import 'server-only'
import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is not set. Please add it to your .env.local file. ' +
    'You can get your API keys from https://dashboard.stripe.com/apikeys'
  )
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
}) 