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

  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute
    const stripe = getStripeAdmin()
    const supabaseAdmin = getSupabaseAdmin()
    const chargeId = dispute.charge as string
    const charge = await stripe.charges.retrieve(chargeId)
    const transferId = charge.transfer as string | null

    if (transferId) {
      const transfer = await stripe.transfers.retrieve(transferId)
      const reverseAmount = Math.min(dispute.amount, transfer.amount)
      try {
        await stripe.transfers.createReversal(transferId, { amount: reverseAmount })
      } catch (err) {
        console.error('Transfer reversal failed (connected account balance likely insufficient):', err)
      }
    }

    const paymentIntentId = charge.payment_intent as string | null
    if (paymentIntentId) {
      await supabaseAdmin.from('orders').update({ status: 'disputed' }).eq('stripe_payment_intent_id', paymentIntentId)
      await supabaseAdmin.from('deliveries').update({ status: 'disputed' }).eq('stripe_payment_intent_id', paymentIntentId)
    }

    return NextResponse.json({ received: true })
  }

  if (event.type === 'charge.dispute.closed') {
    const dispute = event.data.object as Stripe.Dispute
    const stripe = getStripeAdmin()
    const chargeId = dispute.charge as string
    const charge = await stripe.charges.retrieve(chargeId)
    const transferId = charge.transfer as string | null

    if (dispute.status === 'won' && transferId) {
      const transfer = await stripe.transfers.retrieve(transferId)
      const amountReversed = transfer.amount_reversed ?? 0
      if (amountReversed > 0) {
        await stripe.transfers.create({
          amount: amountReversed,
          currency: transfer.currency,
          destination: transfer.destination as string,
          source_transaction: chargeId,
        })
      }
    }

    return NextResponse.json({ received: true })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const paymentIntentId = session.payment_intent as string | null
    const supabaseAdmin = getSupabaseAdmin()

    if (session.metadata?.type === 'delivery') {
      const driverId = session.metadata.driver_id
      const requesterId = session.metadata.requester_id
      const address = session.metadata.address

      if (driverId && requesterId && paymentIntentId) {
        const { data: existing } = await supabaseAdmin
          .from('deliveries')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle()

        if (!existing) {
          const { data: recentOrder } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('buyer_id', requesterId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          await supabaseAdmin.from('deliveries').insert({
            driver_id: driverId,
            requester_id: requesterId,
            order_id: recentOrder?.id ?? null,
            delivery_address: address,
            fee: (session.amount_total ?? 0) / 100,
            status: 'paid',
            stripe_payment_intent_id: paymentIntentId,
          })
        }
      }
      return NextResponse.json({ received: true })
    }

    const userId = session.metadata?.user_id
    const farmId = session.metadata?.farm_id

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
