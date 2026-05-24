import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { decryptKey } from "@/lib/encryption"
import { buildPrompt, LIGHTING_PRESETS } from "@/lib/presets"
import { uploadImageBuffer } from "@/lib/storage"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendWelcomeEmail } from "@/lib/emails/welcome"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Replicate from "replicate"
import sharp from "sharp"
import type { GenerateRequest, PlatformOutput, ImageModel } from "@/types"

// ─── Image generation helpers ────────────────────────────────────────────────

async function generateWithDalle3(
  openai: OpenAI,
  prompt: string,
  aspectRatio: string,
  _styleBuffer: Buffer | null,
  _styleStrength: number
): Promise<Buffer> {
  // DALL-E 3 supports only 3 sizes — map unsupported ratios to closest
  const sizeMap: Record<string, "1024x1024" | "1792x1024" | "1024x1792"> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "2:3": "1024x1792",
    "9:16": "1024x1792", // closest to 9:16 that DALL-E supports
    "4:5": "1024x1024",  // closest to 4:5 that DALL-E supports
  }
  const size = sizeMap[aspectRatio] ?? "1024x1024"

  // DALL-E 3 doesn't support img2img natively — style ref is already injected into prompt via vision analysis
  const imgResp = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size,
    quality: "standard",
    n: 1,
    response_format: "url",
  })

  const imageUrl = imgResp.data?.[0]?.url
  if (!imageUrl) throw new Error("DALL-E 3 returned no image URL")

  const fetchResp = await fetch(imageUrl)
  return Buffer.from(await fetchResp.arrayBuffer())
}

async function generateWithFlux(
  replicate: Replicate,
  model: "flux-schnell" | "flux-dev",
  prompt: string,
  aspectRatio: string,
  styleBuffer: Buffer | null,
  styleStrength: number
): Promise<Buffer> {
  const aspectMap: Record<string, string> = {
    "1:1": "1:1",
    "2:3": "2:3",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:5": "4:5",
  }
  const ratio = aspectMap[aspectRatio] ?? "1:1"

  let output: unknown

  if (model === "flux-schnell") {
    output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt,
        aspect_ratio: ratio,
        num_outputs: 1,
        output_format: "jpg",
        output_quality: 90,
      },
    })
  } else {
    // flux-dev supports img2img via image input
    if (styleBuffer) {
      const styleBase64 = `data:image/jpeg;base64,${styleBuffer.toString("base64")}`
      output = await replicate.run("black-forest-labs/flux-dev", {
        input: {
          prompt,
          image: styleBase64,
          strength: styleStrength / 100,
          aspect_ratio: ratio,
          num_outputs: 1,
          output_format: "jpg",
          output_quality: 90,
        },
      })
    } else {
      output = await replicate.run("black-forest-labs/flux-dev", {
        input: {
          prompt,
          aspect_ratio: ratio,
          num_outputs: 1,
          output_format: "jpg",
          output_quality: 90,
        },
      })
    }
  }

  // Replicate returns array of URLs or ReadableStream objects
  const outputs = output as Array<{ url: () => Promise<string> } | string>
  const first = outputs[0]
  const imageUrl = typeof first === "string" ? first : await first.url()
  if (!imageUrl) throw new Error("Flux returned no image URL")

  const fetchResp = await fetch(imageUrl)
  return Buffer.from(await fetchResp.arrayBuffer())
}

