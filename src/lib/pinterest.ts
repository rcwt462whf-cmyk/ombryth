import { createClient } from "@/lib/supabase/server"
import { encryptKey, decryptKey } from "@/lib/encryption"

export async function getPinterestToken(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
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
