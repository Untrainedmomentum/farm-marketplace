import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin, getOrCreatePrice } from '@/lib/stripeAdmin'

const TIER_PRICES = {
  paid: { lookupKey: 'farm_paid_monthly', amountCents: 1500, name: 'My Farm Express — Paid Plan' },
  premium: { lookupKey: 'farm_premium_monthly', amountCents: 5000, name: 'My Farm Express — Premium Plan' },
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const { tier } = await request.json()
  if (tier !== 'paid' && tier !== 'premium') {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

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

  if (error || !farm) {
    return NextResponse.json({ error: 'No farm found for this account' }, { status: 400 })
  }

  const stripe = getStripeAdmin()
  let customerId = farm.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email })
    customerId = customer.id
    await supabase.from('farms').update({ stripe_customer_id: customerId }).eq('id', farm.id)
  }

  const { lookupKey, amountCents, name } = TIER_PRICES[tier as 'paid' | 'premium']
  const priceId = await getOrCreatePrice(stripe, lookupKey, amountCents, name)

  const origin = request.headers.get('origin') || new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?subscribed=${tier}`,
    cancel_url: `${origin}/dashboard`,
    metadata: { farm_id: farm.id, tier },
  })

  return NextResponse.json({ url: session.url })
}
