"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { Upload, X, Download, Copy, Check, Wand2, Info, ChevronLeft, ChevronRight, ChevronDown, BookMarked, Link, ArrowRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { NICHE_PRESETS, LIGHTING_PRESETS, DEFAULT_NICHE, DEFAULT_STYLE, type CustomNiche } from "@/lib/presets"
import type {
  ImageModel,
  TextModel,
  LightingPreset,
  Platform,
  AspectRatio,
  PlatformOutput,
  Language,
} from "@/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import OnboardingWizard from "@/components/OnboardingWizard"

interface GenerationResult {
  imagesBase64: string[]
  imageUrls: string[]
  textOutput: PlatformOutput
  prompt: string
  productDescription?: string
  textModelUsed?: string
  freeUsed: number | null
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface UploadZoneProps {
  label: string
  tooltip: string
  file: File | null
  preview: string | null
  strength: number
  onFileChange: (file: File | null) => void
  onStrengthChange: (val: number) => void
  strengthLabel?: string
}

function UploadZone({
  label,
  tooltip,
  file,
  preview,
  strength,
  onFileChange,
  onStrengthChange,
  strengthLabel = "Strength",
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const dropped = e.dataTransfer.files[0]
      if (dropped && dropped.type.startsWith("image/")) onFileChange(dropped)
    },
    [onFileChange]
  )

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 aspect-square bg-gray-50 dark:bg-gray-800">
          <Image src={preview} alt={label} fill className="object-cover" unoptimized />
          <button
            onClick={() => onFileChange(null)}
            aria-label="Remove image"
            className="absolute top-1 right-1 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      ) : (
        <div
          className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="w-6 h-6 text-gray-300 dark:text-gray-600 mb-2" />
          <span className="text-xs text-gray-400 dark:text-gray-500 text-center px-2">Drop or click<br />to upload</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileChange(f)
          e.target.value = ""
        }}
      />

      {file && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{strengthLabel}</span>
            <span className="text-xs font-medium text-gray-700">{strength}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[strength]}
            onValueChange={([v]) => onStrengthChange(v)}
            className="py-1"
          />
        </div>
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

function OutputField({ label, value }: { label: string; value: string | string[] }) {
  const text = Array.isArray(value) ? value.map((h) => `#${h}`).join(" ") : value
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <CopyButton text={text} />
      </div>
      <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
    </div>
  )
}

function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LIGHTING_KEYS = Object.keys(LIGHTING_PRESETS) as LightingPreset[]
const ASPECT_RATIOS: { value: AspectRatio; label: string; hint: string; w: number; h: number }[] = [
  { value: "2:3",  label: "2:3",  hint: "Pinterest",      w: 10, h: 15 },
  { value: "4:5",  label: "4:5",  hint: "Instagram",      w: 12, h: 15 },
  { value: "1:1",  label: "1:1",  hint: "Square",         w: 14, h: 14 },
  { value: "9:16", label: "9:16", hint: "Stories",        w: 9,  h: 16 },
  { value: "16:9", label: "16:9", hint: "Google Ads",     w: 16, h: 9  },
]

const IMAGE_MODELS: { value: ImageModel; label: string; badge?: string }[] = [
  { value: "dalle3", label: "DALL-E 3", badge: "OpenAI" },
  { value: "flux-schnell", label: "Flux Schnell", badge: "Replicate" },
  { value: "flux-dev", label: "Flux Dev + img2img", badge: "Replicate" },
  { value: "stability", label: "Stable Diffusion 3", badge: "Stability" },
  { value: "seedream", label: "Seedream", badge: "BytePlus" },
]

const TEXT_MODELS: { value: TextModel; label: string }[] = [
  { value: "gpt4o", label: "GPT-4o" },
  { value: "claude", label: "Claude Sonnet" },
  { value: "gemini", label: "Gemini 1.5 Flash" },
]

function PinterestLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  )
}

function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function GoogleAdsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM19.2 5.6c-.4-.53-.8-1.07-1.2-1.6-.96.71-2.21 1.65-3.2 2.39.4.53.8 1.07 1.2 1.6.99-.74 2.24-1.68 3.2-2.39zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" />
    </svg>
  )
}

