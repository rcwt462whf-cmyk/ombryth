import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { decryptKey } from "@/lib/encryption"
import { buildPrompt } from "@/lib/presets"
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
  aspectRatio: string
): Promise<Buffer> {
  // BytePlus Ark API (OpenAI-compatible)
  const sizeMap: Record<string, string> = {
    "1:1": "1920x1920",
    "2:3": "1568x2352",
    "16:9": "2560x1440",
    "9:16": "1440x2560",
    "4:5": "1728x2160",
  }
  const size = sizeMap[aspectRatio] ?? "1920x1920"

  const resp = await fetch(
    "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "seedream-4-5-251128",
        prompt,
        response_format: "url",
        size,
      }),
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
  openai: OpenAI,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const base64 = buffer.toString("base64")
  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "low" },
          },
          {
            type: "text",
            text: "Describe this image's visual style in 1-2 sentences for use as an AI image generation style reference. Focus on: color palette, lighting quality, mood, composition, photographic style. Be specific and technical.",
          },
        ],
      },
    ],
  })
  return resp.choices[0]?.message?.content?.trim() ?? ""
}

async function analyzeProductImage(
  openai: OpenAI,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const base64 = buffer.toString("base64")
  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "low" },
          },
          {
            type: "text",
            text: "Describe this product in one concise sentence for an AI image generation prompt. Focus on its appearance, material, colour and style. No brand names.",
          },
        ],
      },
    ],
  })
  return resp.choices[0]?.message?.content?.trim() ?? ""
}

// ─── Text generation ──────────────────────────────────────────────────────────

const DEFAULT_SYSTEM_PERSONA =
  "You are a social media content expert specialising in affiliate marketing for interior, home decor, and lifestyle brands. Your mission is to craft captions, hashtags, and descriptions that feel authentic and aspirational, drive traffic, and convert browsers into buyers. Always focus on benefits and lifestyle over product features. Include a clear call-to-action where appropriate."

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
  language?: string | null
): string {
  const persona = customPersona?.trim() || DEFAULT_SYSTEM_PERSONA

  const destinationBlock = destinationContext?.title || destinationContext?.description
    ? `\nThe content being promoted links to a page titled "${destinationContext.title}" described as: "${destinationContext.description}". Naturally weave relevant keywords from this context into your captions and descriptions to align with the destination. Do not mention the URL directly.\n`
    : ""

  return `${persona}

Generate engaging platform content based on this image prompt: "${prompt}".
${destinationBlock}
Return ONLY a valid JSON object. Include ONLY the platforms listed: ${platforms.join(", ")}.

JSON structure:
{
  "pinterest": {
    "title": "max 100 chars, keyword-rich, no hashtags",
    "description": "max 500 chars, engaging, includes keywords",
    "altText": "max 500 chars, descriptive, keyword-rich",
    "caption": "150-300 chars, engaging, lifestyle-oriented",
    "hashtags": ["array", "of", "20", "strings", "WITHOUT", "the", "hash", "symbol", "mix of niche and broad"]
  },
  "instagram": {
    "caption": "150-300 chars, engaging, ends with a question or CTA",
    "altText": "descriptive alt text for accessibility",
    "hashtags": ["array", "of", "30", "strings", "WITHOUT", "the", "hash", "symbol", "mix niche and broad"]
  },
  "facebook": {
    "caption": "100-250 chars, conversational and engaging, includes a soft CTA",
    "altText": "descriptive alt text for accessibility",
    "hashtags": ["array", "of", "5", "strings", "WITHOUT", "the", "hash", "symbol", "broad reach"]
  },
  "google-ads": {
    "headline1": "max 30 chars, main keyword or product benefit",
    "headline2": "max 30 chars, supporting benefit or offer",
    "headline3": "max 30 chars, CTA or brand",
    "description1": "max 90 chars, feature-focused, includes keyword",
    "description2": "max 90 chars, benefit-focused, ends with CTA",
    "altText": "descriptive alt text for the image ad"
  }
}

Return ONLY the JSON. No markdown fences, no explanation.${language && language !== "en" ? `\n\nIMPORTANT: Write ALL output — titles, captions, descriptions, hashtags — in ${LANGUAGE_NAMES[language] ?? language}. Do not mix languages.` : ""}`
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
  return JSON.parse(raw)
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
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim())
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
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim())
}

// ─── Single image generation pipeline ────────────────────────────────────────

async function generateOneImage(
  imageModel: ImageModel,
  keyMap: Record<string, string>,
  prompt: string,
  config: GenerateRequest,
  styleBuffer: Buffer | null
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
      return generateWithSeedream(keyMap.byteplus, prompt, config.aspectRatio)
    }
    default:
      throw new Error(`Unknown image model: ${imageModel}`)
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
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

    const isPro = userData?.subscription_status === "active"
    const freeUsed = userData?.free_generations_used ?? 0
    const customSystemPrompt = userData?.custom_system_prompt ?? null

    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      const seconds = Math.ceil(rateLimit.resetInMs / 1000)
      return NextResponse.json(
        { error: `Rate limit reached. You can generate up to 8 images per minute. Try again in ${seconds} seconds.` },
        { status: 429 }
      )
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

    // Vision analysis (requires OpenAI key for all models to analyze references)
    let productDescription: string | undefined
    let styleDescription: string | undefined

    if (keyMap.openai && (productBuffer || styleBuffer)) {
      const openai = new OpenAI({ apiKey: keyMap.openai })

      const [productDesc, styleDesc] = await Promise.all([
        productBuffer
          ? analyzeProductImage(openai, productBuffer, productFile?.type ?? "image/jpeg").catch(() => undefined)
          : Promise.resolve(undefined),
        styleBuffer && (config.imageModel === "dalle3" || config.imageModel === "seedream")
          ? analyzeStyleReference(openai, styleBuffer, styleFile?.type ?? "image/jpeg").catch(() => undefined)
          : Promise.resolve(undefined),
      ])

      productDescription = productDesc
      styleDescription = styleDesc
    }

    // Build prompt — inject style description for models without native img2img
    let finalPrompt = buildPrompt(
      config.niche ?? config.categoryPreset ?? "home-decor",
      config.lightingPreset,
      config.customPrompt,
      productDescription,
      config.aspectRatio,
      config.stylePreset ?? "minimalist"
    )

    if (styleDescription) {
      finalPrompt += `. Style: ${styleDescription}`
    }

    // Generate images (batch or single)
    const batchCount = config.batchMode ? 3 : 1

    const imageBuffers = await Promise.all(
      Array.from({ length: batchCount }).map(() =>
        generateOneImage(config.imageModel, keyMap, finalPrompt, config, styleBuffer)
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

    // Generate text content
    const textSystemPrompt = buildTextSystemPrompt(finalPrompt, config.platforms, customSystemPrompt, config.destinationContext ?? null, config.language ?? null)
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
