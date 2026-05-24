"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  Eye, EyeOff, Save, Check, Trash2, Key, Sliders,
  User, Sun, Moon, Monitor, Plus, BookMarked, Lock, CreditCard, Bot, AlertTriangle, BarChart2, Layers, X,
} from "lucide-react"
import { ReferralCard } from "@/components/ReferralCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { ImageModel, TextModel, LightingPreset, Language } from "@/types"
import { NICHE_PRESETS, LIGHTING_PRESETS } from "@/lib/presets"
import { cn } from "@/lib/utils"

// ─── API Keys ─────────────────────────────────────────────────────────────────

const API_KEY_FIELDS = [
  {
    provider: "openai",
    label: "OpenAI",
    description: "DALL-E 3, GPT-4o text, vision analysis (product + style). Required for most features.",
    placeholder: "sk-…",
    color: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950",
  },
  {
    provider: "anthropic",
    label: "Anthropic",
    description: "Claude Sonnet text generation",
    placeholder: "sk-ant-…",
    color: "text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-950",
  },
  {
    provider: "gemini",
    label: "Google Gemini",
    description: "Gemini 1.5 Flash text generation",
    placeholder: "AIza…",
    color: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  },
  {
    provider: "replicate",
    label: "Replicate",
    description: "Flux Schnell and Flux Dev image generation",
    placeholder: "r8_…",
    color: "text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
  },
  {
    provider: "stability",
    label: "Stability AI",
    description: "Stable Diffusion 3 — supports native img2img with style reference",
    placeholder: "sk-…",
    color: "text-pink-700 bg-pink-50 dark:text-pink-400 dark:bg-pink-950",
  },
  {
    provider: "byteplus",
    label: "BytePlus (Seedream)",
    description: "Seedream image generation via VolcEngine",
    placeholder: "Your BytePlus API key",
    color: "text-teal-700 bg-teal-50 dark:text-teal-400 dark:bg-teal-950",
  },
] as const

type Provider = typeof API_KEY_FIELDS[number]["provider"]

function ApiKeyRow({
  provider, label, description, placeholder, color, isSaved, onSave, onDelete,
}: {
  provider: Provider; label: string; description: string; placeholder: string
  color: string; isSaved: boolean
  onSave: (p: string, k: string) => Promise<void>
  onDelete: (p: string) => Promise<void>
}) {
  const { toast } = useToast()
  const [value, setValue] = useState("")
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) return

    // Validate key before saving
    setValidating(true)
    try {
      const res = await fetch("/api/keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: trimmed }),
      })
      const data = await res.json()
      if (!data.valid) {
        toast({
          variant: "destructive",
          title: "Invalid key",
          description: data.error ?? "The key could not be validated.",
        })
        return
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Invalid key",
        description: "Could not reach provider",
      })
      return
    } finally {
      setValidating(false)
    }

    // Proceed with saving
    setSaving(true)
    try {
      await onSave(provider, trimmed)
      setValue("")
    } finally {
      setSaving(false)
    }
  }

  const isBusy = validating || saving

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md", color)}>{label}</span>
          {isSaved && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
        {isSaved && (
          <button
            onClick={async () => { setDeleting(true); try { await onDelete(provider) } finally { setDeleting(false) } }}
            disabled={deleting}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            placeholder={isSaved ? "••••••••••••••••" : placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="pr-9 text-sm font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim() && !isBusy) {
                handleSave()
              }
            }}
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <Button
          onClick={handleSave}
          disabled={!value.trim() || isBusy}
          size="sm" className="h-9 gap-1.5 shrink-0"
        >
          {isBusy
            ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            : <Save className="w-3.5 h-3.5" />}
          {validating ? "Validating…" : (isSaved ? "Update" : "Save")}
        </Button>
      </div>
      {!isSaved && (
        <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
          <Check className="w-3 h-3" /> Key is validated before saving
        </p>
      )}
    </div>
  )
}

// ─── Saved prompts ─────────────────────────────────────────────────────────────

interface SavedPrompt {
  id: string
  name: string
  prompt: string
  created_at: string
}

