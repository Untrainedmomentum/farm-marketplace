import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin } from '@/lib/stripeAdmin'

const PLATFORM_FEE_CENTS = 300

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const { farmId } = await request.json()
  if (!farmId) {
    return NextResponse.json({ error: 'Missing farmId' }, { status: 400 })
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

  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('id, stripe_account_id, subscription_active')
    .eq('id', farmId)
    .single()

  if (farmError || !farm) {
    return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
  }
  if (!farm.stripe_account_id) {
    return NextResponse.json({ error: "This farm hasn't set up payouts yet" }, { status: 400 })
  }

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select('id, quantity, product:products(name, price)')
    .eq('user_id', user.id)
    .eq('farm_id', farmId)

  if (error || !cartItems?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin
  const platformFee = farm.subscription_active ? 0 : PLATFORM_FEE_CENTS

  const session = await getStripeAdmin().checkout.sessions.create({
    mode: 'payment',
    line_items: cartItems.map((item) => {
      const product = item.product as unknown as { name: string; price: number }
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: product.name },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: item.quantity,
      }
    }),
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: { destination: farm.stripe_account_id },
    },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata: { user_id: user.id, farm_id: farmId },
  })

  return NextResponse.json({ url: session.url })
}