const PLATFORMS: { value: Platform; label: string; Logo: React.FC<{ className?: string }>; defaultRatio: AspectRatio; activeClass: string }[] = [
  { value: "pinterest",  label: "Pinterest",  Logo: PinterestLogo,  defaultRatio: "2:3",  activeClass: "border-[#E60023]/30 bg-[#E60023]/8 text-[#E60023]"  },
  { value: "instagram",  label: "Instagram",  Logo: InstagramLogo,  defaultRatio: "4:5",  activeClass: "border-pink-300 bg-gradient-to-b from-pink-50 to-orange-50 text-pink-600" },
  { value: "facebook",   label: "Facebook",   Logo: FacebookLogo,   defaultRatio: "1:1",  activeClass: "border-blue-300 bg-blue-50 text-blue-600"  },
  { value: "google-ads", label: "Google Ads", Logo: GoogleAdsLogo,  defaultRatio: "16:9", activeClass: "border-green-300 bg-green-50 text-green-700" },
]

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

const ASPECT_RATIO_CLASS: Record<AspectRatio, string> = {
  "2:3": "aspect-[2/3]",
  "4:5": "aspect-[4/5]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-video",
}

const LOADING_MESSAGES = [
  "Crafting your scene…",
  "Calling the AI…",
  "Adding atmosphere…",
  "Stripping metadata…",
  "Almost there…",
]

