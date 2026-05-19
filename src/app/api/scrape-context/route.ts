import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body as { url?: string }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ title: "", description: "", url: "", error: "Missing URL" }, { status: 400 })
    }

    if (url.length > 500 || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return NextResponse.json({ title: "", description: "", url, error: "Invalid URL" }, { status: 400 })
    }

    let html: string
    try {
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Mozilla/5.0" },
      })

      if (!resp.ok) {
        return NextResponse.json({ title: "", description: "", url, error: "Could not fetch page" }, { status: 200 })
      }

      html = await resp.text()
    } catch {
      return NextResponse.json({ title: "", description: "", url, error: "Could not fetch page" }, { status: 200 })
    }

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ""

    // Extract <meta name="description" content="...">
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
    const description = descMatch ? descMatch[1].trim() : ""

    return NextResponse.json({ title, description, url })
  } catch (err) {
    console.error("[/api/scrape-context]", err)
    return NextResponse.json({ title: "", description: "", url: "", error: "Could not fetch page" }, { status: 200 })
  }
}
