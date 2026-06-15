"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Sparkles, ShieldCheck, LayoutGrid } from "lucide-react"

const FEATURES = [
  { icon: Sparkles,    text: "6 AI providers — use keys you already have" },
  { icon: LayoutGrid,  text: "4 platforms generated in one click" },
  { icon: ShieldCheck, text: "Metadata stripped from every image" },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/app")
  }

  return (
    <div className="min-h-screen bg-[#060810] text-white flex">

      {/* ── Left branded panel (desktop only) ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/[0.06]">

        {/* Line grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Ambient glows */}
        <div className="absolute -bottom-20 -left-20 w-[480px] h-[480px] bg-indigo-600/[0.1] rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/[0.05] rounded-full blur-[100px] pointer-events-none" />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-transparent" />

        {/* Logo */}
        <Link href="/" className="relative z-10 font-display text-2xl font-bold tracking-tight text-white">
          Ombryth
        </Link>

        {/* Headline + features */}
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold tracking-tight leading-[1.08] mb-4">
            Generate scroll-stopping<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-400">
              content in seconds.
            </span>
          </h2>
          <p className="text-slate-500 text-base mb-8 leading-relaxed">
            Your AI keys. Your costs. Zero markup.
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm text-slate-400">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <p className="relative z-10 text-xs text-slate-700">
          © {new Date().getFullYear()} Ombryth · All rights reserved
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden block mb-8 font-display text-2xl font-bold tracking-tight text-white text-center">
            Ombryth
          </Link>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-1">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to your account to continue</p>
          </div>

          {/* Card */}
          <div className="relative bg-[#0c1018] shadow-[0_0_0_1px_rgba(255,255,255,0.07)] rounded-2xl p-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-white/[0.04] border border-white/[0.09] text-white placeholder:text-slate-700 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-white/[0.04] border border-white/[0.09] text-white placeholder:text-slate-700 text-sm rounded-xl px-3.5 py-2.5 pr-10 outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-3.5 py-2.5">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all text-sm shadow-[0_4px_16px_rgba(99,102,241,0.2)] mt-1"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p className="text-center mt-5 text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
