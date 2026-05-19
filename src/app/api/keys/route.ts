import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { encryptKey } from "@/lib/encryption"

const VALID_PROVIDERS = ["openai", "anthropic", "gemini", "byteplus", "replicate", "stability"]

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: keys } = await supabase
    .from("api_keys")
    .select("provider")
    .eq("user_id", user.id)

  const providers = (keys ?? []).map((k) => k.provider)
  return NextResponse.json({ providers })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { provider, key } = body

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  if (!key || typeof key !== "string" || key.trim().length < 4) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 })
  }

  const encryptedKey = encryptKey(key.trim())

  const { error } = await supabase.from("api_keys").upsert(
    {
      user_id: user.id,
      provider,
      encrypted_key: encryptedKey,
    },
    { onConflict: "user_id,provider" }
  )

  if (error) {
    return NextResponse.json({ error: "Failed to save key" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const provider = searchParams.get("provider")

  if (!provider || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider)

  if (error) {
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
