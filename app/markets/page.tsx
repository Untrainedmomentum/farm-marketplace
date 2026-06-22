'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Market = {
  id: string
  name: string
  address: string
  description: string | null
  schedule_text: string | null
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleText, setScheduleText] = useState('')
  const [myFarmId, setMyFarmId] = useState<string | null>(null)
  const [linkToFarm, setLinkToFarm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMarkets()
    loadMyFarm()
  }, [])

  async function loadMarkets() {
    const { data } = await supabase.from('markets').select('*').order('created_at', { ascending: false })
    setMarkets(data || [])
    setLoading(false)
  }

  async function loadMyFarm() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: farm } = await supabase.from('farms').select('id').eq('owner_id', user.id).single()
    if (farm) setMyFarmId(farm.id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Please log in to add a market.')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, address, description, scheduleText,
        farmId: linkToFarm ? myFarmId : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not add market.')
      setSubmitting(false)
      return
    }
    setName(''); setAddress(''); setDescription(''); setScheduleText(''); setLinkToFarm(false)
    setShowForm(false)
    setSubmitting(false)
    loadMarkets()
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>Farm Markets</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          {showForm ? 'Cancel' : '+ Add a Market'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <input placeholder="Market name" value={name} onChange={e => setName(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Schedule (e.g. Saturdays 8am-1pm, May-Oct)" value={scheduleText} onChange={e => setScheduleText(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          {myFarmId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input type="checkbox" checked={linkToFarm} onChange={e => setLinkToFarm(e.target.checked)} />
              Link this market to my farm
            </label>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={submitting}
            style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {submitting ? 'Adding...' : 'Add Market'}
          </button>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {!loading && markets.length === 0 && <p style={{ color: '#888' }}>No markets listed yet. Be the first to add one!</p>}
      {markets.map(m => (
        <div key={m.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{m.name}</h3>
          <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>{m.address}</p>
          {m.schedule_text && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>🗓️ {m.schedule_text}</p>}
          {m.description && <p style={{ margin: 0, color: '#444', fontSize: '0.9rem' }}>{m.description}</p>}
        </div>
      ))}
    </main>
  )
}
