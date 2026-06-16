"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Zap, KeyRound, Globe, Mail } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

const MINT = "#5fe6c4"
const ON_MINT = "#0b3b30"

const FEATURES = [
  { icon: Zap,      text: "10 free generations — no card needed" },
  { icon: KeyRound, text: "Bring keys from any AI provider" },
  { icon: Globe,    text: "Captions in 9 languages from day one" },
]

export default function SignupPage() {
  const [email, setEmail]                   = useState("")
  const [password, setPassword]             = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw]                 = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [success, setSuccess]               = useState(false)
  const [loading, setLoading]               = useState(false)
  const [resendStatus, setResendStatus]     = useState<"idle" | "sending" | "sent">("idle")

  async function handleResend() {
    setResendStatus("sending")
    const supabase = createClient()
    await supabase.auth.resend({ type: "signup", email })
    setResendStatus("sent")
    setTimeout(() => setResendStatus("idle"), 3000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  // ── Success / check inbox state ──────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1e1e1e] text-[#171717] dark:text-[#f2f2f2] flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute top-5 right-5"><ThemeToggle /></div>

        <Link href="/" className="mb-10 font-display text-2xl font-bold tracking-tight flex items-center gap-2">
          Ombryth <span className="w-2.5 h-2.5 rounded-full" style={{ background: MINT }} />
        </Link>

        <div className="w-full max-w-sm bg-white dark:bg-[#262626] border border-[#dfdfdf] dark:border-[#383838] rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="w-14 h-14 rounded-xl bg-[#eafbf4] dark:bg-[#223b34] flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-[#0b3b30] dark:text-[#5fe6c4]" />
          </div>
          <h2 className="font-display text-xl font-semibold tracking-tight mb-2">Check your inbox</h2>
          <p className="text-[#707070] dark:text-[#a3a3a3] text-sm leading-relaxed mb-1">We sent a confirmation link to</p>
          <p className="font-medium text-sm mb-4">{email}</p>
          <p className="text-[#707070] dark:text-[#a3a3a3] text-sm leading-relaxed mb-7">
            Click the link to activate your account, then come back and sign in.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleResend}
              disabled={resendStatus === "sending"}
              className="text-sm text-[#707070] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-white border border-[#dfdfdf] dark:border-[#383838] hover:bg-[#fafafa] dark:hover:bg-[#2a2a2a] px-4 py-2 rounded-md transition-all disabled:opacity-50"
            >
              {resendStatus === "sent" ? "Sent!" : resendStatus === "sending" ? "Sending…" : "Resend email"}
            </button>
            <Link href="/login" className="text-sm font-medium text-[#171717] dark:text-[#f2f2f2] hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Main signup form ─────────────────────────────────────────────────────
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
          <h2 className="font-display text-4xl font-semibold tracking-[-0.02em] leading-[1.1] mb-4">
            Start generating in minutes.
          </h2>
          <p className="text-[#707070] dark:text-[#a3a3a3] text-base mb-8 leading-relaxed">
            No credit card. No commitment. Just results.
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
          <div className="mb-8">
            <h1 className="font-display text-2xl font-semibold tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-[#707070] dark:text-[#a3a3a3]">10 free generations included — no card required</p>
          </div>

          <div className="bg-white dark:bg-[#262626] border border-[#dfdfdf] dark:border-[#383838] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-none">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-[#707070] dark:text-[#a3a3a3]">Email</label>
                <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  className="w-full bg-white dark:bg-[#1e1e1e] border border-[#dfdfdf] dark:border-[#383838] text-[#171717] dark:text-[#f2f2f2] placeholder:text-[#9a9a9a] dark:placeholder:text-[#6f6f6f] text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-[#5fe6c4] transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-[#707070] dark:text-[#a3a3a3]">Password</label>
                <div className="relative">
                  <input id="password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                    className="w-full bg-white dark:bg-[#1e1e1e] border border-[#dfdfdf] dark:border-[#383838] text-[#171717] dark:text-[#f2f2f2] placeholder:text-[#9a9a9a] dark:placeholder:text-[#6f6f6f] text-sm rounded-md px-3.5 py-2.5 pr-10 outline-none focus:border-[#5fe6c4] transition-colors" />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] dark:text-[#6f6f6f] hover:text-[#171717] dark:hover:text-white transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-medium text-[#707070] dark:text-[#a3a3a3]">Confirm password</label>
                <div className="relative">
                  <input id="confirm-password" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password"
                    className="w-full bg-white dark:bg-[#1e1e1e] border border-[#dfdfdf] dark:border-[#383838] text-[#171717] dark:text-[#f2f2f2] placeholder:text-[#9a9a9a] dark:placeholder:text-[#6f6f6f] text-sm rounded-md px-3.5 py-2.5 pr-10 outline-none focus:border-[#5fe6c4] transition-colors" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] dark:text-[#6f6f6f] hover:text-[#171717] dark:hover:text-white transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-md px-3.5 py-2.5">{error}</div>
              )}

              <button type="submit" disabled={loading} className="w-full font-medium py-2.5 rounded-md transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-1" style={{ background: MINT, color: ON_MINT }}>
                {loading ? "Creating account…" : "Create free account"}
              </button>

              <p className="text-center text-xs text-[#9a9a9a] dark:text-[#6f6f6f] pt-1">
                By signing up you agree to our{" "}
                <Link href="/terms" className="underline hover:text-[#171717] dark:hover:text-white transition-colors">Terms</Link> and{" "}
                <Link href="/privacy" className="underline hover:text-[#171717] dark:hover:text-white transition-colors">Privacy Policy</Link>.
              </p>
            </form>
          </div>

          <p className="text-center mt-5 text-sm text-[#707070] dark:text-[#a3a3a3]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#171717] dark:text-[#f2f2f2] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
