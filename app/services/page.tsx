'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const SERVICE_CATEGORIES = ['Farm Sitting', 'Farm Help', 'Farrier', 'Butcher', 'Veterinary', 'Equipment Repair', 'Fencing', 'Other']

type FarmService = {
  id: string
  provider_name: string
  service_category: string
  description: string | null
  service_area: string | null
  rate_info: string | null
  contact_info: string | null
  booking_rate: number | null
  stripe_account_id: string | null
  subscribed: boolean
  created_by: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<FarmService[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [providerName, setProviderName] = useState('')
  const [serviceCategory, setServiceCategory] = useState(SERVICE_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [serviceArea, setServiceArea] = useState('')
  const [rateInfo, setRateInfo] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [bookingRate, setBookingRate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadServices()
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
  }, [])

  async function loadServices() {
    const { data } = await supabase.from('farm_services').select('*').eq('active', true).order('created_at', { ascending: false })
    setServices(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Please log in to list a service.')
      setSubmitting(false)
      return
    }
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerName, serviceCategory, description, serviceArea, rateInfo, contactInfo, bookingRate }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not list this service.')
      setSubmitting(false)
      return
    }
    setProviderName(''); setDescription(''); setServiceArea(''); setRateInfo(''); setContactInfo(''); setBookingRate('')
    setShowForm(false)
    setSubmitting(false)
    loadServices()
  }

  async function connectProviderStripe(serviceId: string) {
    setBusyId(serviceId)
    setMessage('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setBusyId(null); return }
    const res = await fetch('/api/connect/onboard-service', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) { setMessage(data.error || 'Could not start Stripe onboarding.'); setBusyId(null); return }
    window.location.href = data.url
  }

  async function handleBook(serviceId: string) {
    setBusyId(serviceId)
    setMessage('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setMessage('Please log in to book.'); setBusyId(null); return }
    const res = await fetch('/api/services/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) { setMessage(data.error || 'Could not start checkout.'); setBusyId(null); return }
    window.location.href = data.url
  }

  const visibleServices = activeCategory ? services.filter(s => s.service_category === activeCategory) : services

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ color: 'var(--barn-red)' }}>Farm Services</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
          {showForm ? 'Cancel' : '+ List a Service'}
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Farm sitters, farriers, butchers, helpers, and other service providers farmers can hire — listing is always free.</p>
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveCategory(null)}
          style={{
            border: `1px solid ${activeCategory === null ? '#8B1A1A' : '#D4C5A9'}`,
            backgroundColor: activeCategory === null ? '#8B1A1A' : 'white',
            color: activeCategory === null ? 'white' : '#5D4E37',
            borderRadius: 999, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
          }}>
          All
        </button>
        {SERVICE_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            style={{
              border: `1px solid ${activeCategory === cat ? '#8B1A1A' : '#D4C5A9'}`,
              backgroundColor: activeCategory === cat ? '#8B1A1A' : 'white',
              color: activeCategory === cat ? 'white' : '#5D4E37',
              borderRadius: 999, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}>
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <input placeholder="Provider or business name" value={providerName} onChange={e => setProviderName(e.target.value)} required
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}>
            {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <textarea placeholder="Description of services offered" value={description} onChange={e => setDescription(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Service area (e.g. Within 30mi of Springfield)" value={serviceArea} onChange={e => setServiceArea(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Rate description (e.g. $40/visit, $75/hr)" value={rateInfo} onChange={e => setRateInfo(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Bookable price in $ (optional — lets people pay through the site, e.g. 40)" value={bookingRate} onChange={e => setBookingRate(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          <input placeholder="Contact info (email/phone)" value={contactInfo} onChange={e => setContactInfo(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={submitting}
            style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            {submitting ? 'Listing...' : 'List Service'}
          </button>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {!loading && visibleServices.length === 0 && <p style={{ color: '#888' }}>No services listed yet. Be the first!</p>}
      {visibleServices.map(s => {
        const isMine = s.created_by === userId
        const isBusy = busyId === s.id
        return (
          <div key={s.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{s.provider_name}</h3>
              <span style={{ background: '#F0C040', color: '#2C1810', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{s.service_category}</span>
            </div>
            {s.service_area && <p style={{ margin: '0 0 0.25rem', color: '#666', fontSize: '0.9rem' }}>📍 {s.service_area}</p>}
            {s.description && <p style={{ margin: '0 0 0.25rem', color: '#444', fontSize: '0.9rem' }}>{s.description}</p>}
            {s.rate_info && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>💰 {s.rate_info}</p>}
            {s.contact_info && <p style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.85rem' }}>📞 {s.contact_info}</p>}

            {isMine && s.booking_rate != null && !s.stripe_account_id && (
              <button onClick={() => connectProviderStripe(s.id)} disabled={isBusy}
                style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '0.5rem 1.1rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                {isBusy ? 'Connecting...' : '💳 Connect Stripe to accept bookings'}
              </button>
            )}
            {isMine && s.stripe_account_id && (
              <p style={{ fontSize: '0.8rem', color: s.subscribed ? 'var(--green)' : '#888' }}>
                {s.subscribed ? '✅ Subscribed — $1 fee per booking' : '$5 fee per booking on the free plan ($1 if subscribed)'}
              </p>
            )}
            {!isMine && s.booking_rate != null && s.stripe_account_id && (
              <button onClick={() => handleBook(s.id)} disabled={isBusy}
                style={{ backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', padding: '0.5rem 1.1rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
                {isBusy ? 'Redirecting...' : `Book & Pay $${s.booking_rate}`}
              </button>
            )}
          </div>
        )
      })}
    </main>
  )
}
