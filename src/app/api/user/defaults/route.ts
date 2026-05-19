import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { imageModel, textModel, categoryPreset, lightingPreset, customSystemPrompt } = body

  const updateData: Record<string, string | null> = {
    default_image_model: imageModel ?? null,
    default_text_model: textModel ?? null,
    default_category_preset: categoryPreset ?? null,
    default_lighting_preset: lightingPreset ?? null,
  }

  if (customSystemPrompt !== undefined) {
    const trimmed = typeof customSystemPrompt === "string" ? customSystemPrompt.trim() : null
    updateData.custom_system_prompt = trimmed && trimmed.length > 0 ? trimmed.slice(0, 1000) : null
  }

  if (body.defaultLanguage !== undefined) {
    updateData.default_language = body.defaultLanguage ?? 'en'
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id)

  if (error) return NextResponse.json({ error: "Failed to save defaults" }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("users")
    .select("default_image_model, default_text_model, default_category_preset, default_lighting_preset, custom_system_prompt, default_language")
    .eq("id", user.id)
    .single()

  return NextResponse.json({ defaults: data ?? {} })
}
