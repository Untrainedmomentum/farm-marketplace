'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type FarmEvent = {
  id: string
  title: string
  address: string
  description: string | null
  event_date: string | null
}

export default function EventsPage() {
  const [events, setEvents] = useState<FarmEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [myFarmId, setMyFarmId] = useState<string | null>(null)
  const [linkToFarm, setLinkToFarm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEvents()
    loadMyFarm()
  }, [])

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    setEvents(data || [])
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
      setError('Please log in to add an event.')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, address, description, eventDate,
        farmId: linkToFarm ? myFarmId : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not add event.')
      setSubmitting(false)
      return
    }
    setTitle(''); setAddress(''); setDescription(''); setEventDate(''); setLinkToFarm(false)
    setShowForm(false)
    setSubmitting(false)
    loadEvents()
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>Farm Events</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          {showForm ? 'Cancel' : '+ Add an Event'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <input placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          {myFarmId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input type="checkbox" checked={linkToFarm} onChange={e => setLinkToFarm(e.target.checked)} />
              Link this event to my farm
            </label>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={submitting}
            style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {submitting ? 'Adding...' : 'Add Event'}
          </button>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {!loading && events.length === 0 && <p style={{ color: '#888' }}>No events listed yet. Be the first to add one!</p>}
      {events.map(ev => (
        <div key={ev.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{ev.title}</h3>
          {ev.event_date && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>📅 {ev.event_date}</p>}
          <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>{ev.address}</p>
          {ev.description && <p style={{ margin: 0, color: '#444', fontSize: '0.9rem' }}>{ev.description}</p>}
        </div>
      ))}
    </main>
  )
}
