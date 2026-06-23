import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { decryptKey } from "@/lib/encryption"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { PlatformOutput } from "@/types"
import { buildTextSystemPrompt } from "@/lib/caption-engine"

function sanitizeHashtags(output: PlatformOutput): PlatformOutput {
  const cleanTags = (tags: unknown): string[] => {
    if (!Array.isArray(tags)) return []
    return tags.map((t) => typeof t === "string" ? t.replace(/\s+/g, "").replace(/^#+/, "") : "").filter(Boolean)
  }
  const result = { ...output }
  if (result.pinterest?.hashtags) result.pinterest = { ...result.pinterest, hashtags: cleanTags(result.pinterest.hashtags) }
  if (result.instagram?.hashtags) result.instagram = { ...result.instagram, hashtags: cleanTags(result.instagram.hashtags) }
  if (result.facebook?.hashtags) result.facebook = { ...result.facebook, hashtags: cleanTags(result.facebook.hashtags) }
  return result
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { prompt, imageBase64, platforms, language, textModel, destinationContext, productDescription, captionSubject } = body

    if (!prompt || !platforms?.length) {
      return NextResponse.json({ error: "Missing prompt or platforms" }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from("users").select("custom_system_prompt").eq("id", user.id).single()

    const { data: apiKeys } = await supabase
      .from("api_keys").select("provider, encrypted_key").eq("user_id", user.id)

    const keyMap: Record<string, string> = {}
    for (const row of apiKeys ?? []) keyMap[row.provider] = decryptKey(row.encrypted_key)

    // Same click-optimized engine as /api/generate — single source of truth, no drift.
    // (The client merges only caption+hashtags for the "captions" scope, so we always
    // produce a full set here and let the page decide what to keep.)
    const { prompt: systemPrompt } = buildTextSystemPrompt(
      prompt,
      platforms,
      userData?.custom_system_prompt ?? null,
      destinationContext ?? null,
      language ?? null,
      productDescription,
      textModel === "claude" && !!imageBase64,
      captionSubject,
    )

    let textOutput: PlatformOutput = {}
    let textModelUsed = textModel

    if (textModel === "gpt4o") {
      if (!keyMap.openai) return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 400 })
      const openai = new OpenAI({ apiKey: keyMap.openai })
      const resp = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0.9,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      })
      textOutput = sanitizeHashtags(JSON.parse(resp.choices[0]?.message?.content ?? "{}"))
      textModelUsed = "gpt-4o"
    } else if (textModel === "claude") {
      if (!keyMap.anthropic) return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 400 })
      const anthropic = new Anthropic({ apiKey: keyMap.anthropic })
      type CB = { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } } | { type: "text"; text: string }
      const content: CB[] = []
      if (imageBase64) content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } })
      content.push({ type: "text", text: systemPrompt })
      const resp = await anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 1400, messages: [{ role: "user", content }] })
      const raw = resp.content[0]?.type === "text" ? resp.content[0].text : "{}"
      textOutput = sanitizeHashtags(JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()))
      textModelUsed = "claude-sonnet-4-6"
    } else if (textModel === "gemini") {
      if (!keyMap.gemini) return NextResponse.json({ error: "Gemini API key not configured." }, { status: 400 })
      const genAI = new GoogleGenerativeAI(keyMap.gemini)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } })
      const resp = await model.generateContent(systemPrompt)
      textOutput = sanitizeHashtags(JSON.parse(resp.response.text().replace(/```json\n?|\n?```/g, "").trim()))
      textModelUsed = "gemini-1.5-flash"
    }

    return NextResponse.json({ textOutput, textModelUsed })
  } catch (err) {
    console.error("[rewrite-captions]", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
