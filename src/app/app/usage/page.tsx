"use client"

import { useEffect, useState } from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts"
import { TrendingUp, Image as ImageIcon, Type, Layers, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const SPANS = [
  { label: "7 days",  value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "All time", value: 365 * 5 },
]

const MODEL_LABELS: Record<string, string> = {
  dalle3: "DALL-E 3",
  "flux-schnell": "Flux Schnell",
  "flux-dev": "Flux Dev",
  "flux-2-pro": "Flux 2 Pro",
  stability: "Stable Diffusion",
  seedream: "Seedream",
  "seedream-5-lite": "Seedream 5",
  unknown: "Unknown",
}

const TEXT_MODEL_LABELS: Record<string, string> = {
  gpt4o: "GPT-4o",
  claude: "Claude Sonnet",
  gemini: "Gemini Flash",
  failed: "Failed",
  unknown: "Unknown",
}

const PALETTE = [
  "#5fe6c4", "#3b82f6", "#f59e0b", "#ec4899",
  "#8b5cf6", "#10b981", "#f97316", "#14b8a6",
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsData {
  total: number
  successful: number
  byDay: { date: string; count: number }[]
  byModel: { model: string; count: number }[]
  byTextModel: { model: string; count: number }[]
  byCategory: { category: string; count: number }[]
  byDayByModel: Record<string, string | number>[]
  allModels: string[]
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function fmtDate(iso: string, compact = false) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-GB", compact
    ? { day: "numeric", month: "short" }
    : { day: "numeric", month: "short", year: "2-digit" })
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-[#5fe6c4]/10 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-[#5fe6c4]" style={{ width: 18, height: 18 }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs space-y-1 min-w-[120px]">
      {label && <p className="text-muted-foreground font-medium mb-1.5">{fmtDate(label)}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-foreground">{MODEL_LABELS[p.name] ?? p.name}</span>
          </span>
          <span className="font-semibold text-foreground tabular-nums">{p.value}</span>
        </div>
      ))}
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

// ─── Horizontal bar ───────────────────────────────────────────────────────────

function HorizBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs tabular-nums font-medium text-foreground w-8 text-right">{count}</span>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsagePage() {
  const [span, setSpan] = useState(30)
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/stats?span=${span}`)
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [span])

  const Skeleton = () => <div className="h-[200px] bg-muted animate-pulse rounded-lg" />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Usage</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generation stats across models and time</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {SPANS.map(s => (
            <button
              key={s.value}
              onClick={() => setSpan(s.value)}
              className={cn(
                "h-7 px-3 text-xs font-medium rounded-md transition-all",
                span === s.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Zap}
          label="Total generations"
          value={loading ? "—" : (data?.total ?? 0)}
          sub={loading ? undefined : `${data?.successful ?? 0} successful`}
        />
        <StatCard
          icon={ImageIcon}
          label="Image models used"
          value={loading ? "—" : (data?.byModel.length ?? 0)}
          sub="distinct models"
        />
        <StatCard
          icon={Type}
          label="Text models used"
          value={loading ? "—" : (data?.byTextModel.length ?? 0)}
          sub="distinct models"
        />
        <StatCard
          icon={Layers}
          label="Top category"
          value={loading || !data?.byCategory.length ? "—" : (data.byCategory[0].category === "none" ? "Uncategorised" : data.byCategory[0].category)}
          sub={loading || !data?.byCategory.length ? undefined : `${data.byCategory[0].count} gens`}
        />
      </div>

      {/* Generations over time */}
      <Section title="Generations over time">
        {loading ? <Skeleton /> : !data ? null : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.byDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5fe6c4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5fe6c4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => fmtDate(v, true)}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="count"
                stroke="#5fe6c4"
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* By model stacked */}
      {data && data.allModels.length > 1 && (
        <Section title="Generations by image model (daily)">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byDayByModel} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => fmtDate(v, true)}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(v) => <span className="text-xs text-muted-foreground">{MODEL_LABELS[v] ?? v}</span>}
                  wrapperStyle={{ fontSize: 11 }}
                />
                {data.allModels.map((m, i) => (
                  <Bar key={m} dataKey={m} name={m} stackId="a" fill={PALETTE[i % PALETTE.length]} radius={i === data.allModels.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      )}

      {/* Image model breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section title="Image model breakdown">
          {loading ? <div className="h-40 bg-muted animate-pulse rounded-lg" /> : !data?.byModel.length ? (
            <p className="text-xs text-muted-foreground">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {data.byModel.map((m, i) => (
                <HorizBar
                  key={m.model}
                  label={MODEL_LABELS[m.model] ?? m.model}
                  count={m.count}
                  total={data.total}
                  color={PALETTE[i % PALETTE.length]}
                />
              ))}
            </div>
          )}
        </Section>

        <Section title="Text model breakdown">
          {loading ? <div className="h-40 bg-muted animate-pulse rounded-lg" /> : !data?.byTextModel.length ? (
            <p className="text-xs text-muted-foreground">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {data.byTextModel.map((m, i) => (
                <HorizBar
                  key={m.model}
                  label={TEXT_MODEL_LABELS[m.model] ?? m.model}
                  count={m.count}
                  total={data.total}
                  color={PALETTE[i % PALETTE.length]}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Category breakdown */}
      {data && data.byCategory.some(c => c.category !== "none") && (
        <Section title="Top categories">
          {loading ? <div className="h-40 bg-muted animate-pulse rounded-lg" /> : (
            <div className="space-y-3">
              {data.byCategory.map((c, i) => (
                <HorizBar
                  key={c.category}
                  label={c.category === "none" ? "Uncategorised" : c.category}
                  count={c.count}
                  total={data.total}
                  color={PALETTE[i % PALETTE.length]}
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Per-model totals bar */}
      {data && data.byModel.length > 0 && (
        <Section title="Total generations per image model">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byModel} layout="vertical" margin={{ top: 0, right: 16, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="model"
                  tickFormatter={(v) => MODEL_LABELS[v] ?? v}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(v, n) => [v, MODEL_LABELS[n as string] ?? n]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }}
                />
                {data.byModel.map((m, i) => (
                  <Bar key={m.model} dataKey="count" fill={PALETTE[i % PALETTE.length]} radius={[0, 4, 4, 0]}>
                    <Cell key={m.model} fill={PALETTE[i % PALETTE.length]} />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      )}
    </div>
  )
}
