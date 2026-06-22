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

const farmIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
const marketIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'market-marker',
})

type Farm = { id: string; name: string; slug: string; lat: number | null; lng: number | null }
type Market = { id: string; name: string; address: string; lat: number | null; lng: number | null }
type FarmEvent = { id: string; title: string; address: string; lat: number | null; lng: number | null }

export default function MapView() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [events, setEvents] = useState<FarmEvent[]>([])
  const [zip, setZip] = useState('')
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    supabase.from('farms').select('id, name, slug, lat, lng').then(({ data }) => setFarms(data || []))
    supabase.from('markets').select('id, name, address, lat, lng').then(({ data }) => setMarkets(data || []))
    supabase.from('events').select('id, title, address, lat, lng').then(({ data }) => setEvents(data || []))
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
            <Link href={`/farm/${f.slug}`}>Visit storefront</Link>
          </Popup>
        </Marker>
      ))}
      {markets.filter(m => m.lat && m.lng && withinRadius(m.lat, m.lng)).map(m => (
        <Marker key={`market-${m.id}`} position={[m.lat!, m.lng!]} icon={marketIcon}>
          <Popup>
            🧺 <strong>{m.name}</strong><br />
            {m.address}
          </Popup>
        </Marker>
      ))}
      {events.filter(e => e.lat && e.lng && withinRadius(e.lat, e.lng)).map(e => (
        <Marker key={`event-${e.id}`} position={[e.lat!, e.lng!]} icon={marketIcon}>
          <Popup>
            📅 <strong>{e.title}</strong><br />
            {e.address}
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </div>
  )
}
