'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSignup() {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else router.push('/')
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Sign Up</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br /><br />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><br /><br />
      <button onClick={handleSignup}>Sign Up</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Already have an account? <a href="/auth/login">Login</a></p>
    </main>
  )
}
