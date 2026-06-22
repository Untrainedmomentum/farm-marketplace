'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleRole = (role: string) => {
    setRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (roles.length === 0) {
      setError('Please select at least one role.')
      return
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const user = data.user
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email, role: roles })

      if (profileError) {
        setError('Account created but profile setup failed: ' + profileError.message)
        setLoading(false)
        return
      }
    }

    // Redirect based on role priority
    if (roles.includes('farmer')) {
      router.push('/onboarding')
    } else if (roles.includes('delivery')) {
      router.push('/delivery-dashboard')
    } else {
      router.push('/marketplace')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '420px' }}>
        <h1 style={{ color: 'var(--barn-red)', marginBottom: '0.25rem', fontSize: '1.8rem' }}>Join My Farm Express</h1>
        <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>Fresh from the farm, straight to you.</p>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#444', fontSize: '0.9rem' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#444', fontSize: '0.9rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: '#444', fontSize: '0.9rem', fontWeight: 'bold' }}>I am a... (select all that apply)</label>

            {[
              { value: 'farmer', label: '🌾 Farmer', desc: 'I want to sell farm products' },
              { value: 'customer', label: '🛒 Shopper', desc: 'I want to buy farm products' },
              { value: 'delivery', label: '🚚 Delivery Provider', desc: 'I want to deliver orders' },
            ].map(({ value, label, desc }) => (
              <div
                key={value}
                onClick={() => toggleRole(value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  border: `2px solid ${roles.includes(value) ? 'var(--barn-red)' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: roles.includes(value) ? '#fff5f5' : 'white',
                  transition: 'all 0.15s'
                }}
              >
                <input
                  type="checkbox"
                  checked={roles.includes(value)}
                  onChange={() => toggleRole(value)}
                  style={{ accentColor: 'var(--barn-red)', width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{label}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: '0.2rem', width: '16px', height: '16px', accentColor: 'var(--barn-red)' }} />
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              I agree to the <Link href="/terms" target="_blank" style={{ color: 'var(--barn-red)' }}>Terms of Service</Link>,{' '}
              <Link href="/privacy" target="_blank" style={{ color: 'var(--barn-red)' }}>Privacy Policy</Link>, and{' '}
              <Link href="/fees" target="_blank" style={{ color: 'var(--barn-red)' }}>Fees</Link>.
            </span>
          </label>

          {error && (
            <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--barn-red)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', fontFamily: 'Georgia, serif', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
          Already have an account? <Link href="/auth/login" style={{ color: 'var(--barn-red)' }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}