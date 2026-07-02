import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { createHash } from "crypto"

// Public endpoint called by Pinflow to fetch a user's recent generations.
// Auth: Bearer token in Authorization header (personal API key).

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

export async function GET(request: Request) {
  // Extract Bearer token
  const auth = request.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null
  if (!token) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 })
  }

  // Authenticated by hashed personal API key (Bearer), not a user session — so the
  // anon client's RLS would block the personal_api_keys + generations reads. Service role.
  const supabase = await createServiceClient()
  const hash = hashKey(token)

  // Look up the key
  const { data: keyRow } = await supabase
    .from("personal_api_keys")
    .select("id, user_id")
    .eq("key_hash", hash)
    .single()

  if (!keyRow) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  // Update last_used_at (non-fatal)
  supabase
    .from("personal_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => {})

  // Query params
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50)
  const offset = parseInt(url.searchParams.get("offset") ?? "0")
  const since = url.searchParams.get("since") // ISO timestamp — fetch only new ones

  let query = supabase
    .from("generations")
    .select("id, image_url, prompt_used, category_preset, lighting_preset, platforms, created_at, has_product_reference")
    .eq("user_id", keyRow.user_id)
    .eq("status", "completed")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (since) {
    query = query.gt("created_at", since)
  }

  const { data: generations, error } = await query

  if (error) {
    return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 })
  }

  return NextResponse.json({
    generations: generations ?? [],
    total: (generations ?? []).length,
    offset,
    limit,
  })
}
