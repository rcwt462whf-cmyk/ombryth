import { NextResponse } from "next/server"
import { waitUntil } from "@vercel/functions"
import { createClient } from "@/lib/supabase/server"
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

  try {
    // 1. Scrape blog URL for context (reuse existing scrape endpoint)
    let destinationContext: { title: string; description: string } | null = null
    try {
      const scrapeResp = await fetch(`${siteUrl}/api/scrape-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blogUrl }),
      })
      if (scrapeResp.ok) {
        const d = await scrapeResp.json()
        if (d.title || d.description) {
          destinationContext = { title: d.title ?? blogTitle ?? "", description: d.description ?? "" }
        }
      }
    } catch { /* non-fatal — generate without context */ }

    if (!destinationContext && blogTitle) {
      destinationContext = { title: blogTitle, description: "" }
    }

    // 2. Call internal generate endpoint
    const { niche, style } = PRESET_MAP[preset] ?? PRESET_MAP.default
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
      destinationContext: destinationContext ?? undefined,
    }

    const fd = new FormData()
    fd.append("config", JSON.stringify(config))
    // Pass user ID via header so the generate route can look up their API keys
    const genResp = await fetch(`${siteUrl}/api/generate`, {
      method: "POST",
      headers: { "x-vynthr-user-id": userId },
      body: fd,
    })

    if (!genResp.ok) {
      const err = await genResp.json().catch(() => ({}))
      throw new Error(`Generation failed: ${err.error ?? genResp.status}`)
    }

    const genData = await genResp.json()
    const imageUrl: string = genData.imageUrls?.[0] ?? null
    const pinterest = genData.textOutput?.pinterest

    if (!imageUrl) throw new Error("No image URL returned from generation")

    // 3. POST result to Vynthr callback
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

    const callbackResp = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": callbackApiKey,
      },
      body: JSON.stringify(callbackBody),
    })

    if (!callbackResp.ok) {
      console.error(`[generate-pin] callback failed ${callbackResp.status} for job ${jobId}`)
    } else {
      console.log(`[generate-pin] callback success for job ${jobId} → workspace ${workspaceId}`)
    }

    // 4. Update job status in DB
    const supabase = await createClient()
    await supabase
      .from("pin_jobs")
      .update({ status: "completed", image_url: imageUrl, completed_at: new Date().toISOString() })
      .eq("id", jobId)

  } catch (err) {
    console.error(`[generate-pin] job ${jobId} failed:`, err)
    const supabase = await createClient()
    await supabase
      .from("pin_jobs")
      .update({ status: "failed", error: err instanceof Error ? err.message : String(err) })
      .eq("id", jobId)
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Auth: Bearer <personal Ombryth API key>
  const auth = request.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null
  if (!token) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 })
  }

  const supabase = await createClient()
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
