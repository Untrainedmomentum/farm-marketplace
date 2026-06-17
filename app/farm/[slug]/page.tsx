import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import AddToCartButton from '@/components/AddToCartButton'
import Link from 'next/link'

export default async function FarmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: farm } = await supabase.from('farms').select('*').eq('slug', slug).single()
  if (!farm) notFound()

  const { data: products } = await supabase.from('products').select('*').eq('farm_id', farm.id).eq('active', true)

  let theme = { header: '#8B1A1A', bg: '#FFFDF5', text: '#2C1810', accent: '#5D8A3C' }
  if (farm.color_theme) {
    try { theme = { ...theme, ...JSON.parse(farm.color_theme) } } catch {}
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: 'Georgia, serif' }}>
      <div style={{ backgroundColor: theme.header, padding: '2rem', textAlign: 'center' }}>
        {farm.logo_url && farm.logo_url.startsWith('http') ? (
          <img src={farm.logo_url} alt={farm.name} style={{ height: '80px', borderRadius: '8px', marginBottom: '0.5rem' }} />
        ) : (
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏚️</div>
        )}
        <h1 style={{ color: '#fff', margin: 0, fontSize: '2.5rem' }}>{farm.name}</h1>
        <p style={{ color: theme.accent, margin: '0.25rem 0 0', letterSpacing: '0.15em', fontSize: '0.85rem' }}>FRESH FROM THE FARM</p>
        {farm.cash_enabled && (
          <span style={{ display: 'inline-block', marginTop: '0.75rem', backgroundColor: theme.accent, color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem' }}>
            💵 Cash accepted
          </span>
        )}
      </div>

      <div style={{ backgroundColor: theme.header, opacity: 0.85, padding: '0.5rem 2rem', display: 'flex', gap: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <Link href="/marketplace" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Marketplace</Link>
        <Link href="/cart" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.85rem' }}>🛒 View Cart</Link>
      </div>

      <div style={{ padding: '2.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ color: theme.text, marginBottom: '1.5rem', borderBottom: `2px solid ${theme.accent}`, paddingBottom: '0.5rem' }}>Our Products</h2>
        {!products?.length && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
            <p>No products listed yet. Check back soon!</p>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {products?.map(product => (
            <div key={product.id} style={{ backgroundColor: 'white', border: `1px solid ${theme.accent}33`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '6px', backgroundColor: theme.accent }} />
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: theme.text, margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{product.name}</h3>
                {product.description && <p style={{ color: '#777', fontSize: '0.85rem', margin: '0 0 0.75rem', flex: 1 }}>{product.description}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: theme.accent, fontWeight: 'bold', fontSize: '1.2rem' }}>${product.price}</span>
                  <span style={{ color: '#999', fontSize: '0.8rem' }}>In stock: {product.quantity}</span>
                </div>
                <AddToCartButton productId={product.id} farmId={farm.id} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: theme.header, color: '#fff', textAlign: 'center', padding: '1.5rem', marginTop: '3rem', fontSize: '0.85rem' }}>
        {farm.name} — Powered by <strong>My Farm Express</strong>
      </div>
    </div>
  )
}
