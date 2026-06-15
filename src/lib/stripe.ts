import Stripe from "stripe"

let _stripe: Stripe | undefined

export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string) {
    if (!_stripe) {
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-04-22.dahlia",
      })
    }
    return (_stripe as unknown as Record<string, unknown>)[prop]
  },
})

export const SUBSCRIPTION_PRICE_EUR = 2.99
export const FREE_GENERATION_LIMIT = 10
