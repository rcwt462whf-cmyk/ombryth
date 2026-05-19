import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
})

export const SUBSCRIPTION_PRICE_EUR = 2.99
export const FREE_GENERATION_LIMIT = 10