async function generateWithStability(
  apiKey: string,
  prompt: string,
  aspectRatio: string,
  styleBuffer: Buffer | null,
  styleStrength: number
): Promise<Buffer> {
  const ratioMap: Record<string, string> = {
    "1:1": "1:1",
    "2:3": "2:3",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:5": "4:5",
  }
  const ratio = ratioMap[aspectRatio] ?? "1:1"

  const form = new FormData()
  form.append("prompt", prompt)
  form.append("aspect_ratio", ratio)
  form.append("output_format", "jpeg")
  form.append("model", "sd3-large")

  if (styleBuffer) {
    const blob = new Blob([styleBuffer.buffer as ArrayBuffer], { type: "image/jpeg" })
    form.append("image", blob, "style.jpg")
    form.append("mode", "image-to-image")
    form.append("strength", String(styleStrength / 100))
  } else {
    form.append("mode", "text-to-image")
  }

  const resp = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "image/*",
    },
    body: form,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Stability AI error ${resp.status}: ${text}`)
  }

  return Buffer.from(await resp.arrayBuffer())
}

async function generateWithSeedream(
  apiKey: string,
  prompt: string,
  aspectRatio: string,
  styleBuffer?: Buffer | null,
  styleStrength?: number,
  productBuffer?: Buffer | null
): Promise<Buffer> {
  const sizeMap: Record<string, string> = {
    "1:1": "4K",
    "2:3": "3328x4992",
    "16:9": "5504x3040",
    "9:16": "3040x5504",
    "4:5": "3040x3800",
  }
  const size = sizeMap[aspectRatio] ?? "4K"

  const body: Record<string, unknown> = {
    model: "seedream-4-5-251128",
    prompt,
    response_format: "url",
    size,
    watermark: false,
    sequential_image_generation: "disabled",
  }

  if (styleBuffer && productBuffer) {
    // Multi-image: style ref (image 1) + product (image 2)
    // Seedream can natively combine both — product placement is pixel-accurate
    body.image = [
      `data:image/jpeg;base64,${styleBuffer.toString("base64")}`,
      `data:image/jpeg;base64,${productBuffer.toString("base64")}`,
    ]
    // image_weight applies to all reference images
    body.image_weight = Math.round((styleStrength ?? 60) / 100 * 100) / 100
  } else if (styleBuffer) {
    // Style reference only
    body.image = `data:image/jpeg;base64,${styleBuffer.toString("base64")}`
    body.image_weight = Math.round((styleStrength ?? 60) / 100 * 100) / 100
  } else if (productBuffer) {
    // Product only — use it as the sole image reference
    body.image = `data:image/jpeg;base64,${productBuffer.toString("base64")}`
    body.image_weight = 0.85
  }

  const resp = await fetch(
    "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }
  )

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Seedream API error ${resp.status}: ${text}`)
  }

  const data = await resp.json()
  const imageUrl = data?.data?.[0]?.url
  if (!imageUrl) throw new Error("Seedream returned no image URL")

  const imgResp = await fetch(imageUrl)
  return Buffer.from(await imgResp.arrayBuffer())
}

// ─── Style analysis (for models that don't support img2img natively) ──────────

async function analyzeStyleReference(
  anthropic: Anthropic,
  buffer: Buffer,
  mimeType: string,
  strength: number
): Promise<string> {
  const base64 = buffer.toString("base64")
  const safeType = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mimeType)
    ? (mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
    : "image/jpeg"

  const instruction = strength >= 70
    ? "Write a detailed image generation prompt that recreates this scene as closely as possible. Cover: exact lighting (direction, quality, colour temperature), colour palette, mood, composition, materials and textures, camera angle, background details. Write only the prompt, no preamble, max 120 words."
    : "Describe the lighting, colour palette and overall mood of this image in 2-3 concise sentences for use as a style reference in image generation. No preamble."

  const resp = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: safeType, data: base64 },
        },
        { type: "text", text: instruction },
      ],
    }],
  })
  return resp.content[0]?.type === "text" ? resp.content[0].text.trim() : ""
}

async function analyzeProductImage(
  openai: OpenAI,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const base64 = buffer.toString("base64")
  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 280,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
          },
          {
            type: "text",
            text: "Describe this product in precise detail for an AI image generation prompt. Cover: exact shape, all colours (be specific — e.g. 'terracotta red, steel blue, warm beige'), surface texture and finish (matte, glossy, fabric etc.), pattern or design motif if any, material, and approximate size/scale. Be specific enough that an image model could recreate it accurately. Write 2-3 sentences. No brand names.",
          },
        ],
      },
    ],
  })
  return resp.choices[0]?.message?.content?.trim() ?? ""
}

