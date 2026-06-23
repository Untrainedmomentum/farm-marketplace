'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [farm, setFarm] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [productQty, setProductQty] = useState('')
  const [message, setMessage] = useState('')
  const [becomingFarmer, setBecomingFarmer] = useState(false)
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [csaPrograms, setCsaPrograms] = useState<any[]>([])
  const [csaName, setCsaName] = useState('')
  const [csaContents, setCsaContents] = useState('')
  const [csaSchedule, setCsaSchedule] = useState('')
  const [csaPrice, setCsaPrice] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/auth/login'); return }
      const user = session.user
      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (profileError) { console.error('Profile load error:', profileError); setLoading(false); return }
      setProfile(profile)

      if (profile?.role?.includes('farmer')) {
        const { data: farm } = await supabase.from('farms').select('*').eq('owner_id', user.id).single()
        if (farm) {
          setFarm(farm)
          const { data: products } = await supabase.from('products').select('*').eq('farm_id', farm.id)
          setProducts(products || [])
          const { data: csa } = await supabase.from('csa_programs').select('*').eq('farm_id', farm.id)
          setCsaPrograms(csa || [])
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function becomeFarmer() {
    setBecomingFarmer(true)
    const currentRoles = profile?.role || []
    if (!currentRoles.includes('farmer')) {
      await supabase.from('profiles').update({ role: [...currentRoles, 'farmer'] }).eq('id', user.id)
    }
    router.push('/onboarding')
  }

  async function addProduct() {
    if (!productName || !productPrice) return
    if (products.filter(p => p.active).length >= 5) {
      setMessage('Product limit reached: each farm can list up to 5 active products.')
      return
    }
    const { error } = await supabase.from('products').insert({
      farm_id: farm.id, name: productName, price: parseFloat(productPrice),
      description: productDesc, quantity: parseInt(productQty) || 0,
      active: true, is_shippable: false, needs_cold_storage: false
    })
    if (error) { setMessage(error.message); return }
    setMessage('Product added!')
    setProductName(''); setProductPrice(''); setProductDesc(''); setProductQty('')
    const { data } = await supabase.from('products').select('*').eq('farm_id', farm.id)
    setProducts(data || [])
  }

  async function addCsaProgram() {
    if (!csaName) return
    const { error } = await supabase.from('csa_programs').insert({
      farm_id: farm.id, name: csaName, contents_description: csaContents,
      schedule_text: csaSchedule, price: csaPrice ? parseFloat(csaPrice) : null,
    })
    if (error) { setMessage(error.message); return }
    setMessage('CSA program added!')
    setCsaName(''); setCsaContents(''); setCsaSchedule(''); setCsaPrice('')
    const { data } = await supabase.from('csa_programs').select('*').eq('farm_id', farm.id)
    setCsaPrograms(data || [])
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function connectStripe() {
    setConnectingStripe(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setConnectingStripe(false); return }
    const res = await fetch('/api/connect/onboard', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setMessage(data.error || 'Could not start Stripe onboarding.')
      setConnectingStripe(false)
      return
    }
    window.location.href = data.url
  }

  if (loading) return <main style={{ padding: 40, fontFamily: 'Georgia, serif' }}><p>Loading...</p></main>

  const isFarmer = profile?.role?.includes('farmer')

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', backgroundColor: 'var(--cream)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>{isFarmer ? 'Farmer Dashboard' : 'My Dashboard'}</h1>
        <button onClick={handleLogout}
          style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Logged in as: {user?.email}</p>
      {message && <p style={{ color: 'green', marginBottom: '1rem' }}>{message}</p>}

      {!isFarmer && (
        <div style={{ backgroundColor: 'white', border: '2px dashed #ccc', borderRadius: '8px', padding: '2rem', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌾</div>
          <h2 style={{ color: 'var(--barn-red)', marginBottom: '0.5rem' }}>Want to sell on My Farm Express?</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Set up your farm storefront in minutes.</p>
          <button onClick={becomeFarmer} disabled={becomingFarmer}
            style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', opacity: becomingFarmer ? 0.7 : 1 }}>
            {becomingFarmer ? 'Setting up...' : '🚜 Become a Farmer'}
          </button>
        </div>
      )}

      {isFarmer && !farm && (
        <div style={{ backgroundColor: 'white', border: '2px dashed #ccc', borderRadius: '8px', padding: '2rem', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏚️</div>
          <h2 style={{ color: 'var(--barn-red)', marginBottom: '0.5rem' }}>Finish setting up your farm</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem' }}>You have not completed farm setup yet.</p>
          <button onClick={() => router.push('/onboarding')}
            style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            Complete Setup →
          </button>
        </div>
      )}

      {isFarmer && farm && (
        <div>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--barn-red)', marginBottom: '0.25rem' }}>{farm.name}</h2>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  Storefront: <a href={'/farm/' + farm.slug} style={{ color: 'var(--barn-red)' }}>/farm/{farm.slug}</a>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {farm.stripe_account_id ? (
                  <span style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: '0.9rem' }}>✅ Stripe connected</span>
                ) : (
                  <button onClick={connectStripe} disabled={connectingStripe}
                    style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '0.95rem', opacity: connectingStripe ? 0.7 : 1 }}>
                    {connectingStripe ? 'Connecting...' : '💳 Connect Stripe to get paid'}
                  </button>
                )}
                <button onClick={() => router.push('/edit-store')}
                  style={{ backgroundColor: '#F0C040', color: '#2C1810', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '0.95rem' }}>
                  🎨 Edit My Storefront
                </button>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #eee' }}>
            <h3 style={{ color: 'var(--barn-red)', marginBottom: '0.25rem' }}>Selling on My Farm Express</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              No subscriptions — listing is free. A flat $2 platform fee applies per transaction.{' '}
              {farm.payouts_enabled
                ? '✅ Stripe connected: $150 per order limit, 3-day payout hold.'
                : 'Connect Stripe to raise your order limit to $150 and your payout hold to 3 days (currently $50 / 7-day hold).'}
            </p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #eee' }}>
            <h3 style={{ color: 'var(--barn-red)', marginBottom: '0.25rem' }}>Add Product</h3>
            <p style={{ color: products.filter(p => p.active).length >= 5 ? 'var(--barn-red)' : '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {products.filter(p => p.active).length} / 5 active products used
            </p>
            {products.filter(p => p.active).length >= 5 ? (
              <p style={{ color: '#666', fontSize: '0.9rem' }}>You've reached the 5-product limit for free accounts. Remove or deactivate a product to add another.</p>
            ) : (
              <>
                {[
                  { placeholder: 'Product name', value: productName, set: setProductName },
                  { placeholder: 'Price (e.g. 4.99)', value: productPrice, set: setProductPrice },
                  { placeholder: 'Description', value: productDesc, set: setProductDesc },
                  { placeholder: 'Quantity', value: productQty, set: setProductQty },
                ].map(({ placeholder, value, set }) => (
                  <input key={placeholder} placeholder={placeholder} value={value} onChange={e => set(e.target.value)}
                    style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }} />
                ))}
                <button onClick={addProduct}
                  style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  + Add Product
                </button>
              </>
            )}
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #eee' }}>
            <h3 style={{ color: 'var(--barn-red)', marginBottom: '1rem' }}>Your Products ({products.length})</h3>
            {products.length === 0 && <p style={{ color: '#888' }}>No products yet.</p>}
            {products.map(p => (
              <div key={p.id} style={{ border: '1px solid #eee', borderRadius: '6px', padding: '1rem', marginBottom: '0.75rem' }}>
                <strong>{p.name}</strong> — ${p.price} — Qty: {p.quantity}
                {p.description && <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{p.description}</p>}
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #eee' }}>
            <h3 style={{ color: 'var(--barn-red)', marginBottom: '1rem' }}>Add CSA Program</h3>
            <input placeholder="Program name (e.g. Summer Veggie Box)" value={csaName} onChange={e => setCsaName(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }} />
            <input placeholder="What's in the box?" value={csaContents} onChange={e => setCsaContents(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }} />
            <input placeholder="Schedule (e.g. Weekly, June-Sept)" value={csaSchedule} onChange={e => setCsaSchedule(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }} />
            <input placeholder="Price (e.g. 35.00)" value={csaPrice} onChange={e => setCsaPrice(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }} />
            <button onClick={addCsaProgram}
              style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              + Add CSA Program
            </button>
            {csaPrograms.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                {csaPrograms.map(c => (
                  <div key={c.id} style={{ border: '1px solid #eee', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                    <strong>{c.name}</strong>{c.price != null && ` — $${c.price}`}
                    {c.schedule_text && <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{c.schedule_text}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #eee' }}>
            <h3 style={{ color: 'var(--barn-red)', marginBottom: '0.5rem' }}>Need a hand on the farm?</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>Find or post farm help, farriers, sitters, and other services.</p>
            <button onClick={() => router.push('/services')}
              style={{ backgroundColor: '#F0C040', color: '#2C1810', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
              🙋 Find Services →
            </button>
          </div>
        </div>
      )}
    </main>
  )
}