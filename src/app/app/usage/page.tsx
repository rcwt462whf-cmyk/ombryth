"use client"

import { useEffect, useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { BarChart3 } from "lucide-react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ─── Constants ────────────────────────────────────────────────────────────────

type RangeKey = "24h" | "7d" | "30d" | "90d" | "all"
type Bucket = "hour" | "day" | "week"

const RANGES: { label: string; value: RangeKey }[] = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "All time", value: "all" },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelSeries {
  key: string
  label: string
  kind: "image" | "text"
  provider: string
  color: string
  total: number
  series: { bucket: string; count: number }[]
}

interface StatsData {
  range: RangeKey
  bucket: Bucket
  rangeStart: string
  rangeEnd: string
  total: number
  totalRequests: number
  models: ModelSeries[]
  byProvider: { provider: string; label: string; color: string; total: number }[]
  byCategory: { category: string; count: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBucketLabel(key: string, bucket: Bucket) {
  if (bucket === "hour") {
    return new Date(key + ":00:00.000Z").toLocaleString("en-GB", {
      day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "UTC",
    })
  }
  const label = new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", timeZone: "UTC",
  })
  return bucket === "week" ? `Week of ${label}` : label
}

function fmtAxis(key: string, bucket: Bucket) {
  if (bucket === "hour") {
    return new Date(key + ":00:00.000Z").toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
  }
  return new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
}

// Zip each model's aligned series into rows keyed by model for the stacked chart.
function buildStacked(models: ModelSeries[]) {
  const buckets = models[0]?.series.map(s => s.bucket) ?? []
  return buckets.map((b, i) => {
    const row: Record<string, string | number> = { bucket: b }
    for (const m of models) row[m.key] = m.series[i]?.count ?? 0
    return row
  })
}

// ─── Hero tooltip ─────────────────────────────────────────────────────────────

function HeroTooltip({ active, payload, label, models, bucket }: {
  active?: boolean
  payload?: { name: string; value: number }[]
  label?: string
  models: ModelSeries[]
  bucket: Bucket
}) {
  if (!active || !payload?.length) return null
  const rows = payload
    .filter(p => p.value > 0)
    .map(p => ({ ...p, model: models.find(m => m.key === p.name) }))
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs min-w-[150px]">
      <p className="text-muted-foreground font-medium mb-1.5">{label ? fmtBucketLabel(label, bucket) : ""}</p>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">No requests</p>
      ) : (
        <div className="space-y-1">
          {rows.map(r => (
            <div key={r.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.model?.color }} />
                <span className="text-foreground">{r.model?.label ?? r.name}</span>
              </span>
              <span className="font-semibold text-foreground tabular-nums">{r.value}</span>
            </div>
          ))}
          {rows.length > 1 && (
            <div className="flex items-center justify-between gap-4 pt-1 mt-1 border-t border-border">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-foreground tabular-nums">{total}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Model card (per-model, with area sparkline) ──────────────────────────────

function ModelCard({ model, totalRequests }: { model: ModelSeries; totalRequests: number }) {
  const pct = totalRequests > 0 ? Math.round((model.total / totalRequests) * 100) : 0
  const gradId = `spark-${model.key}`
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: model.color }} />
            <span className="text-sm font-medium text-foreground truncate" title={model.label}>{model.label}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{model.kind} model</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{model.total}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{pct}% of use</p>
        </div>
      </div>
      <div className="h-14 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={model.series} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={model.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={model.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="count"
              stroke={model.color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Horizontal bar (provider + category) ─────────────────────────────────────

function HorizBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs tabular-nums font-medium text-foreground w-8 text-right">{count}</span>
      <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsagePage() {
  const [range, setRange] = useState<RangeKey>("30d")
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stats?range=${range}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [range])

  const models = data?.models ?? []
  const stacked = buildStacked(models)
  const hasData = !loading && data && models.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Usage</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Requests by model over time</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map(r => (
              <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Headline */}
      <div className="flex items-baseline gap-2.5">
        <span className="text-3xl font-bold text-foreground tabular-nums">
          {loading || !data ? "—" : data.totalRequests}
        </span>
        <span className="text-sm text-muted-foreground">
          model requests{hasData ? ` · ${data.total} generation${data.total === 1 ? "" : "s"} · ${models.length} model${models.length === 1 ? "" : "s"} used` : ""}
        </span>
      </div>

      {loading ? (
        <div className="h-[280px] bg-muted animate-pulse rounded-xl" />
      ) : !hasData ? (
        <div className="bg-card rounded-xl border border-border py-16 flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No usage in this period</p>
          <p className="text-xs text-muted-foreground mt-1">Generate some content and your model activity will show up here.</p>
        </div>
      ) : (
        <>
          {/* Hero — stacked area by model */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">Requests over time</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {models.map(m => (
                  <span key={m.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stacked} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  {models.map(m => (
                    <linearGradient key={m.key} id={`hero-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={m.color} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={m.color} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={(v) => fmtAxis(v, data!.bucket)}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<HeroTooltip models={models} bucket={data!.bucket} />} />
                {models.map(m => (
                  <Area
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    stackId="a"
                    stroke={m.color}
                    strokeWidth={2}
                    fill={`url(#hero-${m.key})`}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Per-model cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {models.map(m => (
              <ModelCard key={m.key} model={m} totalRequests={data!.totalRequests} />
            ))}
          </div>

          {/* Secondary: provider + category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section title="By provider">
              <div className="space-y-3">
                {data!.byProvider.map(p => (
                  <HorizBar key={p.provider} label={p.label} count={p.total} total={data!.totalRequests} color={p.color} />
                ))}
              </div>
            </Section>

            {data!.byCategory.some(c => c.category !== "none") ? (
              <Section title="Top categories">
                <div className="space-y-3">
                  {data!.byCategory.map((c, i) => (
                    <HorizBar
                      key={c.category}
                      label={c.category === "none" ? "Uncategorised" : c.category}
                      count={c.count}
                      total={data!.total}
                      color={models[i % models.length]?.color ?? "#5fe6c4"}
                    />
                  ))}
                </div>
              </Section>
            ) : (
              <Section title="Top categories">
                <p className="text-xs text-muted-foreground">No categorised generations yet.</p>
              </Section>
            )}
          </div>
        </>
      )}
    </div>
  )
}
