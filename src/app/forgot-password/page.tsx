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
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-[#f2f2f2]">
            Ombryth <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#5fe6c4" }} />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-[#f2f2f2]">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-[#a3a3a3]">We&apos;ll send a reset link to your inbox</p>
        </div>

        <div className="bg-white dark:bg-[#181818] rounded-2xl border border-gray-100 dark:border-[#2e2e2e] shadow-sm p-6">
          {submitted ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-[#eafbf4] dark:bg-[#5fe6c4]/10 border border-[#bff0e1] dark:border-[#5fe6c4]/20 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[#0b9c75] dark:text-[#5fe6c4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 dark:text-[#f2f2f2] mb-1">Check your inbox</p>
              <p className="text-sm text-gray-500 dark:text-[#a3a3a3]">
                We sent a reset link to{" "}
                <span className="font-medium text-gray-700 dark:text-[#d4d4d4]">{email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-gray-500 dark:text-[#a3a3a3] uppercase tracking-wider">
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
                  className="w-full bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#383838] text-gray-900 dark:text-[#f2f2f2] placeholder:text-gray-300 dark:placeholder:text-[#6f6f6f] text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#5fe6c4]/50 focus:border-[#5fe6c4] transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm rounded-xl px-3.5 py-2.5">
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

        {/* Back link */}
        <p className="text-center mt-5 text-sm text-gray-500 dark:text-[#a3a3a3]">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[#0b9c75] dark:text-[#5fe6c4] hover:underline font-medium group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
