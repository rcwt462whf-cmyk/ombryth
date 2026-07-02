import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase/server"
import {
  sendProWelcomeEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
  sendRenewalEmail,
} from "@/lib/emails/billing"
import type Stripe from "stripe"

/** Look up a user's email by their Stripe customer id (for billing emails). */
async function emailFor(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  customerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("email")
    .eq("stripe_customer_id", customerId)
    .single()
  return (data?.email as string | undefined) ?? null
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[webhook] Invalid signature:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Stripe calls this server-to-server with no user session, so the anon client's
  // RLS (auth.uid() = id) would match zero rows and silently no-op every update.
  // Service role is required to update users keyed by stripe_customer_id / referral_code.
  const supabase = await createServiceClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const refCode = session.metadata?.ref_code ?? null
      const userId = session.metadata?.supabase_user_id ?? null

      if (refCode && userId) {
        // Find the referrer by their referral_code
        const { data: referrer } = await supabase
          .from("users")
          .select("id, referral_free_months")
          .eq("referral_code", refCode)
          .single()

        if (referrer) {
          // Mark the new subscriber as referred
          await supabase
            .from("users")
            .update({ referred_by: refCode })
            .eq("id", userId)

          // Credit the referrer with a free month
          await supabase
            .from("users")
            .update({ referral_free_months: (referrer.referral_free_months ?? 0) + 1 })
            .eq("id", referrer.id)

          console.log("Referral credited to", referrer.id)
        }
      }
      break
    }

    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const status = subscription.status === "active" ? "active" : subscription.status

      await supabase
        .from("users")
        .update({ subscription_status: status })
        .eq("stripe_customer_id", customerId)

      // Pro welcome email (non-fatal). The onboarding welcome already fires on the
      // first generation, so a paying user gets a billing-specific welcome here.
      try {
        const email = await emailFor(supabase, customerId)
        if (email) await sendProWelcomeEmail(email)
      } catch (emailErr) {
        console.error("[webhook] pro welcome email failed:", emailErr)
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const status = subscription.status === "active" ? "active" : subscription.status

      await supabase
        .from("users")
        .update({ subscription_status: status })
        .eq("stripe_customer_id", customerId)
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from("users")
        .update({ subscription_status: "cancelled" })
        .eq("stripe_customer_id", customerId)

      // Win-back email (non-fatal)
      try {
        const email = await emailFor(supabase, customerId)
        if (email) await sendSubscriptionCancelledEmail(email)
      } catch (emailErr) {
        console.error("[webhook] cancellation email failed:", emailErr)
      }
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase
        .from("users")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId)

      // Dunning email — keep the payer (non-fatal)
      try {
        const email = await emailFor(supabase, customerId)
        if (email) await sendPaymentFailedEmail(email)
      } catch (emailErr) {
        console.error("[webhook] payment-failed email failed:", emailErr)
      }
      break
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase
        .from("users")
        .update({ subscription_status: "active" })
        .eq("stripe_customer_id", customerId)

      // Only email on real renewals — the first invoice is covered by the Pro welcome.
      if (invoice.billing_reason === "subscription_cycle") {
        try {
          const email = await emailFor(supabase, customerId)
          if (email) await sendRenewalEmail(email)
        } catch (emailErr) {
          console.error("[webhook] renewal email failed:", emailErr)
        }
      }
      break
    }

    default:
      // Unhandled event type — ignore
      break
  }

  return NextResponse.json({ received: true })
}
