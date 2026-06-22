import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin, getOrCreatePrice } from '@/lib/stripeAdmin'

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

  const { data: driver, error } = await supabase
    .from('drivers')
    .select('id, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (error || !driver) {
    return NextResponse.json({ error: 'No driver profile found for this account' }, { status: 400 })
  }

  const stripe = getStripeAdmin()
  let customerId = driver.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email })
    customerId = customer.id
    await supabase.from('drivers').update({ stripe_customer_id: customerId }).eq('id', driver.id)
  }

  const priceId = await getOrCreatePrice(stripe, 'driver_monthly', 2000, 'My Farm Express — Driver Plan')

  const origin = request.headers.get('origin') || new URL(request.url).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/delivery-dashboard?subscribed=true`,
    cancel_url: `${origin}/delivery-dashboard`,
    metadata: { entity: 'driver', driver_id: driver.id },
  })

  return NextResponse.json({ url: session.url })
}
