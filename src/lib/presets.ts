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
    promptBase: "real interior lifestyle photograph, no people",
    styles: {
      "minimalist": { label: "Minimalist", promptModifier: "white plaster walls, pale oak floorboards, single low-profile sofa in off-white boucle, one ceramic vase, no clutter, floor-to-ceiling window, diffused daylight" },
      "cozy": { label: "Cozy & Warm", promptModifier: "chunky knit throws draped over linen sofa, sheepskin rug, birch wood side table, pillar candles, terracotta and amber tones, warm lamp light, dried pampas grass" },
      "scandinavian": { label: "Scandinavian", promptModifier: "white-painted wood panelling, light birch furniture, woven wool cushions, simple pendant lamp, green potted plant, clean lines, cool northern daylight" },
      "bohemian": { label: "Bohemian", promptModifier: "rattan hanging chair, layered kilim rugs, macramé wall hanging, trailing pothos and monstera plants, terracotta pots, warm earthy ochre and rust tones, woven baskets" },
      "luxury": { label: "Luxury", promptModifier: "Calacatta marble surfaces, brushed brass fixtures and handles, velvet cushions in deep emerald, fluted glass vase, architectural pendant light, glossy lacquered surfaces, editorial lighting" },
    },
  },
  "beauty": {
    label: "Beauty & Skincare", emoji: "💄",
    promptBase: "real lifestyle beauty photograph, no people",
    styles: {
      "flat-lay": { label: "Flat Lay", promptModifier: "overhead flat lay on white marble surface, glass dropper bottles, rose quartz roller, sprig of eucalyptus, soft shadows, clean composition, pastel silk fabric" },
      "vanity": { label: "Vanity Setup", promptModifier: "vintage Hollywood vanity mirror with warm globe bulbs, glass perfume bottles, gold tray with skincare products, fresh flowers in bud vase, marble counter, feminine and luxe" },
      "spa": { label: "Spa Aesthetic", promptModifier: "white rolled towels, bamboo tray with candle and jade stone, small bowl of dried flowers, misty bathroom background, stone basin, soft diffused window light, zen atmosphere" },
      "editorial": { label: "Editorial", promptModifier: "stark white studio backdrop, single product dramatically lit with hard side light, deep shadows, glossy reflective surface, high contrast, Vogue-level product shot" },
      "natural": { label: "Natural Glow", promptModifier: "windowsill in a bright bathroom, sheer linen curtain, morning sunlight casting soft shadows, amber glass bottles, dried lavender, worn wooden shelf, authentic and unposed" },
    },
  },
  "fashion": {
    label: "Fashion & Apparel", emoji: "👗",
    promptBase: "real lifestyle fashion photograph, no people",
    styles: {
      "editorial": { label: "Editorial", promptModifier: "clean cyclorama studio, dramatic Profoto strobe side lighting, garment on minimalist hanger or laid on seamless white, sharp shadows, fashion week aesthetic" },
      "street": { label: "Street Style", promptModifier: "European cobblestone street, iron balconies, morning light, café terrace in background, casual laid-on-steps composition, candid and authentic, 35mm film look" },
      "flat-lay": { label: "Flat Lay", promptModifier: "overhead flat lay on raw linen, folded garment with leather belt, silver jewellery, polaroid photo, dried flowers as props, carefully composed, natural daylight" },
      "lifestyle": { label: "Lifestyle", promptModifier: "sun-drenched apartment interior, whitewashed walls, garment hanging on antique brass hook or draped over cane chair, morning light, relaxed editorial feel" },
      "minimal": { label: "Minimal Studio", promptModifier: "pure seamless white studio background, product centred, single soft box light, no props, garment pressed and perfectly displayed, clean and commercial" },
    },
  },
  "fitness": {
    label: "Fitness & Wellness", emoji: "💪",
    promptBase: "real lifestyle fitness photograph, no people",
    styles: {
      "gym": { label: "Gym Setup", promptModifier: "industrial gym interior, rubber flooring, steel weight rack, chalk dust in air, dramatic window shafts of light, kettlebells and dumbbells arranged, moody high-contrast" },
      "outdoor": { label: "Outdoor Workout", promptModifier: "forest trail or outdoor track at golden hour, yoga mat or resistance bands on grass, long warm shadows, green nature backdrop, fresh and energetic feel" },
      "yoga": { label: "Yoga & Mindfulness", promptModifier: "light airy yoga studio, pale wood floor, white walls, rolled cork yoga mat, block and strap beside it, trailing green plant, soft diffused morning light, zen" },
      "morning": { label: "Morning Ritual", promptModifier: "kitchen counter at sunrise, glass water bottle with lemon slices, supplements in amber glass jar, white marble surface, soft peach morning light through blinds, healthy and fresh" },
      "sports": { label: "Sports Action", promptModifier: "stadium or court in background, sports equipment on the ground, shallow depth of field, dynamic composition, bright daylight, energy and motion frozen in time" },
    },
  },
  "food": {
    label: "Food & Kitchen", emoji: "🍽️",
    promptBase: "real food and kitchen lifestyle photograph, no people",
    styles: {
      "rustic": { label: "Rustic Table", promptModifier: "worn oak farmhouse table, rough linen napkin, ceramic bowl with fresh herbs, terracotta pot, sourdough loaf, olive oil bottle, dappled window light, artisanal and lived-in" },
      "minimal": { label: "Clean & Minimal", promptModifier: "pure white matte ceramic plate on white plaster surface, single ingredient or dish, minimal garnish, top-down or 45-degree angle, soft even studio light, refined and elegant" },
      "cafe": { label: "Café Aesthetic", promptModifier: "marble café table, ceramic flat white with latte art, flaky croissant on parchment, vintage spoon, small bud vase with flowers, morning light through large window, Parisian vibe" },
      "dark-moody": { label: "Dark & Moody", promptModifier: "dark slate or black walnut table, dramatic single candle or side light, rich jewel-toned linens, copper pot, deep shadows, wine glass, theatrical chiaroscuro lighting" },
      "bright": { label: "Bright & Fresh", promptModifier: "sun-flooded kitchen with open window, colourful fresh produce spilling from linen bag, white-painted wood, cheerful ceramic bowls, bright natural light, summer morning energy" },
    },
  },
  "tech": {
    label: "Tech & Gadgets", emoji: "💻",
    promptBase: "real tech lifestyle photograph, no people",
    styles: {
      "desk": { label: "Clean Desk Setup", promptModifier: "pale oak desk, white monitor on minimal stand, small succulent in concrete pot, leather mouse pad, cable-free surface, soft north-facing window light, productive calm" },
      "dark": { label: "Dark Aesthetic", promptModifier: "dark walnut desk, deep navy wall, subtle RGB underglow, matte black peripherals, single tungsten desk lamp casting warm pool of light, moody and atmospheric" },
      "creative": { label: "Creative Workspace", promptModifier: "cluttered creative studio desk, Pantone swatches, open sketchbook, potted trailing plant, art prints pinned to wall, warm Edison bulb light, lived-in and inspired" },
      "outdoor": { label: "Outdoor Use", promptModifier: "device on rustic wooden garden table, blurred green garden background, natural dappled sunlight, iced drink nearby, relaxed outdoor lifestyle, shallow depth of field" },
      "minimal": { label: "Minimal Studio", promptModifier: "pure white seamless studio, single device centred, soft box from above and left, no props, crisp sharp detail, clean commercial product photography" },
    },
  },
  "pet": {
    label: "Pet Care", emoji: "🐾",
    promptBase: "real pet lifestyle photograph, no people",
    styles: {
      "cozy-home": { label: "Cozy Home", promptModifier: "pet bed on wide-plank oak floor, chunky knit blanket, wicker basket nearby, warm lamp light from beside, cosy living room corner, shallow depth of field" },
      "outdoor": { label: "Outdoor Adventure", promptModifier: "forest trail or meadow, golden late-afternoon light filtering through trees, lead and collar on mossy log, adventure feel, warm tones, bokeh background" },
      "playful": { label: "Playful", promptModifier: "bright garden or playroom, scattered colourful rubber toys, rope toy and treat bag on grass, cheerful hard sunlight, joyful and energetic composition" },
      "lifestyle": { label: "Lifestyle", promptModifier: "sofa with linen throw, pet bowl and lead arranged on cushion, indoor plant in background, warm window light, cosy and aspirational, authentic lifestyle editorial" },
      "studio": { label: "Studio Portrait", promptModifier: "seamless grey or white studio backdrop, single Profoto key light, pet collar or toy centred, tack-sharp product focus, clean and professional" },
    },
  },
  "travel": {
    label: "Travel & Outdoor", emoji: "✈️",
    promptBase: "real travel lifestyle photograph, no people",
    styles: {
      "adventure": { label: "Adventure", promptModifier: "rugged mountain or forest trail, backpack and hiking boots on rock, dramatic sky, epic wide landscape, golden hour side light, worn map or compass as prop" },
      "resort": { label: "Luxury Resort", promptModifier: "private infinity pool overlooking tropical ocean, rattan sun lounger, white linen towel, tropical flowers in ceramic pot, late-afternoon golden light, aspirational calm" },
      "backpacker": { label: "Backpacker", promptModifier: "hostel dorm or local market street, worn canvas backpack open on bunk, passport and rail ticket visible, warm dusty light, authentic and unfiltered travel documentary feel" },
      "city": { label: "City Exploration", promptModifier: "European cobblestone street or metro station, travel items on iron café table, blurred city life in background, blue-hour or morning light, street photography aesthetic" },
      "nature": { label: "Nature & Serenity", promptModifier: "misty forest lake at dawn, wooden dock, folded wool blanket and thermos on mossy rock, still water reflection, cool blue-green tones, peaceful and untouched" },
    },
  },
  "baby": {
    label: "Baby & Kids", emoji: "🧸",
    promptBase: "real baby and kids lifestyle photograph, no people",
    styles: {
      "nursery": { label: "Nursery", promptModifier: "white-painted wood crib, folded muslin swaddle in sage green, small ceramic night light, mobile hanging above, pale oak floor, soft diffused morning window light, tender and calm" },
      "playroom": { label: "Playroom", promptModifier: "colourful open shelving with wooden toys, rainbow stacker, soft play mat, pastel painted wall, scattered board books, bright cheerful daylight, joyful and organised chaos" },
      "outdoor": { label: "Outdoor Play", promptModifier: "lush garden lawn, wooden balance bike leaning on fence, sandbox with sand moulds, golden afternoon light casting long shadows, green grass, carefree summer feel" },
      "story-time": { label: "Story Time", promptModifier: "low reading nook with floor cushion, pile of picture books, small knitted blanket, fabric teepee in background, warm low lamp light, cosy and imaginative" },
      "pastel": { label: "Pastel Lifestyle", promptModifier: "white painted floorboards, pastel mint and blush props, small linen-covered bunny toy, dried flower wreath on wall, soft diffused light, sweet and minimal Scandinavian nursery feel" },
    },
  },
  "books": {
    label: "Books & Stationery", emoji: "📚",
    promptBase: "real books and stationery lifestyle photograph, no people",
    styles: {
      "bookshelf": { label: "Bookshelf", promptModifier: "floor-to-ceiling built-in shelves with curated spines, small ceramic objects and dried botanicals between books, warm library lamp, dark wood and green walls, intellectual and cosy" },
      "coffee-table": { label: "Coffee Table", promptModifier: "marble or white oak coffee table, large format art book open, small sculpture and fresh flowers arranged on top, soft interior natural light, aspirational and minimal" },
      "study": { label: "Study Setup", promptModifier: "vintage wooden desk, open ruled notebook with fountain pen, brass desk lamp, stack of books, single potted fern, warm pool of lamplight, focused and scholarly" },
      "minimal-desk": { label: "Minimal Desk", promptModifier: "pale concrete desk surface, single pen on open white notebook, washi tape dispenser, small geometric object, cool diffused daylight from left, calm and intentional" },
      "cozy-reading": { label: "Cozy Reading", promptModifier: "deep linen armchair, open book face-down on armrest, ceramic mug of tea on side table, chunky knit blanket pooled on floor, warm amber lamp, rain on window in background" },
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
