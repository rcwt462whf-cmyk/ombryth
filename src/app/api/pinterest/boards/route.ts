import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPinterestToken } from "@/lib/pinterest"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const token = await getPinterestToken(user.id, supabase)
  if (!token) return NextResponse.json({ error: "Pinterest not connected" }, { status: 400 })

  const resp = await fetch("https://api.pinterest.com/v5/boards?page_size=50", {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!resp.ok) {
    const text = await resp.text()
    console.error("[pinterest/boards]", resp.status, text)
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 502 })
  }

  const data = await resp.json()
  const boards = (data.items ?? []).map((b: { id: string; name: string; description?: string }) => ({
    id: b.id,
    name: b.name,
    description: b.description ?? "",
  }))

  return NextResponse.json({ boards })
}
