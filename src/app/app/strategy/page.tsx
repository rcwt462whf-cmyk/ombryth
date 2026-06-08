"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Save, X, Clock, Calendar, FileText, Hash, Check, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StrategyNiche {
  id: string
  name: string
  brand: string
  color: string
  keywords: string[]
  posting_times: string
  posting_frequency: string
  notes: string
  created_at: string
}

type EditForm = {
  name: string
  brand: string
  color: string
  keywordInput: string
  keywords: string[]
  posting_times: string
  posting_frequency: string
  notes: string
}

type BrandFilter = "all" | "general" | "avinovo"

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND_OPTIONS = [
  { value: "general", label: "General" },
  { value: "avinovo", label: "Avinovo" },
]

const COLOR_OPTIONS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
]

const EMPTY_FORM: EditForm = {
  name: "",
  brand: "general",
  color: "#3b82f6",
  keywordInput: "",
  keywords: [],
  posting_times: "",
  posting_frequency: "",
  notes: "",
}

function brandStyle(brand: string) {
  if (brand === "avinovo") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
  return "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20"
}

function dedupe(arr: string[]): string[] {
  const seen: Record<string, boolean> = {}
  return arr.filter(item => {
    if (seen[item]) return false
    seen[item] = true
    return true
  })
}

function parseKeywords(input: string): string[] {
  return input.split(/[,\n]/).map(k => k.trim().replace(/^#/, "")).filter(Boolean)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const { toast } = useToast()
  const [niches, setNiches] = useState<StrategyNiche[]>([])
  const [loading, setLoading] = useState(true)
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<EditForm>({ ...EMPTY_FORM })
  const [editForms, setEditForms] = useState<Record<string, EditForm>>({})

  useEffect(() => {
    fetch("/api/strategy")
      .then(r => r.json())
      .then(d => { setNiches(d.niches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filteredNiches = brandFilter === "all"
    ? niches
    : niches.filter(n => n.brand === brandFilter)

  const totalKeywords = niches.reduce((sum, n) => sum + (n.keywords?.length ?? 0), 0)

  const brandCounts = {
    all: niches.length,
    general: niches.filter(n => n.brand === "general").length,
    avinovo: niches.filter(n => n.brand === "avinovo").length,
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!createForm.name.trim()) {
      toast({ variant: "destructive", title: "Name required" })
      return
    }
    setSaving(true)
    const allKeywords = dedupe([
      ...createForm.keywords,
      ...parseKeywords(createForm.keywordInput),
    ])

    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          brand: createForm.brand,
          color: createForm.color,
          keywords: allKeywords,
          posting_times: createForm.posting_times.trim(),
          posting_frequency: createForm.posting_frequency.trim(),
          notes: createForm.notes.trim(),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setNiches(prev => [...prev, d.niche])
      setCreateForm({ ...EMPTY_FORM })
      setShowCreate(false)
      toast({ title: "Niche created", description: `"${d.niche.name}" added to your strategy.` })
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to create", description: String(err) })
    } finally {
      setSaving(false)
    }
  }

  // ── Save edit ─────────────────────────────────────────────────────────────

  async function handleSave(id: string) {
    const form = editForms[id]
    if (!form?.name.trim()) return
    setSaving(true)
    const allKeywords = dedupe([
      ...form.keywords,
      ...parseKeywords(form.keywordInput),
    ])

    try {
      const res = await fetch("/api/strategy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: form.name.trim(),
          brand: form.brand,
          color: form.color,
          keywords: allKeywords,
          posting_times: form.posting_times.trim(),
          posting_frequency: form.posting_frequency.trim(),
          notes: form.notes.trim(),
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setNiches(prev => prev.map(n => n.id === id ? { ...n, ...form, keywords: allKeywords } : n))
      setExpandedId(null)
      toast({ title: "Saved" })
    } catch {
      toast({ variant: "destructive", title: "Save failed", description: "Please try again." })
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await fetch(`/api/strategy?id=${id}`, { method: "DELETE" })
      setNiches(prev => prev.filter(n => n.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch {
      toast({ variant: "destructive", title: "Delete failed" })
    } finally {
      setDeleting(null)
    }
  }

  // ── Expand / edit ─────────────────────────────────────────────────────────

  function toggleExpand(niche: StrategyNiche) {
    if (expandedId === niche.id) {
      setExpandedId(null)
      return
    }
    setEditForms(prev => ({
      ...prev,
      [niche.id]: {
        name: niche.name,
        brand: niche.brand || "general",
        color: niche.color || "#3b82f6",
        keywordInput: "",
        keywords: [...(niche.keywords ?? [])],
        posting_times: niche.posting_times ?? "",
        posting_frequency: niche.posting_frequency ?? "",
        notes: niche.notes ?? "",
      }
    }))
    setExpandedId(niche.id)
  }

  // ── Keyword helpers ───────────────────────────────────────────────────────

  function addKeywordsToCreate() {
    const kws = parseKeywords(createForm.keywordInput)
    if (!kws.length) return
    setCreateForm(f => ({
      ...f,
      keywords: dedupe([...f.keywords, ...kws]),
      keywordInput: ""
    }))
  }

  function addKeywordsToEdit(id: string) {
    const input = editForms[id]?.keywordInput ?? ""
    const kws = parseKeywords(input)
    if (!kws.length) return
    setEditForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        keywords: dedupe([...prev[id].keywords, ...kws]),
        keywordInput: ""
      }
    }))
  }

  function removeCreateKeyword(kw: string) {
    setCreateForm(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }))
  }

  function removeEditKeyword(id: string, kw: string) {
    setEditForms(prev => ({
      ...prev,
      [id]: { ...prev[id], keywords: prev[id].keywords.filter(k => k !== kw) }
    }))
  }

  function updateCreate(key: keyof EditForm, val: string) {
    setCreateForm(f => ({ ...f, [key]: val }))
  }

  function updateEdit(id: string, key: keyof EditForm, val: string) {
    setEditForms(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-blue-600 bg-clip-text text-transparent dark:from-white dark:via-blue-300 dark:to-blue-500">
            Pinterest Strategy
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your PinClicks research — keywords, schedules and content plans per niche
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setExpandedId(null) }}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-px active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> New niche
        </button>
      </div>

      {/* ── Brand filters + stats ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5">
          {(["all", "general", "avinovo"] as BrandFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setBrandFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                brandFilter === f
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400"
                  : "border-gray-100 dark:border-border text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-200 dark:hover:border-border/80"
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 opacity-50 font-normal">{brandCounts[f]}</span>
            </button>
          ))}
        </div>
        {niches.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-slate-500">
            {niches.length} niche{niches.length !== 1 ? "s" : ""} · {totalKeywords} keywords total
          </p>
        )}
      </div>

      {/* ── Create form ──────────────────────────────────────────────────── */}
      {showCreate && (
        <NicheForm
          form={createForm}
          isCreate
          saving={saving}
          onUpdateText={updateCreate}
          onAddKeywords={addKeywordsToCreate}
          onRemoveKeyword={removeCreateKeyword}
          onSave={handleCreate}
          onCancel={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }) }}
        />
      )}

      {/* ── Cards grid ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filteredNiches.length === 0 && !showCreate ? (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No niches yet</h3>
          <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
            {brandFilter !== "all"
              ? `No ${brandFilter} niches found — switch to "All" or create one.`
              : "Add a Pinterest niche and paste your PinClicks keywords to start building your strategy."}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-md shadow-blue-600/20"
          >
            + New niche
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredNiches.map(niche => (
            <div key={niche.id}>
              {expandedId === niche.id && editForms[niche.id] ? (
                <NicheForm
                  form={editForms[niche.id]}
                  saving={saving}
                  onUpdateText={(key, val) => updateEdit(niche.id, key, val)}
                  onAddKeywords={() => addKeywordsToEdit(niche.id)}
                  onRemoveKeyword={(kw) => removeEditKeyword(niche.id, kw)}
                  onSave={() => handleSave(niche.id)}
                  onCancel={() => setExpandedId(null)}
                  onDelete={() => handleDelete(niche.id, niche.name)}
                  isDeleting={deleting === niche.id}
                />
              ) : (
                <NicheCard
                  niche={niche}
                  onEdit={() => toggleExpand(niche)}
                  onDelete={() => handleDelete(niche.id, niche.name)}
                  isDeleting={deleting === niche.id}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PinClicks help tip ───────────────────────────────────────────── */}
      {niches.length > 0 && (
        <div className="flex items-start gap-3 bg-blue-50/60 dark:bg-blue-500/[0.06] border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3">
          <div className="w-5 h-5 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Hash className="w-3 h-3 text-blue-500" />
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            <strong>How to use PinClicks:</strong> Search your niche on PinClicks → copy the high-volume keywords →
            paste them in bulk here. Then go to <strong>Generate</strong> and pick this niche to inject your keywords into captions automatically.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── NicheCard ────────────────────────────────────────────────────────────────

function NicheCard({ niche, onEdit, onDelete, isDeleting }: {
  niche: StrategyNiche
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const keywords = niche.keywords ?? []
  const preview = keywords.slice(0, 5)
  const overflow = keywords.length - preview.length

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border overflow-hidden hover:shadow-sm transition-shadow group">
      {/* Color bar */}
      <div className="h-[3px]" style={{ background: niche.color }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1.5 truncate">
              {niche.name}
            </h3>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full border inline-block",
              brandStyle(niche.brand)
            )}>
              {niche.brand === "avinovo" ? "Avinovo" : "General"}
            </span>
          </div>
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 dark:border-border text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Keywords section */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Hash className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
              {keywords.length} keyword{keywords.length !== 1 ? "s" : ""}
            </span>
          </div>
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {preview.map(kw => (
                <span key={kw} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                  #{kw}
                </span>
              ))}
              {overflow > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-50 dark:bg-white/[0.04] text-gray-400 dark:text-slate-500">
                  +{overflow} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-gray-300 dark:text-slate-700 italic">
              No keywords yet — click Edit to add PinClicks research
            </p>
          )}
        </div>

        {/* Schedule */}
        {(niche.posting_times || niche.posting_frequency) && (
          <div className="flex flex-wrap gap-3 pt-2.5 border-t border-gray-50 dark:border-white/[0.04]">
            {niche.posting_times && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-500">
                <Clock className="w-3 h-3" />
                {niche.posting_times}
              </div>
            )}
            {niche.posting_frequency && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-500">
                <Calendar className="w-3 h-3" />
                {niche.posting_frequency}
              </div>
            )}
          </div>
        )}

        {/* Notes preview */}
        {niche.notes && (
          <p className="mt-2.5 text-[10px] text-gray-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
            {niche.notes}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── NicheForm ────────────────────────────────────────────────────────────────

function NicheForm({ form, isCreate, saving, onUpdateText, onAddKeywords, onRemoveKeyword, onSave, onCancel, onDelete, isDeleting }: {
  form: EditForm
  isCreate?: boolean
  saving: boolean
  onUpdateText: (key: keyof EditForm, val: string) => void
  onAddKeywords: () => void
  onRemoveKeyword: (kw: string) => void
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
  isDeleting?: boolean
}) {
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-blue-200 dark:border-blue-500/30 overflow-hidden shadow-sm">
      {/* Color bar */}
      <div className="h-[3px]" style={{ background: form.color }} />

      <div className="p-4 space-y-4">
        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
          {isCreate ? "New niche" : "Editing"}
        </p>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Niche name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => onUpdateText("name", e.target.value)}
            placeholder="e.g. Scandinavian Bedroom"
            autoFocus={isCreate}
            className="w-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600"
          />
        </div>

        {/* Brand + Colour row */}
        <div className="flex items-start gap-4">
          {/* Brand */}
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Brand
            </label>
            <div className="flex gap-1.5">
              {BRAND_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateText("brand", opt.value)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    form.brand === opt.value
                      ? opt.value === "avinovo"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400"
                      : "border-gray-100 dark:border-border text-gray-500 dark:text-slate-500 hover:border-gray-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colour picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Colour
            </label>
            <div className="flex gap-1.5 flex-wrap max-w-[120px]">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => onUpdateText("color", c)}
                  className="w-5 h-5 rounded-full relative transition-transform hover:scale-110"
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                >
                  {form.color === c && (
                    <Check className="absolute inset-0 m-auto w-3 h-3 text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            PinClicks Keywords
          </label>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed">
            Paste from PinClicks — comma or line-separated. Press ⌘↵ or click + to add.
          </p>
          <div className="flex gap-2">
            <textarea
              value={form.keywordInput}
              onChange={e => onUpdateText("keywordInput", e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  onAddKeywords()
                }
              }}
              placeholder={`minimalist bedroom decor\nscandinavian interior ideas\ncozy bedroom aesthetic\nboho room inspo`}
              rows={4}
              className="flex-1 bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600 resize-none font-mono"
            />
            <button
              onClick={onAddKeywords}
              disabled={!form.keywordInput.trim()}
              title="Add keywords (⌘+Enter)"
              className="self-start p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Keyword chips */}
          {form.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1 -m-1">
              {form.keywords.map(kw => (
                <span
                  key={kw}
                  className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
                >
                  #{kw}
                  <button
                    onClick={() => onRemoveKeyword(kw)}
                    className="hover:text-red-500 transition-colors rounded-full"
                    aria-label={`Remove ${kw}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {form.keywords.length === 0 && !form.keywordInput && (
            <p className="text-[10px] text-gray-300 dark:text-slate-700 italic">
              {form.keywords.length} keywords added
            </p>
          )}
          {form.keywords.length > 0 && (
            <p className="text-[10px] text-gray-400 dark:text-slate-500">
              {form.keywords.length} keyword{form.keywords.length !== 1 ? "s" : ""} saved
            </p>
          )}
        </div>

        {/* Posting schedule */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Post times
            </label>
            <input
              type="text"
              value={form.posting_times}
              onChange={e => onUpdateText("posting_times", e.target.value)}
              placeholder="8am, 2pm, 8pm EST"
              className="w-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Frequency
            </label>
            <input
              type="text"
              value={form.posting_frequency}
              onChange={e => onUpdateText("posting_frequency", e.target.value)}
              placeholder="5 pins/day"
              className="w-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3" /> Notes
          </label>
          <textarea
            value={form.notes}
            onChange={e => onUpdateText("notes", e.target.value)}
            placeholder="Content ideas, seasonal focus, competitor notes, visual style guide, target audience..."
            rows={3}
            className="w-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600 resize-none leading-relaxed"
          />
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-white/[0.04]">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-100 dark:hover:border-red-500/20 transition-all disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3" />
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-600/20"
            >
              <Save className="w-3 h-3" />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
