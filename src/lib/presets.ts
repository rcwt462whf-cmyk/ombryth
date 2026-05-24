import type { LightingPreset } from "@/types"

// ─── Niche + Style Preset system ───────────────────────────────────────────────

export type NicheStyle = {
  label: string
  promptModifier: string
}

export type NichePreset = {
  label: string
  emoji: string
  promptBase: string
  styles: Record<string, NicheStyle>
}

export type CustomPreset = { id: string; label: string; promptModifier: string }
export type CustomNiche = {
  id: string
  name: string
  emoji: string
  prompt_base: string
  presets: CustomPreset[]
  created_at?: string
}

export const NICHE_PRESETS: Record<string, NichePreset> = {
  "home-decor": {
    label: "Home Decor", emoji: "🏠",
    promptBase: "home decor and interior styling scene",
    styles: {
      "minimalist": { label: "Minimalist", promptModifier: "clean minimalist aesthetic, neutral whites and beiges, uncluttered surfaces, Scandinavian design" },
      "cozy": { label: "Cozy & Warm", promptModifier: "warm cozy hygge atmosphere, soft textiles, candlelight, earthy tones, layered throws" },
      "scandinavian": { label: "Scandinavian", promptModifier: "Scandinavian design, white walls, natural light wood, functional beauty, airy and bright" },
      "bohemian": { label: "Bohemian", promptModifier: "bohemian boho chic, layered textiles, rattan, indoor plants, warm earthy palette" },
      "luxury": { label: "Luxury", promptModifier: "luxury interior, marble surfaces, gold and brass accents, high-end materials, editorial quality" },
    },
  },
  "beauty": {
    label: "Beauty & Skincare", emoji: "💄",
    promptBase: "beauty and skincare product lifestyle scene",
    styles: {
      "flat-lay": { label: "Flat Lay", promptModifier: "overhead flat lay on clean white or marble surface, neatly arranged products, elegant composition" },
      "vanity": { label: "Vanity Setup", promptModifier: "vanity table setup with mirror, soft warm lighting, feminine and luxurious aesthetic" },
      "spa": { label: "Spa Aesthetic", promptModifier: "spa-like serene setting, white towels, botanicals, soft diffused natural lighting" },
      "editorial": { label: "Editorial", promptModifier: "bold beauty editorial shot, dramatic studio lighting, high contrast, fashion magazine quality" },
      "natural": { label: "Natural Glow", promptModifier: "natural window light in bathroom or bedroom, fresh glowing aesthetic, clean and authentic" },
    },
  },
  "fashion": {
    label: "Fashion & Apparel", emoji: "👗",
    promptBase: "fashion and apparel lifestyle scene",
    styles: {
      "editorial": { label: "Editorial", promptModifier: "fashion editorial style, professional studio lighting, bold composition, high fashion quality" },
      "street": { label: "Street Style", promptModifier: "urban street style, city background, candid natural feel, authentic lifestyle moment" },
      "flat-lay": { label: "Flat Lay", promptModifier: "styled clothing flat lay, clean surface, accessories included, overhead shot, carefully composed" },
      "lifestyle": { label: "Lifestyle", promptModifier: "natural lifestyle setting, authentic real-life moment, warm and relatable" },
      "minimal": { label: "Minimal Studio", promptModifier: "clean studio background, minimal props, product-focused, crisp and modern" },
    },
  },
  "fitness": {
    label: "Fitness & Wellness", emoji: "💪",
    promptBase: "fitness and wellness lifestyle scene",
    styles: {
      "gym": { label: "Gym Setup", promptModifier: "gym environment, weights and equipment, energetic dynamic lighting, motivating atmosphere" },
      "outdoor": { label: "Outdoor Workout", promptModifier: "outdoor workout setting, nature or park background, active and energetic, natural sunlight" },
      "yoga": { label: "Yoga & Mindfulness", promptModifier: "yoga studio or serene outdoor space, calm and centred aesthetic, soft natural light" },
      "morning": { label: "Morning Ritual", promptModifier: "morning wellness routine, soft golden natural light, peaceful and fresh, motivating start" },
      "sports": { label: "Sports Action", promptModifier: "dynamic sports action scene, motion and energy, athletic performance, high energy" },
    },
  },
  "food": {
    label: "Food & Kitchen", emoji: "🍽️",
    promptBase: "food and kitchen lifestyle scene",
    styles: {
      "rustic": { label: "Rustic Table", promptModifier: "rustic wooden table, farmhouse aesthetic, natural linen, fresh herbs, artisanal feel" },
      "minimal": { label: "Clean & Minimal", promptModifier: "clean minimal food styling, white or light surfaces, simple elegant plating, refined" },
      "cafe": { label: "Café Aesthetic", promptModifier: "café coffee shop setting, warm tones, cosy morning vibe, latte art" },
      "dark-moody": { label: "Dark & Moody", promptModifier: "dark moody food photography, dramatic shadows, rich deep jewel tones, theatrical" },
      "bright": { label: "Bright & Fresh", promptModifier: "bright airy food photo, summer vibes, fresh colourful ingredients, natural light" },
    },
  },
  "tech": {
    label: "Tech & Gadgets", emoji: "💻",
    promptBase: "tech and gadget lifestyle scene",
    styles: {
      "desk": { label: "Clean Desk Setup", promptModifier: "minimalist clean desk setup, natural light, organised workspace, productive aesthetic" },
      "dark": { label: "Dark Aesthetic", promptModifier: "dark moody tech setup, subtle accent lighting, dramatic shadows, night-time vibe" },
      "creative": { label: "Creative Workspace", promptModifier: "creative workspace, plants and art prints, warm productive atmosphere, personalised desk" },
      "outdoor": { label: "Outdoor Use", promptModifier: "tech product used outdoors, natural environment, lifestyle shot, sunlight and nature" },
      "minimal": { label: "Minimal Studio", promptModifier: "clean product studio shot, pure white background, sharp and modern, tech-focused" },
    },
  },
  "pet": {
    label: "Pet Care", emoji: "🐾",
    promptBase: "pet care and pet lifestyle scene",
    styles: {
      "cozy-home": { label: "Cozy Home", promptModifier: "cozy home setting with pet, warm inviting atmosphere, soft furnishings, heartwarming" },
      "outdoor": { label: "Outdoor Adventure", promptModifier: "outdoor adventure, nature and parks, active happy pet, natural golden light" },
      "playful": { label: "Playful", promptModifier: "playful energetic scene with toys, bright colours, joyful fun atmosphere" },
      "lifestyle": { label: "Lifestyle", promptModifier: "lifestyle scene with pet and owner, authentic and heartwarming, natural connection" },
      "studio": { label: "Studio Portrait", promptModifier: "clean studio portrait shot, professional lighting, focused on pet, sharp detail" },
    },
  },
  "travel": {
    label: "Travel & Outdoor", emoji: "✈️",
    promptBase: "travel and outdoor lifestyle scene",
    styles: {
      "adventure": { label: "Adventure", promptModifier: "adventurous outdoor scene, mountains or forest, epic landscape, exploration spirit" },
      "resort": { label: "Luxury Resort", promptModifier: "luxury resort or hotel setting, infinity pool, tropical paradise, aspirational travel" },
      "backpacker": { label: "Backpacker", promptModifier: "authentic backpacker travel, hostel or local street scene, real wanderlust vibes" },
      "city": { label: "City Exploration", promptModifier: "urban city exploration, street photography style, architectural backdrop, metropolitan life" },
      "nature": { label: "Nature & Serenity", promptModifier: "serene nature setting, forests and lakes, untouched natural beauty, peaceful atmosphere" },
    },
  },
  "baby": {
    label: "Baby & Kids", emoji: "🧸",
    promptBase: "baby and kids product lifestyle scene",
    styles: {
      "nursery": { label: "Nursery", promptModifier: "soft nursery room setting, gentle pastel colours, safe and tender aesthetic" },
      "playroom": { label: "Playroom", promptModifier: "bright colourful playroom, cheerful toys and decor, joyful energetic atmosphere" },
      "outdoor": { label: "Outdoor Play", promptModifier: "outdoor garden or park setting, golden natural light, carefree and joyful" },
      "story-time": { label: "Story Time", promptModifier: "cosy reading nook, soft blankets, picture books and plush toys, warm lamp light" },
      "pastel": { label: "Pastel Lifestyle", promptModifier: "soft pastel lifestyle aesthetic, gentle muted tones, cute and sweet, clean background" },
    },
  },
  "books": {
    label: "Books & Stationery", emoji: "📚",
    promptBase: "books and stationery lifestyle scene",
    styles: {
      "bookshelf": { label: "Bookshelf", promptModifier: "curated bookshelf or library setting, organised spines, cosy academic atmosphere" },
      "coffee-table": { label: "Coffee Table", promptModifier: "coffee table books styling, minimal home decor aesthetic, aspirational lifestyle" },
      "study": { label: "Study Setup", promptModifier: "study desk setup, notebook and pens, productive focused student vibe" },
      "minimal-desk": { label: "Minimal Desk", promptModifier: "minimalist desk flat lay, clean surfaces, organised stationery, calm productive" },
      "cozy-reading": { label: "Cozy Reading", promptModifier: "cosy reading corner, armchair, warm lamp light, cup of tea, ultimate hygge" },
    },
  },
}

