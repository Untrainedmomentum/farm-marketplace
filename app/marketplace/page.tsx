'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { distanceMiles } from '@/lib/geocode'
import Image from 'next/image'
import Link from 'next/link'
import AddToCartButton from '@/components/AddToCartButton'

const CATEGORY_OPTIONS = ['Produce', 'Baked Goods', 'Dairy', 'Meat', 'Eggs', 'Flowers', 'Other']
const RADIUS_MILES = 50

type ProductResult = {
  id: string
  name: string
  description: string | null
  price: number
  quantity: number
  farm_id: string
  farm: { name: string; slug: string; lat: number | null; lng: number | null }
  _distance?: number
}

export default function Marketplace() {
  const [farms, setFarms] = useState<any[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [zip, setZip] = useState('')
  const [searchOrigin, setSearchOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [ratingsByFarm, setRatingsByFarm] = useState<Record<string, { avg: number; count: number }>>({})
  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState<ProductResult[]>([])
  const [productLoading, setProductLoading] = useState(false)

  useEffect(() => {
    supabase.from('farms').select('*').then(({ data }) => setFarms(data || []))
    supabase.from('reviews').select('farm_id, rating').then(({ data }) => {
      const grouped: Record<string, number[]> = {}
      for (const r of data || []) {
        if (!grouped[r.farm_id]) grouped[r.farm_id] = []
        grouped[r.farm_id].push(r.rating)
      }
      const result: Record<string, { avg: number; count: number }> = {}
      for (const [farmId, ratings] of Object.entries(grouped)) {
        result[farmId] = { avg: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length }
      }
      setRatingsByFarm(result)
    })
  }, [])

  useEffect(() => {
    const term = productQuery.trim()
    if (!term) { setProductResults([]); return }
    setProductLoading(true)
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, quantity, farm_id, farm:farms(name, slug, lat, lng)')
        .eq('active', true)
        .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(60)
      setProductResults((data as any) || [])
      setProductLoading(false)
    }, 300)
    return () => clearTimeout(handle)
  }, [productQuery])

  let visibleProducts = productResults
  if (searchOrigin) {
    visibleProducts = visibleProducts
      .filter(p => p.farm?.lat != null && p.farm?.lng != null)
      .map(p => ({ ...p, _distance: distanceMiles(searchOrigin.lat, searchOrigin.lng, Number(p.farm.lat), Number(p.farm.lng)) }))
      .filter(p => p._distance! <= RADIUS_MILES)
      .sort((a, b) => a._distance! - b._distance!)
  }

  async function handleLocate(e: React.FormEvent) {
    e.preventDefault()
    setSearchError('')
    if (!zip) { setSearchOrigin(null); return }
    setSearching(true)
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(zip)}`)
    const data = await res.json()
    setSearching(false)
    if (!res.ok) { setSearchError('Could not find that zip code.'); setSearchOrigin(null); return }
    setSearchOrigin(data)
  }

  function clearLocate() {
    setZip(''); setSearchOrigin(null); setSearchError('')
  }

  let visibleFarms = activeCategory
    ? farms.filter(farm => farm.categories?.includes(activeCategory))
    : farms

  if (searchOrigin) {
    visibleFarms = visibleFarms
      .filter(farm => farm.lat != null && farm.lng != null)
      .map(farm => ({ ...farm, _distance: distanceMiles(searchOrigin.lat, searchOrigin.lng, Number(farm.lat), Number(farm.lng)) }))
      .filter(farm => farm._distance <= RADIUS_MILES)
      .sort((a, b) => a._distance - b._distance)
  }

  return (
    <main style={{ padding: 40, maxWidth: 1100, margin: '0 auto', fontFamily: 'Georgia, serif' }}>
      <div style={{ position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <Image src="/images/bakery-market-stall.png" alt="A market stall with fresh baked goods and preserves" fill style={{ objectFit: 'cover' }} />
      </div>
      <h1 style={{ color: '#8B1A1A', fontSize: 36, marginBottom: 8 }}>Farm Marketplace</h1>
      <p style={{ color: '#5D4E37', marginBottom: 24, fontSize: 16 }}>Shop fresh products directly from local farms</p>

      <div style={{ marginBottom: 16 }}>
        <input value={productQuery} onChange={e => setProductQuery(e.target.value)} placeholder="🔍 Search products (e.g. tomatoes, honey, eggs)"
          style={{ width: '100%', maxWidth: 480, padding: '10px 14px', border: '1px solid #D4C5A9', borderRadius: 8, fontFamily: 'Georgia, serif', fontSize: 15, boxSizing: 'border-box' }} />
      </div>

      <form onSubmit={handleLocate} style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={zip} onChange={e => setZip(e.target.value)} placeholder="Enter zip code"
          style={{ padding: '8px 12px', border: '1px solid #D4C5A9', borderRadius: 6, fontFamily: 'Georgia, serif', fontSize: 14, width: 160 }} />
        <button type="submit" disabled={searching}
          style={{ backgroundColor: '#5D8A3C', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14 }}>
          {searching ? 'Locating...' : `📍 Find within ${RADIUS_MILES}mi`}
        </button>
        {searchOrigin && (
          <button type="button" onClick={clearLocate}
            style={{ background: 'none', border: '1px solid #D4C5A9', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, color: '#5D4E37' }}>
            Clear
          </button>
        )}
        {searchError && <span style={{ color: 'red', fontSize: 13 }}>{searchError}</span>}
      </form>

      {productQuery.trim() ? (
        <div>
          <p style={{ color: '#5D4E37', marginBottom: 16, fontSize: 14 }}>
            {productLoading ? 'Searching...' : `${visibleProducts.length} product${visibleProducts.length === 1 ? '' : 's'} found`}
            {searchOrigin ? ` within ${RADIUS_MILES}mi` : ''}
          </p>
          {!productLoading && visibleProducts.length === 0 && (
            <p style={{ color: '#8B6914', fontSize: 16 }}>No products match "{productQuery}"{searchOrigin ? ' in this area' : ''}.</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {visibleProducts.map(p => (
              <div key={p.id} style={{ border: '1px solid #D4C5A9', borderRadius: 12, padding: 18, background: '#FFFDF5', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: '#8B1A1A', margin: '0 0 4px', fontSize: 17 }}>{p.name}</h3>
                <Link href={'/farm/' + p.farm.slug} style={{ color: '#5D8A3C', fontSize: 13, textDecoration: 'none', marginBottom: 6 }}>🌾 {p.farm.name}</Link>
                {p.description && <p style={{ color: '#777', fontSize: 13, margin: '0 0 8px', flex: 1 }}>{p.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ color: '#8B1A1A', fontWeight: 'bold', fontSize: 18 }}>${p.price}</span>
                  {p._distance != null && <span style={{ background: '#D4C5A9', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 11 }}>📍 {p._distance.toFixed(1)} mi</span>}
                </div>
                <AddToCartButton productId={p.id} farmId={p.farm_id} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            <button onClick={() => setActiveCategory(null)}
              style={{
                border: `1px solid ${activeCategory === null ? '#8B1A1A' : '#D4C5A9'}`,
                backgroundColor: activeCategory === null ? '#8B1A1A' : 'white',
                color: activeCategory === null ? 'white' : '#5D4E37',
                borderRadius: 999, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
              }}>
              All
            </button>
            {CATEGORY_OPTIONS.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                style={{
                  border: `1px solid ${activeCategory === cat ? '#8B1A1A' : '#D4C5A9'}`,
                  backgroundColor: activeCategory === cat ? '#8B1A1A' : 'white',
                  color: activeCategory === cat ? 'white' : '#5D4E37',
                  borderRadius: 999, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
                }}>
                {cat}
              </button>
            ))}
          </div>

          {farms.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#8B6914' }}>
              <p style={{ fontSize: 20 }}>No farms yet — be the first to join!</p>
              <Link href="/auth/signup" style={{ display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#8B1A1A', color: '#F5E6C8', textDecoration: 'none', borderRadius: 8 }}>Join as Farmer</Link>
            </div>
          )}
          {farms.length > 0 && visibleFarms.length === 0 && (
            <p style={{ color: '#8B6914', fontSize: 16 }}>No farms match {searchOrigin ? 'this location' : 'this category'} yet.</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {visibleFarms.map(farm => (
              <Link key={farm.id} href={'/farm/' + farm.slug} style={{ textDecoration: 'none' }}>
                <div
                  onMouseOver={() => setHoveredId(farm.id)}
                  onMouseOut={() => setHoveredId(null)}
                  style={{
                    border: `2px solid ${hoveredId === farm.id ? '#8B1A1A' : '#D4C5A9'}`, borderRadius: 12, padding: 24, background: '#FFFDF5',
                    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                    transform: hoveredId === farm.id ? 'translateY(-3px)' : 'none',
                    boxShadow: hoveredId === farm.id ? '0 8px 20px rgba(139,26,26,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🌾</div>
                  <h2 style={{ color: '#8B1A1A', margin: '0 0 4px', fontSize: 22 }}>{farm.name}</h2>
                  {ratingsByFarm[farm.id] && (
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: '#8B6914' }}>
                      {'★'.repeat(Math.round(ratingsByFarm[farm.id].avg))}{'☆'.repeat(5 - Math.round(ratingsByFarm[farm.id].avg))} ({ratingsByFarm[farm.id].count})
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {farm.categories?.map((cat: string) => (
                      <span key={cat} style={{ background: '#F0C040', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{cat}</span>
                    ))}
                    {farm.cash_enabled && <span style={{ background: '#5D8A3C', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>💵 Cash accepted</span>}
                    {farm._distance != null && <span style={{ background: '#D4C5A9', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>📍 {farm._distance.toFixed(1)} mi</span>}
                  </div>
                  {farm.updated_at && (
                    <p style={{ margin: '0 0 8px', fontSize: 11, color: '#aaa' }}>
                      Updated {Math.floor((Date.now() - new Date(farm.updated_at).getTime()) / 86400000)}d ago
                    </p>
                  )}
                  <p style={{ color: '#8B1A1A', marginTop: 8, fontSize: 14, fontWeight: 'bold' }}>Shop Now →</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  )
}