import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createHash, randomBytes } from "crypto"

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

// GET — list user's personal API keys (prefix + label only, never the key itself)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("personal_api_keys")
    .select("id, key_prefix, label, last_used_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ keys: data ?? [] })
}

// POST — generate a new personal API key
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const label = typeof body.label === "string" ? body.label.slice(0, 50) : "Pinflow"

  // Generate a secure random key: omk_<32 random hex chars>
  const raw = `omk_${randomBytes(16).toString("hex")}`
  const prefix = raw.slice(0, 12) // "omk_" + 8 chars shown in UI
  const hash = hashKey(raw)

  const { error } = await supabase.from("personal_api_keys").insert({
    user_id: user.id,
    key_hash: hash,
    key_prefix: prefix,
    label,
  })

  if (error) return NextResponse.json({ error: "Failed to create key" }, { status: 500 })

  // Return the raw key ONCE — never stored, never retrievable again
  return NextResponse.json({ key: raw, prefix, label })
}

// DELETE — revoke a key by id
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await supabase
    .from("personal_api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  return NextResponse.json({ ok: true })
}
