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

    // SSRF protection: block private/internal IP ranges
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname.toLowerCase()
      const isPrivate =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        // IPv4 private ranges
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
        // AWS/GCP/Azure metadata endpoints
        hostname === "169.254.169.254" ||
        hostname === "metadata.google.internal" ||
        hostname.endsWith(".internal") ||
        hostname.endsWith(".local")
      if (isPrivate) {
        return NextResponse.json({ title: "", description: "", url, error: "Invalid URL" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ title: "", description: "", url, error: "Invalid URL" }, { status: 400 })
    }

    let html: string
    try {
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      })

      if (!resp.ok) {
        return NextResponse.json({ title: "", description: "", url, error: "Could not fetch page" }, { status: 200 })
      }

      html = await resp.text()
    } catch {
      return NextResponse.json({ title: "", description: "", url, error: "Could not fetch page" }, { status: 200 })
    }

    const getMeta = (name: string): string => {
      const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']{1,500})["']`, "i"))
        ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+(?:name|property)=["']${name}["']`, "i"))
      return m ? m[1].trim() : ""
    }

    const getTag = (tag: string): string => {
      const m = html.match(new RegExp(`<${tag}[^>]*>([^<]{1,300})<\/${tag}>`, "i"))
      return m ? m[1].replace(/\s+/g, " ").trim() : ""
    }

    // Title: prefer og:title or article-specific h1 over generic <title>
    const ogTitle = getMeta("og:title")
    const h1 = getTag("h1")
    const pageTitle = getTag("title")
    const title = ogTitle || h1 || pageTitle

    // Description: prefer og:description, then pull first meaty paragraph from article body
    const ogDesc = getMeta("og:description")
    const metaDesc = getMeta("description")

    // Extract real article content — find paragraphs with actual substance
    let articleContent = ""
    if (!ogDesc || ogDesc.length < 60) {
      const paragraphs = Array.from(html.matchAll(/<p[^>]*>([^<]{80,600})<\/p>/gi))
        .map(m => m[1].replace(/\s+/g, " ").trim())
        .filter(p => !p.includes("cookie") && !p.includes("privacy") && !p.includes("©"))
        .slice(0, 3)
      if (paragraphs.length > 0) {
        articleContent = paragraphs.join(" ").slice(0, 400)
      }
    }

    // Also extract h2 headings as topic keywords
    const h2s = Array.from(html.matchAll(/<h2[^>]*>([^<]{5,100})<\/h2>/gi))
      .map(m => m[1].replace(/\s+/g, " ").trim())
      .slice(0, 5)
    const h2Keywords = h2s.join(", ")

    const description = ogDesc || articleContent || metaDesc
    const keywords = h2Keywords ? `Topics: ${h2Keywords}` : ""

    // Strip control chars and anything that looks like prompt injection
    // before this content enters an AI system prompt
    const scrub = (s: string, max: number) =>
      s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
       .replace(/\b(ignore|disregard|forget|override)\b.{0,80}(instruction|prompt|previous|above)/gi, "[…]")
       .trim()
       .slice(0, max)

    return NextResponse.json({
      title: scrub(title, 200),
      description: scrub([description, keywords].filter(Boolean).join(" | "), 600),
      url,
    })
  } catch (err) {
    console.error("[/api/scrape-context]", err)
    return NextResponse.json({ title: "", description: "", url: "", error: "Could not fetch page" }, { status: 200 })
  }
}
