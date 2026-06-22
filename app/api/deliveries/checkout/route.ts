import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin } from '@/lib/stripeAdmin'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const { driverId, address } = await request.json()
  if (!driverId || !address) {
    return NextResponse.json({ error: 'Missing driverId or address' }, { status: 400 })
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

  const { data: driver, error } = await supabase
    .from('drivers')
    .select('id, name, delivery_rate, stripe_account_id, active')
    .eq('id', driverId)
    .single()

  if (error || !driver || !driver.active) {
    return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
  }
  if (!driver.stripe_account_id) {
    return NextResponse.json({ error: "This driver hasn't set up payouts yet" }, { status: 400 })
  }
  if (!driver.delivery_rate) {
    return NextResponse.json({ error: 'This driver has not set a delivery rate' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin

  const session = await getStripeAdmin().checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Delivery by ${driver.name}` },
        unit_amount: Math.round(Number(driver.delivery_rate) * 100),
      },
      quantity: 1,
    }],
    payment_intent_data: {
      transfer_data: { destination: driver.stripe_account_id },
    },
    success_url: `${origin}/delivery-dashboard?delivery_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/drivers`,
    metadata: {
      type: 'delivery',
      driver_id: driverId,
      requester_id: user.id,
      address,
    },
  })

  return NextResponse.json({ url: session.url })
}
