"use client"

import Link from "next/link"
import { useState, useId } from "react"

const FAQ_ITEMS = [
  {
    q: "Do I need all 6 API keys?",
    a: "No. OpenAI alone covers DALL-E 3 for images and GPT-4o for captions — that's everything you need to start. Other providers are optional and unlock additional image models.",
  },
  {
    q: "How much does it cost to generate an image?",
    a: "Roughly €0.03–0.07 per image depending on the model, billed directly by your AI provider. Ombryth's subscription is €2.99/month on top — that's it.",
  },
  {
    q: "Who owns the generated images?",
    a: "You do. Ombryth claims no rights to your outputs. Check your AI provider's terms for any specific restrictions (OpenAI's are permissive for commercial use).",
  },
  {
    q: "Is my API key safe?",
    a: "Yes. Keys are encrypted with AES-256 before storage and never logged or exposed. We use them only when you click Generate.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings → Billing, effective at end of billing period. No questions asked.",
  },
  {
    q: "What's the difference between the image models?",
    a: "DALL-E 3 is the most reliable and easiest to use. Flux Dev supports native style-reference blending (img2img). Stable Diffusion 3 is great for photorealistic results. Seedream is BytePlus's model, good for product shots.",
  },
  {
    q: "Connect your OpenAI account — isn't that limiting?",
    a: "You can connect keys from OpenAI, Anthropic, Google, Replicate, Stability AI, or BytePlus — whichever you already have. BYOK means you control the costs and there's no hidden markup.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left py-4 flex items-center justify-between gap-4 group"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {q}
        </span>
        <svg
          aria-hidden="true"
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p id={panelId} role="region" className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pb-4 -mt-1">
          {a}
        </p>
      )}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Ombryth</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-md transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors font-medium"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true"></span>
          10 free generations — no credit card required
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-5 tracking-tight">
          Turn any product into<br />
          <span className="text-blue-600 dark:text-blue-400">scroll-stopping content.</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Bring your own AI keys. Generate lifestyle images and platform-ready captions for Pinterest, Instagram, Facebook and Google Ads — in seconds, not hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
          >
            Generate your first image free
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-medium px-8 py-3.5 rounded-lg transition-colors text-base"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">No credit card needed · Cancel anytime · Your keys, your costs</p>

        {/* Powered-by badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["DALL-E 3", "Claude", "Flux", "Gemini", "Stability AI", "Seedream"].map((name) => (
            <span
              key={name}
              className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-3 py-1 rounded-full font-medium"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Hero visual placeholder */}
        <div className="mt-16 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-gray-50 dark:from-gray-900 to-blue-50 dark:to-blue-950 h-72 sm:h-96 flex items-center justify-center shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center mx-auto mb-3">
              <svg aria-hidden="true" className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">AI-generated lifestyle image</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">with platform-ready captions</p>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 py-4">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Built for affiliate marketers who want to move fast — not wait on agencies
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>✓ AES-256 encrypted keys</span>
            <span>✓ No watermarks</span>
            <span>✓ EXIF metadata stripped</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-950 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to publish faster
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              One workflow from product photo to publish-ready content across all your platforms.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-5">
                <svg aria-hidden="true" className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Image Generation</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Use DALL-E 3, Stable Diffusion, Flux or Seedream with your own API keys. Upload a style reference and product photo — Ombryth does the rest.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-5">
                <svg aria-hidden="true" className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Metadata Stripped</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Every generated image is automatically processed to remove EXIF and metadata — keeping your workflow and AI usage private.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center mb-5">
                <svg aria-hidden="true" className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi-Platform Captions</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Get Pinterest titles, Instagram captions, Facebook posts, and Google Ads headlines + descriptions — all generated simultaneously.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-5">
                <span className="text-2xl leading-none" aria-hidden="true">🌍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">9 Languages</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Generate captions in English, Spanish, French, German, Portuguese, Italian, Dutch, Polish, or Hungarian. One click.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-5">
                <span className="text-2xl leading-none" aria-hidden="true">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Destination-aware captions</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Paste your affiliate link. Ombryth reads the page and weaves the relevant keywords into your captions automatically.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
                <span className="text-2xl leading-none" aria-hidden="true">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your keys, your costs</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Connect any AI provider you already use — OpenAI, Anthropic, Replicate, Stability AI, or BytePlus. Pay providers directly at their rates. Zero markup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 dark:bg-gray-900 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How it works</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Three steps from upload to publish</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Upload references", desc: "Drop in a style reference image and your product photo. Set the mood with lighting and category presets." },
              { step: "2", title: "Choose your platforms", desc: "Select Pinterest, Instagram, Facebook, Google Ads, or all four. Pick your AI image and text models." },
              { step: "3", title: "Generate & publish", desc: "Click generate. Download your clean image and copy captions directly into your publishing tool." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm" aria-hidden="true">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently asked questions</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Everything you need to know before you start generating.
          </p>
        </div>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-6">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Simple pricing</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Start free, upgrade when you need more</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-950 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Free</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Try it out, no commitment</p>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                €0<span className="text-lg font-normal text-gray-400 dark:text-gray-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "10 free generations",
                  "All image models",
                  "All text models",
                  "Pinterest, Instagram, Facebook, Google Ads",
                  "Metadata stripping",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg aria-hidden="true" className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-blue-600 rounded-2xl p-8 border border-blue-600 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                Most popular
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Pro</h3>
              <p className="text-blue-100 text-sm mb-6">For active creators</p>
              <div className="text-4xl font-bold text-white mb-2">
                €2.99<span className="text-lg font-normal text-blue-200">/mo</span>
              </div>
              <p className="text-blue-200 text-xs mb-5">🔒 No long-term commitment</p>
              <p className="text-white text-xs font-semibold uppercase tracking-wide mb-3">Everything in Free, plus:</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited generations",
                  "Batch mode (3 variations)",
                  "Priority support",
                  "9 caption languages",
                  "Destination-aware captions",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white">
                    <svg aria-hidden="true" className="w-4 h-4 text-blue-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center bg-white hover:bg-blue-50 text-blue-600 font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Start Pro — €2.99/mo
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-6">
            Prices in EUR. Billed monthly. Cancel anytime. Your API keys, your costs.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to move faster?
        </h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
          Stop spending hours creating content manually. Ombryth gives you scroll-stopping images and platform captions in seconds — powered by your own AI keys.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
        >
          Generate your first image free
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">10 generations free · No credit card · Cancel anytime</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Ombryth</span>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            © {new Date().getFullYear()} Ombryth. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-sm text-gray-400 dark:text-gray-500">
            <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
