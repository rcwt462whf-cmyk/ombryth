import { NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { createServiceClient } from "@/lib/supabase/server"
import { scrapeUrl, type ScrapedProduct } from "@/lib/scrape-context"
import { createHash, randomUUID } from "crypto"

// ─── Preset → Ombryth niche/style mapping ────────────────────────────────────
const PRESET_MAP: Record<string, { niche: string; style: string }> = {
  lifestyle:  { niche: "home-decor",  style: "cozy"      },
  minimal:    { niche: "home-decor",  style: "minimalist" },
  product:    { niche: "home-decor",  style: "luxury"     },
  editorial:  { niche: "fashion",     style: "editorial"  },
  // fallback
  default:    { niche: "home-decor",  style: "cozy"      },
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

// ─── Async generation + callback ─────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function attemptGeneration(params: {
  userId: string
  blogUrl: string
  blogTitle?: string
  preset: string
  destinationContext: { title: string; description: string; products?: ScrapedProduct[] } | null
  siteUrl: string
}): Promise<{ imageUrl: string; pinterest: Record<string, unknown> | null }> {
  const { niche, style } = PRESET_MAP[params.preset] ?? PRESET_MAP.default
  const config = {
    imageModel: "seedream-5-lite",
    textModel: "gpt4o",
    niche,
    stylePreset: style,
    lightingPreset: "morning",
    platforms: ["pinterest"],
    aspectRatio: "2:3",
    language: "en",
    batchMode: false,
    destinationContext: params.destinationContext ?? undefined,
  }

  const fd = new FormData()
  fd.append("config", JSON.stringify(config))

  const genResp = await fetch(`${params.siteUrl}/api/generate`, {
    method: "POST",
    headers: {
      "x-vynthr-user-id": params.userId,
      // Proves this is a trusted server-to-server call, not a spoofed public request.
      "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
    },
    body: fd,
  })

  if (!genResp.ok) {
    const err = await genResp.json().catch(() => ({}))
    throw new Error(`Generation failed (${genResp.status}): ${err.error ?? "unknown"}`)
  }

  const genData = await genResp.json()
  const imageUrl: string | null = genData.imageUrls?.[0] ?? null
  if (!imageUrl) throw new Error("No image URL in generation response")

  return { imageUrl, pinterest: genData.textOutput?.pinterest ?? null }
}

