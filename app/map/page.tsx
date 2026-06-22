'use client'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <p style={{ padding: 40 }}>Loading map...</p> })

export default function MapPage() {
  return (
    <main style={{ fontFamily: 'Georgia, serif' }}>
      <h1 style={{ color: 'var(--barn-red)', padding: '1.5rem 2rem 0' }}>Explore the Map</h1>
      <p style={{ padding: '0 2rem', color: '#666' }}>🌾 Farms · 🧺 Markets &amp; Events</p>
      <MapView />
    </main>
  )
}
