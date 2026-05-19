import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { CustomPreset } from "@/lib/presets"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("custom_niches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ niches: [] })
  return NextResponse.json({ niches: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as {
    name: string
    emoji: string
    promptBase: string
    presets: CustomPreset[]
  }

  const { name, emoji, promptBase, presets } = body
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const { data, error } = await supabase
    .from("custom_niches")
    .insert({
      user_id: user.id,
      name: name.trim(),
      emoji: emoji || "🎨",
      prompt_base: promptBase?.trim() ?? "",
      presets: presets ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ niche: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error } = await supabase
    .from("custom_niches")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as {
    nicheId: string
    action: "add-preset" | "remove-preset"
    preset: CustomPreset
  }
  const { nicheId, action, preset } = body

  const { data: niche, error: fetchErr } = await supabase
    .from("custom_niches")
    .select("presets")
    .eq("id", nicheId)
    .eq("user_id", user.id)
    .single()

  if (fetchErr || !niche) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let presets = (niche.presets ?? []) as CustomPreset[]

  if (action === "add-preset") {
    if (presets.length >= 10) return NextResponse.json({ error: "Max 10 presets" }, { status: 400 })
    presets = [...presets, preset]
  } else if (action === "remove-preset") {
    presets = presets.filter((p) => p.id !== preset.id)
  }

  const { error: updateErr } = await supabase
    .from("custom_niches")
    .update({ presets })
    .eq("id", nicheId)
    .eq("user_id", user.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  return NextResponse.json({ success: true, presets })
}
