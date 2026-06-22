import { resend } from "@/lib/resend"

// On-brand Ombryth billing emails — mint accent, minimal, no fluff (tool-first voice).
// Each send is awaited by the caller inside try/catch so a failure never breaks the webhook.

const APP_URL = "https://ombryth.io"
const MINT = "#5fe6c4"
const ON_MINT = "#0b3b30"
const INK = "#171717"
const MUTED = "#707070"
const BORDER = "#ededed"

function fromAddress(): string {
  const addr = process.env.RESEND_FROM_EMAIL ?? "hello@ombryth.io"
  return `Ombryth <${addr}>`
}

function shell(opts: {
  heading: string
  intro: string
  bodyHtml?: string
  cta?: { label: string; href: string }
  footnote?: string
}): string {
  const { heading, intro, bodyHtml = "", cta, footnote } = opts
  const ctaHtml = cta
    ? `<tr><td style="padding:8px 0;">
<a href="${cta.href}" style="display:inline-block;padding:13px 28px;background:${MINT};color:${ON_MINT};font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">${cta.label}</a>
</td></tr>`
    : ""
  const footnoteHtml = footnote
    ? `<tr><td style="padding:8px 0 0;"><p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">${footnote}</p></td></tr>`
    : ""
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fafafa;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:540px;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">
<tr><td style="padding:32px 40px 0;">
<span style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:${INK};">Ombryth</span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${MINT};margin-left:6px;vertical-align:middle;"></span>
</td></tr>
<tr><td style="padding:24px 40px 0;">
<h1 style="margin:0;font-size:24px;font-weight:700;letter-spacing:-0.4px;line-height:1.25;color:${INK};">${heading}</h1>
</td></tr>
<tr><td style="padding:14px 40px 0;">
<p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">${intro}</p>
</td></tr>
<tr><td style="padding:20px 40px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${bodyHtml}${ctaHtml}${footnoteHtml}
</table>
</td></tr>
<tr><td style="padding:28px 40px 32px;">
<p style="margin:0;border-top:1px solid ${BORDER};padding-top:18px;font-size:12px;line-height:1.6;color:#9ca3af;">
Ombryth · <a href="${APP_URL}/app/billing" style="color:#9ca3af;text-decoration:underline;">Manage subscription</a> · <a href="mailto:hello@ombryth.io" style="color:#9ca3af;text-decoration:underline;">Contact support</a>
</p>
</td></tr>
</table>
</td></tr></table></body></html>`
}

async function send(email: string, subject: string, html: string): Promise<void> {
  await resend.emails.send({ from: fromAddress(), to: email, subject, html })
}

/** Subscription just became active — what Pro unlocks. */
export async function sendProWelcomeEmail(email: string): Promise<void> {
  const features = [
    "Unlimited generations — no monthly cap",
    "Priority generation queue",
    "Saved prompts &amp; presets",
    "Custom AI persona &amp; defaults",
  ]
  const list = features
    .map(
      (f) =>
        `<tr><td style="padding:0 0 10px;"><p style="margin:0;font-size:14px;line-height:1.5;color:${INK};">→ ${f}</p></td></tr>`,
    )
    .join("")
  await send(
    email,
    "You're on Ombryth Pro",
    shell({
      heading: "You're on Pro",
      intro: "Your subscription is active. Here's what's unlocked:",
      bodyHtml: list + `<tr><td style="height:6px"></td></tr>`,
      cta: { label: "Open Ombryth", href: `${APP_URL}/app` },
      footnote: "Billed €2.99/month. Cancel anytime from Settings → Billing.",
    }),
  )
}

/** A renewal/charge failed — keep them, don't lose them. */
export async function sendPaymentFailedEmail(email: string): Promise<void> {
  await send(
    email,
    "Your Ombryth payment didn't go through",
    shell({
      heading: "Payment failed",
      intro:
        "We couldn't process your latest Ombryth payment. Pro stays active for now, but it'll pause if the card isn't updated before the next attempt.",
      cta: { label: "Update payment method", href: `${APP_URL}/app/billing` },
      footnote:
        "Already sorted it? You can ignore this — the next automatic attempt will go through.",
    }),
  )
}

/** Subscription cancelled / ended — soft win-back. */
export async function sendSubscriptionCancelledEmail(email: string): Promise<void> {
  await send(
    email,
    "Your Ombryth Pro plan has ended",
    shell({
      heading: "Pro plan ended",
      intro:
        "Your Ombryth Pro subscription has been cancelled. Your account stays active on the free plan — your images and history are untouched.",
      cta: { label: "Reactivate Pro", href: `${APP_URL}/app/billing` },
      footnote: "Cancelled by accident, or changed your mind? You can resubscribe anytime.",
    }),
  )
}

/** A successful renewal (not the first invoice) — light confirmation. */
export async function sendRenewalEmail(email: string): Promise<void> {
  await send(
    email,
    "Ombryth Pro renewed",
    shell({
      heading: "Pro renewed",
      intro:
        "Your Ombryth Pro subscription renewed for another month. Nothing to do — you're all set.",
      cta: { label: "Open Ombryth", href: `${APP_URL}/app` },
      footnote: "Billed €2.99/month. Manage or cancel anytime from Settings → Billing.",
    }),
  )
}
