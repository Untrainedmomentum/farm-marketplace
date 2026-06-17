'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Marketplace() {
  const [farms, setFarms] = useState<any[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('farms').select('*').then(({ data }) => setFarms(data || []))
  }, [])

  return (
    <main style={{ padding: 40, maxWidth: 1100, margin: '0 auto', fontFamily: 'Georgia, serif' }}>
      <h1 style={{ color: '#8B1A1A', fontSize: 36, marginBottom: 8 }}>Farm Marketplace</h1>
      <p style={{ color: '#5D4E37', marginBottom: 32, fontSize: 16 }}>Shop fresh products directly from local farms</p>
      {farms.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#8B6914' }}>
          <p style={{ fontSize: 20 }}>No farms yet — be the first to join!</p>
          <Link href="/auth/signup" style={{ display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#8B1A1A', color: '#F5E6C8', textDecoration: 'none', borderRadius: 8 }}>Join as Farmer</Link>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {farms.map(farm => (
          <Link key={farm.id} href={'/farm/' + farm.slug} style={{ textDecoration: 'none' }}>
            <div
              onMouseOver={() => setHoveredId(farm.id)}
              onMouseOut={() => setHoveredId(null)}
              style={{ border: `2px solid ${hoveredId === farm.id ? '#8B1A1A' : '#D4C5A9'}`, borderRadius: 12, padding: 24, background: '#FFFDF5', transition: 'border-color 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌾</div>
              <h2 style={{ color: '#8B1A1A', margin: '0 0 8px', fontSize: 22 }}>{farm.name}</h2>
              {farm.cash_enabled && <span style={{ background: '#5D8A3C', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>💵 Cash accepted</span>}
              <p style={{ color: '#8B1A1A', marginTop: 16, fontSize: 14, fontWeight: 'bold' }}>Shop Now →</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}