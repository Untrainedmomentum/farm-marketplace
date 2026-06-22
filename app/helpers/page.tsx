'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type HelperListing = {
  id: string
  title: string
  description: string | null
  pay_info: string | null
  contact_info: string | null
  farm: { name: string; slug: string } | null
}

export default function HelpersPage() {
  const [listings, setListings] = useState<HelperListing[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [payInfo, setPayInfo] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [myFarmId, setMyFarmId] = useState<string | null>(null)
  const [linkToFarm, setLinkToFarm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadListings()
    loadMyFarm()
  }, [])

  async function loadListings() {
    const { data } = await supabase
      .from('helper_listings')
      .select('*, farm:farms(name, slug)')
      .order('created_at', { ascending: false })
    setListings((data as unknown as HelperListing[]) || [])
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
      setError('Please log in to post a listing.')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/helpers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description, payInfo, contactInfo,
        farmId: linkToFarm ? myFarmId : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not post listing.')
      setSubmitting(false)
      return
    }
    setTitle(''); setDescription(''); setPayInfo(''); setContactInfo(''); setLinkToFarm(false)
    setShowForm(false)
    setSubmitting(false)
    loadListings()
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>Farm Helpers</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          {showForm ? 'Cancel' : '+ Post a Listing'}
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Find seasonal help, or offer your time to a local farm.</p>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <input placeholder="What do you need help with?" value={title} onChange={e => setTitle(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Pay (e.g. $15/hr, room+board)" value={payInfo} onChange={e => setPayInfo(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Contact info (email/phone)" value={contactInfo} onChange={e => setContactInfo(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          {myFarmId && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input type="checkbox" checked={linkToFarm} onChange={e => setLinkToFarm(e.target.checked)} />
              Link this listing to my farm
            </label>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={submitting}
            style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {submitting ? 'Posting...' : 'Post Listing'}
          </button>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {!loading && listings.length === 0 && <p style={{ color: '#888' }}>No listings yet. Be the first to post one!</p>}
      {listings.map(l => (
        <div key={l.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{l.title}</h3>
          {l.farm && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>🌾 {l.farm.name}</p>}
          {l.description && <p style={{ margin: '0 0 0.25rem', color: '#444', fontSize: '0.9rem' }}>{l.description}</p>}
          {l.pay_info && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>💰 {l.pay_info}</p>}
          {l.contact_info && <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>📞 {l.contact_info}</p>}
        </div>
      ))}
    </main>
  )
}
