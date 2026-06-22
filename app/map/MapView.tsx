'use client'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { distanceMiles } from '@/lib/geocode'

const RADIUS_MILES = 50

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 9) }, [lat, lng])
  return null
}

const COLOR_MARKER_BASE = 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img'
function colorIcon(color: string) {
  return new L.Icon({
    iconUrl: `${COLOR_MARKER_BASE}/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })
}

const farmIcon = colorIcon('green')
const marketIcon = colorIcon('blue')
const standIconClaimed = colorIcon('green')
const standIconUnverified = colorIcon('grey')
const eventIcon = colorIcon('gold')

type Farm = { id: string; name: string; slug: string; lat: number | null; lng: number | null; categories: string[] | null; cash_enabled: boolean | null }
type Market = {
  id: string; name: string; address: string; lat: number | null; lng: number | null
  type: 'market' | 'stand'; farm_id: string | null; county: string | null
  description: string | null; schedule_text: string | null; hours_text: string | null
  website: string | null; contact_info: string | null; notes: string | null
}
type FarmEvent = { id: string; title: string; address: string; lat: number | null; lng: number | null; description: string | null; event_date: string | null }

export default function MapView() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [events, setEvents] = useState<FarmEvent[]>([])
  const [zip, setZip] = useState('')
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    supabase.from('farms').select('id, name, slug, lat, lng, categories, cash_enabled').then(({ data }) => setFarms(data || []))
    supabase.from('markets').select('id, name, address, lat, lng, type, farm_id, county, description, schedule_text, hours_text, website, contact_info, notes').then(({ data }) => setMarkets(data || []))
    supabase.from('events').select('id, title, address, lat, lng, description, event_date').then(({ data }) => setEvents(data || []))
  }, [])

  async function handleLocate(e: React.FormEvent) {
    e.preventDefault()
    setSearchError('')
    if (!zip) { setOrigin(null); return }
    setSearching(true)
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(zip)}`)
    const data = await res.json()
    setSearching(false)
    if (!res.ok) { setSearchError('Could not find that zip code.'); return }
    setOrigin(data)
  }

  const withinRadius = (lat: number | null, lng: number | null) => {
    if (!origin || lat == null || lng == null) return !origin
    return distanceMiles(origin.lat, origin.lng, lat, lng) <= RADIUS_MILES
  }

  return (
    <div>
      <form onSubmit={handleLocate} style={{ display: 'flex', gap: 8, padding: '0 2rem 1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={zip} onChange={e => setZip(e.target.value)} placeholder="Enter zip code"
          style={{ padding: '8px 12px', border: '1px solid #D4C5A9', borderRadius: 6, fontFamily: 'Georgia, serif', fontSize: 14, width: 160 }} />
        <button type="submit" disabled={searching}
          style={{ backgroundColor: 'var(--green)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14 }}>
          {searching ? 'Locating...' : `📍 Find within ${RADIUS_MILES}mi`}
        </button>
        {origin && (
          <button type="button" onClick={() => { setZip(''); setOrigin(null) }}
            style={{ background: 'none', border: '1px solid #D4C5A9', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14, color: '#5D4E37' }}>
            Clear
          </button>
        )}
        {searchError && <span style={{ color: 'red', fontSize: 13 }}>{searchError}</span>}
      </form>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '0 2rem 0.75rem', fontSize: 13, color: '#5D4E37', fontFamily: 'Georgia, serif' }}>
        <span><span style={{ color: '#3cb44b', fontWeight: 'bold' }}>●</span> Verified farm</span>
        <span><span style={{ color: '#3b82f6', fontWeight: 'bold' }}>●</span> Farmers market</span>
        <span><span style={{ color: '#3cb44b', fontWeight: 'bold' }}>●</span> Claimed stand</span>
        <span><span style={{ color: '#888', fontWeight: 'bold' }}>●</span> Unverified stand</span>
        <span><span style={{ color: '#d4a017', fontWeight: 'bold' }}>●</span> Event</span>
      </div>

      <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '75vh', width: '100%' }}>
      {origin && <FlyTo lat={origin.lat} lng={origin.lng} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {farms.filter(f => f.lat && f.lng && withinRadius(f.lat, f.lng)).map(f => (
        <Marker key={`farm-${f.id}`} position={[f.lat!, f.lng!]} icon={farmIcon}>
          <Popup>
            🌾 <strong>{f.name}</strong><br />
            <span style={{ color: 'green', fontSize: 12 }}>✅ Verified MyFarmExpress farm</span><br />
            {f.categories && f.categories.length > 0 && <span style={{ fontSize: 12 }}>{f.categories.join(', ')}<br /></span>}
            {f.cash_enabled && <span style={{ fontSize: 12 }}>💵 Cash accepted<br /></span>}
            <Link href={`/farm/${f.slug}`}>Visit storefront →</Link>
          </Popup>
        </Marker>
      ))}
      {markets.filter(m => m.lat && m.lng && withinRadius(m.lat, m.lng) && m.type === 'market').map(m => (
        <Marker key={`market-${m.id}`} position={[m.lat!, m.lng!]} icon={marketIcon}>
          <Popup>
            🧺 <strong>{m.name}</strong><br />
            <span style={{ fontSize: 12, color: '#666' }}>Multi-vendor farmers market</span><br />
            {m.address}<br />
            {m.county && <span style={{ fontSize: 12 }}>{m.county} County<br /></span>}
            {m.schedule_text && <span style={{ fontSize: 12 }}>🗓️ {m.schedule_text}<br /></span>}
            {m.description && <span style={{ fontSize: 12 }}>{m.description}<br /></span>}
            {m.contact_info && <span style={{ fontSize: 12 }}>📞 {m.contact_info}<br /></span>}
            {m.website && <a href={m.website} target="_blank" rel="noopener noreferrer">🔗 Website</a>}
          </Popup>
        </Marker>
      ))}
      {markets.filter(m => m.lat && m.lng && withinRadius(m.lat, m.lng) && m.type === 'stand').map(m => (
        <Marker key={`stand-${m.id}`} position={[m.lat!, m.lng!]} icon={m.farm_id ? standIconClaimed : standIconUnverified}>
          <Popup>
            🧑‍🌾 <strong>{m.name}</strong><br />
            {m.address}<br />
            {m.county && <span style={{ fontSize: 12 }}>{m.county} County<br /></span>}
            {(m.schedule_text || m.hours_text) && <span style={{ fontSize: 12 }}>🗓️ {[m.schedule_text, m.hours_text].filter(Boolean).join(' · ')}<br /></span>}
            {(m.notes || m.description) && <span style={{ fontSize: 12 }}>{m.notes || m.description}<br /></span>}
            {m.contact_info && <span style={{ fontSize: 12 }}>📞 {m.contact_info}<br /></span>}
            {m.website && <a href={m.website} target="_blank" rel="noopener noreferrer">🔗 Website</a>}<br />
            {m.farm_id
              ? <span style={{ color: 'green', fontSize: 12 }}>✅ Claimed by a MyFarmExpress farm</span>
              : <span style={{ color: '#888', fontSize: 12 }}>Not a MyFarmExpress-verified farm. <Link href="/markets">Is this your stand?</Link></span>}
          </Popup>
        </Marker>
      ))}
      {events.filter(e => e.lat && e.lng && withinRadius(e.lat, e.lng)).map(e => (
        <Marker key={`event-${e.id}`} position={[e.lat!, e.lng!]} icon={eventIcon}>
          <Popup>
            📅 <strong>{e.title}</strong><br />
            {e.event_date && <span style={{ fontSize: 12 }}>{new Date(e.event_date).toLocaleDateString()}<br /></span>}
            {e.address}<br />
            {e.description && <span style={{ fontSize: 12 }}>{e.description}</span>}
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </div>
  )
}
