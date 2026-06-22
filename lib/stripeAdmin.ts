import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripeAdmin(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return stripeInstance
}
