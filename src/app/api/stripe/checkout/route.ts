import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Read optional ref_code from request body (form POST has no body, JSON POST does)
  let ref_code: string | null = null
  try {
    const contentType = request.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      const body = await request.json() as { ref_code?: string }
      ref_code = body.ref_code ?? null
    }
  } catch {
    // No body or not JSON — fine
  }

  const { origin } = new URL(request.url)

  // Get or create Stripe customer
  const { data: userData } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  let customerId = userData?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
  }

  // If STRIPE_PRICE_ID env var is set, use it directly (recommended for production)
  // Otherwise fall back to inline price_data (fine for testing)
  const lineItems = process.env.STRIPE_PRICE_ID
    ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "eur",
            unit_amount: 299,
            recurring: { interval: "month" as const },
            product_data: {
              name: "Ombryth Pro",
              description: "Unlimited generations, all models, all features",
            },
          },
          quantity: 1,
        },
      ]

  const metadata: Record<string, string> = { supabase_user_id: user.id }
  if (ref_code) metadata.ref_code = ref_code

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: lineItems,
    success_url: `${origin}/app/billing?success=1`,
    cancel_url: `${origin}/app/billing?cancelled=1`,
    metadata,
  })

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }

  return NextResponse.redirect(session.url)
}
