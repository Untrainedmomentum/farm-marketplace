'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { distanceMiles } from '@/lib/geocode'
import Link from 'next/link'

const CATEGORY_OPTIONS = ['Produce', 'Baked Goods', 'Dairy', 'Meat', 'Eggs', 'Flowers', 'Other']
const RADIUS_MILES = 50

export default function Marketplace() {
  const [farms, setFarms] = useState<any[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [zip, setZip] = useState('')
  const [searchOrigin, setSearchOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    supabase.from('farms').select('*').then(({ data }) => setFarms(data || []))
  }, [])

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
      <h1 style={{ color: '#8B1A1A', fontSize: 36, marginBottom: 8 }}>Farm Marketplace</h1>
      <p style={{ color: '#5D4E37', marginBottom: 24, fontSize: 16 }}>Shop fresh products directly from local farms</p>

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
              <h2 style={{ color: '#8B1A1A', margin: '0 0 8px', fontSize: 22 }}>{farm.name}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {farm.categories?.map((cat: string) => (
                  <span key={cat} style={{ background: '#F0C040', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{cat}</span>
                ))}
                {farm.cash_enabled && <span style={{ background: '#5D8A3C', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>💵 Cash accepted</span>}
                {farm._distance != null && <span style={{ background: '#D4C5A9', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>📍 {farm._distance.toFixed(1)} mi</span>}
              </div>
              <p style={{ color: '#8B1A1A', marginTop: 16, fontSize: 14, fontWeight: 'bold' }}>Shop Now →</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}