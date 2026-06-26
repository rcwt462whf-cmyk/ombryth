"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Save, X, FileText, Hash, Check, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StrategyNiche {
  id: string
  name: string
  color: string
  keywords: string[]
  notes: string
  created_at: string
}

type EditForm = {
  name: string
  color: string
  keywordInput: string
  keywords: string[]
  notes: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
]

const EMPTY_FORM: EditForm = {
  name: "",
  color: "#3b82f6",
  keywordInput: "",
  keywords: [],
  notes: "",
}

function dedupeStrings(arr: string[]): string[] {
  const seen: Record<string, boolean> = {}
  return arr.filter(item => {
    if (seen[item]) return false
    seen[item] = true
    return true
  })
}

function parseKeywords(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map(k => k.trim().replace(/^#/, ""))
    .filter(Boolean)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const { toast } = useToast()
  const [niches, setNiches] = useState<StrategyNiche[]>([])
  const [loading, setLoading] = useState(true)
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

  const totalKeywords = niches.reduce((sum, n) => sum + (n.keywords?.length ?? 0), 0)

  // ── Create ────────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!createForm.name.trim()) {
      toast({ variant: "destructive", title: "Name required" })
      return
    }
    setSaving(true)
    const allKeywords = dedupeStrings([
      ...createForm.keywords,
      ...parseKeywords(createForm.keywordInput),
    ])

    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          color: createForm.color,
          keywords: allKeywords,
          notes: createForm.notes.trim(),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setNiches(prev => [...prev, d.niche])
      setCreateForm({ ...EMPTY_FORM })
      setShowCreate(false)
      toast({ title: "Saved", description: `"${d.niche.name}" added.` })
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
    const allKeywords = dedupeStrings([
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
          color: form.color,
          keywords: allKeywords,
          notes: form.notes.trim(),
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      setNiches(prev => prev.map(n =>
        n.id === id ? { ...n, name: form.name.trim(), color: form.color, keywords: allKeywords, notes: form.notes.trim() } : n
      ))
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
        color: niche.color || "#3b82f6",
        keywordInput: "",
        keywords: [...(niche.keywords ?? [])],
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
      keywords: dedupeStrings([...f.keywords, ...kws]),
      keywordInput: ""
    }))
  }

  function addKeywordsToEdit(id: string) {
    const kws = parseKeywords(editForms[id]?.keywordInput ?? "")
    if (!kws.length) return
    setEditForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        keywords: dedupeStrings([...prev[id].keywords, ...kws]),
        keywordInput: ""
      }
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
    <div className="max-w-[1100px] mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-[#171717] dark:text-[#f2f2f2]">
            Keyword Strategy
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Store your PinClicks research — inject keywords into any generation
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setExpandedId(null) }}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5fe6c4] hover:bg-[#4ad6b4] text-[#0b3b30] text-sm font-bold transition-all shadow-lg shadow-black/10 hover:-translate-y-px active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> New set
        </button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      {niches.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-slate-500">
          {niches.length} keyword set{niches.length !== 1 ? "s" : ""} · {totalKeywords} keywords total
        </p>
      )}

      {/* ── Create form ──────────────────────────────────────────────────── */}
      {showCreate && (
        <NicheForm
          form={createForm}
          isCreate
          saving={saving}
          onUpdateText={updateCreate}
          onAddKeywords={addKeywordsToCreate}
          onRemoveKeyword={kw => setCreateForm(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }))}
          onSave={handleCreate}
          onCancel={() => { setShowCreate(false); setCreateForm({ ...EMPTY_FORM }) }}
        />
      )}

      {/* ── Cards grid ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-5 h-5 animate-spin text-[#0b3b30] dark:text-[#5fe6c4]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : niches.length === 0 && !showCreate ? (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#eafbf4] dark:bg-[#5fe6c4]/10 border border-[#bdebd9] dark:border-[#5fe6c4]/20 flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6 text-[#0b3b30] dark:text-[#5fe6c4]" />
          </div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No keyword sets yet</h3>
          <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto leading-relaxed">
            Create a keyword set, paste your PinClicks research, and inject them into any generation with one click.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl bg-[#5fe6c4] hover:bg-[#4ad6b4] text-[#0b3b30] text-xs font-bold transition-colors shadow-md shadow-black/10"
          >
            + New set
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {niches.map(niche => (
            <div key={niche.id}>
              {expandedId === niche.id && editForms[niche.id] ? (
                <NicheForm
                  form={editForms[niche.id]}
                  saving={saving}
                  onUpdateText={(key, val) => updateEdit(niche.id, key, val)}
                  onAddKeywords={() => addKeywordsToEdit(niche.id)}
                  onRemoveKeyword={kw => setEditForms(prev => ({
                    ...prev,
                    [niche.id]: { ...prev[niche.id], keywords: prev[niche.id].keywords.filter(k => k !== kw) }
                  }))}
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

      {/* ── How-to tip ───────────────────────────────────────────────────── */}
      {niches.length > 0 && (
        <p className="text-[11px] text-gray-400 dark:text-slate-600 text-center pb-2">
          Pick a keyword set in Generate → inject into caption prompt in one click
        </p>
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
  const preview = keywords.slice(0, 6)
  const overflow = keywords.length - preview.length

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border overflow-hidden hover:shadow-sm transition-shadow group">
      <div className="h-[3px]" style={{ background: niche.color }} />
      <div className="p-4">

        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <h3 className="flex-1 text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
            {niche.name}
          </h3>
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

        {/* Keywords */}
        <div className="flex items-center gap-1.5 mb-2">
          <Hash className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
            {keywords.length} keyword{keywords.length !== 1 ? "s" : ""}
          </span>
        </div>

        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {preview.map(kw => (
              <span key={kw} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#eafbf4] dark:bg-[#5fe6c4]/10 text-[#0b3b30] dark:text-[#5fe6c4] dark:text-[#5fe6c4]">
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
          <p className="text-[10px] text-gray-300 dark:text-slate-700 italic">No keywords — edit to add</p>
        )}

        {/* Notes preview */}
        {niche.notes && (
          <p className="mt-3 pt-2.5 border-t border-gray-50 dark:border-white/[0.04] text-[10px] text-gray-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
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
    <div className="bg-white dark:bg-card rounded-xl border border-[#5fe6c4]/50 dark:border-[#5fe6c4]/30 overflow-hidden shadow-sm">
      <div className="h-[3px]" style={{ background: form.color }} />
      <div className="p-4 space-y-4">

        <p className="text-[10px] font-bold text-[#0b3b30] dark:text-[#5fe6c4] dark:text-[#5fe6c4] uppercase tracking-widest">
          {isCreate ? "New keyword set" : "Editing"}
        </p>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => onUpdateText("name", e.target.value)}
            placeholder="e.g. Scandinavian Bedroom"
            autoFocus={isCreate}
            className="w-full bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-[#5fe6c4] dark:focus:border-[#5fe6c4]/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600"
          />
        </div>

        {/* Colour */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Colour
          </label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                onClick={() => onUpdateText("color", c)}
                className="w-6 h-6 rounded-full relative transition-transform hover:scale-110 shrink-0"
                style={{ background: c }}
                aria-label={`Color ${c}`}
              >
                {form.color === c && (
                  <Check className="absolute inset-0 m-auto w-3.5 h-3.5 text-white drop-shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Keywords
          </label>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            Paste from PinClicks — comma or line-separated — then hit +
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
              placeholder={"minimalist bedroom decor\nscandinavian interior ideas\ncozy bedroom aesthetic\nboho room inspo"}
              rows={4}
              className="flex-1 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[#5fe6c4] dark:focus:border-[#5fe6c4]/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600 resize-none font-mono"
            />
            <button
              onClick={onAddKeywords}
              disabled={!form.keywordInput.trim()}
              title="Add (⌘+Enter)"
              className="self-start p-2.5 rounded-xl bg-[#eafbf4] dark:bg-[#5fe6c4]/10 border border-[#5fe6c4]/50 dark:border-[#5fe6c4]/20 text-[#0b3b30] dark:text-[#5fe6c4] dark:text-[#5fe6c4] hover:bg-blue-100 dark:hover:bg-[#5fe6c4]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {form.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {form.keywords.map(kw => (
                <span
                  key={kw}
                  className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10px] font-medium bg-[#eafbf4] dark:bg-[#5fe6c4]/10 text-[#0b3b30] dark:text-[#5fe6c4] dark:text-[#5fe6c4] border border-[#bdebd9] dark:border-[#5fe6c4]/20"
                >
                  #{kw}
                  <button
                    onClick={() => onRemoveKeyword(kw)}
                    className="hover:text-red-500 transition-colors"
                    aria-label={`Remove ${kw}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            {form.keywords.length} keyword{form.keywords.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3" /> Notes
          </label>
          <textarea
            value={form.notes}
            onChange={e => onUpdateText("notes", e.target.value)}
            placeholder="Content ideas, visual style, seasonal focus, target audience..."
            rows={3}
            className="w-full bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[#5fe6c4] dark:focus:border-[#5fe6c4]/50 transition-colors placeholder:text-gray-300 dark:placeholder:text-slate-600 resize-none leading-relaxed"
          />
        </div>

        {/* Actions */}
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#5fe6c4] hover:bg-[#4ad6b4] text-[#0b3b30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-black/10"
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
