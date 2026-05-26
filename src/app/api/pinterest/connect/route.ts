import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clientId = process.env.PINTEREST_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: "Pinterest not configured" }, { status: 500 })

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/pinterest/callback`
  const scope = "boards:read,pins:write"
  const state = Buffer.from(user.id).toString("base64")

  const url = new URL("https://www.pinterest.com/oauth/")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", scope)
  url.searchParams.set("state", state)

  return NextResponse.redirect(url.toString())
}