const DEFAULT_SYSTEM_PERSONA =
  "You are a social media content expert specialising in affiliate marketing for interior, home decor, and lifestyle brands. Your mission is to craft captions, hashtags, and descriptions that feel authentic and aspirational, drive traffic, and convert browsers into buyers. Always focus on benefits and lifestyle over product features. Include a clear call-to-action where appropriate."

function SystemPromptCard() {
  const { toast } = useToast()
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/user/defaults")
      .then(r => r.json())
      .then(d => {
        const saved = d.defaults?.custom_system_prompt
        setValue(saved ?? DEFAULT_SYSTEM_PERSONA)
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/user/defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customSystemPrompt: value }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "AI persona saved", description: "Applied to all future generations." })
    } catch {
      toast({ variant: "destructive", title: "Failed to save" })
    } finally {
      setSaving(false)
    }
  }

  async function reset() {
    setValue(DEFAULT_SYSTEM_PERSONA)
    setSaving(true)
    try {
      await fetch("/api/user/defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customSystemPrompt: DEFAULT_SYSTEM_PERSONA }),
      })
      toast({ title: "Reset to default" })
    } catch {
      toast({ variant: "destructive", title: "Failed to reset" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" /> AI Persona
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            This instruction is sent to GPT-4o, Claude, and Gemini before every caption generation. Customise it to match your brand voice and goals.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="h-[120px] bg-muted animate-pulse rounded-lg" />
      ) : (
        <>
          <div className="space-y-1.5">
            <Textarea
              value={value}
              onChange={e => setValue(e.target.value.slice(0, 1000))}
              className="text-sm resize-none leading-relaxed"
              rows={6}
              placeholder="You are a marketing expert for an affiliate business…"
            />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                Tip: describe the persona, tone, and goal. The platform-specific instructions are always added on top of this.
              </p>
              <p className={cn(
                "text-[11px] shrink-0 ml-2",
                value.length >= 950 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {value.length}/1000
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !value.trim()} size="sm" className="gap-2">
              {saving
                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                : <Save className="w-3.5 h-3.5" />}
              Save persona
            </Button>
            <Button onClick={reset} disabled={saving} size="sm" variant="outline" className="gap-2 text-muted-foreground">
              Reset to default
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function PromptsTab() {
  const { toast } = useToast()
  const [prompts, setPrompts] = useState<SavedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [newPrompt, setNewPrompt] = useState("")
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/prompts")
      .then(r => r.json())
      .then(d => setPrompts(d.prompts ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function addPrompt() {
    if (!newName.trim() || !newPrompt.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), prompt: newPrompt.trim() }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPrompts(prev => [data.prompt, ...prev])
      setNewName("")
      setNewPrompt("")
      toast({ title: "Prompt saved" })
    } catch {
      toast({ variant: "destructive", title: "Failed to save prompt" })
    } finally {
      setSaving(false)
    }
  }

  async function deletePrompt(id: string) {
    const res = await fetch(`/api/prompts?id=${id}`, { method: "DELETE" })
    if (!res.ok) { toast({ variant: "destructive", title: "Failed to delete" }); return }
    setPrompts(prev => prev.filter(p => p.id !== id))
    toast({ title: "Prompt removed" })
  }

  return (
    <div className="space-y-6">
      {/* AI Persona / custom system prompt */}
      <SystemPromptCard />

      {/* Add new */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-muted-foreground" /> Save a new prompt
        </h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              placeholder="e.g. Cosy morning bathroom"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Prompt text</Label>
            <Textarea
              placeholder="Film photo of a real bathroom, warm morning light, steam from a hot bath, white towels, candles…"
              value={newPrompt}
              onChange={e => setNewPrompt(e.target.value)}
              className="text-sm resize-none"
              rows={4}
            />
            <p className="text-[11px] text-muted-foreground text-right">{newPrompt.length}/2000</p>
          </div>
          <Button
            onClick={addPrompt}
            disabled={!newName.trim() || !newPrompt.trim() || saving}
            size="sm" className="gap-2"
          >
            {saving
              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <Save className="w-3.5 h-3.5" />}
            Save prompt
          </Button>
        </div>
      </div>

      {/* Saved list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Saved prompts <Badge variant="secondary" className="ml-2 text-xs">{prompts.length}</Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Load these from the Generate page via the prompt dropdown.
          </p>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center">
            <svg className="w-5 h-5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : prompts.length === 0 ? (
          <div className="p-10 text-center">
            <BookMarked className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No saved prompts yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {prompts.map(p => (
              <div key={p.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    className="flex-1 text-left"
                  >
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </button>
                  <button
                    onClick={() => deletePrompt(p.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {expanded === p.id && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.prompt}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Appearance tab ────────────────────────────────────────────────────────────

function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const themes = [
    { value: "light", label: "Light", icon: Sun, description: "Clean white interface" },
    { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
    { value: "system", label: "System", icon: Monitor, description: "Follows your OS setting" },
  ] as const

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ value, label, icon: Icon, description }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                mounted && theme === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30 bg-card"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                mounted && theme === value ? "bg-primary/10" : "bg-muted"
              )}>
                <Icon className={cn("w-5 h-5", mounted && theme === value ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
              </div>
              {mounted && theme === value && (
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Account tab ───────────────────────────────────────────────────────────────

function AccountTab() {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [subStatus, setSubStatus] = useState("free")
  const [freeUsed, setFreeUsed] = useState(0)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  const [usageLoading, setUsageLoading] = useState(true)
  const [generationsCount, setGenerationsCount] = useState<number | null>(null)
  const [savedPromptsCount, setSavedPromptsCount] = useState<number | null>(null)
  const [apiKeysCount, setApiKeysCount] = useState<number | null>(null)

  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralFreeMonths, setReferralFreeMonths] = useState(0)
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? "")

      const [usersResult, generationsResult, promptsResult, keysResult] = await Promise.all([
        supabase
          .from("users")
          .select("subscription_status, free_generations_used, referral_code, referral_free_months")
          .eq("id", user.id)
          .single(),
        supabase
          .from("generations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("saved_prompts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("api_keys")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ])

      if (usersResult.data) {
        setSubStatus(usersResult.data.subscription_status ?? "free")
        setFreeUsed(usersResult.data.free_generations_used ?? 0)
        setReferralFreeMonths(usersResult.data.referral_free_months ?? 0)

        // Ensure referral code — generate one via API if missing
        let code = usersResult.data.referral_code as string | null
        if (!code) {
          try {
            const res = await fetch("/api/user/referral-code", { method: "POST" })
            if (res.ok) {
              const d = await res.json() as { referral_code: string }
              code = d.referral_code
            }
          } catch {
            // Best effort
          }
        }
        setReferralCode(code)

        // Fetch how many users were referred
        if (code) {
          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("referred_by", code)
          setReferralCount(count ?? 0)
        }
      }

      setGenerationsCount(generationsResult.count ?? 0)
      setSavedPromptsCount(promptsResult.count ?? 0)
      setApiKeysCount(keysResult.count ?? 0)
      setUsageLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" })
      return
    }
    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Password must be at least 8 characters" })
      return
    }
    setChangingPassword(true)
    try {
      // Re-authenticate first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (signInError) {
        toast({ variant: "destructive", title: "Current password is incorrect" })
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast({ title: "Password changed", description: "Your password has been updated." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast({ variant: "destructive", title: "Failed to change password" })
    } finally {
      setChangingPassword(false)
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch("/api/user/delete", { method: "POST" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to delete account")
      }
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete account",
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeleting(false)
    }
  }

  const isPro = subStatus === "active"

  return (
    <div className="space-y-6">
      {/* Account info */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" /> Account
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="text-sm text-foreground mt-0.5 font-medium">{email || "—"}</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-muted-foreground">Plan</Label>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={isPro ? "default" : "secondary"}>{isPro ? "Pro" : "Free"}</Badge>
                {!isPro && (
                  <span className="text-xs text-muted-foreground">{freeUsed}/10 generations used</span>
                )}
                {isPro && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Unlimited generations</span>
                )}
              </div>
            </div>
            <a
              href="/app/billing"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:opacity-80 font-medium transition-opacity"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {isPro ? "Manage subscription" : "Upgrade to Pro"}
            </a>
          </div>
        </div>
      </div>

      {/* Usage overview */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-muted-foreground" /> Usage overview
        </h3>
        {usageLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3.5 w-36 bg-muted animate-pulse rounded" />
                <div className="h-3.5 w-8 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { label: "Total generations", value: generationsCount ?? 0 },
              { label: "Images generated", value: generationsCount ?? 0 },
              { label: "Saved prompts", value: savedPromptsCount ?? 0 },
              {
                label: "API keys saved",
                value: `${apiKeysCount ?? 0} / ${API_KEY_FIELDS.length}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referral Program */}
      {referralCode && (
        <ReferralCard
          referralCode={referralCode}
          freeMonths={referralFreeMonths}
          referralCount={referralCount}
        />
      )}

      {/* Change password */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" /> Change password
        </h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Current password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="pr-9"
              />
              <button type="button" onClick={() => setShowCurrent(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">New password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="pr-9"
              />
              <button type="button" onClick={() => setShowNew(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Confirm new password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords don&apos;t match</p>
            )}
          </div>
          <Button
            onClick={changePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword || changingPassword}
            size="sm" className="gap-2"
          >
            {changingPassword
              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <Lock className="w-3.5 h-3.5" />}
            Update password
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-red-50/30 dark:bg-red-950/10 dark:border-red-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" /> Danger Zone
        </h3>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Delete account</p>
          <p className="text-xs text-muted-foreground">
            Permanently delete your account, all generated images, API keys, and saved prompts. This cannot be undone.
          </p>
        </div>
        {!showDeleteConfirm ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete my account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Are you absolutely sure?</p>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm</label>
              <Input
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="text-sm font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteConfirmText !== "DELETE" || deleting}
                onClick={deleteAccount}
                className="gap-1.5"
              >
                {deleting
                  ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <Trash2 className="w-3.5 h-3.5" />}
                Delete my account permanently
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText("") }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Defaults tab ──────────────────────────────────────────────────────────────

const IMAGE_MODELS: { value: ImageModel; label: string }[] = [
  { value: "dalle3", label: "DALL-E 3" },
  { value: "flux-schnell", label: "Flux Schnell" },
  { value: "flux-dev", label: "Flux Dev" },
  { value: "stability", label: "Stable Diffusion 3" },
  { value: "seedream", label: "Seedream" },
]

const TEXT_MODELS: { value: TextModel; label: string }[] = [
  { value: "gpt4o", label: "GPT-4o" },
  { value: "claude", label: "Claude Sonnet" },
  { value: "gemini", label: "Gemini 1.5 Flash" },
]

const NICHE_KEYS = Object.keys(NICHE_PRESETS)
const LIGHTING_KEYS = Object.keys(LIGHTING_PRESETS) as LightingPreset[]

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: "en",    label: "English",             flag: "🇬🇧" },
  { value: "es",    label: "Spanish",             flag: "🇪🇸" },
  { value: "pt-BR", label: "Portuguese (Brazil)", flag: "🇧🇷" },
  { value: "fr",    label: "French",              flag: "🇫🇷" },
  { value: "de",    label: "German",              flag: "🇩🇪" },
  { value: "it",    label: "Italian",             flag: "🇮🇹" },
  { value: "nl",    label: "Dutch",               flag: "🇳🇱" },
  { value: "pl",    label: "Polish",              flag: "🇵🇱" },
  { value: "hu",    label: "Hungarian",           flag: "🇭🇺" },
]

// ─── Niches Tab ───────────────────────────────────────────────────────────────

type CustomNicheRow = {
  id: string
  name: string
  emoji: string
  prompt_base: string
  presets: { id: string; label: string; promptModifier: string }[]
}

function NichesTab() {
  const { toast } = useToast()
  const [customNiches, setCustomNiches] = useState<CustomNicheRow[]>([])
  const [loading, setLoading] = useState(true)

  // New niche form
  const [newEmoji, setNewEmoji] = useState("🎨")
  const [newName, setNewName] = useState("")
  const [newPromptBase, setNewPromptBase] = useState("")
  const [newPresets, setNewPresets] = useState<{ id: string; label: string; promptModifier: string }[]>([])
  const [presetLabel, setPresetLabel] = useState("")
  const [presetModifier, setPresetModifier] = useState("")
  const [saving, setSaving] = useState(false)

  // Inline add-preset state per niche
  const [addingPresetFor, setAddingPresetFor] = useState<string | null>(null)
  const [inlinePresetLabel, setInlinePresetLabel] = useState("")
  const [inlinePresetModifier, setInlinePresetModifier] = useState("")

  useEffect(() => {
    fetch("/api/niches")
      .then(r => r.ok ? r.json() : { niches: [] })
      .then(d => { setCustomNiches(d.niches ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function deleteNiche(id: string) {
    if (!confirm("Delete this custom niche?")) return
    const res = await fetch(`/api/niches?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      setCustomNiches(prev => prev.filter(n => n.id !== id))
      toast({ title: "Niche deleted" })
    }
  }

  async function removePreset(nicheId: string, presetId: string) {
    const res = await fetch("/api/niches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nicheId, action: "remove-preset", preset: { id: presetId, label: "", promptModifier: "" } }),
    })
    if (res.ok) {
      setCustomNiches(prev => prev.map(n =>
        n.id === nicheId ? { ...n, presets: n.presets.filter(p => p.id !== presetId) } : n
      ))
    }
  }

  async function addInlinePreset(nicheId: string) {
    if (!inlinePresetLabel.trim()) return
    const preset = { id: crypto.randomUUID(), label: inlinePresetLabel.trim(), promptModifier: inlinePresetModifier.trim() }
    const res = await fetch("/api/niches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nicheId, action: "add-preset", preset }),
    })
    if (res.ok) {
      setCustomNiches(prev => prev.map(n =>
        n.id === nicheId ? { ...n, presets: [...n.presets, preset] } : n
      ))
      setInlinePresetLabel("")
      setInlinePresetModifier("")
      setAddingPresetFor(null)
    }
  }

  function addNewPreset() {
    if (!presetLabel.trim()) return
    setNewPresets(prev => [...prev, { id: crypto.randomUUID(), label: presetLabel.trim(), promptModifier: presetModifier.trim() }])
    setPresetLabel("")
    setPresetModifier("")
  }

  async function createNiche() {
    if (!newName.trim()) { toast({ title: "Name required", variant: "destructive" }); return }
    setSaving(true)
    const res = await fetch("/api/niches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, emoji: newEmoji, promptBase: newPromptBase, presets: newPresets }),
    })
    if (res.ok) {
      const data = await res.json()
      setCustomNiches(prev => [...prev, data.niche])
      setNewEmoji("🎨"); setNewName(""); setNewPromptBase(""); setNewPresets([])
      toast({ title: "Niche created!" })
    } else {
      toast({ title: "Failed to create niche", variant: "destructive" })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Built-in niches */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Built-in Niches</h2>
          <p className="text-xs text-muted-foreground mt-0.5">10 niches included — each with 5 style presets</p>
        </div>
        <div className="divide-y divide-border">
          {Object.entries(NICHE_PRESETS).map(([key, n]) => (
            <div key={key} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{n.emoji}</span>
                <span className="text-sm text-foreground">{n.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{Object.keys(n.styles).length} styles</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom niches */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Your Custom Niches</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Add niches for your specific product categories</p>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center">
            <svg className="w-5 h-5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : customNiches.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No custom niches yet — create one below.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {customNiches.map(n => (
              <div key={n.id} className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{n.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{n.name}</span>
                    <span className="text-xs text-muted-foreground">· {n.presets.length} preset{n.presets.length !== 1 ? "s" : ""}</span>
                  </div>
                  <button
                    onClick={() => deleteNiche(n.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                    title="Delete niche"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Presets */}
                <div className="ml-6 space-y-1.5">
                  {n.presets.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2 group">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground">{p.label}</span>
                        {p.promptModifier && (
                          <span className="text-xs text-muted-foreground ml-2 truncate">{p.promptModifier.slice(0, 50)}{p.promptModifier.length > 50 ? "…" : ""}</span>
                        )}
                      </div>
                      <button
                        onClick={() => removePreset(n.id, p.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Inline add preset */}
                  {addingPresetFor === n.id ? (
                    <div className="space-y-2 pt-1">
                      <Input
                        placeholder="Preset name (e.g. Rustic)"
                        value={inlinePresetLabel}
                        onChange={e => setInlinePresetLabel(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Input
                        placeholder="Prompt modifier (e.g. rustic wooden surfaces, warm tones)"
                        value={inlinePresetModifier}
                        onChange={e => setInlinePresetModifier(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs px-3" onClick={() => addInlinePreset(n.id)}>Add</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-3" onClick={() => { setAddingPresetFor(null); setInlinePresetLabel(""); setInlinePresetModifier("") }}>Cancel</Button>
                      </div>
                    </div>
                  ) : n.presets.length < 10 && (
                    <button
                      onClick={() => setAddingPresetFor(n.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add preset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create new niche */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Add a Custom Niche</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex gap-3">
            <div className="w-16 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Emoji</Label>
              <Input
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value.slice(-2) || "🎨")}
                className="h-8 text-center text-base"
                maxLength={2}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                placeholder="e.g. Handmade Jewellery"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Scene description <span className="font-normal">(optional)</span></Label>
            <Input
              placeholder="e.g. handmade jewellery lifestyle scene on natural wood surface"
              value={newPromptBase}
              onChange={e => setNewPromptBase(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Presets for new niche */}
          {newPresets.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Presets</Label>
              {newPresets.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 bg-muted/40 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-xs font-medium text-foreground">{p.label}</span>
                    {p.promptModifier && <span className="text-xs text-muted-foreground ml-2">{p.promptModifier.slice(0, 40)}…</span>}
                  </div>
                  <button onClick={() => setNewPresets(prev => prev.filter(x => x.id !== p.id))}>
                    <X className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {newPresets.length < 10 && (
            <div className="space-y-2 border border-dashed border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-medium">Add a style preset</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Label (e.g. Minimalist)"
                  value={presetLabel}
                  onChange={e => setPresetLabel(e.target.value)}
                  className="h-7 text-xs"
                />
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={addNewPreset}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <Input
                placeholder="Prompt modifier (e.g. clean flat lay on white marble)"
                value={presetModifier}
                onChange={e => setPresetModifier(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}

          <Button className="w-full h-9 text-sm" onClick={createNiche} disabled={saving || !newName.trim()}>
            {saving ? "Creating…" : "Create Niche"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DefaultsTab() {
  const { toast } = useToast()
  const [defaultImageModel, setDefaultImageModel] = useState<ImageModel>("dalle3")
  const [defaultTextModel, setDefaultTextModel] = useState<TextModel>("gpt4o")
  const [defaultCategory, setDefaultCategory] = useState<string>("home-decor")
  const [defaultLighting, setDefaultLighting] = useState<string>("morning")
  const [defaultLanguage, setDefaultLanguage] = useState<Language>("en")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/user/defaults")
      .then(r => r.json())
      .then(d => {
        const def = d.defaults ?? {}
        if (def.default_image_model) setDefaultImageModel(def.default_image_model as ImageModel)
        if (def.default_text_model) setDefaultTextModel(def.default_text_model as TextModel)
        if (def.default_category_preset) setDefaultCategory(def.default_category_preset as string)
        if (def.default_lighting_preset) setDefaultLighting(def.default_lighting_preset as string)
        if (def.default_language) setDefaultLanguage(def.default_language as Language)
      })
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/user/defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageModel: defaultImageModel,
          textModel: defaultTextModel,
          categoryPreset: defaultCategory,
          lightingPreset: defaultLighting,
          defaultLanguage,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "Defaults saved" })
    } catch {
      toast({ variant: "destructive", title: "Failed to save defaults" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Sliders className="w-4 h-4 text-muted-foreground" /> Generation defaults
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Image Model</Label>
          <Select value={defaultImageModel} onValueChange={v => setDefaultImageModel(v as ImageModel)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Text Model</Label>
          <Select value={defaultTextModel} onValueChange={v => setDefaultTextModel(v as TextModel)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TEXT_MODELS.map(m => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Default Niche</Label>
          <Select value={defaultCategory} onValueChange={v => setDefaultCategory(v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="off" className="text-xs text-muted-foreground">Off (hides niche + style)</SelectItem>
              {NICHE_KEYS.map(k => (
                <SelectItem key={k} value={k} className="text-xs">
                  {NICHE_PRESETS[k].emoji} {NICHE_PRESETS[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Default Lighting</Label>
          <Select value={defaultLighting} onValueChange={v => setDefaultLighting(v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="off" className="text-xs text-muted-foreground">Off (hidden)</SelectItem>
              {LIGHTING_KEYS.map(k => (
                <SelectItem key={k} value={k} className="text-xs">
                  {LIGHTING_PRESETS[k].emoji} {LIGHTING_PRESETS[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Default Language</Label>
        <Select value={defaultLanguage} onValueChange={v => setDefaultLanguage(v as Language)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(l => (
              <SelectItem key={l.value} value={l.value} className="text-xs">
                {l.flag} {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <Button onClick={save} disabled={saving} size="sm" className="gap-2">
        {saving
          ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          : <Save className="w-3.5 h-3.5" />}
        Save defaults
      </Button>
    </div>
  )
}

// ─── Main settings page ────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { toast } = useToast()
  const [savedProviders, setSavedProviders] = useState<Set<string>>(new Set())
  const [loadingKeys, setLoadingKeys] = useState(true)

  useEffect(() => {
    fetch("/api/keys")
      .then(r => r.json())
      .then(d => setSavedProviders(new Set(d.providers ?? [])))
      .finally(() => setLoadingKeys(false))
  }, [])

  async function saveKey(provider: string, key: string) {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, key }),
    })
    if (!res.ok) { toast({ variant: "destructive", title: "Failed to save key" }); throw new Error() }
    setSavedProviders(prev => new Set(Array.from(prev).concat(provider)))
    toast({ title: "Key saved", description: "Encrypted and stored securely." })
  }

  async function deleteKey(provider: string) {
    const res = await fetch(`/api/keys?provider=${encodeURIComponent(provider)}`, { method: "DELETE" })
    if (!res.ok) { toast({ variant: "destructive", title: "Failed to remove key" }); return }
    setSavedProviders(prev => { const s = new Set(Array.from(prev)); s.delete(provider); return s })
    toast({ title: "Key removed" })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your API keys, appearance, prompts and account</p>
      </div>

      <Tabs defaultValue="keys">
        <TabsList className="mb-6 h-9 grid w-full grid-cols-5">
          <TabsTrigger value="keys" className="text-xs gap-1">
            <Key className="w-3.5 h-3.5" /> Keys
          </TabsTrigger>
          <TabsTrigger value="prompts" className="text-xs gap-1">
            <BookMarked className="w-3.5 h-3.5" /> Prompts
          </TabsTrigger>
          <TabsTrigger value="niches" className="text-xs gap-1">
            <Layers className="w-3.5 h-3.5" /> Niches
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs gap-1">
            <Sun className="w-3.5 h-3.5" /> Theme
          </TabsTrigger>
          <TabsTrigger value="account" className="text-xs gap-1">
            <User className="w-3.5 h-3.5" /> Account
          </TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="keys" className="mt-0 space-y-0">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">API Keys</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your keys are AES-256 encrypted — never logged or exposed</p>
              </div>
              <Badge variant="outline" className="text-[11px]">
                {savedProviders.size}/{API_KEY_FIELDS.length} configured
              </Badge>
            </div>
            {loadingKeys ? (
              <div className="p-8 flex justify-center">
                <svg className="w-5 h-5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {API_KEY_FIELDS.map(field => (
                  <div key={field.provider} className="px-5 py-4">
                    <ApiKeyRow
                      {...field}
                      isSaved={savedProviders.has(field.provider)}
                      onSave={saveKey}
                      onDelete={deleteKey}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4">
            <DefaultsTab />
          </div>
        </TabsContent>

        {/* Prompts */}
        <TabsContent value="prompts" className="mt-0">
          <PromptsTab />
        </TabsContent>

        {/* Niches */}
        <TabsContent value="niches" className="mt-0">
          <NichesTab />
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-0">
          <AppearanceTab />
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="mt-0">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
