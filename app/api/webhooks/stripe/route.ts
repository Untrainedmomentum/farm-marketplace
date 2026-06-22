import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripeAdmin } from '@/lib/stripeAdmin'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripeAdmin().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const farmId = session.metadata?.farm_id
    const paymentIntentId = session.payment_intent as string | null
    const supabaseAdmin = getSupabaseAdmin()

    if (userId && farmId && paymentIntentId) {
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()

      if (!existing) {
        const { data: cartItems } = await supabaseAdmin
          .from('cart_items')
          .select('product_id, farm_id, quantity, product:products(price)')
          .eq('user_id', userId)
          .eq('farm_id', farmId)

        const { data: farm } = await supabaseAdmin
          .from('farms')
          .select('subscription_active')
          .eq('id', farmId)
          .single()

        if (cartItems?.length) {
          const { data: order } = await supabaseAdmin
            .from('orders')
            .insert({
              buyer_id: userId,
              total: (session.amount_total ?? 0) / 100,
              platform_fee: farm?.subscription_active ? 0 : 3,
              status: 'paid',
              stripe_payment_intent_id: paymentIntentId,
            })
            .select('id')
            .single()

          if (order) {
            await supabaseAdmin.from('order_items').insert(
              cartItems.map((item) => ({
                order_id: order.id,
                product_id: item.product_id,
                farm_id: item.farm_id,
                quantity: item.quantity,
                price: (item.product as unknown as { price: number }).price,
              }))
            )
            await supabaseAdmin.from('cart_items').delete().eq('user_id', userId).eq('farm_id', farmId)
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
