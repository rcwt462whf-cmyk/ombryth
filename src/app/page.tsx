"use client"

import Link from "next/link"
import { useState, useId, useEffect } from "react"
import { useTheme } from "next-themes"
import { ArrowRight, Sparkles, ShieldCheck, LayoutGrid, Globe, Link2, KeyRound, Check, ChevronDown, MessageSquare, Wand2, Boxes, Plus, Search, Sun, Moon } from "lucide-react"

const MINT = "#5fe6c4"
const ON_MINT = "#0b3b30"

const FEATURES = [
  { icon: Sparkles, title: "AI Image Generation", desc: "Use DALL·E 3, Stable Diffusion, Flux, or Seedream with your own keys. Upload a style reference and product photo — Ombryth does the rest." },
  { icon: ShieldCheck, title: "Metadata Stripped", desc: "Every generated image is automatically processed to remove EXIF and metadata — keeping your workflow and AI usage private." },
  { icon: LayoutGrid, title: "Multi-Platform Captions", desc: "Get Pinterest titles, Instagram captions, Facebook posts, and Google Ads headlines — all generated simultaneously from one prompt." },
  { icon: Globe, title: "9 Languages", desc: "Generate captions in English, Spanish, French, German, Portuguese, Italian, Dutch, Polish, or Hungarian. One click." },
  { icon: Link2, title: "Destination-Aware Captions", desc: "Paste your affiliate link. Ombryth reads the page and weaves the relevant keywords into your captions automatically." },
  { icon: KeyRound, title: "Your Keys, Your Costs", desc: "Connect OpenAI, Anthropic, Replicate, Stability AI, or BytePlus. Pay providers directly at their rates. Zero markup." },
]

const INTEGRATIONS = [
  { icon: MessageSquare, title: "Chat AI captions", desc: "OpenAI, Claude and Gemini write platform-ready captions from one prompt." },
  { icon: Wand2, title: "AI image generation", desc: "DALL·E 3, Flux, Stable Diffusion and Seedream — your keys, your models." },
  { icon: Globe, title: "Firecrawl", desc: "Context-aware captions are built in — Firecrawl elevates them, reading your destination page in richer detail for sharper copy." },
  { icon: Search, title: "Keyword research", desc: "Add keyword research for best results — target the high-intent terms your audience is actually searching." },
  { icon: Boxes, title: "Vynthr", desc: "Connect your Vynthr account and pull work straight into Ombryth." },
]

