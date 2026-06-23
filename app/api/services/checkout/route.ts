import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin, PLATFORM_FEE_CENTS } from '@/lib/stripeAdmin'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const { serviceId } = await request.json()
  if (!serviceId) {
    return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 })
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

  const { data: service, error } = await supabase
    .from('farm_services')
    .select('id, provider_name, booking_rate, stripe_account_id, active')
    .eq('id', serviceId)
    .single()

  if (error || !service || !service.active) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }
  if (!service.stripe_account_id) {
    return NextResponse.json({ error: "This provider hasn't set up payouts yet" }, { status: 400 })
  }
  if (!service.booking_rate) {
    return NextResponse.json({ error: 'This provider has not set a booking rate' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin

  const session = await getStripeAdmin().checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Booking with ${service.provider_name}` },
        unit_amount: Math.round(Number(service.booking_rate) * 100),
      },
      quantity: 1,
    }],
    payment_intent_data: {
      transfer_data: { destination: service.stripe_account_id },
      application_fee_amount: PLATFORM_FEE_CENTS,
    },
    success_url: `${origin}/services?booking_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/services`,
    metadata: {
      type: 'service_booking',
      service_id: serviceId,
      requester_id: user.id,
    },
  })

  return NextResponse.json({ url: session.url })
}
