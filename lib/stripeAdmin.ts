import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripeAdmin(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return stripeInstance
}

export async function syncPayoutSchedule(stripe: Stripe, accountId: string, delayDays: number) {
  try {
    await stripe.accounts.update(accountId, {
      settings: { payouts: { schedule: { delay_days: delayDays } } },
    })
  } catch (err) {
    console.error('Failed to sync payout schedule:', err)
  }
}

export const TIER_LIMITS = {
  free: { capCents: 5000, delayDays: 7 },
  paid: { capCents: 15000, delayDays: 3 },
  premium: { capCents: null as number | null, delayDays: 2 },
}

export function getFarmTierLimits(tier: string, payoutsEnabled: boolean) {
  if (!payoutsEnabled) return TIER_LIMITS.free
  return TIER_LIMITS[tier as keyof typeof TIER_LIMITS] ?? TIER_LIMITS.free
}

export async function getOrCreatePrice(stripe: Stripe, lookupKey: string, unitAmountCents: number, productName: string): Promise<string> {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })
  if (existing.data.length) return existing.data[0].id

  const product = await stripe.products.create({ name: productName })
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmountCents,
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: lookupKey,
  })
  return price.id
}