async function runGenerationAndCallback(params: {
  jobId: string
  userId: string
  blogUrl: string
  blogTitle?: string
  workspaceId: string
  callbackUrl: string
  callbackApiKey: string
  affiliateLink?: string
  preset: string
  sourceId?: string
  externalRowId?: string
  siteUrl: string
}) {
  const {
    jobId, userId, blogUrl, blogTitle, workspaceId,
    callbackUrl, callbackApiKey, affiliateLink,
    preset, sourceId, externalRowId, siteUrl,
  } = params

  const supabase = await createServiceClient()

  // 1. Scrape blog URL for context — non-fatal. Call the shared lib directly instead of
  // fetching /api/scrape-context over HTTP (that route needs a user session and would 401
  // here, silently dropping all product/price context from Vynthr-generated pins).
  let destinationContext: { title: string; description: string; products?: ScrapedProduct[] } | null = null
  try {
    const scraped = await scrapeUrl(blogUrl)
    if (scraped.title || scraped.description || scraped.products.length > 0) {
      destinationContext = {
        title: scraped.title || blogTitle || "",
        description: scraped.description,
        products: scraped.products.length > 0 ? scraped.products : undefined,
      }
    }
  } catch { /* continue without context */ }
  if (!destinationContext && blogTitle) destinationContext = { title: blogTitle, description: "" }

  // 2. Generate with up to 2 retries — wasted tokens on silent failures is unacceptable
  const MAX_ATTEMPTS = 2
  let lastError: string = "unknown"
  let imageUrl: string | null = null
  let pinterest: Record<string, unknown> | null = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await attemptGeneration({ userId, blogUrl, blogTitle, preset, destinationContext, siteUrl })
      imageUrl = result.imageUrl
      pinterest = result.pinterest
      break // success — stop retrying
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.error(`[generate-pin] job ${jobId} attempt ${attempt}/${MAX_ATTEMPTS} failed: ${lastError}`)
      if (attempt < MAX_ATTEMPTS) await sleep(3000) // wait 3s before retry
    }
  }

  if (!imageUrl) {
    // All attempts exhausted — mark failed, do NOT call callback (nothing useful to send)
    console.error(`[generate-pin] job ${jobId} exhausted all attempts: ${lastError}`)
    await supabase
      .from("pin_jobs")
      .update({ status: "failed", error: lastError })
      .eq("id", jobId)
    return
  }

  // 3. POST to Vynthr callback — retry once if it fails
  const callbackBody = {
    workspace_id: workspaceId,
    image_url: imageUrl,
    caption: pinterest?.description ?? pinterest?.caption ?? null,
    alt_text: pinterest?.altText ?? null,
    hashtags: pinterest?.hashtags ?? [],
    ombryth_generation_id: jobId,
    link: affiliateLink ?? null,
    source_id: sourceId ?? null,
    external_row_id: externalRowId ?? null,
  }

  let callbackOk = false
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const callbackResp = await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": callbackApiKey },
        body: JSON.stringify(callbackBody),
      })
      if (callbackResp.ok) { callbackOk = true; break }
      console.error(`[generate-pin] callback attempt ${attempt} → ${callbackResp.status}`)
    } catch (err) {
      console.error(`[generate-pin] callback attempt ${attempt} threw: ${err}`)
    }
    if (attempt < 2) await sleep(2000)
  }

  // 4. Update job — completed even if callback failed (image was generated, URL is stored)
  await supabase
    .from("pin_jobs")
    .update({
      status: callbackOk ? "completed" : "callback_failed",
      image_url: imageUrl,
      completed_at: new Date().toISOString(),
      error: callbackOk ? null : "Image generated but callback delivery failed after 2 attempts",
    })
    .eq("id", jobId)

  console.log(`[generate-pin] job ${jobId} → ${callbackOk ? "completed" : "callback_failed"}, imageUrl: ${imageUrl}`)
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Auth: Bearer <personal Ombryth API key>
  const auth = request.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null
  if (!token) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 })
  }

  // Authenticated by hashed personal API key, not a user session — service role required
  // to read personal_api_keys and write pin_jobs (no auth.uid() to satisfy RLS).
  const supabase = await createServiceClient()
  const hash = hashKey(token)

  const { data: keyRow } = await supabase
    .from("personal_api_keys")
    .select("id, user_id")
    .eq("key_hash", hash)
    .single()

  if (!keyRow) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  // Update last_used_at non-blocking
  supabase.from("personal_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => {})

  // Parse body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const blogUrl = typeof body.blog_url === "string" ? body.blog_url : null
  const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id : null
  const callbackUrl = typeof body.callback_url === "string" ? body.callback_url : null
  const callbackApiKey = typeof body.callback_api_key === "string" ? body.callback_api_key : null

  if (!blogUrl || !workspaceId || !callbackUrl || !callbackApiKey) {
    return NextResponse.json(
      { error: "Required fields: blog_url, workspace_id, callback_url, callback_api_key" },
      { status: 400 }
    )
  }

  // Create job record
  const jobId = randomUUID()
  await supabase.from("pin_jobs").insert({
    id: jobId,
    user_id: keyRow.user_id,
    workspace_id: workspaceId,
    blog_url: blogUrl,
    callback_url: callbackUrl,
    status: "pending",
    preset: body.preset ?? "lifestyle",
    source_id: body.source_id ?? null,
    external_row_id: body.external_row_id ?? null,
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ombryth.com"

  // Fire generation async — response returns immediately
  waitUntil(runGenerationAndCallback({
    jobId,
    userId: keyRow.user_id,
    blogUrl,
    blogTitle: typeof body.blog_title === "string" ? body.blog_title : undefined,
    workspaceId,
    callbackUrl,
    callbackApiKey,
    affiliateLink: typeof body.affiliate_link === "string" ? body.affiliate_link : undefined,
    preset: typeof body.preset === "string" ? body.preset : "lifestyle",
    sourceId: typeof body.source_id === "string" ? body.source_id : undefined,
    externalRowId: typeof body.external_row_id === "string" ? body.external_row_id : undefined,
    siteUrl,
  }))

  return NextResponse.json({ job_id: jobId }, { status: 202 })
}
