"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#060a0f] text-white flex flex-col items-center justify-center px-6 py-12">

      {/* Backgrounds */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5fe6c4] to-transparent" />
      <div className="fixed -top-40 left-1/3 w-[500px] h-[500px] bg-[#5fe6c4]/[0.06] rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="relative mb-10 font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
        Ombryth <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#5fe6c4" }} />
      </Link>

      <div className="relative w-full max-w-sm">

        {/* Back link */}
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to login
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-white mb-1">Reset your password</h1>
          <p className="text-sm text-slate-500">We&apos;ll send a reset link to your inbox</p>
        </div>

        <div className="bg-[#0c1018] shadow-[0_0_0_1px_rgba(255,255,255,0.07)] rounded-2xl p-6">
          {submitted ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-bold text-white mb-1">Check your inbox</p>
              <p className="text-sm text-slate-500">
                We sent a reset link to{" "}
                <span className="font-medium text-slate-300">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-3.5 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5fe6c4] hover:bg-[#54d6b6] disabled:opacity-50 disabled:cursor-not-allowed text-[#0b3b30] font-bold py-2.5 rounded-xl transition-all text-sm"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
