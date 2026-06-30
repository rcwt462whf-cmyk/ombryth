import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("saved_links")
    .select("id, label, url, title, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ links: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const label = typeof body.label === "string" ? body.label.slice(0, 80).trim() : null
  const url = typeof body.url === "string" ? body.url.slice(0, 500).trim() : null
  const title = typeof body.title === "string" ? body.title.slice(0, 200).trim() : null
  const description = typeof body.description === "string" ? body.description.slice(0, 600).trim() : null

  if (!label || !url) return NextResponse.json({ error: "label and url required" }, { status: 400 })

  const { data, error } = await supabase.from("saved_links").insert({
    user_id: user.id, label, url, title, description,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ link: data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const id = typeof body.id === "string" ? body.id : null
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const updates: Record<string, string | null> = {}
  if (typeof body.label === "string") updates.label = body.label.slice(0, 80).trim()
  if (typeof body.url === "string") updates.url = body.url.slice(0, 500).trim()
  if (typeof body.title === "string") updates.title = body.title.slice(0, 200).trim() || null
  if (typeof body.description === "string") updates.description = body.description.slice(0, 600).trim() || null

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  if (updates.label === "") return NextResponse.json({ error: "Label cannot be empty" }, { status: 400 })
  if (updates.url === "") return NextResponse.json({ error: "URL cannot be empty" }, { status: 400 })

  const { data, error } = await supabase
    .from("saved_links")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ link: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await supabase.from("saved_links").delete().eq("id", id).eq("user_id", user.id)
  return NextResponse.json({ ok: true })
}
