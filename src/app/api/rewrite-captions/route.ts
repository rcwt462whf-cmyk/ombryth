import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { decryptKey } from "@/lib/encryption"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { PlatformOutput } from "@/types"

const LANGUAGE_NAMES: Record<string, string> = {
  "en": "English", "es": "Spanish", "pt-BR": "Brazilian Portuguese",
  "fr": "French", "de": "German", "it": "Italian",
  "nl": "Dutch", "pl": "Polish", "hu": "Hungarian",
}

const HOOK_STYLES = [
  "Open with a curiosity gap — tease something without revealing it. e.g. 'The detail nobody mentions when they redo their bathroom'",
  "Open with a confident, surprising claim stated as fact. e.g. 'Warm lighting does more for a bathroom than any renovation'",
  "Open with a direct provocative question. e.g. 'Still using cool-white bulbs in your bathroom?'",
  "Open by challenging a popular assumption. e.g. 'The marble trend is over — here's what's replacing it'",
  "Open with a micro-scene or personal moment. e.g. 'Walked into a hotel room last month and couldn't stop staring at the wall'",
  "Open with a specific number that teases a list. e.g. '3 things this bathroom does that yours probably doesn't'",
  "Open with social proof or trend urgency. e.g. 'Every designer studio in Copenhagen is using this combination right now'",
  "Open by promising a specific transformation. e.g. 'How to make a rental bathroom look like a boutique hotel'",
]

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
    const { prompt, imageBase64, platforms, language, textModel, destinationContext, productDescription } = body

    if (!prompt || !platforms?.length) {
      return NextResponse.json({ error: "Missing prompt or platforms" }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from("users").select("custom_system_prompt").eq("id", user.id).single()

    const { data: apiKeys } = await supabase
      .from("api_keys").select("provider, encrypted_key").eq("user_id", user.id)

    const keyMap: Record<string, string> = {}
    for (const row of apiKeys ?? []) keyMap[row.provider] = decryptKey(row.encrypted_key)

    // Pick a fresh random hook style for variety
    const hookStyle = HOOK_STYLES[Math.floor(Math.random() * HOOK_STYLES.length)]
    const persona = userData?.custom_system_prompt?.trim() ||
      "You are a top-performing social media content creator for lifestyle and home decor affiliate marketing. Punchy, hook-first, conversational. Short sentences. 1-2 emojis. Concrete CTA. Write like a real person."

    const destBlock = destinationContext?.title || destinationContext?.description
      ? `\nThe content links to: "${destinationContext.title}" — "${destinationContext.description}". Weave keywords naturally.\n`
      : ""
    const productBlock = productDescription
      ? `\nFeatured product: ${productDescription}. Reference it specifically.\n`
      : ""
    const imageRef = textModel === "claude" && imageBase64
      ? "Look at the image carefully — write captions based on exactly what you see."
      : `The lifestyle image shows: "${prompt}".`
    const langRule = language && language !== "en"
      ? `\n\nWrite ALL output in ${LANGUAGE_NAMES[language] ?? language} as a native speaker.`
      : ""

    const systemPrompt = `${persona}

${imageRef}
${productBlock}${destBlock}
HOOK STYLE (mandatory for opening line on every platform):
${hookStyle}

BANNED OPENERS: "Discover", "Transform", "Elevate", "Game changer", "The secret to", "Nobody tells you", "Say hello to"

CAPTION RULES:
- Opening line MUST use the hook style above.
- Short sentences. Line breaks between ideas.
- End with a specific CTA.
- 1-2 emojis max.

HASHTAG RULES: No spaces inside tags. No # prefix. Mix niche + broad.

Return ONLY valid JSON for platforms: ${platforms.join(", ")}.${langRule}`

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
      const resp = await anthropic.messages.create({ model: "claude-sonnet-4-5", max_tokens: 1400, messages: [{ role: "user", content }] })
      const raw = resp.content[0]?.type === "text" ? resp.content[0].text : "{}"
      textOutput = sanitizeHashtags(JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()))
      textModelUsed = "claude-sonnet-4-5"
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
