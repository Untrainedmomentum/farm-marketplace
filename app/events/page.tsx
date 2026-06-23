'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type FarmEvent = { id: string; title: string; address: string; description: string | null; event_date: string | null }
type Market = {
  id: string; name: string; address: string; type: 'market' | 'stand'
  schedule_text: string | null; hours_text: string | null; county: string | null; farm_id: string | null
}
type Farm = { id: string; name: string; slug: string }

type ListingType = 'event' | 'market' | 'stand' | 'farm'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function isOpenOnDate(text: string, dateStr: string): boolean {
  const lower = text.toLowerCase()
  if (lower.includes('year-round') || lower.includes('daily')) return true

  const date = new Date(dateStr + 'T00:00:00')
  const weekday = WEEKDAYS[date.getDay()]
  const hasAnyWeekday = WEEKDAYS.some(w => lower.includes(w.toLowerCase()) || lower.includes(w.slice(0, 3).toLowerCase()))
  const dayMatches = !hasAnyWeekday || lower.includes(weekday.toLowerCase()) || lower.includes(weekday.slice(0, 3).toLowerCase())

  const monthIndexes = MONTHS.map((m, i) => (lower.includes(m.toLowerCase()) ? i : -1)).filter(i => i >= 0)
  let seasonMatches = true
  if (monthIndexes.length >= 2) {
    const start = monthIndexes[0]
    const end = monthIndexes[monthIndexes.length - 1]
    const targetMonth = date.getMonth()
    seasonMatches = start <= end ? targetMonth >= start && targetMonth <= end : targetMonth >= start || targetMonth <= end
  }

  return dayMatches && seasonMatches
}

export default function EventsPage() {
  const [events, setEvents] = useState<FarmEvent[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
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
  const [activeTypes, setActiveTypes] = useState<Set<ListingType>>(new Set(['event', 'market', 'stand', 'farm']))

  useEffect(() => {
    loadAll()
    loadMyFarm()
  }, [])

  async function loadAll() {
    const [ev, mk, fm] = await Promise.all([
      supabase.from('events').select('*').order('event_date', { ascending: true }),
      supabase.from('markets').select('id, name, address, type, schedule_text, hours_text, county, farm_id'),
      supabase.from('farms').select('id, name, slug'),
    ])
    setEvents(ev.data || [])
    setMarkets(mk.data || [])
    setFarms(fm.data || [])
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
    loadAll()
  }

  function toggleType(t: ListingType) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t); else next.add(t)
      return next
    })
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

  const marketsOpenOnSelected = selectedDate
    ? markets.filter(m => isOpenOnDate([m.schedule_text, m.hours_text].filter(Boolean).join(' '), selectedDate))
    : []
  const eventsOnSelected = selectedDate ? events.filter(ev => ev.event_date?.slice(0, 10) === selectedDate) : events

  const displayedEvents = activeTypes.has('event') ? eventsOnSelected : []
  const displayedMarkets = selectedDate && activeTypes.has('market') ? marketsOpenOnSelected.filter(m => m.type === 'market') : []
  const displayedStands = selectedDate && activeTypes.has('stand') ? marketsOpenOnSelected.filter(m => m.type === 'stand') : []
  const displayedFarms = selectedDate && activeTypes.has('farm') ? farms : []

  const typeChip = (t: ListingType, label: string) => (
    <button key={t} onClick={() => toggleType(t)}
      style={{
        border: `1px solid ${activeTypes.has(t) ? '#8B1A1A' : '#D4C5A9'}`,
        backgroundColor: activeTypes.has(t) ? '#8B1A1A' : 'white',
        color: activeTypes.has(t) ? 'white' : '#5D4E37',
        borderRadius: 999, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
      }}>
      {label}
    </button>
  )

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>Calendar</h1>
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
      <p style={{ color: '#666', marginBottom: '1rem' }}>Click a day to see what's happening — events, markets, stands, and farms.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
        {typeChip('event', 'Events')}
        {typeChip('market', 'Markets')}
        {typeChip('stand', 'Stands')}
        {typeChip('farm', 'Farms')}
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
              const dayMarketCount = dateStr ? markets.filter(m => isOpenOnDate([m.schedule_text, m.hours_text].filter(Boolean).join(' '), dateStr)).length : 0
              const isSelected = dateStr === selectedDate
              return (
                <div key={i} onClick={() => dateStr && setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 48, borderRadius: 6, padding: '0.4rem', cursor: dateStr ? 'pointer' : 'default',
                    backgroundColor: isSelected ? 'var(--barn-red)' : (dayEvents.length || dayMarketCount) ? '#fff5e6' : '#fafafa',
                    border: (dayEvents.length || dayMarketCount) ? '1px solid var(--gold)' : '1px solid #eee',
                  }}>
                  {dateStr && (
                    <>
                      <div style={{ fontSize: '0.75rem', color: isSelected ? 'white' : '#666' }}>{Number(dateStr.slice(8, 10))}</div>
                      {dayEvents.length > 0 && (
                        <div style={{ fontSize: '0.65rem', color: isSelected ? 'white' : 'var(--barn-red)', fontWeight: 'bold' }}>
                          {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                        </div>
                      )}
                      {dayMarketCount > 0 && (
                        <div style={{ fontSize: '0.65rem', color: isSelected ? 'white' : '#5D8A3C', fontWeight: 'bold' }}>
                          {dayMarketCount} open
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

      {!loading && selectedDate && displayedEvents.length === 0 && displayedMarkets.length === 0 && displayedStands.length === 0 && displayedFarms.length === 0 && (
        <p style={{ color: '#888' }}>Nothing matches your filters on this day.</p>
      )}
      {!loading && !selectedDate && displayedEvents.length === 0 && <p style={{ color: '#888' }}>No events listed yet. Be the first to add one!</p>}

      {displayedEvents.map(ev => (
        <div key={ev.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{ev.title}</h3>
            <span style={{ background: '#F0C040', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>Event</span>
          </div>
          {ev.event_date && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>📅 {ev.event_date}</p>}
          <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>{ev.address}</p>
          {ev.description && <p style={{ margin: 0, color: '#444', fontSize: '0.9rem' }}>{ev.description}</p>}
        </div>
      ))}

      {displayedMarkets.map(m => (
        <div key={m.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{m.name}</h3>
            <span style={{ background: '#3b82f6', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>Market</span>
          </div>
          <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>📍 {m.address}{m.county ? ` (${m.county} County)` : ''}</p>
          {(m.schedule_text || m.hours_text) && <p style={{ margin: 0, fontSize: '0.9rem' }}>🗓️ {[m.schedule_text, m.hours_text].filter(Boolean).join(' · ')}</p>}
        </div>
      ))}

      {displayedStands.map(m => (
        <div key={m.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{m.name}</h3>
            <span style={{ background: m.farm_id ? '#5D8A3C' : '#888', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{m.farm_id ? 'Claimed Stand' : 'Unverified Stand'}</span>
          </div>
          <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>📍 {m.address}{m.county ? ` (${m.county} County)` : ''}</p>
          {(m.schedule_text || m.hours_text) && <p style={{ margin: 0, fontSize: '0.9rem' }}>🗓️ {[m.schedule_text, m.hours_text].filter(Boolean).join(' · ')}</p>}
        </div>
      ))}

      {displayedFarms.map(f => (
        <div key={f.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{f.name}</h3>
            <span style={{ background: '#3cb44b', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>Verified Farm</span>
          </div>
          <Link href={`/farm/${f.slug}`} style={{ fontSize: '0.85rem' }}>Visit storefront →</Link>
        </div>
      ))}
    </main>
  )
}