const FAQ_ITEMS = [
  { q: "Do I need all 6 API keys?", a: "No. OpenAI alone covers DALL·E 3 for images and GPT-4o for captions — that's everything you need to start. Other providers are optional and unlock additional image models." },
  { q: "How much does it cost to generate an image?", a: "Roughly €0.03–0.07 per image depending on the model, billed directly by your AI provider. Ombryth's subscription is €2.99/month on top — that's it." },
  { q: "Who owns the generated images?", a: "You do. Ombryth claims no rights to your outputs. Check your AI provider's terms for any specific restrictions." },
  { q: "Is my API key safe?", a: "Yes. Keys are encrypted with AES-256 before storage and never logged or exposed. We use them only when you click Generate." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from Settings → Billing, effective at end of billing period. No questions asked." },
]

const PROVIDERS = ["DALL·E 3", "Claude", "Flux", "Gemini", "Stability AI", "Seedream"]

function PinterestMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#e60023" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.378-.293 1.194-.333 1.361-.052.22-.174.266-.402.16-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12C24 5.372 18.627 0 12 0"/>
    </svg>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = resolvedTheme === "dark"
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-md flex items-center justify-center text-[#707070] dark:text-[#a3a3a3] hover:bg-[#fafafa] dark:hover:bg-[#2a2a2a] transition-colors"
    >
      {mounted && isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div className="border-b border-[#ededed] dark:border-[#2e2e2e] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left py-4 flex items-center justify-between gap-4 group"
      >
        <span className="text-[15px] text-[#171717] dark:text-[#f2f2f2]">{q}</span>
        <ChevronDown aria-hidden="true" className={`w-4 h-4 text-[#9a9a9a] dark:text-[#6f6f6f] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p id={panelId} role="region" className="text-sm text-[#707070] dark:text-[#a3a3a3] leading-relaxed pb-4 -mt-1">{a}</p>
      )}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1e1e1e] text-[#171717] dark:text-[#f2f2f2] relative isolate">

      {/* Gridded background — light */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none block dark:hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(17,17,17,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)",
        }}
      />
      {/* Gridded background — dark */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none hidden dark:block"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)",
        }}
      />

      {/* Nav */}
      <nav className="border-b border-[#ededed] dark:border-[#2e2e2e] bg-white dark:bg-[#1e1e1e] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl font-bold tracking-tight flex items-center gap-2 text-[#171717] dark:text-[#f2f2f2]">
            Ombryth
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: MINT }} />
          </span>
          <div className="hidden sm:flex items-center gap-7 text-sm text-[#707070] dark:text-[#a3a3a3]">
            <a href="#features" className="hover:text-[#171717] dark:hover:text-white transition-colors">Features</a>
            <a href="#integrations" className="hover:text-[#171717] dark:hover:text-white transition-colors">Integrations</a>
            <a href="#pricing" className="hover:text-[#171717] dark:hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#171717] dark:hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-[#171717] dark:text-[#f2f2f2] px-3 py-2 transition-colors">Log in</Link>
            <Link href="/signup" className="text-sm px-4 py-2 rounded-md font-medium transition-all" style={{ background: MINT, color: ON_MINT }}>
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#fafafa] dark:bg-[#2a2a2a] border border-[#dfdfdf] dark:border-[#383838] rounded-full px-3 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: MINT }} />
              <span className="text-[#171717] dark:text-[#f2f2f2] text-xs">10 free generations — no credit card required</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.05] mb-5">
              Turn any product into scroll-stopping content.
            </h1>
            <p className="text-lg text-[#707070] dark:text-[#a3a3a3] mb-8 leading-relaxed">
              Bring your own AI keys. Generate lifestyle images and platform-ready captions for Pinterest, Instagram, Facebook, and Google Ads — in seconds, not hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2.5 font-medium px-6 py-3 rounded-md transition-all text-[15px] group" style={{ background: MINT, color: ON_MINT }}>
                Generate your first image free
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full transition-transform group-hover:translate-x-0.5" style={{ background: ON_MINT }}>
                  <ArrowRight className="w-3 h-3" style={{ color: MINT }} />
                </span>
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center bg-white dark:bg-[#262626] border border-[#c7c7c7] dark:border-[#454545] text-[#171717] dark:text-[#f2f2f2] font-medium px-6 py-3 rounded-md hover:bg-[#fafafa] dark:hover:bg-[#2e2e2e] transition-colors text-[15px]">
                Sign in
              </Link>
            </div>
          </div>

          {/* Two stacked Pinterest pins (white in both themes so they pop) */}
          <div className="relative w-full max-w-[380px] mx-auto pt-8 pr-10">
            {/* Back pin */}
            <div className="absolute top-0 right-0 w-[74%] rotate-[5deg] rounded-2xl border border-[#dfdfdf] bg-white overflow-hidden shadow-[0_8px_22px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#ededed]">
                <PinterestMark />
                <span className="text-[11px] font-medium text-[#707070]">Pinterest</span>
              </div>
              <div className="relative">
                <img src="/hero/pin2.jpg" alt="Arc floor lamp styled in a warm mid-century living room" className="w-full aspect-[3/4] object-cover" />
                <span className="absolute top-2.5 right-2.5 bg-[#e60023] text-white text-[11px] font-medium px-3 py-1.5 rounded-full">Save</span>
              </div>
              <div className="px-3.5 py-3">
                <p className="text-[13px] font-medium text-[#171717] leading-snug mb-1.5">Same lamp, cozier glow — styled for nights in</p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9a9a9a]"><Link2 className="w-3 h-3" />ombryth.com</div>
              </div>
            </div>
            {/* Front pin */}
            <div className="relative w-[84%] -rotate-[2deg] rounded-2xl border border-[#dfdfdf] bg-white overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.16)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#ededed]">
                <PinterestMark />
                <span className="text-[11px] font-medium text-[#707070]">Pinterest</span>
              </div>
              <div className="relative">
                <img src="/hero/pin1.jpg" alt="Orange arc floor lamp in a sunlit mid-century reading nook" className="w-full aspect-[3/4] object-cover" />
                <span className="absolute top-2.5 right-2.5 bg-[#e60023] text-white text-[11px] font-medium px-3 py-1.5 rounded-full">Save</span>
                <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 bg-white/95 text-[#171717] text-[11px] font-medium px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)]">Arc Floor Lamp · €189</span>
              </div>
              <div className="px-3.5 py-3">
                <p className="text-[13px] font-medium text-[#171717] leading-snug mb-1.5">This arc floor lamp turns any corner into a golden-hour reading nook ✨</p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9a9a9a]"><Link2 className="w-3 h-3" />ombryth.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Provider strip */}
        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#9a9a9a] dark:text-[#6f6f6f]">
          <span className="text-[#707070] dark:text-[#a3a3a3]">Works with</span>
          {PROVIDERS.map((p) => <span key={p}>{p}</span>)}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] mb-3">Built for creators who move fast</h2>
          <p className="text-[#707070] dark:text-[#a3a3a3] text-base max-w-xl">One workflow from product photo to publish-ready content across all your platforms.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-[#262626] border border-[#dfdfdf] dark:border-[#383838] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-[#f4f4f4] dark:bg-[#2e2e2e] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#171717] dark:text-[#f2f2f2]" />
              </div>
              <h3 className="font-display text-[15px] font-medium tracking-tight mb-2">{title}</h3>
              <p className="text-[#707070] dark:text-[#a3a3a3] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] mb-3">Connect your whole stack</h2>
          <p className="text-[#707070] dark:text-[#a3a3a3] text-base max-w-xl">Bring your own keys — Ombryth orchestrates the tools you already use. More connections land regularly.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white dark:bg-[#262626] border border-[#dfdfdf] dark:border-[#383838] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-[#f4f4f4] dark:bg-[#2e2e2e] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#171717] dark:text-[#f2f2f2]" />
              </div>
              <h3 className="font-display text-[15px] font-medium tracking-tight mb-2">{title}</h3>
              <p className="text-[#707070] dark:text-[#a3a3a3] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-[#d4d4d4] dark:border-[#3a3a3a] bg-white dark:bg-[#222222] p-6 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-lg bg-[#fafafa] dark:bg-[#2a2a2a] flex items-center justify-center mb-4">
              <Plus className="w-5 h-5 text-[#9a9a9a] dark:text-[#6f6f6f]" />
            </div>
            <h3 className="font-display text-[15px] font-medium tracking-tight mb-2 text-[#707070] dark:text-[#a3a3a3]">More coming</h3>
            <p className="text-[#9a9a9a] dark:text-[#6f6f6f] text-sm leading-relaxed">New connections added regularly.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] mb-3">Simple pricing</h2>
          <p className="text-[#707070] dark:text-[#a3a3a3] text-base">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
          {/* Free */}
          <div className="bg-white dark:bg-[#262626] border border-[#dfdfdf] dark:border-[#383838] rounded-xl p-8">
            <h3 className="font-display text-lg font-medium mb-1">Free</h3>
            <p className="text-[#707070] dark:text-[#a3a3a3] text-sm mb-6">Try it out, no commitment.</p>
            <div className="font-display text-4xl font-semibold mb-6">€0<span className="text-lg font-normal text-[#9a9a9a] dark:text-[#6f6f6f]">/mo</span></div>
            <ul className="space-y-3 mb-8">
              {["10 free generations", "All image models", "All text models", "All 4 platforms", "Metadata stripping"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-[#171717] dark:text-[#f2f2f2]">
                  <Check className="w-4 h-4 shrink-0 text-[#0b3b30] dark:text-[#5fe6c4]" />{item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-[#c7c7c7] dark:border-[#454545] text-[#171717] dark:text-[#f2f2f2] font-medium py-2.5 rounded-md hover:bg-[#fafafa] dark:hover:bg-[#2a2a2a] transition-colors text-sm">Start free</Link>
          </div>
          {/* Pro — featured tier, inverts against the page */}
          <div className="bg-[#1c1c1c] dark:bg-white text-white dark:text-[#171717] rounded-xl p-8">
            <h3 className="font-display text-lg font-medium mb-1">Pro</h3>
            <p className="text-[#9a9a9a] dark:text-[#707070] text-sm mb-6">For creators publishing daily.</p>
            <div className="font-display text-4xl font-semibold mb-6">€2.99<span className="text-lg font-normal text-[#9a9a9a]">/mo</span></div>
            <ul className="space-y-3 mb-8">
              {["Unlimited generations", "Priority generation queue", "Saved prompts & presets", "AI persona & defaults", "Export history"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-[#ededed] dark:text-[#171717]">
                  <Check className="w-4 h-4 shrink-0 text-[#5fe6c4] dark:text-[#0b3b30]" />{item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center font-medium py-2.5 rounded-md transition-all text-sm" style={{ background: MINT, color: ON_MINT }}>Upgrade to Pro</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] mb-8">Frequently asked questions</h2>
        <div>
          {FAQ_ITEMS.map((item) => <FaqItem key={item.q} {...item} />)}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#ededed] dark:border-[#2e2e2e]">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#9a9a9a] dark:text-[#6f6f6f]">
          <span className="font-display font-bold text-[#171717] dark:text-[#f2f2f2] flex items-center gap-2">
            Ombryth <span className="w-1.5 h-1.5 rounded-full" style={{ background: MINT }} />
          </span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-[#171717] dark:hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#171717] dark:hover:text-white transition-colors">Terms</a>
            <a href="mailto:hello@ombryth.io" className="hover:text-[#171717] dark:hover:text-white transition-colors">Contact</a>
          </div>
          <span>© 2026 Ombryth</span>
        </div>
      </footer>
    </div>
  )
}
