"use client"

import Link from "next/link"
import { useState, useId } from "react"
import { ArrowRight, Sparkles, ShieldCheck, LayoutGrid, Globe, Link2, KeyRound, Check, ChevronDown } from "lucide-react"

const FEATURES = [
  {
    icon: Sparkles,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(139,92,246,0.22)]",
    topGrad: "from-transparent via-violet-500/50 to-transparent",
    title: "AI Image Generation",
    desc: "Use DALL-E 3, Stable Diffusion, Flux, or Seedream with your own keys. Upload a style reference and product photo — Ombryth does the rest.",
  },
  {
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(52,211,153,0.22)]",
    topGrad: "from-transparent via-emerald-500/50 to-transparent",
    title: "Metadata Stripped",
    desc: "Every generated image is automatically processed to remove EXIF and metadata — keeping your workflow and AI usage private.",
  },
  {
    icon: LayoutGrid,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(251,146,60,0.22)]",
    topGrad: "from-transparent via-orange-500/50 to-transparent",
    title: "Multi-Platform Captions",
    desc: "Get Pinterest titles, Instagram captions, Facebook posts, and Google Ads headlines — all generated simultaneously from one prompt.",
  },
  {
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(96,165,250,0.22)]",
    topGrad: "from-transparent via-blue-500/50 to-transparent",
    title: "9 Languages",
    desc: "Generate captions in English, Spanish, French, German, Portuguese, Italian, Dutch, Polish, or Hungarian. One click.",
  },
  {
    icon: Link2,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(34,211,238,0.22)]",
    topGrad: "from-transparent via-cyan-500/50 to-transparent",
    title: "Destination-Aware Captions",
    desc: "Paste your affiliate link. Ombryth reads the page and weaves the relevant keywords into your captions automatically.",
  },
  {
    icon: KeyRound,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    glow: "group-hover:shadow-[0_0_0_1px_rgba(148,163,184,0.18)]",
    topGrad: "from-transparent via-slate-400/40 to-transparent",
    title: "Your Keys, Your Costs",
    desc: "Connect OpenAI, Anthropic, Replicate, Stability AI, or BytePlus. Pay providers directly at their rates. Zero markup.",
  },
]

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
    a: "DALL-E 3 is the most reliable and easiest to use. Flux Dev supports native style-reference blending. Stable Diffusion 3 is great for photorealistic results. Seedream is BytePlus's model, good for product shots.",
  },
  {
    q: "Isn't bringing your own API keys limiting?",
    a: "You can connect keys from OpenAI, Anthropic, Google, Replicate, Stability AI, or BytePlus — whichever you already have. BYOK means you control costs and there's no hidden markup.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left py-4 flex items-center justify-between gap-4 group"
      >
        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
          {q}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-slate-600 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p id={panelId} role="region" className="text-sm text-slate-500 leading-relaxed pb-4 -mt-1">
          {a}
        </p>
      )}
    </div>
  )
}

