'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function CheckoutSuccess() {
  const [isGuest, setIsGuest] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsGuest(!!user?.is_anonymous))
  }, [])

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { data, error: updateError } = await supabase.auth.updateUser({ email, password })
    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }
    if (data.user) {
      await supabase.from('profiles').update({ email }).eq('id', data.user.id)
    }
    setSubmitting(false)
    setDone(true)
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', textAlign: 'center' }}>
      <h1>Thank you for your order! 🌾</h1>
      <p>Your payment was successful. Your order is being processed.</p>

      {isGuest && !done && (
        <div style={{ maxWidth: 420, margin: '2rem auto 0', background: 'white', border: '1px solid #eee', borderRadius: 8, padding: '1.5rem', textAlign: 'left' }}>
          <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Save this order</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Add an email and password to turn this guest checkout into a real account — your order history carries over automatically.
          </p>
          <form onSubmit={handleSaveAccount}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ display: 'block', width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}
            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: '0.7rem', backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              {submitting ? 'Saving...' : 'Create my account'}
            </button>
          </form>
        </div>
      )}
      {done && (
        <p style={{ color: 'var(--green)', marginTop: '1.5rem' }}>✅ Check your email to confirm your account — your order is already linked to it.</p>
      )}

      <p style={{ marginTop: '2rem' }}><Link href="/marketplace">Continue shopping</Link></p>
    </main>
  )
}