// ─── Text generation ──────────────────────────────────────────────────────────

const DEFAULT_SYSTEM_PERSONA =
  "You are a top-performing social media content creator for lifestyle and home decor affiliate marketing. Your copy style is punchy, hook-first, and conversational — never corporate or repetitive. Every caption opens with a scroll-stopping first line (a bold claim, a question, or an unexpected tip). Use short sentences. Use numbered lists or line breaks for tips. Add 1-2 relevant emojis naturally. End with a clear CTA ('Link in bio', 'Save this', 'Try it tonight' etc.). Never repeat the same idea twice in one caption. Write like a real person, not a brand."

const LANGUAGE_NAMES: Record<string, string> = {
  "en": "English", "es": "Spanish", "pt-BR": "Brazilian Portuguese",
  "fr": "French", "de": "German", "it": "Italian",
  "nl": "Dutch", "pl": "Polish", "hu": "Hungarian",
}

function buildTextSystemPrompt(
  prompt: string,
  platforms: string[],
  customPersona?: string | null,
  destinationContext?: { title: string; description: string } | null,
  language?: string | null,
  productDescription?: string
): string {
  const persona = customPersona?.trim() || DEFAULT_SYSTEM_PERSONA

  const destinationBlock = destinationContext?.title || destinationContext?.description
    ? `\nThe content being promoted links to a page titled "${destinationContext.title}" described as: "${destinationContext.description}". Naturally weave relevant keywords from this context into your captions and descriptions to align with the destination. Do not mention the URL directly.\n`
    : ""

  const productBlock = productDescription
    ? `\nThe featured product is: ${productDescription}. Make sure the captions clearly reference this specific product — its look, style and use — rather than describing the scene generically.\n`
    : ""

  return `${persona}

Generate platform content for this lifestyle image: "${prompt}".
${productBlock}${destinationBlock}
CAPTION RULES (apply to all platforms):
- First sentence must be the hook — a bold statement, unexpected tip, or intriguing question. Make the reader stop scrolling.
- Short sentences. Use line breaks or numbered steps for tips (e.g. "1. ... 2. ... 3. ...").
- No filler phrases like "Discover", "Transform your space", "Find the perfect" — these are banned.
- Never repeat the same idea twice in one caption.
- End with a concrete CTA: "Link in bio", "Save for later", "Try it tonight", etc.
- 1-2 relevant emojis max, placed naturally.

HASHTAG RULES (critical):
- NEVER include spaces inside a hashtag. Multi-word tags must be written as one word (e.g. "lakásvilágítás" not "lakás világítás", "homedecor" not "home decor").
- Mix niche-specific and broad tags.
- Do NOT prefix with # — return only the word/words joined together.

Return ONLY a valid JSON object. Include ONLY the platforms listed: ${platforms.join(", ")}.

JSON structure:
{
  "pinterest": {
    "title": "max 100 chars — must be a curiosity gap or benefit hook (e.g. 'The curtain trick nobody tells you — try it tonight'). NOT a keyword list. No hashtags. No generic openers like 'Discover' or 'Explore'.",
    "description": "2-4 punchy sentences. Hook first. Relevant keywords woven in naturally. Ends with CTA.",
    "altText": "Concise visual description of the image for accessibility",
    "caption": "2-4 punchy sentences. Hook first. Ends with CTA.",
    "hashtags": ["array", "of", "20", "singleword", "or", "joinedwords", "strings", "NO", "hash", "symbol"]
  },
  "instagram": {
    "caption": "Hook first line. Short sentences or numbered tip list. Ends with CTA. 150-300 chars total.",
    "altText": "Concise visual description of the image for accessibility",
    "hashtags": ["array", "of", "30", "singleword", "or", "joinedwords", "strings", "NO", "hash", "symbol"]
  },
  "facebook": {
    "caption": "Hook first. Conversational. 1-3 short sentences. Soft CTA at end. 100-200 chars.",
    "altText": "Concise visual description of the image for accessibility",
    "hashtags": ["array", "of", "5", "broad", "singleword", "strings", "NO", "hash", "symbol"]
  },
  "google-ads": {
    "headline1": "max 30 chars, benefit or product",
    "headline2": "max 30 chars, supporting benefit",
    "headline3": "max 30 chars, CTA",
    "description1": "max 90 chars, feature-focused with keyword",
    "description2": "max 90 chars, benefit-focused, ends with CTA",
    "altText": "Concise visual description of the image for accessibility"
  }
}

Return ONLY the JSON. No markdown fences, no explanation.${language && language !== "en" ? `\n\nLANGUAGE: Write ALL output in ${LANGUAGE_NAMES[language] ?? language}. Do not mix languages. For hashtags: join multi-word concepts into one word (no spaces, no hyphens) as is standard on social media in that language.` : ""}`
}

