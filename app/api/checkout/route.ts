import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeAdmin, syncPayoutSchedule, getFarmTierLimits } from '@/lib/stripeAdmin'

const SERVICE_FEE_CENTS = 300

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

  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select('id, farm_id, quantity, product:products(name, price)')
    .eq('user_id', user.id)

  if (error || !cartItems?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const farmIds = [...new Set(cartItems.map(item => item.farm_id))]
  const { data: farms, error: farmsError } = await supabase
    .from('farms')
    .select('id, name, stripe_account_id, subscription_tier, payouts_enabled')
    .in('id', farmIds)

  if (farmsError || !farms || farms.length !== farmIds.length) {
    return NextResponse.json({ error: 'One or more farms in your cart could not be found' }, { status: 404 })
  }

  const farmsById = new Map(farms.map(f => [f.id, f]))

  const notConnected = farms.find(f => !f.stripe_account_id)
  if (notConnected) {
    return NextResponse.json({ error: `${notConnected.name} hasn't set up payouts yet. Please remove their items or try again later.` }, { status: 400 })
  }

  const subtotalsByFarm = new Map<string, number>()
  for (const item of cartItems) {
    const product = item.product as unknown as { price: number }
    const lineCents = Math.round(Number(product.price) * 100) * item.quantity
    subtotalsByFarm.set(item.farm_id, (subtotalsByFarm.get(item.farm_id) ?? 0) + lineCents)
  }

  for (const [farmId, subtotalCents] of subtotalsByFarm) {
    const farm = farmsById.get(farmId)!
    const { capCents } = getFarmTierLimits(farm.subscription_tier, farm.payouts_enabled)
    if (capCents != null && subtotalCents > capCents) {
      return NextResponse.json({
        error: `${farm.name} is limited to $${capCents / 100} per order on their current plan. Please check out their items separately in a smaller order, or ask them to upgrade.`,
      }, { status: 400 })
    }
  }

  const origin = request.headers.get('origin') || new URL(request.url).origin
  const transferGroup = `order_${user.id}_${Date.now()}`
  const stripe = getStripeAdmin()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      ...cartItems.map((item) => {
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
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Service fee' },
          unit_amount: SERVICE_FEE_CENTS,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      transfer_group: transferGroup,
    },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata: { user_id: user.id, transfer_group: transferGroup },
  })

  for (const farm of farms) {
    const { delayDays } = getFarmTierLimits(farm.subscription_tier, farm.payouts_enabled)
    await syncPayoutSchedule(stripe, farm.stripe_account_id!, delayDays)
  }

  return NextResponse.json({ url: session.url })
}
