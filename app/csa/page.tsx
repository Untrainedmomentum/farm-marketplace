'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type CsaProgram = {
  id: string
  name: string
  contents_description: string | null
  schedule_text: string | null
  price: number | null
  signup_info: string | null
  farm: { name: string; slug: string }
}

export default function CsaPage() {
  const [programs, setPrograms] = useState<CsaProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('csa_programs')
      .select('*, farm:farms(name, slug)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPrograms((data as unknown as CsaProgram[]) || [])
        setLoading(false)
      })
  }, [])

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: 'var(--barn-red)' }}>CSA Programs</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Subscribe to a season of fresh boxes straight from local farms.</p>

      {loading && <p>Loading...</p>}
      {!loading && programs.length === 0 && <p style={{ color: '#888' }}>No CSA programs listed yet.</p>}
      {programs.map(p => (
        <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', backgroundColor: 'white' }}>
          <h3 style={{ color: 'var(--barn-red)', margin: '0 0 0.25rem' }}>{p.name}</h3>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>
            🌾 <Link href={`/farm/${p.farm.slug}`}>{p.farm.name}</Link>
          </p>
          {p.schedule_text && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>🗓️ {p.schedule_text}</p>}
          {p.contents_description && <p style={{ margin: '0 0 0.25rem', color: '#444', fontSize: '0.9rem' }}>📦 {p.contents_description}</p>}
          {p.price != null && <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>💰 ${p.price}</p>}
          {p.signup_info && <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>{p.signup_info}</p>}
        </div>
      ))}
    </main>
  )
}
