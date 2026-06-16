"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Sparkles, ShieldCheck, LayoutGrid } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

const MINT = "#5fe6c4"
const ON_MINT = "#0b3b30"

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
    <div className="min-h-screen bg-white dark:bg-[#1e1e1e] text-[#171717] dark:text-[#f2f2f2] flex">

      {/* Left branded panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-[#fafafa] dark:bg-[#181818] border-r border-[#ededed] dark:border-[#2e2e2e] overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none block dark:hidden" style={{ backgroundImage: "linear-gradient(rgba(17,17,17,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.04) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(120% 80% at 0% 0%, #000 30%, transparent 75%)", WebkitMaskImage: "radial-gradient(120% 80% at 0% 0%, #000 30%, transparent 75%)" }} />
        <div className="absolute inset-0 -z-10 pointer-events-none hidden dark:block" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "radial-gradient(120% 80% at 0% 0%, #000 30%, transparent 75%)", WebkitMaskImage: "radial-gradient(120% 80% at 0% 0%, #000 30%, transparent 75%)" }} />

        <Link href="/" className="relative font-display text-2xl font-bold tracking-tight flex items-center gap-2">
          Ombryth <span className="w-2.5 h-2.5 rounded-full" style={{ background: MINT }} />
        </Link>

        <div className="relative">
          <h2 className="font-display text-4xl font-semibold tracking-[-0.02em] leading-[1.08] mb-4">
            Generate scroll-stopping content in seconds.
          </h2>
          <p className="text-[#707070] dark:text-[#a3a3a3] text-base mb-8 leading-relaxed">
            Your AI keys. Your costs. Zero markup.
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#262626] border border-[#dfdfdf] dark:border-[#383838] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#171717] dark:text-[#f2f2f2]" />
                </div>
                <span className="text-sm text-[#707070] dark:text-[#a3a3a3]">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[#9a9a9a] dark:text-[#6f6f6f]">
          © {new Date().getFullYear()} Ombryth · All rights reserved
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute top-5 right-5"><ThemeToggle /></div>

        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-8 font-display text-2xl font-bold tracking-tight">
            Ombryth <span className="w-2.5 h-2.5 rounded-full" style={{ background: MINT }} />
          </Link>

          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-[#707070] dark:text-[#a3a3a3]">Sign in to your account to continue</p>
          </div>

          <div className="bg-white dark:bg-[#262626] border border-[#dfdfdf] dark:border-[#383838] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-[#707070] dark:text-[#a3a3a3]">Email</label>
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  className="w-full bg-white dark:bg-[#1e1e1e] border border-[#dfdfdf] dark:border-[#383838] text-[#171717] dark:text-[#f2f2f2] placeholder:text-[#9a9a9a] dark:placeholder:text-[#6f6f6f] text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-[#5fe6c4] transition-colors" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-medium text-[#707070] dark:text-[#a3a3a3]">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[#707070] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-white transition-colors">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input id="password" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                    className="w-full bg-white dark:bg-[#1e1e1e] border border-[#dfdfdf] dark:border-[#383838] text-[#171717] dark:text-[#f2f2f2] placeholder:text-[#9a9a9a] dark:placeholder:text-[#6f6f6f] text-sm rounded-md px-3.5 py-2.5 pr-10 outline-none focus:border-[#5fe6c4] transition-colors" />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] dark:text-[#6f6f6f] hover:text-[#171717] dark:hover:text-white transition-colors" tabIndex={-1} aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-md px-3.5 py-2.5">{error}</div>
              )}

              <button type="submit" disabled={loading} className="w-full font-medium py-2.5 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-1" style={{ background: MINT, color: ON_MINT }}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>

          <p className="text-center mt-5 text-sm text-[#707070] dark:text-[#a3a3a3]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-[#171717] dark:text-[#f2f2f2] hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
