"use client"

import { useEffect } from "react"

export function RefCookieSetter({ code }: { code: string }) {
  useEffect(() => {
    try {
      document.cookie = `ref_code=${encodeURIComponent(code)}; path=/; max-age=604800; SameSite=Lax`
    } catch {
      // Cookie setting is best-effort
    }
  }, [code])

  return null
}
