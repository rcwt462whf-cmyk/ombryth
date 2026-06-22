import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import JSZip from "jszip"

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
    .select("id, image_url, category_preset, created_at")
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

  await Promise.all(
    generations.map(async (gen) => {
      if (!gen.image_url) return

      const date = new Date(gen.created_at).toISOString().slice(0, 10)
      const category = (gen.category_preset ?? "unknown").replace(/[^a-zA-Z0-9_-]/g, "_")
      const idPrefix = gen.id.slice(0, 6)
      const filename = `${date}_${category}_${idPrefix}.jpg`

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)

        const imgRes = await fetch(gen.image_url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!imgRes.ok) return

        const buffer = await imgRes.arrayBuffer()
        zip.file(filename, buffer)
      } catch {
        // Skip images that fail to fetch
      }
    })
  )

  const content = await zip.generateAsync({ type: "arraybuffer" })

  return new Response(content, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ombryth-export-${Date.now()}.zip"`,
    },
  })
}
