import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripeAdmin(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return stripeInstance
}

export async function syncPayoutSchedule(stripe: Stripe, accountId: string, isPaid: boolean) {
  try {
    await stripe.accounts.update(accountId, {
      settings: { payouts: { schedule: { delay_days: isPaid ? 2 : 7 } } },
    })
  } catch (err) {
    console.error('Failed to sync payout schedule:', err)
  }
}
