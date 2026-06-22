'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type FarmStand = {
  id: string
  name: string
  address: string
  county: string | null
  dates_text: string | null
  hours_text: string | null
  website: string | null
  contact_info: string | null
  notes: string | null
  farm_id: string | null
}

export default function FarmStandsPage() {
  const [stands, setStands] = useState<FarmStand[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [datesText, setDatesText] = useState('')
  const [hoursText, setHoursText] = useState('')
  const [website, setWebsite] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadStands() }, [])

  async function loadStands() {
    const { data } = await supabase.from('farm_stands').select('*').order('created_at', { ascending: false })
    setStands(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Please log in to report a farm stand.')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/farmstands', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, datesText, hoursText, website, contactInfo, notes }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not report this stand.')
      setSubmitting(false)
      return
    }
    setName(''); setAddress(''); setDatesText(''); setHoursText(''); setWebsite(''); setContactInfo(''); setNotes('')
    setShowForm(false)
    setSubmitting(false)
    loadStands()
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ position: 'relative', height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <Image src="/images/farm-market-stand.png" alt="A roadside farm stand" fill style={{ objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>Farm Stands</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          {showForm ? 'Cancel' : '+ Report a Farm Stand'}
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '0.75rem' }}>
        Self-serve roadside stands and honor-box farms near you — see them on the <a href="/map">map</a> too.
      </p>
      <p style={{ background: '#FFF8E1', border: '1px solid #F0C040', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#5D4E37', marginBottom: '1.5rem' }}>
        ⚠️ Unless marked "Claimed," these listings are sourced from public info or reported by visitors — not verified by MyFarmExpress. If this is your stand, you can claim it by visiting your <a href="/dashboard">farm dashboard</a> and linking it once you're on-site.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <input placeholder="Stand name" value={name} onChange={e => setName(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Season (e.g. June - October)" value={datesText} onChange={e => setDatesText(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Hours (e.g. Daily, dawn to dusk)" value={hoursText} onChange={e => setHoursText(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Website (optional)" value={website} onChange={e => setWebsite(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Contact info (optional)" value={contactInfo} onChange={e => setContactInfo(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <textarea placeholder="What do they sell? Honor box, cash only, etc." value={notes} onChange={e => setNotes(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={submitting}
            style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {submitting ? 'Reporting...' : 'Report Stand'}
          </button>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {!loading && stands.length === 0 && <p style={{ color: '#888' }}>No farm stands listed yet. Be the first to report one!</p>}
      {stands.map(s => (
        <div key={s.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{s.name}</h3>
            {s.farm_id
              ? <span style={{ background: '#5D8A3C', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>✅ Claimed</span>
              : <span style={{ background: '#D4C5A9', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>Unverified</span>}
          </div>
          <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>📍 {s.address}{s.county ? ` (${s.county} County)` : ''}</p>
          {(s.dates_text || s.hours_text) && (
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>🗓️ {[s.dates_text, s.hours_text].filter(Boolean).join(' · ')}</p>
          )}
          {s.notes && <p style={{ margin: '0 0 0.25rem', color: '#444', fontSize: '0.9rem' }}>{s.notes}</p>}
          {s.contact_info && <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.85rem' }}>📞 {s.contact_info}</p>}
          {s.website && <p style={{ margin: 0, fontSize: '0.85rem' }}><a href={s.website} target="_blank" rel="noopener noreferrer">🔗 Website</a></p>}
        </div>
      ))}
    </main>
  )
}
