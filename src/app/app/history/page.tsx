"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Clock, Image as ImageIcon, Trash2, X, Download, Loader2 } from "lucide-react"
import Image from "next/image"
import { NICHE_PRESETS, LIGHTING_PRESETS } from "@/lib/presets"
import type { LightingPreset } from "@/types"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

function statusVariant(status: string): "default" | "destructive" | "secondary" | "outline" {
  if (status === "completed") return "default"
  if (status === "failed") return "destructive"
  return "secondary"
}

function ModelBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium", color)}>
      {label}
    </span>
  )
}

type Generation = {
  id: string
  user_id: string
  image_url: string | null
  status: string
  category_preset: string
  lighting_preset: string
  image_model: string | null
  text_model: string | null
  platforms: string[] | null
  has_style_reference: boolean
  has_product_reference: boolean
  product_description: string | null
  created_at: string
}

function extractStoragePath(imageUrl: string): string | null {
  // URL format: https://<project>.supabase.co/storage/v1/object/public/generated-images/<user_id>/<filename>
  const match = imageUrl.match(/\/storage\/v1\/object\/public\/generated-images\/(.+)$/)
  return match ? match[1] : null
}

const PAGE_SIZE = 20

const IMAGE_MODEL_OPTIONS = [
  { value: "all", label: "All models" },
  { value: "dalle3", label: "DALL-E 3" },
  { value: "flux-schnell", label: "Flux Schnell" },
  { value: "flux-dev", label: "Flux Dev" },
  { value: "stability", label: "Stable Diffusion 3" },
  { value: "seedream", label: "Seedream" },
]

const PLATFORM_OPTIONS = [
  { value: "all", label: "All platforms" },
  { value: "pinterest", label: "Pinterest" },
  { value: "instagram", label: "Instagram" },
  { value: "blog", label: "Blog" },
]

const CATEGORY_OPTIONS = [
  { value: "all", label: "All niches" },
  ...Object.entries(NICHE_PRESETS).map(([key, preset]) => ({
    value: key,
    label: `${preset.emoji} ${preset.label}`,
  })),
]

function buildUrl(limit: number, offset: number, model: string, platform: string, category: string) {
  const params = new URLSearchParams()
  params.set("limit", String(limit))
  params.set("offset", String(offset))
  if (model !== "all") params.set("model", model)
  if (platform !== "all") params.set("platform", platform)
  if (category !== "all") params.set("category", category)
  return `/api/generations?${params.toString()}`
}

