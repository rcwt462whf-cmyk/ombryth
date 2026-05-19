"use client"

import Link from "next/link"
import { useState } from "react"

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
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left py-4 flex items-center justify-between gap-4 group"
      >
        <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {q}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-4 -mt-1">{a}</p>
      )}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Ombryth</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          10 free generations — no credit card required
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-4 tracking-tight">
          Lifestyle images + affiliate captions.<br />
          <span className="text-blue-600">One click.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Bring your own AI keys. Generate scroll-stopping Pinterest, Instagram, Facebook and Google Ads content for your products — in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
          >
            Start for free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-8 py-3.5 rounded-lg transition-colors text-base"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">No credit card needed · Cancel anytime</p>

        {/* Powered-by badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {["DALL-E 3", "Claude", "Flux", "Gemini", "Stability AI"].map((name) => (
            <span
              key={name}
              className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full font-medium"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Hero visual placeholder */}
        <div className="mt-16 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50 h-72 sm:h-96 flex items-center justify-center shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">AI-generated lifestyle image</p>
            <p className="text-gray-400 text-xs mt-1">with platform-ready captions</p>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="bg-gray-50 border-y border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-3">
          <span className="text-yellow-400 tracking-tighter text-lg leading-none">★★★★★</span>
          <p className="text-sm text-gray-500 font-medium">
            Trusted by affiliate marketers in 20+ countries
          </p>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to publish faster
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              One workflow from product photo to publish-ready content across all your platforms.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Image Generation</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Use DALL-E 3, Stable Diffusion, or Flux with your own API keys. Upload a style reference and product photo — Ombryth does the rest.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Metadata Stripped</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Every generated image is automatically processed to remove EXIF and metadata — keeping your workflow and AI usage private.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Platform Captions</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Get Pinterest titles, Instagram captions, Facebook posts, and Google Ads headlines + descriptions — all generated simultaneously.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                <span className="text-2xl leading-none">🌍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">9 Languages</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Generate captions in English, Spanish, French, German, Portuguese, Italian, Dutch, Polish, or Hungarian. One click.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-5">
                <span className="text-2xl leading-none">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Destination-aware captions</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Paste your affiliate link. Ombryth reads the page title and description and weaves those keywords into your captions automatically.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-5">
                <span className="text-2xl leading-none">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your keys, your costs</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                You connect your own OpenAI, Replicate, or Stability AI key. You pay providers directly at their published rates. We never mark up AI costs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-lg text-gray-500">Three steps from upload to publish</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Upload references", desc: "Drop in a style reference image and your product photo. Set the mood with lighting and category presets." },
            { step: "2", title: "Choose your platforms", desc: "Select Pinterest, Instagram, Facebook, Google Ads, or all four. Pick your AI image and text models." },
            { step: "3", title: "Generate & publish", desc: "Click generate. Download your clean image and copy captions directly into your publishing tool." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Everything you need to know before you start generating.
          </p>
        </div>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple pricing</h2>
            <p className="text-lg text-gray-500">Start free, upgrade when you need more</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Free</h3>
              <p className="text-gray-500 text-sm mb-6">Try it out, no commitment</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                €0<span className="text-lg font-normal text-gray-400">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "10 free generations",
                  "All image models",
                  "All text models",
                  "Pinterest, Instagram, Facebook, Google Ads",
                  "Metadata stripping",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-blue-600 rounded-2xl p-8 border border-blue-600 shadow-sm relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-blue-500 text-blue-100 text-xs font-medium px-2.5 py-1 rounded-full">
                Most popular
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Pro</h3>
              <p className="text-blue-200 text-sm mb-6">For active creators</p>
              <div className="text-4xl font-bold text-white mb-2">
                €2.99<span className="text-lg font-normal text-blue-300">/mo</span>
              </div>
              <p className="text-blue-300 text-xs mb-5">🔒 No long-term commitment</p>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-3">Everything in Free, plus:</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited generations",
                  "Batch mode (3 variations)",
                  "Priority support",
                  "9 caption languages",
                  "Destination-aware captions",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-blue-100">
                    <svg className="w-4 h-4 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <p className="text-center text-gray-400 text-sm mt-6">
            Prices in EUR. Billed monthly. Cancel anytime. Your API keys, your costs.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Ready to create faster?
        </h2>
        <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
          Join creators using Ombryth to produce scroll-stopping lifestyle content — powered by their own AI keys.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-colors text-base"
        >
          Start for free — 10 generations included
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Ombryth</span>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Ombryth. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
