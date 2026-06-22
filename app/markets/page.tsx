'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

type Market = {
  id: string
  name: string
  address: string
  type: 'market' | 'stand'
  county: string | null
  description: string | null
  schedule_text: string | null
  hours_text: string | null
  website: string | null
  contact_info: string | null
  notes: string | null
  farm_id: string | null
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<'all' | 'market' | 'stand'>('all')
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<'market' | 'stand'>('market')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleText, setScheduleText] = useState('')
  const [hoursText, setHoursText] = useState('')
  const [website, setWebsite] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [notes, setNotes] = useState('')
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
      setError('Please log in to add a listing.')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/markets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, address, description, scheduleText, hoursText, website, contactInfo, notes, type,
        farmId: linkToFarm ? myFarmId : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not add listing.')
      setSubmitting(false)
      return
    }
    setName(''); setAddress(''); setDescription(''); setScheduleText(''); setHoursText(''); setWebsite(''); setContactInfo(''); setNotes(''); setLinkToFarm(false)
    setShowForm(false)
    setSubmitting(false)
    loadMarkets()
  }

  const visibleMarkets = activeType === 'all' ? markets : markets.filter(m => m.type === activeType)

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ position: 'relative', height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <Image src="/images/farm-market-stand.png" alt="A farm market stand" fill style={{ objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>Markets &amp; Stands</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          {showForm ? 'Cancel' : '+ Add a Listing'}
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '0.75rem' }}>
        Organized farmers markets and self-serve roadside stands — see them on the <a href="/map">map</a> too.
      </p>
      <p style={{ background: '#FFF8E1', border: '1px solid #F0C040', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#5D4E37', marginBottom: '1.5rem' }}>
        ⚠️ Unless marked "Claimed," stand listings are sourced from public info or reported by visitors — not verified by MyFarmExpress. If this is your stand, claim it from your <a href="/dashboard">farm dashboard</a> once you're on-site.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
        {(['all', 'market', 'stand'] as const).map(t => (
          <button key={t} onClick={() => setActiveType(t)}
            style={{
              border: `1px solid ${activeType === t ? '#8B1A1A' : '#D4C5A9'}`,
              backgroundColor: activeType === t ? '#8B1A1A' : 'white',
              color: activeType === t ? 'white' : '#5D4E37',
              borderRadius: 999, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}>
            {t === 'all' ? 'All' : t === 'market' ? 'Markets' : 'Stands'}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="radio" checked={type === 'market'} onChange={() => setType('market')} /> Organized market
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input type="radio" checked={type === 'stand'} onChange={() => setType('stand')} /> Roadside / honor-box stand
            </label>
          </div>
          <input placeholder={type === 'market' ? 'Market name' : 'Stand name'} value={name} onChange={e => setName(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Season/schedule (e.g. May - October, or Saturdays 8am-1pm)" value={scheduleText} onChange={e => setScheduleText(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          {type === 'stand' && (
            <input placeholder="Hours (e.g. Daily, dawn to dusk)" value={hoursText} onChange={e => setHoursText(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          )}
          <textarea placeholder="Description / what they sell" value={type === 'market' ? description : notes} onChange={e => type === 'market' ? setDescription(e.target.value) : setNotes(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Website (optional)" value={website} onChange={e => setWebsite(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Contact info (optional)" value={contactInfo} onChange={e => setContactInfo(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          {myFarmId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input type="checkbox" checked={linkToFarm} onChange={e => setLinkToFarm(e.target.checked)} />
              Link this to my farm
            </label>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={submitting}
            style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {submitting ? 'Adding...' : 'Add Listing'}
          </button>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {!loading && visibleMarkets.length === 0 && <p style={{ color: '#888' }}>No listings yet. Be the first to add one!</p>}
      {visibleMarkets.map(m => (
        <div key={m.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{m.name}</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ background: '#F0C040', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{m.type === 'market' ? 'Market' : 'Stand'}</span>
              {m.type === 'stand' && (m.farm_id
                ? <span style={{ background: '#5D8A3C', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>✅ Claimed</span>
                : <span style={{ background: '#D4C5A9', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>Unverified</span>)}
            </div>
          </div>
          <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>📍 {m.address}{m.county ? ` (${m.county} County)` : ''}</p>
          {(m.schedule_text || m.hours_text) && (
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>🗓️ {[m.schedule_text, m.hours_text].filter(Boolean).join(' · ')}</p>
          )}
          {(m.description || m.notes) && <p style={{ margin: '0 0 0.25rem', color: '#444', fontSize: '0.9rem' }}>{m.description || m.notes}</p>}
          {m.contact_info && <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.85rem' }}>📞 {m.contact_info}</p>}
          {m.website && <p style={{ margin: 0, fontSize: '0.85rem' }}><a href={m.website} target="_blank" rel="noopener noreferrer">🔗 Website</a></p>}
        </div>
      ))}
    </main>
  )
}