export default function HistoryPage() {
  const { toast } = useToast()
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filter state
  const [filterModel, setFilterModel] = useState("all")
  const [filterPlatform, setFilterPlatform] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")

  const hasActiveFilters = filterModel !== "all" || filterPlatform !== "all" || filterCategory !== "all"

  const loadInitial = useCallback(async (model: string, platform: string, category: string) => {
    setLoading(true)
    setPage(0)
    const res = await fetch(buildUrl(PAGE_SIZE, 0, model, platform, category))
    if (!res.ok) { setLoading(false); return }
    const json = await res.json()
    const items: Generation[] = json.generations ?? []
    setGenerations(items)
    setHasMore(items.length === PAGE_SIZE)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadInitial(filterModel, filterPlatform, filterCategory)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterModel, filterPlatform, filterCategory])

  async function loadMore() {
    setLoadingMore(true)
    const nextPage = page + 1
    const res = await fetch(buildUrl(PAGE_SIZE, nextPage * PAGE_SIZE, filterModel, filterPlatform, filterCategory))
    if (res.ok) {
      const json = await res.json()
      const items: Generation[] = json.generations ?? []
      setGenerations((prev) => [...prev, ...items])
      setPage(nextPage)
      setHasMore(items.length === PAGE_SIZE)
    }
    setLoadingMore(false)
  }

  function clearFilters() {
    setFilterModel("all")
    setFilterPlatform("all")
    setFilterCategory("all")
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/export")
      if (!res.ok) {
        toast({ title: "Nothing to export" })
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `flowgen-export-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: "Export failed", variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete(gen: Generation) {
    const confirmed = window.confirm("Delete this generation? This cannot be undone.")
    if (!confirmed) return

    setDeletingId(gen.id)

    try {
      // Optimistic update
      setGenerations((prev) => prev.filter((g) => g.id !== gen.id))

      // Delete storage file
      if (gen.image_url) {
        const path = extractStoragePath(gen.image_url)
        if (path) {
          const supabase = createClient()
          await supabase.storage.from("generated-images").remove([path])
        }
      }

      // Delete DB record
      const res = await fetch(`/api/generations?id=${gen.id}`, { method: "DELETE" })
      if (!res.ok) {
        // Roll back optimistic update on failure
        setGenerations((prev) => {
          const restored = [...prev, gen].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          return restored
        })
        console.error("Failed to delete generation")
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white">History</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900 dark:text-white">History</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {generations.length} generation{generations.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " (filtered)" : ""}
          </p>
        </div>
        {generations.length > 0 && (
          <button
            onClick={handleExport}
            disabled={loading || exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export ZIP
              </>
            )}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[160px]">
            <SelectValue placeholder="All models" />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_MODEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-auto min-w-[160px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-8 px-3 text-xs flex items-center gap-1.5 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {generations.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-white/[0.07] p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          {hasActiveFilters ? (
            <>
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No results for these filters</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                Try adjusting or clearing your filters to see more generations.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No generations yet</h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
                Head to the Generate tab and create your first AI lifestyle image.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="generations-grid">
          {generations.map((gen) => {
            const categoryLabel = NICHE_PRESETS[gen.category_preset]?.label ?? gen.category_preset
            const categoryEmoji = NICHE_PRESETS[gen.category_preset]?.emoji ?? "🎨"
            const lightingLabel = LIGHTING_PRESETS[gen.lighting_preset as LightingPreset]?.label ?? gen.lighting_preset
            const lightingEmoji = LIGHTING_PRESETS[gen.lighting_preset as LightingPreset]?.emoji ?? ""

            return (
              <div key={gen.id} className="group bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-white/[0.07] overflow-hidden hover:shadow-sm dark:hover:border-white/[0.12] transition-all">

                {/* Image thumbnail */}
                {gen.image_url ? (
                  <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <Image
                      src={gen.image_url}
                      alt={categoryLabel}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <Badge variant={statusVariant(gen.status)} className="text-[10px] px-1.5 py-0.5">
                        {gen.status}
                      </Badge>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(gen.image_url!)
                            const blob = await res.blob()
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement("a")
                            a.href = url
                            a.download = `ombryth-${gen.id.slice(0, 8)}.jpg`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          } catch { /* non-fatal */ }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md bg-white/80 hover:bg-blue-50 text-gray-400 hover:text-blue-500 backdrop-blur-sm"
                        title="Download image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(gen)}
                        disabled={deletingId === gen.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 backdrop-blur-sm disabled:opacity-50"
                        title="Delete generation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center border-b border-gray-100 dark:border-white/[0.07]">
                    <ImageIcon className="w-8 h-8 text-gray-200 dark:text-gray-600" />
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleDelete(gen)}
                        disabled={deletingId === gen.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-200 disabled:opacity-50"
                        title="Delete generation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="p-3 space-y-2.5">
                  {/* Category + date */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {categoryEmoji} {categoryLabel}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(gen.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        ·{" "}
                        {new Date(gen.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!gen.image_url && (
                      <Badge variant={statusVariant(gen.status)} className="text-[10px] px-1.5 py-0.5 shrink-0">
                        {gen.status}
                      </Badge>
                    )}
                  </div>

                  {/* Lighting + models */}
                  <div className="flex flex-wrap gap-1">
                    {lightingLabel && (
                      <ModelBadge label={`${lightingEmoji} ${lightingLabel}`} color="bg-amber-50 text-amber-700" />
                    )}
                    {gen.image_model && (
                      <ModelBadge label={gen.image_model} color="bg-purple-50 text-purple-700" />
                    )}
                    {gen.text_model && (
                      <ModelBadge label={gen.text_model} color="bg-green-50 text-green-700" />
                    )}
                  </div>

                  {/* Platforms */}
                  {Array.isArray(gen.platforms) && gen.platforms.length > 0 && (
                    <div className="flex gap-1">
                      {(gen.platforms as string[]).map((p) => (
                        <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium capitalize border border-indigo-100 dark:border-indigo-500/20">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reference flags */}
                  {(gen.has_style_reference || gen.has_product_reference) && (
                    <div className="flex gap-2 text-[11px] text-gray-400 pt-0.5">
                      {gen.has_style_reference && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                          Style ref
                        </span>
                      )}
                      {gen.has_product_reference && gen.product_description && (
                        <span className="flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                          <span className="truncate" title={gen.product_description}>
                            {gen.product_description}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {hasMore && !loadingMore && (
          <div className="flex justify-center pt-2">
            <button
              onClick={loadMore}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors"
            >
              Load more
            </button>
          </div>
        )}
        {loadingMore && (
          <div className="flex justify-center pt-2">
            <span className="text-sm text-gray-400">Loading…</span>
          </div>
        )}
        </>
      )}
    </div>
  )
}
