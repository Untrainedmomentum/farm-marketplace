'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header style={{ backgroundColor: 'var(--barn-red)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="24,4 44,18 4,18" fill="#F5E6C8" />
          <rect x="8" y="18" width="32" height="22" fill="#F5E6C8" />
          <rect x="18" y="28" width="12" height="12" fill="#8B1A1A" />
          <rect x="4" y="18" width="6" height="22" fill="#D4B896" />
          <rect x="38" y="18" width="6" height="22" fill="#D4B896" />
        </svg>
        <div>
          <div style={{ color: '#F5E6C8', fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: 'bold' }}>
            My Farm Express
          </div>
          <div style={{ color: '#F0C040', fontFamily: 'Georgia, serif', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
            FRESH FROM THE FARM
          </div>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link href="/marketplace" style={{ color: '#F5E6C8', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>Marketplace</Link>
        <Link href="/cart" style={{ color: '#F5E6C8', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>Cart</Link>
        <Link href="/dashboard" style={{ color: '#F5E6C8', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>Dashboard</Link>
        {user ? (
          <button
            onClick={handleLogout}
            style={{ color: '#F5E6C8', background: 'none', border: '1px solid #F5E6C8', borderRadius: '4px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
          >
            Logout
          </button>
        ) : (
          <Link href="/auth/login" style={{ color: '#F5E6C8', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>Login</Link>
        )}
      </nav>
    </header>
  )
}