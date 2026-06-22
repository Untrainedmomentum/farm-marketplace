import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin } from '@/lib/stripeAdmin'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { data: farm, error } = await supabase
    .from('farms')
    .select('id, stripe_customer_id')
    .eq('owner_id', user.id)
    .single()

  if (error || !farm || !farm.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin
  const portalSession = await getStripeAdmin().billingPortal.sessions.create({
    customer: farm.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  })

  return NextResponse.json({ url: portalSession.url })
}
