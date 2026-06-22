'use client'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    supabase.from('farms').select('id, name, slug, lat, lng').then(({ data }) => setFarms(data || []))
    supabase.from('markets').select('id, name, address, lat, lng').then(({ data }) => setMarkets(data || []))
    supabase.from('events').select('id, title, address, lat, lng').then(({ data }) => setEvents(data || []))
  }, [])

  return (
    <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '80vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {farms.filter(f => f.lat && f.lng).map(f => (
        <Marker key={`farm-${f.id}`} position={[f.lat!, f.lng!]} icon={farmIcon}>
          <Popup>
            🌾 <strong>{f.name}</strong><br />
            <Link href={`/farm/${f.slug}`}>Visit storefront</Link>
          </Popup>
        </Marker>
      ))}
      {markets.filter(m => m.lat && m.lng).map(m => (
        <Marker key={`market-${m.id}`} position={[m.lat!, m.lng!]} icon={marketIcon}>
          <Popup>
            🧺 <strong>{m.name}</strong><br />
            {m.address}
          </Popup>
        </Marker>
      ))}
      {events.filter(e => e.lat && e.lng).map(e => (
        <Marker key={`event-${e.id}`} position={[e.lat!, e.lng!]} icon={marketIcon}>
          <Popup>
            📅 <strong>{e.title}</strong><br />
            {e.address}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
