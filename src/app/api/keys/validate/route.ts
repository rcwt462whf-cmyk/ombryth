import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { provider, key } = await request.json() as { provider: string; key: string }

    if (!provider || !key) {
      return NextResponse.json({ valid: false, error: "Missing provider or key" })
    }

    // byteplus: skip validation
    if (provider === "byteplus") {
      return NextResponse.json({ valid: true, skipped: true })
    }

    const signal = AbortSignal.timeout(10000)

    try {
      if (provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
          signal,
        })
        if (res.ok) return NextResponse.json({ valid: true })
        const body = await res.json().catch(() => ({}))
        return NextResponse.json({ valid: false, error: body?.error?.message ?? "Invalid key" })
      }

      if (provider === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "hi" }],
          }),
          signal,
        })
        // 200 = success, 529 = overloaded, 400 = billing/limit issue — all mean the key itself is valid
        // Only 401 means the key is actually wrong
        if (res.status !== 401) return NextResponse.json({ valid: true })
        const body = await res.json().catch(() => ({}))
        return NextResponse.json({ valid: false, error: body?.error?.message ?? "Invalid key" })
      }

      if (provider === "gemini") {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
          { signal }
        )
        if (res.ok) return NextResponse.json({ valid: true })
        const body = await res.json().catch(() => ({}))
        return NextResponse.json({ valid: false, error: body?.error?.message ?? "Invalid key" })
      }

      if (provider === "replicate") {
        const res = await fetch("https://api.replicate.com/v1/account", {
          headers: { Authorization: `Token ${key}` },
          signal,
        })
        if (res.ok) return NextResponse.json({ valid: true })
        const body = await res.json().catch(() => ({}))
        return NextResponse.json({ valid: false, error: body?.detail ?? "Invalid key" })
      }

      if (provider === "stability") {
        const res = await fetch("https://api.stability.ai/v1/user/account", {
          headers: { Authorization: `Bearer ${key}` },
          signal,
        })
        if (res.ok) return NextResponse.json({ valid: true })
        const body = await res.json().catch(() => ({}))
        return NextResponse.json({ valid: false, error: body?.message ?? "Invalid key" })
      }

      // Unknown provider — skip validation
      return NextResponse.json({ valid: true, skipped: true })
    } catch {
      return NextResponse.json({ valid: false, error: "Could not reach provider" })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
