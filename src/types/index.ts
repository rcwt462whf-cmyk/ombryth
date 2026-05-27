export type ImageModel = "dalle3" | "seedream" | "flux-schnell" | "flux-dev" | "stability"
export type TextModel = "gpt4o" | "claude" | "gemini"
export type Platform = "pinterest" | "instagram" | "facebook" | "google-ads"
export type AspectRatio = "2:3" | "1:1" | "16:9" | "9:16" | "4:5"
export type Language =
  | "en"
  | "es"
  | "pt-BR"
  | "fr"
  | "de"
  | "it"
  | "nl"
  | "pl"
  | "hu"
export type CategoryPreset = string // now dynamic (niche key)
export type LightingPreset =
  | "morning"
  | "golden-hour"
  | "overcast"
  | "evening"
  | "film-grain"
  | "candid"
  | "candlelight"

export interface GenerateRequest {
  imageModel: ImageModel
  textModel: TextModel
  categoryPreset?: CategoryPreset // legacy compat
  niche?: string
  stylePreset?: string
  lightingPreset: LightingPreset
  customPrompt?: string
  platforms: Platform[]
  aspectRatio: AspectRatio
  language?: Language
  batchMode?: boolean
  styleReferenceStrength?: number
  productReferenceStrength?: number
  hasStyleReference?: boolean
  hasProductReference?: boolean
  destinationContext?: { title: string; description: string }
  promptOverride?: string
  aiTonedown?: boolean
}

export interface PlatformOutput {
  pinterest?: {
    title: string
    description: string
    altText: string
    caption: string
    hashtags: string[]
  }
  instagram?: {
    caption: string
    altText: string
    hashtags: string[]
  }
  facebook?: {
    caption: string
    altText: string
    hashtags: string[]
  }
  "google-ads"?: {
    headline1: string
    headline2: string
    headline3: string
    description1: string
    description2: string
    altText: string
  }
}

export interface GenerationResult {
  imageUrl: string
  imageBase64?: string
  textOutput: PlatformOutput
  prompt: string
  productDescription?: string
}

export interface ApiKeyConfig {
  openai?: string
  anthropic?: string
  gemini?: string
  byteplus?: string
  replicate?: string
  stability?: string
}

export interface UserSettings {
  defaultImageModel: ImageModel
  defaultTextModel: TextModel
  defaultCategoryPreset: CategoryPreset
  defaultLightingPreset: LightingPreset
  defaultPlatforms: Platform[]
  defaultLanguage: Language
}