/** Strip spaces from hashtag strings so "#belső tér" → "belsőtér" */
function sanitizeHashtags(output: PlatformOutput): PlatformOutput {
  const cleanTags = (tags: unknown): string[] => {
    if (!Array.isArray(tags)) return []
    return tags.map((t) =>
      typeof t === "string" ? t.replace(/\s+/g, "").replace(/^#+/, "") : ""
    ).filter(Boolean)
  }
  const result = { ...output }
  if (result.pinterest?.hashtags) result.pinterest = { ...result.pinterest, hashtags: cleanTags(result.pinterest.hashtags) }
  if (result.instagram?.hashtags) result.instagram = { ...result.instagram, hashtags: cleanTags(result.instagram.hashtags) }
  if (result.facebook?.hashtags) result.facebook = { ...result.facebook, hashtags: cleanTags(result.facebook.hashtags) }
  return result
}

async function generateTextWithOpenAI(
  openai: OpenAI,
  systemPrompt: string
): Promise<PlatformOutput> {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: systemPrompt }],
    temperature: 0.7,
    max_tokens: 1200,
    response_format: { type: "json_object" },
  })
  const raw = resp.choices[0]?.message?.content ?? "{}"
  return sanitizeHashtags(JSON.parse(raw))
}

async function generateTextWithClaude(
  anthropic: Anthropic,
  systemPrompt: string
): Promise<PlatformOutput> {
  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1200,
    messages: [{ role: "user", content: systemPrompt }],
  })
  const raw = resp.content[0]?.type === "text" ? resp.content[0].text : "{}"
  return sanitizeHashtags(JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()))
}

async function generateTextWithGemini(
  genAI: GoogleGenerativeAI,
  systemPrompt: string
): Promise<PlatformOutput> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  })
  const resp = await model.generateContent(systemPrompt)
  const raw = resp.response.text()
  return sanitizeHashtags(JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()))
}

// ─── Single image generation pipeline ────────────────────────────────────────

