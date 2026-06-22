'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Driver = {
  id: string
  name: string
  service_area: string | null
  delivery_rate: number | null
  notes: string | null
  contact_info: string | null
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('drivers').select('*').eq('active', true).order('created_at', { ascending: false })
      .then(({ data }) => { setDrivers(data || []); setLoading(false) })
  }, [])

  async function handleRequest(driverId: string) {
    setError('')
    if (!address) { setError('Please enter a delivery address.'); return }
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Please log in to request a delivery.')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/deliveries/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, address }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setError(data.error || 'Could not start checkout.')
      setSubmitting(false)
      return
    }
    window.location.href = data.url
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: 'var(--barn-red)' }}>Delivery Drivers</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Pick a driver to deliver your order. Drivers set their own rate and are paid directly.</p>

      {loading && <p>Loading...</p>}
      {!loading && drivers.length === 0 && <p style={{ color: '#888' }}>No drivers available yet.</p>}
      {drivers.map(d => {
        const isRequesting = requestingId === d.id
        return (
          <div key={d.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
            <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{d.name}</h3>
            {d.service_area && <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>📍 {d.service_area}</p>}
            {d.delivery_rate != null && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>💰 ${d.delivery_rate} per delivery</p>}
            {d.notes && <p style={{ margin: '0 0 0.5rem', color: '#444', fontSize: '0.9rem' }}>{d.notes}</p>}

            {!isRequesting ? (
              <button onClick={() => { setRequestingId(d.id); setError(''); setAddress('') }}
                style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.5rem 1.1rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                🚚 Request This Driver
              </button>
            ) : (
              <div style={{ marginTop: '0.5rem' }}>
                <input placeholder="Delivery address" value={address} onChange={e => setAddress(e.target.value)}
                  style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.5rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
                {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleRequest(d.id)} disabled={submitting}
                    style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.5rem 1.1rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                    {submitting ? 'Redirecting...' : `Pay $${d.delivery_rate} & Request`}
                  </button>
                  <button onClick={() => setRequestingId(null)}
                    style={{ background: 'none', border: '1px solid #ccc', padding: '0.5rem 1.1rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </main>
  )
}
