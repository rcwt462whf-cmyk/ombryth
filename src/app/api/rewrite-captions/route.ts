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
  `Contradiction: "[Thing] looks [positive]. But [negative truth]." e.g. "Cold grey bedroom walls look fine in photos. At night they feel like a waiting room."`,
  `Reframe: "[Common assumption]. [Correction]." e.g. "Most plants don't die from neglect. They die from being put in the wrong room."`,
  `Number: "[Number]. [Number]. [Result]." e.g. "Three lamps. Two hours. Completely different room."`,
  `Single truth: "[Thing] is the [one decision/mistake] that [consequence]." e.g. "The headboard is the most important decision in a bedroom."`,
  `Challenge: "Most [things] [negative]." e.g. "Most bedrooms are designed by accident." or "Most kitchens age badly."`,
  `Trend subversion: "[Trend] will date. [Timeless thing] won't." e.g. "Trends change. Terracotta zellige doesn't."`,
  `Curiosity gap: State what's at stake without the answer. e.g. "Zellige is the most saved tile on Pinterest. Most people buying it don't know what they're getting."`,
  `Strong opinion: Confident, specific, mildly controversial. e.g. "Open shelving in kitchens is almost always a mistake."`,
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
    const { prompt, imageBase64, platforms, language, textModel, destinationContext, productDescription, scope } = body
    const captionsOnly = scope === "captions"

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

    const scopeInstruction = captionsOnly
      ? `SCOPE: Rewrite ONLY the caption and hashtags fields. Keep title and altText exactly as they were — do not change them.`
      : `SCOPE: Rewrite ALL fields — title, caption, altText, hashtags, headlines. Full fresh rewrite.`

    const systemPrompt = `${persona}

${imageRef}
${productBlock}${destBlock}
HOOK (mandatory — use on every platform):
${hookStyle}
Write original copy using this structure. Do not copy the formula literally.

${scopeInstruction}

BANNED: stunning, gorgeous, amazing, game-changing, transform your space, nobody tells you, the secret to, discover, say hello to

RULES: 1-2 emojis per caption placed naturally. No bullet points. No first person. Short punchy sentences.
Pinterest description: HOOK-FIRST. Do NOT list image objects. Write what the reader will understand or change. End "Full guide on the blog."
Pinterest caption: same hook-first approach, slightly different wording. End with varied CTA: "Link in bio 👇", "Save this", "Full guide on the blog 🌿", "Tap the link".
Pinterest hashtags (20): 8-10 niche-specific, 6-8 topic-level, 2-3 intent. No vanity tags (#home #design).
Instagram hashtags (30): mix niche + topic + broad + intent.
Facebook hashtags (5): broad only.
No # prefix in arrays. No spaces inside tags.

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
