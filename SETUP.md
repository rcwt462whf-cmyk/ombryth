# FlowGen — Setup Guide

## 1. Supabase

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Authentication → URL Configuration** and add:
   - Site URL: `http://localhost:3000` (dev) or your Vercel URL (prod)
   - Redirect URL: `http://localhost:3000/auth/callback`

## 2. Stripe

1. Create a Stripe account at https://stripe.com
2. Copy your keys from Dashboard → Developers → API keys:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
3. Set up webhook:
   - Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://your-vercel-app.vercel.app/api/stripe/webhook`
   - Events to listen: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
   - Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## 3. Encryption key

Generate a random 32-character key:

```bash
openssl rand -hex 32
```

Copy the result → `ENCRYPTION_KEY`

## 4. Environment variables

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
ENCRYPTION_KEY=your_32_char_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Shared secret that lets /api/generate-pin authenticate its internal call to
# /api/generate for the Vynthr integration. Generate with: openssl rand -hex 32
# REQUIRED for the Vynthr pin pipeline to work — without it those calls return 401.
INTERNAL_API_SECRET=your_random_hex_secret_here
```

## 5. Email (Resend)

1. Create a free account at https://resend.com
2. Go to **API Keys** and create a new key → copy it to `RESEND_API_KEY` in `.env.local`
3. Go to **Domains** and add your sending domain (e.g. `flowgen.app`). Follow the DNS verification steps.
4. Once verified, set `RESEND_FROM_EMAIL=hello@flowgen.app` (or whichever address you verified).

> Without a verified domain, Resend will only deliver to the address you signed up with. Verify your domain before going to production.

## 6. Run locally

```bash
cd ~/Desktop/flowgen
npm run dev
```

Open http://localhost:3000

## 7. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in Vercel → Project → Settings → Environment Variables.

## 8. User API keys to configure in Settings

After signing up, go to **/app/settings** and add at minimum:

| Key | Required for |
|-----|-------------|
| OpenAI | DALL-E 3, GPT-4o, vision analysis |
| Anthropic | Claude Sonnet text generation |
| Google Gemini | Gemini text generation |
| Replicate | Flux Schnell / Flux Dev image generation |
| Stability AI | Stable Diffusion 3 image generation |
| BytePlus | Seedream image generation |

Users only need the keys for the models they intend to use.
OpenAI is needed for any model if you want product or style analysis.

## Image model capabilities

| Model | img2img style | Product placement | Notes |
|-------|--------------|-------------------|-------|
| DALL-E 3 | ✅ (prompt injection) | ✅ (description) | Requires OpenAI key |
| Flux Schnell | — | ✅ (description) | Fast, Replicate |
| Flux Dev | ✅ (native) | ✅ (description) | Best quality, Replicate |
| Stability SD3 | ✅ (native) | ✅ (description) | Stability AI key |
| Seedream | ✅ (prompt injection) | ✅ (description) | BytePlus key |
