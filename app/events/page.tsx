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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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

  const eventsByDate = events.reduce((acc: Record<string, FarmEvent[]>, ev) => {
    if (!ev.event_date) return acc
    const key = ev.event_date.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(ev)
    return acc
  }, {})

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const cells: (string | null)[] = [...Array(startWeekday).fill(null)]
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(dateStr)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const displayedEvents = selectedDate
    ? events.filter(ev => ev.event_date?.slice(0, 10) === selectedDate)
    : events

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>Farm Events</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            style={{ background: 'none', border: '1px solid #D4C5A9', color: '#5D4E37', padding: '0.6rem 1.1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {viewMode === 'calendar' ? '☰ List View' : '📅 Calendar View'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {showForm ? 'Cancel' : '+ Add an Event'}
          </button>
        </div>
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

      {!loading && viewMode === 'calendar' && (
        <div style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={{ background: 'none', border: 'none', color: 'var(--barn-red)', cursor: 'pointer', fontSize: '1.1rem' }}>←</button>
            <strong style={{ color: 'var(--barn-red)' }}>{monthLabel}</strong>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{ background: 'none', border: 'none', color: 'var(--barn-red)', cursor: 'pointer', fontSize: '1.1rem' }}>→</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#999' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((dateStr, i) => {
              const dayEvents = dateStr ? eventsByDate[dateStr] || [] : []
              const isSelected = dateStr === selectedDate
              return (
                <div key={i} onClick={() => dateStr && setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 48, borderRadius: 6, padding: '0.4rem', cursor: dateStr ? 'pointer' : 'default',
                    backgroundColor: isSelected ? 'var(--barn-red)' : dayEvents.length ? '#fff5e6' : '#fafafa',
                    border: dayEvents.length ? '1px solid var(--gold)' : '1px solid #eee',
                  }}>
                  {dateStr && (
                    <>
                      <div style={{ fontSize: '0.75rem', color: isSelected ? 'white' : '#666' }}>{Number(dateStr.slice(8, 10))}</div>
                      {dayEvents.length > 0 && (
                        <div style={{ fontSize: '0.7rem', color: isSelected ? 'white' : 'var(--barn-red)', fontWeight: 'bold' }}>
                          {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && selectedDate && (
        <button onClick={() => setSelectedDate(null)} style={{ marginBottom: '1rem', background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '0.4rem 1rem', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
          ✕ Showing {selectedDate} only — clear
        </button>
      )}

      {!loading && displayedEvents.length === 0 && <p style={{ color: '#888' }}>No events {selectedDate ? 'on this day' : 'listed yet. Be the first to add one!'}</p>}
      {displayedEvents.map(ev => (
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
