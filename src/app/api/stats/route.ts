import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const span = searchParams.get("span") ?? "30"
  const days = parseInt(span, 10)
  if (isNaN(days) || days < 1) return NextResponse.json({ error: "Invalid span" }, { status: 400 })

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  const { data, error } = await supabase
    .from("generations")
    .select("created_at, image_model, text_model, category_preset, status")
    .eq("user_id", user.id)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []

  // ── Daily totals ─────────────────────────────────────────────────────────────
  const dayMap: Record<string, number> = {}
  // Fill every calendar day in range with 0 so chart never has gaps
  for (let i = days; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    dayMap[day] = (dayMap[day] ?? 0) + 1
  }
  const byDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // ── By image model ────────────────────────────────────────────────────────────
  const modelMap: Record<string, number> = {}
  for (const r of rows) {
    const m = r.image_model ?? "unknown"
    modelMap[m] = (modelMap[m] ?? 0) + 1
  }
  const byModel = Object.entries(modelMap)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)

  // ── By text model ─────────────────────────────────────────────────────────────
  const textMap: Record<string, number> = {}
  for (const r of rows) {
    const m = r.text_model ?? "unknown"
    textMap[m] = (textMap[m] ?? 0) + 1
  }
  const byTextModel = Object.entries(textMap)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)

  // ── By category ───────────────────────────────────────────────────────────────
  const catMap: Record<string, number> = {}
  for (const r of rows) {
    const c = r.category_preset ?? "none"
    catMap[c] = (catMap[c] ?? 0) + 1
  }
  const byCategory = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // ── Per-model daily breakdown (stacked line data) ─────────────────────────────
  const allModels = Array.from(new Set(rows.map(r => r.image_model ?? "unknown")))
  const modelDayMap: Record<string, Record<string, number>> = {}
  for (const day of Object.keys(dayMap)) modelDayMap[day] = {}
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    const m = r.image_model ?? "unknown"
    if (!modelDayMap[day]) modelDayMap[day] = {}
    modelDayMap[day][m] = (modelDayMap[day][m] ?? 0) + 1
  }
  const byDayByModel = Object.entries(modelDayMap).map(([date, counts]) => ({
    date,
    ...counts,
  }))

  // ── Totals ────────────────────────────────────────────────────────────────────
  const total = rows.length
  const successful = rows.filter(r => r.status === "completed").length

  return NextResponse.json({
    total,
    successful,
    byDay,
    byModel,
    byTextModel,
    byCategory,
    byDayByModel,
    allModels,
  })
}
