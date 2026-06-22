'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Delivery = {
  id: string
  delivery_address: string | null
  fee: number | null
  status: string
  created_at: string
}

export default function DeliveryDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [message, setMessage] = useState('')
  const [connecting, setConnecting] = useState(false)

  const [name, setName] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [deliveryRate, setDeliveryRate] = useState('')
  const [notes, setNotes] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/auth/login'); return }
      setUser(session.user)

      const { data: driver } = await supabase.from('drivers').select('*').eq('user_id', session.user.id).single()
      if (driver) {
        setDriver(driver)
        setName(driver.name); setServiceArea(driver.service_area || '')
        setDeliveryRate(driver.delivery_rate?.toString() || ''); setNotes(driver.notes || '')
        setContactInfo(driver.contact_info || '')
        const { data: ds } = await supabase.from('deliveries').select('*').eq('driver_id', driver.id).order('created_at', { ascending: false })
        setDeliveries(ds || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile() {
    if (!name) { setMessage('Name is required.'); return }
    setSaving(true)
    const payload = {
      user_id: user.id, name, service_area: serviceArea,
      delivery_rate: deliveryRate ? parseFloat(deliveryRate) : null,
      notes, contact_info: contactInfo,
    }
    const { data, error } = driver
      ? await supabase.from('drivers').update(payload).eq('id', driver.id).select().single()
      : await supabase.from('drivers').insert(payload).select().single()

    setSaving(false)
    if (error) { setMessage(error.message); return }
    setDriver(data)
    setMessage('Driver profile saved!')
  }

  async function connectStripe() {
    setConnecting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setConnecting(false); return }
    const res = await fetch('/api/connect/onboard-driver', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setMessage(data.error || 'Could not start Stripe onboarding.')
      setConnecting(false)
      return
    }
    window.location.href = data.url
  }

  async function markDelivered(id: string) {
    await supabase.from('deliveries').update({ status: 'delivered' }).eq('id', id)
    setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: 'delivered' } : d))
  }

  if (loading) return <main style={{ padding: 40, fontFamily: 'Georgia, serif' }}><p>Loading...</p></main>

  const inputStyle = { display: 'block' as const, width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', boxSizing: 'border-box' as const }

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', backgroundColor: 'var(--cream)', minHeight: '100vh', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: 'var(--barn-red)' }}>Delivery Dashboard</h1>
      {message && <p style={{ color: 'green', marginBottom: '1rem' }}>{message}</p>}

      <div style={{ backgroundColor: 'white', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #eee' }}>
        <h3 style={{ color: 'var(--barn-red)', marginBottom: '1rem' }}>{driver ? 'Edit Driver Profile' : 'Become a Driver'}</h3>
        <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input placeholder="Service area (e.g. Within 20mi of Springfield)" value={serviceArea} onChange={e => setServiceArea(e.target.value)} style={inputStyle} />
        <input placeholder="Your rate per delivery (e.g. 8.00)" value={deliveryRate} onChange={e => setDeliveryRate(e.target.value)} style={inputStyle} />
        <input placeholder="Notes (vehicle, availability, etc.)" value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} />
        <input placeholder="Contact info" value={contactInfo} onChange={e => setContactInfo(e.target.value)} style={inputStyle} />
        <button onClick={saveProfile} disabled={saving}
          style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          {saving ? 'Saving...' : driver ? 'Save Changes' : 'Create Driver Profile'}
        </button>
      </div>

      {driver && (
        <div style={{ backgroundColor: 'white', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #eee' }}>
          <h3 style={{ color: 'var(--barn-red)', marginBottom: '0.75rem' }}>Get Paid</h3>
          {driver.stripe_account_id ? (
            <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>✅ Stripe connected</span>
          ) : (
            <button onClick={connectStripe} disabled={connecting}
              style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
              {connecting ? 'Connecting...' : '💳 Connect Stripe to get paid'}
            </button>
          )}
        </div>
      )}

      {driver && (
        <div style={{ backgroundColor: 'white', borderRadius: 8, padding: '1.5rem', border: '1px solid #eee' }}>
          <h3 style={{ color: 'var(--barn-red)', marginBottom: '1rem' }}>Your Deliveries ({deliveries.length})</h3>
          {deliveries.length === 0 && <p style={{ color: '#888' }}>No delivery requests yet.</p>}
          {deliveries.map(d => (
            <div key={d.id} style={{ border: '1px solid #eee', borderRadius: 6, padding: '1rem', marginBottom: '0.75rem' }}>
              <p style={{ margin: '0 0 0.25rem' }}>📍 {d.delivery_address}</p>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>💰 ${d.fee} — Status: <strong>{d.status}</strong></p>
              {d.status !== 'delivered' && (
                <button onClick={() => markDelivered(d.id)}
                  style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                  Mark Delivered
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
