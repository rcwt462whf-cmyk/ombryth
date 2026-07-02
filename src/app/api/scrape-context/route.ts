import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { scrapeUrl } from "@/lib/scrape-context"

// Thin route: authenticate the user, then delegate all fetching/parsing to the shared
// scrapeUrl() lib so the same logic can be reused server-to-server (see /api/generate-pin).
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { url } = body as { url?: string }

    const result = await scrapeUrl(url ?? "")

    // Client-facing errors: a bad URL is a 400, an unreachable page is a soft 200
    // (the user can still generate without context) — preserve the original contract.
    if (result.error === "Missing URL" || result.error === "Invalid URL") {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error("[/api/scrape-context]", err)
    return NextResponse.json({ title: "", description: "", subtopics: [], products: [], url: "", error: "Could not fetch page" }, { status: 200 })
  }
}
