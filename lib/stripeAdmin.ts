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

export const PLATFORM_FEE_CENTS = 200

export const FARM_LIMITS = {
  unlinked: { capCents: 5000, delayDays: 7 },
  linked: { capCents: 15000, delayDays: 3 },
}

export function getFarmLimits(payoutsEnabled: boolean) {
  return payoutsEnabled ? FARM_LIMITS.linked : FARM_LIMITS.unlinked
}
