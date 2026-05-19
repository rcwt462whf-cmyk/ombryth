"use client"

import { useState } from "react"

function getRefCookie(): string | null {
  try {
    return (
      document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("ref_code="))
        ?.split("=")[1] ?? null
    )
  } catch {
    return null
  }
}

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const ref_code = getRefCookie()
      const body: { ref_code?: string } = {}
      if (ref_code) body.ref_code = decodeURIComponent(ref_code)

      // Follow redirects automatically — fetch will end up at the Stripe URL
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.redirected && res.url) {
        window.location.href = res.url
      } else if (!res.ok) {
        console.error("[checkout] failed", res.status)
        setLoading(false)
      }
    } catch {
      // Redirect errors in fetch are non-fatal — the redirect likely already happened
      // or we need to fall back
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full bg-white hover:bg-blue-50 disabled:opacity-70 text-blue-700 font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
    >
      {loading ? "Redirecting…" : "Upgrade to Pro — €2.99/mo"}
    </button>
  )
}
