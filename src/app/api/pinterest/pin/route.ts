import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPinterestToken } from "../callback/route"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const token = await getPinterestToken(user.id, supabase)
  if (!token) return NextResponse.json({ error: "Pinterest not connected" }, { status: 400 })

  const body = await request.json()
  const { boardId, imageUrl, title, description, altText, link } = body as {
    boardId: string
    imageUrl: string
    title?: string
    description?: string
    altText?: string
    link?: string
  }

  if (!boardId || !imageUrl) {
    return NextResponse.json({ error: "boardId and imageUrl are required" }, { status: 400 })
  }

  // Sanitize inputs
  const safeTitle = (title ?? "").slice(0, 100)
  const safeDescription = (description ?? "").slice(0, 500)
  const safeAlt = (altText ?? "").slice(0, 500)

  const pinBody: Record<string, unknown> = {
    board_id: boardId,
    media_source: {
      source_type: "image_url",
      url: imageUrl,
    },
    title: safeTitle,
    description: safeDescription,
    alt_text: safeAlt,
  }

  if (link) pinBody.link = link

  const resp = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pinBody),
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error("[pinterest/pin]", resp.status, text)
    return NextResponse.json({ error: `Pinterest error: ${resp.status}` }, { status: 502 })
  }

  const pin = await resp.json()
  return NextResponse.json({ success: true, pinId: pin.id, pinUrl: `https://pinterest.com/pin/${pin.id}` })
}
