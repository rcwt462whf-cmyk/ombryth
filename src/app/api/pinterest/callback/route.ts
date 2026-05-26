import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptKey, decryptKey } from "@/lib/encryption"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  if (error || !code || !state) {
    return NextResponse.redirect(`${siteUrl}/app/settings?pinterest=error`)
  }

  // Decode user ID from state
  let userId: string
  try {
    userId = Buffer.from(state, "base64").toString("utf-8")
  } catch {
    return NextResponse.redirect(`${siteUrl}/app/settings?pinterest=error`)
  }

  const clientId = process.env.PINTEREST_CLIENT_ID!
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET!
  const redirectUri = `${siteUrl}/api/pinterest/callback`

  // Exchange code for tokens
  const tokenResp = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenResp.ok) {
    return NextResponse.redirect(`${siteUrl}/app/settings?pinterest=error`)
  }

  const tokens = await tokenResp.json()
  const { access_token, refresh_token, expires_in } = tokens

  const expiresAt = new Date(Date.now() + (expires_in ?? 2592000) * 1000).toISOString()

  const supabase = await createClient()

  await supabase.from("pinterest_tokens").upsert({
    user_id: userId,
    access_token: encryptKey(access_token),
    refresh_token: refresh_token ? encryptKey(refresh_token) : null,
    expires_at: expiresAt,
    connected_at: new Date().toISOString(),
  }, { onConflict: "user_id" })

  return NextResponse.redirect(`${siteUrl}/app/settings?pinterest=connected`)
}

// Helper used by other routes to get a valid access token, refreshing if needed
export async function getPinterestToken(userId: string, supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const { data } = await supabase
    .from("pinterest_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single()

  if (!data) return null

  const accessToken = decryptKey(data.access_token)

  // If not expired, return as-is
  if (new Date(data.expires_at) > new Date(Date.now() + 60_000)) {
    return accessToken
  }

  // Refresh if we have a refresh token
  if (!data.refresh_token) return null

  const refreshToken = decryptKey(data.refresh_token)
  const clientId = process.env.PINTEREST_CLIENT_ID!
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET!

  const resp = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  })

  if (!resp.ok) return null

  const newTokens = await resp.json()
  const expiresAt = new Date(Date.now() + (newTokens.expires_in ?? 2592000) * 1000).toISOString()

  await supabase.from("pinterest_tokens").update({
    access_token: encryptKey(newTokens.access_token),
    refresh_token: newTokens.refresh_token ? encryptKey(newTokens.refresh_token) : data.refresh_token,
    expires_at: expiresAt,
  }).eq("user_id", userId)

  return newTokens.access_token
}