export const DEFAULT_NICHE = "home-decor"
export const DEFAULT_STYLE = "minimalist"

export function getNichePrompt(nicheKey: string, styleKey: string, customNiches?: CustomNiche[]): string {
  const niche = NICHE_PRESETS[nicheKey]
  if (niche) {
    const style = niche.styles[styleKey]
    return `${niche.promptBase}. Style: ${style?.promptModifier ?? niche.styles[Object.keys(niche.styles)[0]].promptModifier}`
  }
  const custom = customNiches?.find((n) => n.id === nicheKey)
  if (custom) {
    const preset = custom.presets.find((p) => p.id === styleKey)
    return `${custom.prompt_base || custom.name + " product lifestyle scene"}. Style: ${preset?.promptModifier ?? ""}`
  }
  return "lifestyle product scene"
}

// ─── Legacy category presets (kept for backward compat / history display) ──────

export type CategoryPresetLegacy = "home-decor" | "garden" | "bathroom" | "kitchen" | "sauna" | "balcony" | "custom"

// ─── Lighting presets (unchanged) ──────────────────────────────────────────────

export const LIGHTING_PRESETS: Record<LightingPreset, { label: string; emoji: string; append: string }> = {
  morning: {
    label: "Morning light",
    emoji: "☀️",
    append: "soft morning light, golden side light",
  },
  "golden-hour": {
    label: "Golden hour",
    emoji: "🌅",
    append: "warm golden hour backlight, amber tones",
  },
  overcast: {
    label: "Overcast",
    emoji: "☁️",
    append: "soft overcast light, even tones, no harsh shadows",
  },
  evening: {
    label: "Evening / cosy",
    emoji: "🌙",
    append: "warm amber evening light, cosy and dim",
  },
  "film-grain": {
    label: "Film grain (Canon)",
    emoji: "📷",
    append: "Canon 5D, 35mm, f/2.0, film grain, available light",
  },
  candid: {
    label: "Candid / real",
    emoji: "👥",
    append: "shot by a friend, 35mm, f/2.0, candid, no staging",
  },
  candlelight: {
    label: "Candlelight",
    emoji: "🕯️",
    append: "candlelight and one warm table lamp, no overhead light, dark and moody",
  },
}

export function buildPrompt(
  niche: string,
  lighting: LightingPreset,
  customPrompt?: string,
  productDescription?: string,
  aspectRatio?: string,
  stylePreset?: string,
  customNiches?: CustomNiche[]
): string {
  const nichePrompt = getNichePrompt(niche, stylePreset ?? DEFAULT_STYLE, customNiches)
  const lightingAppend = LIGHTING_PRESETS[lighting]?.append ?? ""

  let prompt = productDescription
    ? `${productDescription}, as the clear hero and focal point of the scene. Lifestyle setting: ${nichePrompt}, ${lightingAppend}`
    : `${nichePrompt}, ${lightingAppend}`
  if (customPrompt) prompt += `, ${customPrompt}`
  if (aspectRatio) prompt += `, ${aspectRatioToDescription(aspectRatio)}`
  return prompt
}

function aspectRatioToDescription(ratio: string): string {
  switch (ratio) {
    case "2:3": return "portrait orientation"
    case "1:1": return "square format"
    case "16:9": return "landscape widescreen"
    default: return ""
  }
}