// ─── Main component ────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const { toast } = useToast()

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetch("/api/user/onboarding")
          .then((r) => r.json())
          .then((d) => {
            if (!d.completed) setShowOnboarding(true)
          })
          .catch(() => {})
      }
    })
  }, [])

  // Upload state
  const [styleFile, setStyleFile] = useState<File | null>(null)
  const [stylePreview, setStylePreview] = useState<string | null>(null)
  const [styleStrength, setStyleStrength] = useState(40)

  const [productFile, setProductFile] = useState<File | null>(null)
  const [productPreview, setProductPreview] = useState<string | null>(null)
  const [productStrength, setProductStrength] = useState(70)

  // Settings
  const [imageModel, setImageModel] = useState<ImageModel>("dalle3")
  const [textModel, setTextModel] = useState<TextModel>("gpt4o")
  const [niche, setNiche] = useState<string>(DEFAULT_NICHE)
  const [stylePreset, setStylePreset] = useState<string>(DEFAULT_STYLE)
  const [nicheOpen, setNicheOpen] = useState(true)
  const [styleOpen, setStyleOpen] = useState(true)
  const [lightingOpen, setLightingOpen] = useState(true)
  const [customNiches, setCustomNiches] = useState<CustomNiche[]>([])
  const [lighting, setLighting] = useState<LightingPreset>("morning")
  const [destUrlOpen, setDestUrlOpen] = useState(true)
  const [freeUsedCount, setFreeUsedCount] = useState<number | null>(null)
  const [additionalOpen, setAdditionalOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [platforms, setPlatforms] = useState<Platform[]>(["pinterest", "instagram"])
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("2:3")
  const [batchMode, setBatchMode] = useState(false)
  const [aiTonedown, setAiTonedown] = useState(false)
  const [language, setLanguage] = useState<Language>("en")

  // Destination URL
  const [destinationUrl, setDestinationUrl] = useState("")
  const [destinationContext, setDestinationContext] = useState<{ title: string; description: string } | null>(null)
  const [scrapingUrl, setScrapingUrl] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)

  // Saved prompts
  const [savedPrompts, setSavedPrompts] = useState<{ id: string; name: string; prompt: string }[]>([])
  useEffect(() => {
    fetch("/api/prompts").then(r => r.json()).then(d => setSavedPrompts(d.prompts ?? []))
    fetch("/api/user/defaults").then(r => r.json()).then(d => {
      const def = d.defaults ?? {}
      // Free usage counter
      if (def.free_generations_used !== undefined) setFreeUsedCount(def.free_generations_used)
      // Default model/niche/lighting/language
      if (def.default_image_model) setImageModel(def.default_image_model as ImageModel)
      if (def.default_text_model) setTextModel(def.default_text_model as TextModel)
      if (def.default_category_preset === "off") { setNicheOpen(false); setStyleOpen(false) }
      else if (def.default_category_preset) { setNiche(def.default_category_preset); setNicheOpen(true); setStyleOpen(true) }
      if (def.default_lighting_preset === "off") { setLightingOpen(false) }
      else if (def.default_lighting_preset) { setLighting(def.default_lighting_preset as LightingPreset); setLightingOpen(true) }
      if (def.default_language) setLanguage(def.default_language as Language)
    })
    fetch("/api/niches").then(r => r.ok ? r.json() : { niches: [] }).then(d => setCustomNiches(d.niches ?? []))
  }, [])

  // Output state
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const loadingMsgInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Prompt editing
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState("")
  const overridePromptRef = useRef<string | null>(null)

  // Download label (acts as filename prefix / folder grouping)
  const [downloadLabel, setDownloadLabel] = useState("")
  const [downloadingAll, setDownloadingAll] = useState(false)

  function handleStyleFile(file: File | null) {
    setStyleFile(file)
    setStylePreview(file ? URL.createObjectURL(file) : null)
  }

  function handleProductFile(file: File | null) {
    setProductFile(file)
    setProductPreview(file ? URL.createObjectURL(file) : null)
  }

  function togglePlatform(platform: Platform) {
    setPlatforms((prev) => {
      const isAdding = !prev.includes(platform)
      const next = isAdding ? [...prev, platform] : prev.filter((p) => p !== platform)
      if (isAdding) {
        const ratio = PLATFORMS.find((p) => p.value === platform)?.defaultRatio
        if (ratio) setAspectRatio(ratio)
      }
      return next
    })
  }

  function startLoadingMessages() {
    let i = 0
    loadingMsgInterval.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[i])
    }, 4000)
  }

  function stopLoadingMessages() {
    if (loadingMsgInterval.current) clearInterval(loadingMsgInterval.current)
  }

  async function fetchDestinationContext(url: string) {
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      setScrapeError("Please enter a valid URL starting with http:// or https://")
      return
    }
    setScrapingUrl(true)
    setScrapeError(null)
    setDestinationContext(null)
    try {
      const res = await fetch("/api/scrape-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.error) {
        setScrapeError("Could not fetch page — you can still generate without it.")
      } else {
        setDestinationContext({ title: data.title, description: data.description })
      }
    } catch {
      setScrapeError("Network error — you can still generate without it.")
    } finally {
      setScrapingUrl(false)
    }
  }

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    setSelectedImageIndex(0)
    setEditingPrompt(false)
    setLoadingMsg(LOADING_MESSAGES[0])
    startLoadingMessages()

    try {
      const fd = new FormData()
      if (styleFile) fd.append("style_reference", styleFile)
      if (productFile) fd.append("product_reference", productFile)

      fd.append(
        "config",
        JSON.stringify({
          imageModel,
          textModel,
          categoryPreset: nicheOpen ? niche : undefined,
          niche: nicheOpen ? niche : undefined,
          stylePreset: styleOpen ? stylePreset : undefined,
          lightingPreset: lightingOpen ? lighting : undefined,
          customPrompt: customPrompt || undefined,
          platforms,
          aspectRatio,
          language,
          batchMode,
          aiTonedown,
          styleReferenceStrength: styleFile ? styleStrength : undefined,
          productReferenceStrength: productFile ? productStrength : undefined,
          hasStyleReference: !!styleFile,
          hasProductReference: !!productFile,
          destinationContext: destinationContext ?? undefined,
          promptOverride: overridePromptRef.current ?? undefined,
        })
      )
      overridePromptRef.current = null

      const res = await fetch("/api/generate", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: res.status === 402 ? "Free trial exhausted"
                : res.status === 429 ? "Slow down!"
                : "Generation failed",
          description: data.error ?? "Something went wrong.",
        })
        return
      }

      setResult(data)
      // Keep free usage counter in sync
      if (data.freeUsed !== null && data.freeUsed !== undefined) setFreeUsedCount(data.freeUsed)
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Please try again." })
    } finally {
      setLoading(false)
      stopLoadingMessages()
    }
  }

  function downloadImage(index: number) {
    const b64 = result?.imagesBase64?.[index]
    if (!b64) return
    const prefix = downloadLabel.trim().replace(/[^a-zA-Z0-9_\-]/g, "-") || "ombryth"
    const suffix = (result?.imagesBase64?.length ?? 1) > 1 ? `-v${index + 1}` : ""
    const filename = `${prefix}${suffix}.jpg`
    // Must append to DOM before click — browsers silently ignore detached-element clicks
    const link = document.createElement("a")
    link.href = `data:image/jpeg;base64,${b64}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function downloadAll() {
    if (downloadingAll) return
    const total = result?.imagesBase64?.length ?? 0
    if (total === 0) return
    setDownloadingAll(true)
    // Start at 200ms so all downloads are async (0ms fires inside click handler and gets dropped).
    // 800ms gap between each — browsers throttle rapid data: URL downloads.
    for (let i = 0; i < total; i++) {
      setTimeout(() => {
        downloadImage(i)
        if (i === total - 1) setDownloadingAll(false)
      }, 200 + i * 800)
    }
  }

  const activePlatforms = platforms.filter((p) => result?.textOutput?.[p] !== undefined)
  const hasMultipleImages = (result?.imagesBase64?.length ?? 0) > 1
  const currentImage = result?.imagesBase64?.[selectedImageIndex]

  return (
    <TooltipProvider>
      {showOnboarding && userId && (
        <OnboardingWizard userId={userId} onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto">

        {/* ── Left panel ───────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[420px] lg:shrink-0 space-y-4">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-blue-600 bg-clip-text text-transparent">Generate</h1>
            <p className="text-sm text-gray-400 mt-0.5">Lifestyle images + platform captions in one click</p>
          </div>

          {/* Reference images */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Reference Images</p>
            <div className="grid grid-cols-2 gap-3">
              <UploadZone
                label="Style Reference"
                tooltip="Sets the mood, composition and lighting of the generated image. Supported natively by Flux Dev and Stability AI — for DALL-E and Seedream, the style is analysed and injected into the prompt."
                file={styleFile}
                preview={stylePreview}
                strength={styleStrength}
                onFileChange={handleStyleFile}
                onStrengthChange={setStyleStrength}
                strengthLabel="Style influence"
              />
              <UploadZone
                label="Product / Item"
                tooltip="Upload your product or item. GPT-4o will describe it and inject it into the image prompt so it appears naturally in the scene."
                file={productFile}
                preview={productPreview}
                strength={productStrength}
                onFileChange={handleProductFile}
                onStrengthChange={setProductStrength}
                strengthLabel="Prominence"
              />
            </div>
            {productFile && (
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                This product will be described and placed in the generated scene.
              </p>
            )}
          </div>

          {/* AI Models */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Models</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Image Model</Label>
                <Select value={imageModel} onValueChange={(v) => setImageModel(v as ImageModel)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          {m.label}
                          {m.badge && (
                            <span className="text-[10px] text-gray-400">{m.badge}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Text Model</Label>
                <Select value={textModel} onValueChange={(v) => setTextModel(v as TextModel)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXT_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Niche selector */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 space-y-3">
            <button onClick={() => { setNicheOpen(o => { const next = !o; if (!next) setStyleOpen(false); return next }) }} className="flex items-center justify-between w-full">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Niche</p>
              <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", nicheOpen && "rotate-180")} />
            </button>
            {nicheOpen && <div className="flex flex-wrap gap-1.5">
              {Object.entries(NICHE_PRESETS).map(([key, n]) => (
                <button
                  key={key}
                  onClick={() => { setNiche(key); setStylePreset(Object.keys(n.styles)[0]) }}
                  aria-pressed={niche === key}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    niche === key
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 hover:text-gray-700"
                  )}
                >
                  {n.label}
                </button>
              ))}
              {customNiches.map((customNiche) => (
                <button
                  key={customNiche.id}
                  onClick={() => { setNiche(customNiche.id); setStylePreset(customNiche.presets[0]?.id ?? "") }}
                  aria-pressed={niche === customNiche.id}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    niche === customNiche.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 hover:text-gray-700"
                  )}
                >
                  {customNiche.name}
                </button>
              ))}
            </div>}
          </div>

          {/* Style preset */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 space-y-3">
            <button onClick={() => setStyleOpen(o => !o)} className="flex items-center justify-between w-full">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Style</p>
              <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", styleOpen && "rotate-180")} />
            </button>
            {styleOpen && <div className="flex flex-wrap gap-1.5">
              {(() => {
                const builtIn = NICHE_PRESETS[niche]
                if (builtIn) {
                  return Object.entries(builtIn.styles).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => setStylePreset(key)}
                      aria-pressed={stylePreset === key}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                        stylePreset === key
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-gray-100 hover:border-gray-200 text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {s.label}
                    </button>
                  ))
                }
                const custom = customNiches.find((cn2) => cn2.id === niche)
                return (custom?.presets ?? []).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setStylePreset(p.id)}
                    aria-pressed={stylePreset === p.id}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                      stylePreset === p.id
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-100 hover:border-gray-200 text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {p.label}
                  </button>
                ))
              })()}
            </div>}
          </div>

          {/* Lighting presets */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 space-y-3">
            <button onClick={() => setLightingOpen(o => !o)} className="flex items-center justify-between w-full">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lighting & Camera</p>
              <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", lightingOpen && "rotate-180")} />
            </button>
            {lightingOpen && <div className="grid grid-cols-4 gap-1.5">
              {LIGHTING_KEYS.map((key) => {
                const preset = LIGHTING_PRESETS[key]
                return (
                  <button
                    key={key}
                    onClick={() => setLighting(key)}
                    aria-pressed={lighting === key}
                    className={cn(
                      "flex flex-col items-center justify-center px-1 py-2.5 rounded-lg text-[10px] transition-colors border",
                      lighting === key
                        ? "border-blue-200 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <span className="leading-tight text-center line-clamp-2">
                      {preset.label}
                    </span>
                  </button>
                )
              })}
            </div>}
          </div>

          {/* Custom prompt — collapsible */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border overflow-hidden">
            <button
              onClick={() => setAdditionalOpen(!additionalOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer">
                Additional Instructions <span className="font-normal normal-case text-gray-400">(optional)</span>
              </Label>
              <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0", additionalOpen && "rotate-180")} />
            </button>
            {additionalOpen && (
              <div className="px-4 pb-4 space-y-2">
                {savedPrompts.length > 0 && (
                  <div className="flex justify-end">
                    <Select onValueChange={(id) => {
                      const p = savedPrompts.find(s => s.id === id)
                      if (p) setCustomPrompt(p.prompt)
                    }}>
                      <SelectTrigger className="h-7 text-xs w-auto gap-1 border-gray-200 dark:border-border">
                        <BookMarked className="w-3 h-3 text-gray-400" />
                        <SelectValue placeholder="Load saved…" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedPrompts.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Textarea
                  placeholder="E.g. add a cozy throw blanket, warm coffee mug on the side, mossy stone wall in background…"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="text-sm resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Destination URL — collapsible */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border overflow-hidden">
            <button
              onClick={() => setDestUrlOpen(!destUrlOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-gray-400" />
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer">
                  Destination URL <span className="font-normal normal-case text-gray-400">(optional)</span>
                </Label>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0", destUrlOpen && "rotate-180")} />
            </button>
            {destUrlOpen && (
            <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-gray-400">
              Paste the page you&apos;re linking to — keywords will be injected into your captions.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/product-page"
                value={destinationUrl}
                onChange={(e) => {
                  setDestinationUrl(e.target.value)
                  if (destinationContext) setDestinationContext(null)
                  if (scrapeError) setScrapeError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchDestinationContext(destinationUrl)
                }}
                className="flex-1 h-10 px-3 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 placeholder:text-gray-300"
              />
              {destinationUrl && (
                <button
                  onClick={() => {
                    setDestinationUrl("")
                    setDestinationContext(null)
                    setScrapeError(null)
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => fetchDestinationContext(destinationUrl)}
                disabled={scrapingUrl || !destinationUrl}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Fetch page context"
              >
                {scrapingUrl ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {destinationContext && (destinationContext.title || destinationContext.description) && (
              <div className="flex items-start gap-1.5 bg-green-50 border border-green-100 rounded-lg px-2.5 py-2">
                <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-xs text-green-700 leading-snug">
                  {(destinationContext.title || destinationContext.description).slice(0, 60)}
                  {(destinationContext.title || destinationContext.description).length > 60 ? "…" : ""}
                </p>
              </div>
            )}
            {scrapeError && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <span>⚠</span> {scrapeError}
              </p>
            )}
            </div>
            )}
          </div>

          {/* Platforms + Aspect + Batch */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Output Platforms</p>
              <div className="flex gap-2">
                {PLATFORMS.map(({ value, label, Logo, activeClass }) => {
                  const active = platforms.includes(value)
                  return (
                    <button
                      key={value}
                      onClick={() => togglePlatform(value)}
                      aria-pressed={active}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center gap-1 relative",
                        active ? activeClass : "border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200 dark:hover:border-gray-600 hover:text-gray-600"
                      )}
                    >
                      {active && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
                      <Logo className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aspect Ratio</p>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_RATIOS.map(({ value, label, hint, w, h }) => {
                  const active = aspectRatio === value
                  // Scale shape to max 16px in longest dimension
                  const scale = 16 / Math.max(w, h)
                  const pw = Math.round(w * scale)
                  const ph = Math.round(h * scale)
                  return (
                    <button
                      key={value}
                      onClick={() => setAspectRatio(value)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center gap-1.5",
                        active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-500 hover:border-gray-200"
                      )}
                    >
                      <span
                        className={cn("rounded-[2px] border-[1.5px] transition-colors", active ? "border-blue-400 bg-blue-100" : "border-gray-300 bg-gray-100")}
                        style={{ width: pw, height: ph }}
                      />
                      <span className="leading-none">{label}</span>
                    </button>
                  )
                })}
              </div>
              {(aspectRatio === "9:16" || aspectRatio === "4:5") && imageModel === "dalle3" && (
                <p className="text-[11px] text-amber-600 flex items-center gap-1">
                  <span>⚠</span> DALL-E 3 maps {aspectRatio} to the closest supported size. Use Flux or Stability for exact ratio.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Caption Language</p>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">
                      {l.flag} {l.label}{l.value === "en" ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-gray-700">Batch mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Generate 3 variations at once</p>
              </div>
              <Switch checked={batchMode} onCheckedChange={setBatchMode} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">AI tonedown</p>
                <p className="text-xs text-gray-400 mt-0.5">Adds film grain + imperfections for a more natural look</p>
              </div>
              <Switch checked={aiTonedown} onCheckedChange={setAiTonedown} />
            </div>
          </div>

          {/* Generate button */}
          <div className="space-y-2 pb-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={cn(
                "w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                loading
                  ? "bg-blue-400 cursor-not-allowed text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-px active:translate-y-0"
              )}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {batchMode ? "Generate 3 Variations" : "Generate"}
                </>
              )}
            </button>
            {freeUsedCount !== null && (
              <p className={cn(
                "text-center text-xs",
                freeUsedCount >= 10 ? "text-red-500 font-medium" : freeUsedCount >= 7 ? "text-amber-500" : "text-gray-400"
              )}>
                {freeUsedCount >= 10
                  ? "Free trial exhausted — upgrade to continue"
                  : `${freeUsedCount}/10 free generations used · ${10 - freeUsedCount} remaining`}
              </p>
            )}
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────────────────────────── */}
        <div className="w-full lg:flex-1 min-w-0 space-y-4">

          {/* Image output */}
          <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border overflow-hidden">
            {loading ? (
              <div className={cn("flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/60 gap-4", ASPECT_RATIO_CLASS[aspectRatio])}>
                <LoadingSpinner text={loadingMsg} />
                <p className="text-xs text-gray-400">This may take 10–60 seconds</p>
              </div>
            ) : currentImage ? (
              <div>
                <div className={cn("relative bg-gray-100 overflow-hidden", ASPECT_RATIO_CLASS[aspectRatio])}>
                  <Image
                    src={`data:image/jpeg;base64,${currentImage}`}
                    alt="Generated lifestyle image"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Batch navigation */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((i) => Math.max(0, i - 1))}
                        disabled={selectedImageIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((i) => Math.min((result?.imagesBase64?.length ?? 1) - 1, i + 1))}
                        disabled={selectedImageIndex === (result?.imagesBase64?.length ?? 1) - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {result?.imagesBase64?.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedImageIndex(i)}
                            aria-label={`View variation ${i + 1}`}
                            aria-pressed={i === selectedImageIndex}
                            className="w-8 h-8 flex items-center justify-center"
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full transition-colors",
                              i === selectedImageIndex ? "bg-white" : "bg-white/50"
                            )} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Download label + buttons */}
                <div className="border-t border-gray-50 px-3 pt-2.5 pb-3 space-y-2">
                  {/* Label/folder row */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 shrink-0">📁 Label</span>
                    <input
                      type="text"
                      value={downloadLabel}
                      onChange={e => setDownloadLabel(e.target.value)}
                      placeholder="e.g. kitchen-shoot (optional)"
                      className="flex-1 h-6 px-2 text-[11px] rounded border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-200 placeholder:text-gray-300"
                    />
                    <span className="text-[10px] text-gray-400 shrink-0 hidden sm:block">→ {(downloadLabel.trim().replace(/[^a-zA-Z0-9_\-]/g, "-") || "ombryth")}-v1.jpg</span>
                  </div>
                  {/* Action row */}
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 flex items-center gap-1 text-xs">
                      <Check className="w-3 h-3" /> Metadata stripped
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading} className="h-7 text-xs gap-1">
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </Button>
                      {hasMultipleImages && (
                        <Button size="sm" variant="outline" onClick={downloadAll} disabled={downloadingAll} className="h-7 text-xs gap-1">
                          {downloadingAll
                            ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            : <Download className="w-3 h-3" />}
                          All {result?.imagesBase64?.length}
                        </Button>
                      )}
                      <Button size="sm" onClick={() => downloadImage(selectedImageIndex)} className="h-7 text-xs gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Batch thumbnails */}
                {hasMultipleImages && (
                  <div className="flex gap-2 px-3 pb-3">
                    {result?.imagesBase64?.map((b64, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={cn(
                          "w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors shrink-0 relative",
                          i === selectedImageIndex ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Image
                          src={`data:image/jpeg;base64,${b64}`}
                          alt={`Variation ${i + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={cn("relative flex flex-col items-center justify-center gap-3 overflow-hidden", ASPECT_RATIO_CLASS[aspectRatio])}>
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 dark:from-gray-800 dark:via-blue-950/20 dark:to-indigo-950/30" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.07),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(59,130,246,0.07),transparent_60%)]" />
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-gray-700/80 shadow-sm border border-white dark:border-gray-600 flex items-center justify-center backdrop-blur-sm">
                    <Wand2 className="w-7 h-7 text-blue-400 dark:text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Your image will appear here</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Configure settings and click Generate</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt used */}
          {result?.prompt && (
            <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prompt Used</p>
                <div className="flex items-center gap-2">
                  {result.textModelUsed && (
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      result.textModelUsed === "failed"
                        ? "bg-red-50 text-red-500"
                        : result.textModelUsed.includes("claude")
                          ? "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                          : result.textModelUsed.includes("gemini")
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                            : "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
                    )}>
                      {result.textModelUsed}
                    </span>
                  )}
                  <CopyButton text={result.prompt} />
                  {!editingPrompt && (
                    <button
                      onClick={() => { setEditedPrompt(result.prompt); setEditingPrompt(true) }}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded border border-transparent hover:border-border"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {editingPrompt ? (
                <div className="space-y-2">
                  <textarea
                    value={editedPrompt}
                    onChange={e => setEditedPrompt(e.target.value)}
                    className="w-full text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={5}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      disabled={loading || !editedPrompt.trim()}
                      onClick={() => {
                        overridePromptRef.current = editedPrompt.trim()
                        handleGenerate()
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry with this prompt
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setEditingPrompt(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{result.prompt}</p>
              )}

              {result.productDescription && (
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Product: &ldquo;{result.productDescription}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Platform text output */}
          {result?.textOutput && activePlatforms.length > 0 && (
            <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Platform Content</p>
              <Tabs defaultValue={activePlatforms[0]}>
                <TabsList className="mb-4 h-8">
                  {activePlatforms.map((p) => {
                    const plat = PLATFORMS.find((x) => x.value === p)
                    return (
                      <TabsTrigger key={p} value={p} className="capitalize text-xs gap-1">
                        {plat && <plat.Logo className="w-3 h-3" />}
                        {plat?.label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {result.textOutput.pinterest && platforms.includes("pinterest") && (
                  <TabsContent value="pinterest" className="space-y-3 mt-0">
                    <OutputField label="Title" value={result.textOutput.pinterest.title} />
                    <OutputField
                      label="Description"
                      value={
                        [result.textOutput.pinterest.description, result.textOutput.pinterest.caption]
                          .filter(Boolean).join(" ") +
                        (result.textOutput.pinterest.hashtags
                          ? " " + (Array.isArray(result.textOutput.pinterest.hashtags)
                              ? result.textOutput.pinterest.hashtags.map((h: string) => `#${h}`).join(" ")
                              : result.textOutput.pinterest.hashtags)
                          : "")
                      }
                    />
                    <OutputField label="Alt Text" value={result.textOutput.pinterest.altText} />
                    {destinationUrl && (
                      <OutputField label="Link" value={destinationUrl} />
                    )}
                    {result.imageUrls?.[selectedImageIndex] && (
                      <a
                        href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(destinationUrl || "https://ombryth.com")}&media=${encodeURIComponent(result.imageUrls[selectedImageIndex])}&description=${encodeURIComponent(
                          result.textOutput.pinterest.title + " " +
                          [result.textOutput.pinterest.description, result.textOutput.pinterest.caption].filter(Boolean).join(" ") +
                          (result.textOutput.pinterest.hashtags
                            ? " " + (Array.isArray(result.textOutput.pinterest.hashtags)
                                ? result.textOutput.pinterest.hashtags.map((h: string) => `#${h}`).join(" ")
                                : result.textOutput.pinterest.hashtags)
                            : "")
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#E60023] hover:bg-[#c1001f] text-white text-sm font-medium transition-colors"
                      >
                        <PinterestLogo className="w-4 h-4" />
                        Pin it
                      </a>
                    )}
                  </TabsContent>
                )}

                {result.textOutput.instagram && platforms.includes("instagram") && (
                  <TabsContent value="instagram" className="space-y-3 mt-0">
                    <OutputField label="Caption" value={result.textOutput.instagram.caption} />
                    <OutputField label="Alt Text" value={result.textOutput.instagram.altText} />
                    <OutputField label="Hashtags (30)" value={result.textOutput.instagram.hashtags} />
                  </TabsContent>
                )}

                {result.textOutput.facebook && platforms.includes("facebook") && (
                  <TabsContent value="facebook" className="space-y-3 mt-0">
                    <OutputField label="Caption" value={result.textOutput.facebook.caption} />
                    <OutputField label="Alt Text" value={result.textOutput.facebook.altText} />
                    <OutputField label="Hashtags" value={result.textOutput.facebook.hashtags} />
                  </TabsContent>
                )}

                {result.textOutput["google-ads"] && platforms.includes("google-ads") && (
                  <TabsContent value="google-ads" className="space-y-3 mt-0">
                    <OutputField label="Headline 1" value={result.textOutput["google-ads"].headline1} />
                    <OutputField label="Headline 2" value={result.textOutput["google-ads"].headline2} />
                    <OutputField label="Headline 3" value={result.textOutput["google-ads"].headline3} />
                    <OutputField label="Description 1" value={result.textOutput["google-ads"].description1} />
                    <OutputField label="Description 2" value={result.textOutput["google-ads"].description2} />
                    <OutputField label="Alt Text" value={result.textOutput["google-ads"].altText} />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}

          {/* Loading text output placeholder */}
          {loading && (
            <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-6 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating platform content…
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-border p-6 text-center">
              <p className="text-sm text-gray-400">Platform captions will appear here after generation</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
