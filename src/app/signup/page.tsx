"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Zap, KeyRound, Globe } from "lucide-react"

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
      <div className="min-h-screen bg-[#060a0f] text-white flex flex-col items-center justify-center px-6 py-12">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="fixed -top-40 left-1/3 w-[500px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <Link href="/" className="relative mb-10 text-2xl font-black tracking-tight text-white">
          Ombryth
        </Link>

        <div className="relative w-full max-w-sm bg-[#0c1018] shadow-[0_0_0_1px_rgba(255,255,255,0.07)] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mb-2">Check your inbox</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-1">We sent a confirmation link to</p>
          <p className="font-semibold text-white text-sm mb-4">{email}</p>
          <p className="text-slate-500 text-sm leading-relaxed mb-7">
            Click the link to activate your account, then come back and sign in.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleResend}
              disabled={resendStatus === "sending"}
              className="text-sm text-slate-400 hover:text-white border border-white/[0.1] hover:border-white/[0.2] px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {resendStatus === "sent" ? "Sent!" : resendStatus === "sending" ? "Sending…" : "Resend email"}
            </button>
            <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Main signup form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060a0f] text-white flex">

      {/* ── Left branded panel (desktop only) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -bottom-20 -left-20 w-[480px] h-[480px] bg-blue-600/[0.12] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-400/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-blue-400 to-transparent" />

        <Link href="/" className="relative z-10 text-2xl font-black tracking-tight text-white">
          Ombryth
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tight leading-[1.1] mb-4">
            Start generating<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              in minutes.
            </span>
          </h2>
          <p className="text-slate-500 text-base mb-8 leading-relaxed">
            No credit card. No commitment. Just results.
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-slate-400">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-700">
          © {new Date().getFullYear()} Ombryth · All rights reserved
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden block mb-8 text-2xl font-black tracking-tight text-white">
            Ombryth
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight text-white mb-1">Create your account</h1>
            <p className="text-sm text-slate-500">10 free generations included — no card required</p>
          </div>

          <div className="bg-[#0c1018] shadow-[0_0_0_1px_rgba(255,255,255,0.07)] rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                  className="w-full bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-slate-600 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-slate-600 text-sm rounded-xl px-3.5 py-2.5 pr-10 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-slate-600 text-sm rounded-xl px-3.5 py-2.5 pr-10 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-blue-600/20 mt-1"
              >
                {loading ? "Creating account…" : "Create free account"}
              </button>

              <p className="text-center text-xs text-slate-700 pt-1">
                By signing up you agree to our{" "}
                <Link href="/terms" className="underline hover:text-slate-400 transition-colors">Terms</Link> and{" "}
                <Link href="/privacy" className="underline hover:text-slate-400 transition-colors">Privacy Policy</Link>.
              </p>
            </form>
          </div>

          <p className="text-center mt-5 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
