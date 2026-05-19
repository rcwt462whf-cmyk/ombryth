import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("saved_prompts")
    .select("id, name, prompt, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ prompts: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, prompt } = await request.json()

  if (!name?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "Name and prompt are required" }, { status: 400 })
  }
  if (prompt.trim().length > 2000) {
    return NextResponse.json({ error: "Prompt too long (max 2000 chars)" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("saved_prompts")
    .insert({ user_id: user.id, name: name.trim(), prompt: prompt.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 })
  return NextResponse.json({ prompt: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await supabase
    .from("saved_prompts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 })
  return NextResponse.json({ success: true })
}
