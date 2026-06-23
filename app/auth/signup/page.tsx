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
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#8B1A1A' }}>
            Join My Farm Express
          </h1>
          <p className="text-gray-600">Fresh from the farm, straight to you</p>
        </div>

        {/* Card */}
        <div 
          className="rounded-lg shadow-lg p-8 border-2"
          style={{ 
            backgroundColor: '#FFFDF5',
            borderColor: '#F5E6C8'
          }}
        >
          {/* Error Message */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-lg border-l-4"
              style={{ 
                backgroundColor: '#FEE2E2',
                borderColor: '#8B1A1A',
                color: '#7F1D1D'
              }}
            >
              <p className="font-semibold text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#2C1810' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none"
                style={{
                  borderColor: '#F5E6C8',
                  color: '#2C1810',
                  backgroundColor: '#FFFDF5'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8B1A1A'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#F5E6C8'}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#2C1810' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none"
                style={{
                  borderColor: '#F5E6C8',
                  color: '#2C1810',
                  backgroundColor: '#FFFDF5'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8B1A1A'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#F5E6C8'}
              />
            </div>

            {/* Roles */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#2C1810' }}>
                I am a... (select all that apply)
              </label>
              <div className="space-y-2">
                {[
                  { value: 'farmer', label: '🌾 Farmer', desc: 'I want to sell farm products' },
                  { value: 'customer', label: '🛒 Shopper', desc: 'I want to buy farm products' },
                  { value: 'delivery', label: '🚚 Delivery Provider', desc: 'I want to deliver orders' },
                ].map(({ value, label, desc }) => (
                  <div
                    key={value}
                    onClick={() => toggleRole(value)}
                    className="p-3 border-2 rounded-lg cursor-pointer transition duration-150"
                    style={{
                      borderColor: roles.includes(value) ? '#8B1A1A' : '#F5E6C8',
                      backgroundColor: roles.includes(value) ? '#FEE2E2' : '#FFFDF5',
                    }}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roles.includes(value)}
                        onChange={() => toggleRole(value)}
                        className="w-4 h-4"
                        style={{ accentColor: '#8B1A1A' }}
                      />
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#2C1810' }}>{label}</div>
                        <div className="text-xs text-gray-600">{desc}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                id="terms"
                className="mt-1 w-4 h-4"
                style={{ accentColor: '#8B1A1A' }}
              />
              <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="hover:underline" style={{ color: '#8B1A1A' }}>
                  Terms of Service
                </Link>
                , <Link href="/privacy" target="_blank" className="hover:underline" style={{ color: '#8B1A1A' }}>
                  Privacy Policy
                </Link>
                , and{' '}
                <Link href="/fees" target="_blank" className="hover:underline" style={{ color: '#8B1A1A' }}>
                  Fees
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition duration-200"
              style={{
                backgroundColor: loading ? '#C4622D' : '#8B1A1A',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t-2" style={{ borderColor: '#F5E6C8' }}></div>
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t-2" style={{ borderColor: '#F5E6C8' }}></div>
          </div>

          {/* Login Link */}
          <p className="text-center text-sm">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold hover:underline"
              style={{ color: '#8B1A1A' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}