const PROVIDERS = ["DALL-E 3", "Claude", "Flux", "Gemini", "Stability AI", "Seedream"]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060810] text-white">

      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent z-50" />

      {/* Line grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Layered ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 left-1/4 w-[900px] h-[900px] bg-blue-600/[0.06] rounded-full blur-[180px]" />
        <div className="absolute top-1/3 right-[-15%] w-[700px] h-[700px] bg-violet-700/[0.05] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-700/[0.04] rounded-full blur-[130px]" />
      </div>

      <div className="relative">

        {/* Nav */}
        <nav className="relative z-50 border-b border-white/[0.06] bg-[#060810]/80 backdrop-blur-md sticky top-[2px]">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="font-display text-xl font-bold tracking-tight">Ombryth</span>
            <div className="hidden sm:flex items-center gap-7 text-sm text-slate-500">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-slate-400 hover:text-white px-4 py-2 transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-lg transition-all font-semibold shadow-lg shadow-indigo-600/25"
              >
                Try free
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-12">
          <div className="text-center mb-16">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-500/[0.08] border border-indigo-500/[0.18] rounded-full px-4 py-1.5 mb-10">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-300 text-sm font-medium">10 free generations — no credit card required</span>
            </div>

            {/* H1 */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight leading-[1.02] mb-6">
              Turn any product into
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-400">
                scroll-stopping content.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Bring your own AI keys. Generate lifestyle images and platform-ready captions for Pinterest, Instagram, Facebook, and Google Ads — in seconds, not hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-base shadow-lg shadow-indigo-600/20 group"
              >
                Generate your first image free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-base"
              >
                Sign in
              </Link>
            </div>
            <p className="text-sm text-slate-700">No credit card needed · Cancel anytime · Your keys, your costs</p>

            {/* Provider badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {PROVIDERS.map((name) => (
                <span
                  key={name}
                  className="text-xs text-slate-600 bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.14] hover:text-slate-400 transition-colors px-3 py-1.5 rounded-full font-medium cursor-default"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Mock app UI */}
          <div className="relative mx-auto max-w-4xl">
            <div className="relative bg-[#0c1018] rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_32px_80px_rgba(0,0,0,0.6)]">

              {/* Window chrome */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-black/20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/25" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/25" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/25" />
                </div>
                <div className="flex-1 h-5 bg-white/[0.04] rounded-md max-w-xs mx-auto" />
                <div className="flex gap-2">
                  <div className="w-16 h-5 bg-white/[0.04] rounded-md" />
                  <div className="w-16 h-5 bg-indigo-600/20 border border-indigo-500/30 rounded-md" />
                </div>
              </div>

              {/* App layout */}
              <div className="flex">
                {/* Sidebar stub */}
                <div className="hidden sm:flex w-14 border-r border-white/[0.05] flex-col items-center py-5 gap-4 bg-black/20 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30" />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-5 h-5 rounded-md bg-white/[0.04]" />
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 grid md:grid-cols-5 min-h-[320px]">

                  {/* Controls panel */}
                  <div className="md:col-span-2 p-5 border-r border-white/[0.05] space-y-4">
                    <div className="space-y-1.5">
                      <div className="h-2 bg-white/[0.07] rounded-full w-20" />
                      <div className="h-9 bg-white/[0.04] border border-white/[0.07] rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 bg-white/[0.07] rounded-full w-24" />
                      <div className="flex gap-2">
                        <div className="flex-1 h-9 bg-white/[0.04] border border-white/[0.07] rounded-lg" />
                        <div className="flex-1 h-9 bg-white/[0.04] border border-white/[0.07] rounded-lg" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 bg-white/[0.07] rounded-full w-28" />
                      <div className="h-20 bg-white/[0.02] border border-white/[0.07] border-dashed rounded-lg flex items-center justify-center">
                        <div className="space-y-1.5 text-center">
                          <div className="h-2 bg-white/[0.09] rounded-full w-20 mx-auto" />
                          <div className="h-1.5 bg-white/[0.05] rounded-full w-14 mx-auto" />
                        </div>
                      </div>
                    </div>
                    <div className="h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.25)]">
                      <div className="w-3.5 h-3.5 rounded-full bg-white/30" />
                      <div className="h-2 bg-white/50 rounded-full w-14" />
                    </div>
                  </div>

                  {/* Output panel */}
                  <div className="md:col-span-3 p-5 space-y-4">
                    {/* Generated image placeholder */}
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-indigo-950/60 via-blue-950/40 to-violet-950/60 border border-white/[0.06] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      {/* Simulated product photo */}
                      <div className="absolute inset-4 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/30 via-orange-900/15 to-amber-800/20" />
                        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-xl bg-white/[0.04] blur-sm" />
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Generated in 4.2s
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                        <div className="flex-1 h-7 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10" />
                        <div className="w-20 h-7 bg-indigo-600/80 rounded-lg" />
                      </div>
                    </div>

                    {/* Caption output */}
                    <div>
                      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg mb-3">
                        {["Pinterest", "Instagram", "Facebook", "Ads"].map((tab, i) => (
                          <div
                            key={tab}
                            className={`flex-1 text-center py-1 rounded-md text-xs font-medium ${
                              i === 0 ? "bg-indigo-600 text-white" : "text-slate-600"
                            }`}
                          >
                            {tab}
                          </div>
                        ))}
                      </div>
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 space-y-1.5 mb-2">
                        <div className="h-2 bg-white/20 rounded-full w-3/4" />
                        <div className="h-2 bg-white/10 rounded-full w-full" />
                        <div className="h-2 bg-white/10 rounded-full w-5/6" />
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {[40, 32, 50, 36, 44].map((w, i) => (
                          <div key={i} className="h-5 bg-indigo-500/10 border border-indigo-500/20 rounded-full" style={{ width: `${w}px` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow under card */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-600/[0.07] blur-3xl rounded-full pointer-events-none" />
          </div>
        </section>

        {/* Stats strip */}
        <div className="border-y border-white/[0.06] bg-white/[0.01] py-10 mt-14">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 divide-x divide-white/[0.06]">
            {[
              { value: "6", label: "AI providers" },
              { value: "4", label: "Platforms in one click" },
              { value: "€0", label: "Hidden markup" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center px-6 first:pl-0 last:pr-0">
                <p className="font-display text-5xl font-bold tracking-tight text-white">{value}</p>
                <p className="text-slate-600 text-sm mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">Built for creators who move fast</h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">One workflow from product photo to publish-ready content across all your platforms.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, color, bg, glow, topGrad, title, desc }) => (
              <div
                key={title}
                className={`group relative bg-[#0c1018] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${glow} rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
              >
                {/* Per-feature top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${topGrad}`} />
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-white font-semibold mb-2 tracking-tight">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="bg-[#0c1018] shadow-[0_0_0_1px_rgba(99,102,241,0.12)] rounded-3xl p-10">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold tracking-tight">Three steps to publish-ready content</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { n: "1", title: "Upload references", desc: "Drop in a style reference image and your product photo. Set the mood with lighting and category presets." },
                { n: "2", title: "Choose your platforms", desc: "Select Pinterest, Instagram, Facebook, Google Ads, or all four. Pick your AI image and text models." },
                { n: "3", title: "Generate & publish", desc: "Click generate. Download your clean image and copy captions directly into your publishing tool." },
              ].map(({ n, title, desc }, i) => (
                <div key={n} className="text-center relative">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-6 left-[58%] right-[-42%] h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
                  )}
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 relative z-10 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <span className="font-display text-indigo-400 font-bold text-lg">{n}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 pb-24">
          <div className="text-center mb-14">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple pricing</h2>
            <p className="text-slate-500 text-base">Start free, upgrade when you need more</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">

            {/* Free plan */}
            <div className="relative bg-[#0c1018] rounded-2xl p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.07)] overflow-hidden hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition-all">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
              <h3 className="font-display text-lg font-bold text-white mb-1">Free</h3>
              <p className="text-slate-500 text-sm mb-6">Try it out, no commitment</p>
              <div className="font-display text-4xl font-bold text-white mb-6">
                €0<span className="text-lg font-normal text-slate-600">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {["10 free generations", "All image models", "All text models", "Pinterest, Instagram, Facebook, Google Ads", "Metadata stripping"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-400">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm">
                Get started free
              </Link>
            </div>

            {/* Pro plan */}
            <div className="relative bg-gradient-to-b from-indigo-700 to-blue-800 rounded-2xl p-8 overflow-hidden shadow-[0_8px_32px_rgba(99,102,241,0.22)]">
              {/* Corner light leak */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/[0.06] rounded-full blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="absolute -top-1 right-0 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Most popular
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-1">Pro</h3>
                <p className="text-indigo-200 text-sm mb-6">For active creators</p>
                <div className="font-display text-4xl font-bold text-white mb-1">
                  €2.99<span className="text-lg font-normal text-indigo-300">/mo</span>
                </div>
                <p className="text-indigo-300 text-xs mb-6">No long-term commitment</p>
                <p className="text-white/70 text-xs font-bold uppercase tracking-wide mb-3">Everything in Free, plus:</p>
                <ul className="space-y-3 mb-8">
                  {["Unlimited generations", "Batch mode (3 variations)", "Priority support", "9 caption languages", "Destination-aware captions"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-white">
                      <Check className="w-4 h-4 text-indigo-200 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block text-center bg-white hover:bg-indigo-50 text-indigo-700 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
                  Start Pro — €2.99/mo
                </Link>
              </div>
            </div>
          </div>
          <p className="text-center text-slate-700 text-sm mt-6">Prices in EUR. Billed monthly. Cancel anytime. Your API keys, your costs.</p>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-2xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">Frequently asked questions</h2>
            <p className="text-slate-500 text-base">Everything you need to know before you start generating.</p>
          </div>
          <div className="bg-[#0c1018] shadow-[0_0_0_1px_rgba(255,255,255,0.07)] rounded-2xl px-6">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
          <div className="relative bg-gradient-to-b from-indigo-500/[0.09] to-blue-500/[0.03] shadow-[0_0_0_1px_rgba(99,102,241,0.18)] rounded-3xl p-8 sm:p-12 overflow-hidden">
            {/* Grid overlay on CTA */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">Ready to move faster?</h2>
              <p className="text-slate-400 text-base mb-8 max-w-lg mx-auto leading-relaxed">
                Stop spending hours creating content manually. Generate scroll-stopping images and platform captions in seconds — powered by your own AI keys.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-base shadow-lg shadow-indigo-600/25 group"
              >
                Generate your first image free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-slate-700 text-sm mt-4">10 generations free · No credit card · Cancel anytime</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-display text-base font-bold tracking-tight">Ombryth</span>
            <p className="text-slate-700 text-sm">© {new Date().getFullYear()} Ombryth. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <a href="mailto:hello@ombryth.com" className="hover:text-slate-300 transition-colors">Support</a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
