import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PROVIDERS, MODELS, modelInfo } from "@/lib/providers"

type Range = "24h" | "7d" | "30d" | "90d" | "all"
type Bucket = "hour" | "day" | "week"

const RANGE_CONFIG: Record<Range, { ms: number; bucket: Bucket }> = {
  "24h": { ms: 24 * 60 * 60 * 1000, bucket: "hour" },
  "7d": { ms: 7 * 24 * 60 * 60 * 1000, bucket: "day" },
  "30d": { ms: 30 * 24 * 60 * 60 * 1000, bucket: "day" },
  "90d": { ms: 90 * 24 * 60 * 60 * 1000, bucket: "week" },
  all: { ms: 5 * 365 * 24 * 60 * 60 * 1000, bucket: "week" },
}

// All bucketing is done in UTC so server keys and client-rendered labels agree.
function bucketKey(iso: string, bucket: Bucket): string {
  if (bucket === "hour") return iso.slice(0, 13)
  if (bucket === "day") return iso.slice(0, 10)
  const d = new Date(iso.slice(0, 10) + "T00:00:00.000Z")
  const dow = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() + ((dow === 0 ? -6 : 1) - dow)) // back to Monday
  return d.toISOString().slice(0, 10)
}

function enumerateBuckets(sinceMs: number, nowMs: number, bucket: Bucket): string[] {
  const stepMs = bucket === "hour" ? 3_600_000 : 86_400_000
  const keys: string[] = []
  const seen = new Set<string>()
  for (let t = sinceMs; t <= nowMs; t += stepMs) {
    const k = bucketKey(new Date(t).toISOString(), bucket)
    if (!seen.has(k)) { seen.add(k); keys.push(k) }
  }
  const nowKey = bucketKey(new Date(nowMs).toISOString(), bucket)
  if (!seen.has(nowKey)) keys.push(nowKey)
  return keys
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const rangeParam = searchParams.get("range") ?? "30d"
  const range: Range = rangeParam in RANGE_CONFIG ? (rangeParam as Range) : "30d"
  const { ms, bucket } = RANGE_CONFIG[range]

  const nowMs = Date.now()
  const sinceMs = nowMs - ms
  const sinceIso = new Date(sinceMs).toISOString()

  const { data, error } = await supabase
    .from("generations")
    .select("created_at, image_model, text_model, category_preset")
    .eq("user_id", user.id)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data ?? []
  const buckets = enumerateBuckets(sinceMs, nowMs, bucket)

  // ── Per-model totals + per-bucket series (the primary view) ──────────────────
  // Each generation uses one image_model and one text_model, so it counts once
  // toward each. We only surface models that were actually used.
  const modelTotal: Record<string, number> = {}
  const modelBucket: Record<string, Record<string, number>> = {}
  const providerTotal: Record<string, number> = {}

  const bump = (modelKey: string, b: string) => {
    const info = modelInfo(modelKey)
    if (!info) return
    modelTotal[modelKey] = (modelTotal[modelKey] ?? 0) + 1
    if (!modelBucket[modelKey]) modelBucket[modelKey] = {}
    modelBucket[modelKey][b] = (modelBucket[modelKey][b] ?? 0) + 1
    providerTotal[info.provider] = (providerTotal[info.provider] ?? 0) + 1
  }

  for (const r of rows) {
    const b = bucketKey(r.created_at, bucket)
    if (r.image_model) bump(r.image_model, b)
    if (r.text_model) bump(r.text_model, b)
  }

  const models = MODELS
    .filter(m => (modelTotal[m.key] ?? 0) > 0)
    .map(m => ({
      key: m.key,
      label: m.label,
      kind: m.kind,
      provider: m.provider,
      color: m.color,
      total: modelTotal[m.key],
      series: buckets.map(b => ({ bucket: b, count: modelBucket[m.key]?.[b] ?? 0 })),
    }))
    .sort((a, b) => b.total - a.total)

  const totalRequests = models.reduce((sum, m) => sum + m.total, 0)

  // ── Compact per-provider summary (secondary; totals only, used only) ─────────
  const byProvider = PROVIDERS
    .filter(p => (providerTotal[p.key] ?? 0) > 0)
    .map(p => ({ provider: p.key, label: p.label, color: p.color, total: providerTotal[p.key] }))
    .sort((a, b) => b.total - a.total)

  // ── Category breakdown ───────────────────────────────────────────────────────
  const catMap: Record<string, number> = {}
  for (const r of rows) { const c = r.category_preset ?? "none"; catMap[c] = (catMap[c] ?? 0) + 1 }
  const byCategory = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return NextResponse.json({
    range,
    bucket,
    rangeStart: sinceIso,
    rangeEnd: new Date(nowMs).toISOString(),
    total: rows.length,
    totalRequests,
    models,
    byProvider,
    byCategory,
  })
}
