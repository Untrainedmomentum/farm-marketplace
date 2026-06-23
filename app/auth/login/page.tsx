'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else router.push('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#8B1A1A' }}>
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to your farm account</p>
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
          <form onSubmit={handleLogin} className="space-y-5">
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
                className="w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none focus:ring-2"
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
                className="w-full px-4 py-3 border-2 rounded-lg transition focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#F5E6C8',
                  color: '#2C1810',
                  backgroundColor: '#FFFDF5'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8B1A1A'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#F5E6C8'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition duration-200 transform hover:scale-105"
              style={{
                backgroundColor: loading ? '#C4622D' : '#8B1A1A',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t-2" style={{ borderColor: '#F5E6C8' }}></div>
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t-2" style={{ borderColor: '#F5E6C8' }}></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm">
            Don't have an account?{' '}
            <a
              href="/auth/signup"
              className="font-semibold transition"
              style={{ color: '#8B1A1A' }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Create one
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing in, you agree to our{' '}
          <a href="/terms" className="hover:underline" style={{ color: '#8B1A1A' }}>
            Terms of Service
          </a>
        </p>
      </div>
    </main>
  )
}
