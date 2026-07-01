// Provider + model registry for usage stats. Providers mirror the API Keys tab
// in Settings; models mirror the pickers on the Generate page.

export interface ProviderInfo {
  key: string
  label: string
  color: string
}

export const PROVIDERS: ProviderInfo[] = [
  { key: "openai", label: "OpenAI", color: "#10b981" },
  { key: "anthropic", label: "Anthropic", color: "#f97316" },
  { key: "gemini", label: "Google Gemini", color: "#3b82f6" },
  { key: "replicate", label: "Replicate", color: "#a855f7" },
  { key: "bfl", label: "Black Forest Labs", color: "#eab308" },
  { key: "stability", label: "Stability AI", color: "#ec4899" },
  { key: "byteplus", label: "BytePlus (Seedream)", color: "#14b8a6" },
]

export type ModelKind = "image" | "text"

export interface ModelInfo {
  key: string
  label: string
  kind: ModelKind
  provider: string
  color: string
}

// Colors are a well-spaced categorical palette (not provider brand colors) so
// that any image+text pairing a user picks stays visually distinct — the mint
// image default (DALL-E 3) contrasts strongly with the warm/blue text models.
export const MODELS: ModelInfo[] = [
  // Image models
  { key: "dalle3", label: "DALL-E 3", kind: "image", provider: "openai", color: "#5fe6c4" },
  { key: "flux-schnell", label: "Flux Schnell", kind: "image", provider: "replicate", color: "#8b5cf6" },
  { key: "flux-dev", label: "Flux Dev", kind: "image", provider: "replicate", color: "#ec4899" },
  { key: "flux-2-pro", label: "Flux 2 Pro", kind: "image", provider: "bfl", color: "#eab308" },
  { key: "stability", label: "Stable Diffusion", kind: "image", provider: "stability", color: "#f43f5e" },
  { key: "seedream", label: "Seedream", kind: "image", provider: "byteplus", color: "#06b6d4" },
  { key: "seedream-5-lite", label: "Seedream 5", kind: "image", provider: "byteplus", color: "#14b8a6" },
  // Text models
  { key: "gpt4o", label: "GPT-4o", kind: "text", provider: "openai", color: "#f97316" },
  { key: "claude", label: "Claude Sonnet", kind: "text", provider: "anthropic", color: "#3b82f6" },
  { key: "gemini", label: "Gemini Flash", kind: "text", provider: "gemini", color: "#a855f7" },
]

// Image and text model keys never collide, so a single key lookup is safe.
const MODEL_BY_KEY: Record<string, ModelInfo> = Object.fromEntries(
  MODELS.map(m => [m.key, m])
)

export function modelInfo(key: string): ModelInfo | undefined {
  return MODEL_BY_KEY[key]
}

export function providerOf(model: string): string {
  return MODEL_BY_KEY[model]?.provider ?? "unknown"
}
