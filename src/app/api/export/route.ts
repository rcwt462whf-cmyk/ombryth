import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import JSZip from "jszip"

type PinterestCaption = { title?: string; description?: string; altText?: string; caption?: string; hashtags?: string[] }
type SimpleCaption = { caption?: string; altText?: string; hashtags?: string[] }
type GoogleAdsCaption = { headline1?: string; headline2?: string; headline3?: string; description1?: string; description2?: string; altText?: string }
type CaptionsByPlatform = {
  pinterest?: PinterestCaption
  instagram?: SimpleCaption
  facebook?: SimpleCaption
  "google-ads"?: GoogleAdsCaption
}

const CSV_HEADER = ["date", "filename", "platform", "title", "caption", "description", "alt_text", "hashtags"]

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function csvRow(values: string[]): string {
  return values.map(csvField).join(",") + "\r\n"
}

/** Flattens one generation's per-platform captions into CSV rows scheduling tools can bulk-import. */
function captionsToCsvRows(date: string, filename: string, captions: CaptionsByPlatform): string {
  let rows = ""
  if (captions.pinterest) {
    const p = captions.pinterest
    rows += csvRow([date, filename, "pinterest", p.title ?? "", p.caption ?? "", p.description ?? "", p.altText ?? "", (p.hashtags ?? []).map((h) => `#${h}`).join(" ")])
  }
  for (const platform of ["instagram", "facebook"] as const) {
    const c = captions[platform]
    if (!c) continue
    rows += csvRow([date, filename, platform, "", c.caption ?? "", "", c.altText ?? "", (c.hashtags ?? []).map((h) => `#${h}`).join(" ")])
  }
  if (captions["google-ads"]) {
    const g = captions["google-ads"]
    rows += csvRow([
      date, filename, "google-ads",
      g.headline1 ?? "",
      [g.headline2, g.headline3].filter(Boolean).join(" / "),
      [g.description1, g.description2].filter(Boolean).join(" / "),
      g.altText ?? "", "",
    ])
  }
  return rows
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  let supabase: Awaited<ReturnType<typeof createClient>>
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json({ error: "Failed to initialize database client" }, { status: 500 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: generations, error: dbError } = await supabase
    .from("generations")
    .select("id, image_url, category_preset, created_at, captions")
    .eq("user_id", user.id)
    .not("image_url", "is", null)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(100)

  if (dbError) {
    return NextResponse.json({ error: "Failed to fetch generations" }, { status: 500 })
  }

  if (!generations || generations.length === 0) {
    return NextResponse.json({ error: "No images to export" }, { status: 404 })
  }

  const zip = new JSZip()

  const withFilenames = generations.map((gen) => {
    const date = new Date(gen.created_at).toISOString().slice(0, 10)
    const category = (gen.category_preset ?? "unknown").replace(/[^a-zA-Z0-9_-]/g, "_")
    const idPrefix = gen.id.slice(0, 6)
    return { ...gen, date, filename: `${date}_${category}_${idPrefix}.jpg` }
  })

  await Promise.all(
    withFilenames.map(async (gen) => {
      if (!gen.image_url) return

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)

        const imgRes = await fetch(gen.image_url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!imgRes.ok) return

        const buffer = await imgRes.arrayBuffer()
        zip.file(gen.filename, buffer)
      } catch {
        // Skip images that fail to fetch
      }
    })
  )

  // Bundle captions/hashtags alongside the images — one row per platform per generation —
  // so the export can be bulk-imported into a scheduler (Later, Metricool, Sprout, etc).
  let csv = csvRow(CSV_HEADER)
  for (const gen of withFilenames) {
    if (!gen.captions) continue
    csv += captionsToCsvRows(gen.date, gen.filename, gen.captions as CaptionsByPlatform)
  }
  zip.file("captions.csv", csv)

  const content = await zip.generateAsync({ type: "arraybuffer" })

  return new Response(content, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ombryth-export-${Date.now()}.zip"`,
    },
  })
}
