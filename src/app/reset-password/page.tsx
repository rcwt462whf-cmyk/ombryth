"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")

  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [exchangeDone, setExchangeDone] = useState(false)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!code) {
      setExchangeError("No reset code found. Please request a new password reset link.")
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setExchangeError(error.message)
      } else {
        setExchangeDone(true)
      }
    })
  }, [code])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push("/app"), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {exchangeError ? (
        <div className="text-center py-2 space-y-3">
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2">
            {exchangeError}
          </div>
          <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm font-medium">
            Request a new reset link
          </Link>
        </div>
      ) : !exchangeDone ? (
        <p className="text-center text-sm text-gray-500 py-2">Verifying your reset link…</p>
      ) : success ? (
        <div className="text-center py-2">
          <div className="text-2xl mb-3">✅</div>
          <p className="font-semibold text-gray-900">Password updated!</p>
          <p className="mt-1 text-sm text-gray-500">Redirecting you to the app…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500">Passwords don&apos;t match</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">FlowGen</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="mt-2 text-sm text-gray-500">Choose a strong password for your account</p>
        </div>

        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-center text-sm text-gray-500 py-2">Loading…</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-center mt-5 text-sm text-gray-500">
          Back to{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
