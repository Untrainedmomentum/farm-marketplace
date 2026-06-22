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
    } else if (charge.transfer_group) {
      const transfers = await stripe.transfers.list({ transfer_group: charge.transfer_group, limit: 100 })
      let remaining = dispute.amount
      for (const transfer of transfers.data) {
        if (remaining <= 0) break
        const available = transfer.amount - (transfer.amount_reversed ?? 0)
        const reverseAmount = Math.min(available, remaining)
        if (reverseAmount <= 0) continue
        try {
          await stripe.transfers.createReversal(transfer.id, { amount: reverseAmount })
          remaining -= reverseAmount
        } catch (err) {
          console.error('Transfer reversal failed (connected account balance likely insufficient):', err)
        }
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

    if (dispute.status === 'won') {
      if (transferId) {
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
      } else if (charge.transfer_group) {
        const transfers = await stripe.transfers.list({ transfer_group: charge.transfer_group, limit: 100 })
        for (const transfer of transfers.data) {
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
      }
    }

    return NextResponse.json({ received: true })
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const supabaseAdmin = getSupabaseAdmin()
    const payoutsEnabled = !!account.payouts_enabled
    await supabaseAdmin.from('farms').update({ payouts_enabled: payoutsEnabled }).eq('stripe_account_id', account.id)
    await supabaseAdmin.from('drivers').update({ payouts_enabled: payoutsEnabled }).eq('stripe_account_id', account.id)
    await supabaseAdmin.from('farm_services').update({ payouts_enabled: payoutsEnabled }).eq('stripe_account_id', account.id)
    return NextResponse.json({ received: true })
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const supabaseAdmin = getSupabaseAdmin()
    const isActive = event.type === 'customer.subscription.updated' && (subscription.status === 'active' || subscription.status === 'trialing')
    if (!isActive) {
      await supabaseAdmin.from('farms').update({ subscription_tier: 'free' }).eq('stripe_subscription_id', subscription.id)
      await supabaseAdmin.from('drivers').update({ subscribed: false }).eq('stripe_subscription_id', subscription.id)
      await supabaseAdmin.from('farm_services').update({ subscribed: false }).eq('stripe_subscription_id', subscription.id)
    }
    return NextResponse.json({ received: true })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const paymentIntentId = session.payment_intent as string | null
    const supabaseAdmin = getSupabaseAdmin()

    if (session.mode === 'subscription') {
      const entity = session.metadata?.entity
      const subscriptionId = session.subscription as string
      if (entity === 'farm' && session.metadata?.farm_id && session.metadata?.tier) {
        await supabaseAdmin.from('farms').update({
          subscription_tier: session.metadata.tier,
          stripe_subscription_id: subscriptionId,
        }).eq('id', session.metadata.farm_id)
      } else if (entity === 'driver' && session.metadata?.driver_id) {
        await supabaseAdmin.from('drivers').update({
          subscribed: true,
          stripe_subscription_id: subscriptionId,
        }).eq('id', session.metadata.driver_id)
      } else if (entity === 'service' && session.metadata?.service_id) {
        await supabaseAdmin.from('farm_services').update({
          subscribed: true,
          stripe_subscription_id: subscriptionId,
        }).eq('id', session.metadata.service_id)
      }
      return NextResponse.json({ received: true })
    }

    if (session.metadata?.type === 'service_booking') {
      const serviceId = session.metadata.service_id
      const requesterId = session.metadata.requester_id

      if (serviceId && requesterId && paymentIntentId) {
        const { data: existing } = await supabaseAdmin
          .from('service_bookings')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle()

        if (!existing) {
          await supabaseAdmin.from('service_bookings').insert({
            service_id: serviceId,
            requester_id: requesterId,
            fee: (session.amount_total ?? 0) / 100,
            status: 'paid',
            stripe_payment_intent_id: paymentIntentId,
          })
        }
      }
      return NextResponse.json({ received: true })
    }

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
    const transferGroup = session.metadata?.transfer_group

    if (userId && paymentIntentId) {
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

        if (cartItems?.length) {
          const { data: order } = await supabaseAdmin
            .from('orders')
            .insert({
              buyer_id: userId,
              total: (session.amount_total ?? 0) / 100,
              platform_fee: 3,
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
            await supabaseAdmin.from('cart_items').delete().eq('user_id', userId)

            const subtotalsByFarm = new Map<string, number>()
            for (const item of cartItems) {
              const price = (item.product as unknown as { price: number }).price
              const lineCents = Math.round(Number(price) * 100) * item.quantity
              subtotalsByFarm.set(item.farm_id, (subtotalsByFarm.get(item.farm_id) ?? 0) + lineCents)
            }

            const { data: farms } = await supabaseAdmin
              .from('farms')
              .select('id, stripe_account_id')
              .in('id', [...subtotalsByFarm.keys()])

            const stripe = getStripeAdmin()
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
            const chargeId = paymentIntent.latest_charge as string | null

            for (const farm of farms ?? []) {
              const amount = subtotalsByFarm.get(farm.id)
              if (!amount || !farm.stripe_account_id) continue
              try {
                await stripe.transfers.create({
                  amount,
                  currency: 'usd',
                  destination: farm.stripe_account_id,
                  transfer_group: transferGroup,
                  ...(chargeId ? { source_transaction: chargeId } : {}),
                })
              } catch (err) {
                console.error(`Transfer to farm ${farm.id} failed:`, err)
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