async function generateOneImage(
  imageModel: ImageModel,
  keyMap: Record<string, string>,
  prompt: string,
  config: GenerateRequest,
  styleBuffer: Buffer | null,
  productBuffer: Buffer | null
): Promise<Buffer> {
  switch (imageModel) {
    case "dalle3": {
      if (!keyMap.openai) throw new Error("OpenAI API key not configured. Add it in Settings.")
      const openai = new OpenAI({ apiKey: keyMap.openai })
      return generateWithDalle3(openai, prompt, config.aspectRatio, styleBuffer, config.styleReferenceStrength ?? 40)
    }
    case "flux-schnell":
    case "flux-dev": {
      if (!keyMap.replicate) throw new Error("Replicate API key not configured. Add it in Settings.")
      const replicate = new Replicate({ auth: keyMap.replicate })
      return generateWithFlux(replicate, imageModel, prompt, config.aspectRatio, styleBuffer, config.styleReferenceStrength ?? 40)
    }
    case "stability": {
      if (!keyMap.stability) throw new Error("Stability AI API key not configured. Add it in Settings.")
      return generateWithStability(keyMap.stability, prompt, config.aspectRatio, styleBuffer, config.styleReferenceStrength ?? 40)
    }
    case "seedream": {
      if (!keyMap.byteplus) throw new Error("BytePlus API key not configured. Add it in Settings.")
      // Seedream supports native multi-image: pass both style + product directly
      return generateWithSeedream(keyMap.byteplus, prompt, config.aspectRatio, styleBuffer, config.styleReferenceStrength ?? 60, productBuffer)
    }
    default:
      throw new Error(`Unknown image model: ${imageModel}`)
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ── Emergency kill switch ──────────────────────────────────────────────────
    if (process.env.GENERATION_KILL_SWITCH === "true") {
      return NextResponse.json(
        { error: "Generation is temporarily disabled for maintenance. Please try again later." },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("subscription_status, free_generations_used, custom_system_prompt, email, referral_code")
      .eq("id", user.id)
      .single()

    const ADMIN_EMAILS = ["sz.veres.tamas@gmail.com"]
    const isAdmin = ADMIN_EMAILS.includes(userData?.email ?? "")
    const isPro = isAdmin || userData?.subscription_status === "active"
    const freeUsed = userData?.free_generations_used ?? 0
    const customSystemPrompt = userData?.custom_system_prompt ?? null

    // ── Per-minute rate limit (in-memory) ─────────────────────────────────────
    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      const seconds = Math.ceil(rateLimit.resetInMs / 1000)
      return NextResponse.json(
        { error: `Rate limit reached. You can generate up to 8 images per minute. Try again in ${seconds} seconds.` },
        { status: 429 }
      )
    }

    // ── Daily cap — counts DB rows to survive server restarts ──────────────────
    if (!isAdmin) {
      const dailyLimit = isPro
        ? parseInt(process.env.DAILY_PRO_LIMIT ?? "200")
        : 10
      const since = new Date()
      since.setHours(0, 0, 0, 0)
      const { count: todayCount } = await supabase
        .from("generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", since.toISOString())
      if ((todayCount ?? 0) >= dailyLimit) {
        return NextResponse.json(
          { error: `Daily limit of ${dailyLimit} generations reached. Resets at midnight.` },
          { status: 429 }
        )
      }
    }

    if (!isPro && freeUsed >= 10) {
      return NextResponse.json(
        { error: "Free trial exhausted. Please upgrade to Pro." },
        { status: 402 }
      )
    }

    const formData = await request.formData()
    const configRaw = formData.get("config")
    if (!configRaw || typeof configRaw !== "string") {
      return NextResponse.json({ error: "Missing config" }, { status: 400 })
    }

    const config: GenerateRequest = JSON.parse(configRaw)
    const styleFile = formData.get("style_reference") as File | null
    const productFile = formData.get("product_reference") as File | null

    const { data: apiKeys } = await supabase
      .from("api_keys")
      .select("provider, encrypted_key")
      .eq("user_id", user.id)

    const keyMap: Record<string, string> = {}
    for (const row of apiKeys ?? []) {
      keyMap[row.provider] = decryptKey(row.encrypted_key)
    }

    // Load reference image buffers
    const styleBuffer = styleFile ? Buffer.from(await styleFile.arrayBuffer()) : null
    const productBuffer = productFile ? Buffer.from(await productFile.arrayBuffer()) : null

    // Vision analysis
    let productDescription: string | undefined
    let styleDescription: string | undefined
    const styleStrength = config.styleReferenceStrength ?? 60

    // Product analysis — needs OpenAI
    if (keyMap.openai && productBuffer) {
      const openai = new OpenAI({ apiKey: keyMap.openai })
      productDescription = await analyzeProductImage(openai, productBuffer, productFile?.type ?? "image/jpeg").catch(() => undefined)
    }

    // Style analysis — use Claude if available, no OpenAI required
    if (styleBuffer && (config.imageModel === "dalle3" || config.imageModel === "seedream")) {
      if (keyMap.anthropic) {
        const anthropic = new Anthropic({ apiKey: keyMap.anthropic })
        styleDescription = await analyzeStyleReference(anthropic, styleBuffer, styleFile?.type ?? "image/jpeg", styleStrength).catch(() => undefined)
      } else if (keyMap.openai) {
        // Fallback to OpenAI if no Claude key
        const openai = new OpenAI({ apiKey: keyMap.openai })
        const resp = await openai.chat.completions.create({
          model: "gpt-4o", max_tokens: 200,
          messages: [{ role: "user", content: [
            { type: "image_url", image_url: { url: `data:${styleFile?.type ?? "image/jpeg"};base64,${styleBuffer.toString("base64")}`, detail: "low" } },
            { type: "text", text: "Describe this image's lighting, colour palette, mood and composition in 2-3 sentences for image generation." },
          ]}],
        }).catch(() => null)
        styleDescription = resp?.choices[0]?.message?.content?.trim()
      }
    }

    // Build prompt — product is always the hero when provided
    let finalPrompt: string
    if (styleDescription && styleStrength >= 70) {
      if (productDescription) {
        // Product leads — scene from style ref is the backdrop
        finalPrompt = `${productDescription}, prominently displayed as the hero subject of the scene`
        finalPrompt += `. Setting and atmosphere: ${styleDescription}`
        if (config.customPrompt) finalPrompt += `. ${config.customPrompt}`
      } else {
        // No product — style description drives the whole prompt
        finalPrompt = styleDescription
        if (config.customPrompt) finalPrompt += `. ${config.customPrompt}`
      }
    } else {
      const hasNiche = !!(config.niche ?? config.categoryPreset)
      const hasLighting = !!(config.lightingPreset)
      const hasStyle = !!(config.stylePreset)

      if (hasNiche) {
        finalPrompt = buildPrompt(
          config.niche ?? config.categoryPreset ?? "home-decor",
          hasLighting ? config.lightingPreset! : "morning",
          config.customPrompt,
          productDescription,
          config.aspectRatio,
          hasStyle ? config.stylePreset : undefined
        )
      } else {
        // Niche is off — build a minimal prompt from just custom text + product + lighting
        const parts: string[] = []
        if (productDescription) parts.push(`${productDescription}, as the main focal point`)
        if (config.customPrompt) parts.push(config.customPrompt)
        if (hasLighting && LIGHTING_PRESETS[config.lightingPreset!]) parts.push(LIGHTING_PRESETS[config.lightingPreset!].append)
        if (config.aspectRatio === "2:3") parts.push("portrait orientation")
        if (config.aspectRatio === "16:9") parts.push("landscape widescreen")
        finalPrompt = parts.length > 0 ? parts.join(", ") : "professional lifestyle product photography"
      }
      if (styleDescription) finalPrompt += `. Lighting and atmosphere: ${styleDescription}`
    }

    // captionContext is what Claude/GPT-4o uses to write captions — always rich and descriptive
    // For Seedream multi-image we override the IMAGE prompt to use array syntax,
    // but keep captionContext pointing at the human-readable scene+product description
    const captionContext = finalPrompt

    // Seedream with both images: override IMAGE prompt to reference image slots explicitly
    // but preserve captionContext so captions are still written from rich product/scene description
    if (config.imageModel === "seedream" && styleBuffer && productBuffer) {
      const customAddition = config.customPrompt ? ` ${config.customPrompt}.` : ""
      finalPrompt = `Place the product shown in image 2 as the prominent focal point of a lifestyle scene that matches the mood, lighting, colour palette and atmosphere of image 1.${customAddition} The product must be clearly visible and true to its original design and colours. Professional lifestyle photography.`
      // captionContext stays as the rich text description built above
    } else if (config.imageModel === "seedream" && productBuffer && !styleBuffer) {
      const customAddition = config.customPrompt ? ` ${config.customPrompt}.` : ""
      finalPrompt = `${finalPrompt}${customAddition} The product shown in the reference image must be clearly visible and true to its original design.`
    }

    // Generate images (batch or single)
    const batchCount = config.batchMode ? 3 : 1

    const imageBuffers = await Promise.all(
      Array.from({ length: batchCount }).map(() =>
        generateOneImage(config.imageModel, keyMap, finalPrompt, config, styleBuffer, productBuffer)
      )
    )

    // Strip metadata and encode
    const cleanBuffers = await Promise.all(
      imageBuffers.map((buf) =>
        sharp(buf).jpeg({ quality: 90 }).toBuffer()
      )
    )

    // Upload to Supabase Storage
    const imageUrls = await Promise.all(
      cleanBuffers.map((buf) => uploadImageBuffer(buf, user.id, "jpg"))
    )

    // Base64 for immediate display
    const imagesBase64 = cleanBuffers.map((buf) => buf.toString("base64"))

    // Generate text content — use captionContext (rich scene+product description), not finalPrompt
    // (finalPrompt may be a Seedream multi-image instruction that Claude can't write captions from)
    const textSystemPrompt = buildTextSystemPrompt(captionContext, config.platforms, customSystemPrompt, config.destinationContext ?? null, config.language ?? null, productDescription)
    let textOutput: PlatformOutput = {}

    try {
      if (config.textModel === "gpt4o") {
        if (!keyMap.openai) throw new Error("OpenAI API key not configured. Add it in Settings.")
        const openai = new OpenAI({ apiKey: keyMap.openai })
        textOutput = await generateTextWithOpenAI(openai, textSystemPrompt)
      } else if (config.textModel === "claude") {
        if (!keyMap.anthropic) throw new Error("Anthropic API key not configured. Add it in Settings.")
        const anthropic = new Anthropic({ apiKey: keyMap.anthropic })
        textOutput = await generateTextWithClaude(anthropic, textSystemPrompt)
      } else if (config.textModel === "gemini") {
        if (!keyMap.gemini) throw new Error("Google Gemini API key not configured. Add it in Settings.")
        const genAI = new GoogleGenerativeAI(keyMap.gemini)
        textOutput = await generateTextWithGemini(genAI, textSystemPrompt)
      }
    } catch (textErr) {
      console.error("[generate] text generation failed:", textErr)
      // Non-fatal — return image without text
    }

    // Save generation records
    await Promise.all(
      imageUrls.map((imageUrl) =>
        supabase.from("generations").insert({
          user_id: user.id,
          image_model: config.imageModel,
          text_model: config.textModel,
          category_preset: config.niche ?? config.categoryPreset ?? "home-decor",
          lighting_preset: config.lightingPreset,
          platforms: config.platforms,
          prompt_used: finalPrompt,
          status: "completed",
          has_style_reference: !!styleFile,
          has_product_reference: !!productFile,
          product_description: productDescription ?? null,
          image_url: imageUrl ?? null,
        })
      )
    )

    if (!isPro) {
      await supabase
        .from("users")
        .update({ free_generations_used: freeUsed + batchCount })
        .eq("id", user.id)

      // Send welcome email on the very first generation (freeUsed was 0 before this)
      if (freeUsed === 0) {
        try {
          const userEmail = userData?.email ?? user.email
          if (userEmail) {
            await sendWelcomeEmail(userEmail, userData?.referral_code ?? undefined)
          }
        } catch (emailErr) {
          console.error("[generate] welcome email failed:", emailErr)
        }
      }
    }

    return NextResponse.json({
      imagesBase64,
      imageUrls: imageUrls.filter(Boolean),
      textOutput,
      prompt: finalPrompt,
      productDescription,
      freeUsed: !isPro ? Math.min(freeUsed + batchCount, 10) : null,
    })
  } catch (err: unknown) {
    console.error("[/api/generate]", err)
    const message = err instanceof Error ? err.message : "Internal server error."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
