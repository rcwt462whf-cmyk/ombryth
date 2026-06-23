// Shared caption-generation engine — used by both /api/generate and /api/rewrite-captions
// so the click-optimized prompt logic can never drift between the two paths.

const DEFAULT_SYSTEM_PERSONA =
  "You are a Pinterest content specialist for home decor, interior design, bathroom, kitchen, wellness and indoor plants niches. Write like a knowledgeable friend — direct, honest, specific. Never use filler or hype words. Use 1-2 emojis per caption placed naturally where they add personality."

// Rotating hook formulas — each OPENS a gap the reader can only close by clicking through.
// Never resolve the gap in the caption: the payoff (products, steps, list, prices) lives behind the link.
// Keep this list large and varied so diagnostics (e.g. Vynthr) can isolate which hooks drive outbound clicks.
const HOOK_STYLES = [
  { name: "withheld-list",     instruction: `HOOK — Withheld list: name how many things matter and tease only ONE, leaving the rest behind the link. e.g. "Four things make a reading corner actually work — the lamp is just the first." or "Three swaps fixed this whole living room. Here's the one most people skip."` },
  { name: "problem-promise",   instruction: `HOOK — Problem + promise: name a specific frustration the reader feels, then signal the fix is one click away. e.g. "Your living room feels flat after dark — and it isn't the paint." or "Most rental corners feel dead. This one didn't take much to fix."` },
  { name: "result-howhidden",  instruction: `HOOK — Result, method hidden: state an enviable result but keep the exact how behind the link. e.g. "This corner went from dead space to the most-used seat in the house." or "Same room, completely different mood — and it wasn't a renovation."` },
  { name: "mistake-fix",       instruction: `HOOK — Mistake + fix behind link: name a common mistake, say the fix is quick, the steps are in the link. e.g. "One lighting mistake makes every room feel smaller. The fix takes ten minutes." or "Most people light a living room wrong. Here's the layout that works."` },
  { name: "which-ones",        instruction: `HOOK — Which ones: imply only SOME options are worth it and the shortlist is linked. e.g. "Not every arc lamp is worth it. The ones that are, are linked." or "Most floor lamps are too short — these aren't."` },
  { name: "before-you-buy",    instruction: `HOOK — Before you buy: warn there are things to check first, and they're in the link. e.g. "Before you buy a floor lamp, there are three things to check." or "Read this before you pick a living-room light."` },
  { name: "shoppable",         instruction: `HOOK — Shoppable: signal every piece in the image is linked and ready to shop. e.g. "Everything in this corner is linked — including the lamp." or "Yes, you can get this exact setup. All of it's in the link."` },
  { name: "cost-reveal",       instruction: `HOOK — Cost reveal: pair a desirable result with an approachable cost, full list behind the link. e.g. "This corner came together for less than one big-box sofa." or "A hotel-feel lighting setup, mostly under €100 — list in the link."` },
  { name: "this-or-that",      instruction: `HOOK — This or that: pose a binary the reader has to resolve, with the verdict behind the link. e.g. "Arc lamp or floor lamp for a small room? One clearly wins." or "Warm bulbs or dimmers first? The answer surprises most people."` },
  { name: "almost-right",      instruction: `HOOK — Almost right: tell them they're one piece away, and that piece is in the link. e.g. "Your corner's almost there — it's missing one thing." or "Good bones, wrong light. The fix is small."` },
  { name: "stat-tease",        instruction: `HOOK — Stat tease: open with a specific, surprising number that sets up the why behind the link. e.g. "90% of the warmth in a room comes from light, not paint." or "Most living rooms have one light source. Good ones have three."` },
  { name: "callout-audience",  instruction: `HOOK — Audience callout: name exactly who this is for so the right person clicks. e.g. "If your rental corner feels dead, this is for you." or "Small living room, no overhead light? Start here."` },
  { name: "tested-shortlist",  instruction: `HOOK — Tested shortlist: imply many were tried and only a few made the cut, which are linked. e.g. "Tested a dozen floor lamps. Only three were worth keeping — they're linked." or "Most didn't make the cut. These did."` },
  { name: "timely",            instruction: `HOOK — Timely: tie to a moment so clicking feels urgent now. e.g. "Before the days get shorter, fix your lighting." or "Cozy-season starts with one swap — here's where to start."` },
  { name: "objection-flip",    instruction: `HOOK — Objection flip: pre-empt the "too expensive/hard" objection, proof behind the link. e.g. "Think a hotel-feel corner costs a fortune? Not this one." or "You don't need a renovation. You need these."` },
  { name: "demand-proof",      instruction: `HOOK — Demand proof: signal lots of people are already clicking/buying, payoff behind the link. e.g. "This is the corner everyone's been asking about." or "The most-clicked lamp this month — here's why."` },
  { name: "quick-win",         instruction: `HOOK — Quick win: tiny effort, real payoff, steps in the link. e.g. "Ten minutes, one swap, warmer room." or "One outlet, one lamp — the whole corner changes."` },
  { name: "regret-avoid",      instruction: `HOOK — Regret avoidance: name what people wish they'd known first, full list in the link. e.g. "The thing people wish they knew before buying a floor lamp." or "Two corners in, here's what actually matters."` },
]

// Rotating title formulas — built for CLICKS: search intent + a payoff that only exists behind the click.
// Keep this list large so diagnostics can isolate which title structures pull the most outbound clicks.
const TITLE_FORMULAS = [
  { name: "search-intent",   instruction: `Title matches what someone would actually type into search, framed to promise the answer. e.g. "Small living room lighting ideas that actually work" or "How to make a dark corner feel cozy"` },
  { name: "numbered-list",   instruction: `Title is a specific numbered list — listicles pull clicks, and the list lives behind the link. e.g. "5 floor lamps that make a corner feel intentional" or "3 lighting swaps that warm up any living room"` },
  { name: "how-to",          instruction: `Title is a concrete how-to with the payoff named. e.g. "How to light a living room so it feels warm at night" or "How to style a reading nook in a rental"` },
  { name: "before-you-buy",  instruction: `Title is a pre-purchase check or warning. e.g. "What to check before you buy a floor lamp" or "Read this before you choose living-room lighting"` },
  { name: "get-this-look",   instruction: `Title promises the exact look is replicable and shoppable. e.g. "Get this warm reading corner — everything linked" or "Recreate this cozy living room, piece by piece"` },
  { name: "comparison",      instruction: `Title sets up a comparison whose verdict is behind the click. e.g. "Arc lamp vs floor lamp: which actually works in a small room" or "Warm vs cool bulbs: what changes after dark"` },
  { name: "outcome-cost",    instruction: `Title leads with the outcome + an approachable cost. e.g. "A hotel-feel living-room corner for under €200" or "The cozy-corner setup that didn't cost much"` },
  { name: "mistake-reveal",  instruction: `Title names a mistake and implies the fix is inside. e.g. "The lighting mistake that makes living rooms feel cold" or "Why your corner feels unfinished — and the fix"` },
  { name: "question-search", instruction: `Title is a real question people search, answered behind the click. e.g. "Why does my living room feel cold at night?" or "What lighting makes a small room feel bigger?"` },
  { name: "for-audience",    instruction: `Title pairs an outcome with a specific space or audience. e.g. "Lighting ideas for small rentals" or "Cozy corner setups for north-facing rooms"` },
  { name: "checklist",       instruction: `Title promises a short checklist to get right before acting. e.g. "The 4-point checklist before you buy a floor lamp" or "5 things to fix before you restyle a living room"` },
  { name: "no-x-needed",     instruction: `Title promises the outcome without the expected cost/effort. e.g. "A warmer living room — no renovation needed" or "Hotel-feel lighting without rewiring anything"` },
  { name: "ranked",          instruction: `Title promises a ranked verdict, the ranking behind the click. e.g. "The best floor lamps for small rooms, ranked" or "Warmest-to-coolest bulbs, ranked for living rooms"` },
  { name: "mistakes-list",   instruction: `Title is a numbered list of mistakes, the list behind the click. e.g. "6 living room mistakes that quietly make it feel cheap" or "3 lighting mistakes almost everyone makes"` },
  { name: "this-year",       instruction: `Title ties to the current year for timely search. e.g. "Living room lighting ideas worth trying in 2026" or "The cozy-corner setup everyone's copying in 2026"` },
  { name: "where-to-buy",    instruction: `Title promises sourcing — where to actually find it without overpaying. e.g. "Where to actually find a good arc lamp (without overpaying)" or "The affordable version of that viral floor lamp"` },
]

// Rotating content angles — each makes the CLICK the only way to get the real value.
// Named so diagnostics can attribute outbound clicks to the angle, not just the hook/title.
const CONTENT_ANGLES = [
  { name: "shopping-list",    instruction: `ANGLE: Shopping-list — hint that the exact products (and where to buy them) are all linked. The value is the click-through to shop.` },
  { name: "step-by-step",     instruction: `ANGLE: Step-by-step — tease that the full how-to / setup order lives in the linked guide.` },
  { name: "shortlist",        instruction: `ANGLE: Shortlist — imply you tested many options and only the few worth buying are in the link.` },
  { name: "checklist",        instruction: `ANGLE: Checklist — there's a short list of things to get right; the full checklist is one click away.` },
  { name: "cost-breakdown",   instruction: `ANGLE: Cost breakdown — show the result is affordable and put the full costs + sources behind the link.` },
  { name: "mistakes-to-avoid",instruction: `ANGLE: Mistakes-to-avoid — name one mistake, keep the rest of the list in the link.` },
  { name: "comparison",       instruction: `ANGLE: Comparison — set up two options and keep the full verdict / which-to-buy behind the link.` },
  { name: "where-to-buy",     instruction: `ANGLE: Where-to-buy — focus on sourcing; the exact places to buy (without overpaying) are in the link.` },
  { name: "how-much",         instruction: `ANGLE: How-much — tease the real total cost and put the itemised numbers behind the link.` },
  { name: "timing",           instruction: `ANGLE: Timing — focus on when to do this / seasonal relevance, full timing guide in the link.` },
  { name: "swap-guide",       instruction: `ANGLE: Swap-guide — frame it as "replace X with Y"; the full swap list and picks are in the link.` },
  { name: "ranked-picks",     instruction: `ANGLE: Ranked-picks — imply a ranked set of options; the ranking and links are one click away.` },
]

// Rotating click-CTAs — each names exactly what the reader GETS by clicking. Never generic "link in bio".
// Kept large so diagnostics can isolate which CTA wording converts to the most outbound clicks.
const CTA_STYLES = [
  "I linked every piece — prices in the link. 👇",
  "Full breakdown + sources in the link. 👇",
  "Shopping list with links here. 👇",
  "Exact products in the link. 👇",
  "Step-by-step + links in the guide. 👇",
  "Everything's linked — tap through. 👇",
  "Get the full list in the link. 👇",
  "Prices and links in the guide. 👇",
  "Sources + where to buy in the link. 👇",
  "The full list's one tap away. 👇",
  "Every piece linked below. 👇",
  "Full setup + costs in the link. 👇",
  "See the ranked picks in the link. 👇",
  "Grab the checklist in the link. 👇",
  "The verdict's in the link. 👇",
  "Tap through for all the links. 👇",
]
const LANGUAGE_NAMES: Record<string, string> = {
  "en": "English", "es": "Spanish", "pt-BR": "Brazilian Portuguese",
  "fr": "French", "de": "German", "it": "Italian",
  "nl": "Dutch", "pl": "Polish", "hu": "Hungarian",
}

// Per-platform spec + JSON schema, assembled on demand so the model only writes
// the platforms the user actually selected (no wasted tokens on hidden output).
const PLATFORM_SPECS: Record<string, string> = {
  pinterest: `PINTEREST (the title is your single biggest click lever — make it search-friendly AND promise a payoff):
- Title: max 100 chars. Use the TITLE FORMULA above and INCLUDE the subject's main keyword. Should read like something a person would actually search, with a clear reason to click. No hashtags.
- Description: 2-3 short sentences. Open the gap with the HOOK FORMULA, build a little desire, then end with the assigned CTA. 1 emoji minimum. Do NOT give away the specifics.
- Alt text: describe what's visible (materials, colours, objects, lighting). End with topic + "guide 2026."
- Caption: same click goal from a different angle — do not just rephrase the description. Ends with the assigned CTA.
- Hashtags (20): center on the SUBJECT, not incidental objects in the image. 8-10 subject-specific exact terms (subject "layered lighting" → #layeredlighting #livingroomlighting #ambientlighting), 6-8 topic (#livingroomdesign #lightingideas), 2-3 intent (#shopthelook #homedecorideas). No vanity tags (#home #design #beautiful), and no tags about props that aren't the subject.`,
  instagram: `INSTAGRAM:
- Caption: hook → 2-3 sentences that build the gap → assigned CTA. 150-250 chars total
- Hashtags (30): mix niche + topic + broad + intent`,
  facebook: `FACEBOOK:
- Caption: hook → 1-2 sentences → assigned CTA. Max 150 chars
- Hashtags: 3-5 broad only`,
  "google-ads": `GOOGLE-ADS (every line should pull the click):
- 3 headlines (≤30 chars each): benefit/outcome-led, at least one with a number or "get the look".
- 2 descriptions (≤90 chars each): name the payoff + an explicit click-through CTA.`,
}

const PLATFORM_JSON: Record<string, string> = {
  pinterest: `"pinterest": { "title": "...", "description": "...", "altText": "...", "caption": "...", "hashtags": ["no","hash","prefix"] }`,
  instagram: `"instagram": { "caption": "...", "altText": "...", "hashtags": ["30","tags"] }`,
  facebook: `"facebook": { "caption": "...", "altText": "...", "hashtags": ["5","tags"] }`,
  "google-ads": `"google-ads": { "headline1": "30 chars", "headline2": "30 chars", "headline3": "30 chars", "description1": "90 chars", "description2": "90 chars", "altText": "..." }`,
}

export function buildTextSystemPrompt(
  prompt: string,
  platforms: string[],
  customPersona?: string | null,
  destinationContext?: { title: string; description: string } | null,
  language?: string | null,
  productDescription?: string,
  hasImage?: boolean,
  subject?: string
): { prompt: string; variants: { hook: string; title: string; angle: string; cta: string } } {
  const persona = customPersona?.trim() || DEFAULT_SYSTEM_PERSONA

  // Pick a random hook style, title formula, and content angle — forces genuine variety
  const hookStyle = HOOK_STYLES[Math.floor(Math.random() * HOOK_STYLES.length)]
  const titleFormula = TITLE_FORMULAS[Math.floor(Math.random() * TITLE_FORMULAS.length)]
  const contentAngle = CONTENT_ANGLES[Math.floor(Math.random() * CONTENT_ANGLES.length)]
  const ctaStyle = CTA_STYLES[Math.floor(Math.random() * CTA_STYLES.length)]

  // Build specs + JSON schema for ONLY the selected platforms (avoids generating hidden, paid-for captions).
  const platformSpecs = platforms.map((p) => PLATFORM_SPECS[p]).filter(Boolean).join("\n\n")
  const jsonSchema = `{ ${platforms.map((p) => PLATFORM_JSON[p]).filter(Boolean).join(", ")} }`

  const subjectBlock = subject
    ? `\nSUBJECT — what this post is about. Every title, hook, description, caption and hashtag MUST be about this:\n→ ${subject}\n`
    : ""

  const destinationBlock = destinationContext?.title || destinationContext?.description
    ? `\nWHAT THE LINK DELIVERS — this is the payoff to tease. Build the gap so the reader must click to get it; do NOT restate it verbatim and never print the URL:\n• Page: "${destinationContext.title}"\n• Covers: "${destinationContext.description}"\nLet this decide the angle and the exact value you withhold — reason from it, don't just append it.\n`
    : ""

  const productBlock = productDescription
    ? `\nFEATURED PRODUCT — must be referenced specifically (its look, style and use), not as a generic scene: ${productDescription}\n`
    : ""

  const imageRef = hasImage
    ? "An image is attached — treat it as visual proof of the SUBJECT. Pull only the details that support the subject; ignore prominent objects that aren't the subject."
    : `The lifestyle image shows: "${prompt}". Use it as visual proof of the SUBJECT, not as a list of things to describe.`

  const body = `${persona}

PRIMARY OBJECTIVE — the only success metric is the OUTBOUND CLICK:
Every title, description and caption exists to make the viewer click through to the destination link. We are NOT optimising for saves, likes or follows — a save with no click is a failure. The image already earns the save; your copy's only job is to open a curiosity or value gap the viewer can ONLY close by clicking. Withhold the specifics — the exact products, prices, steps, shortlist or sources live behind the link. Tease enough that not clicking feels like missing out, but never resolve the gap in the caption itself.
${subjectBlock}${productBlock}${destinationBlock}
TOPIC DISCIPLINE — non-negotiable, this is the #1 failure to avoid:
- Lock onto the ONE subject above before writing. Title, hook, description, caption AND hashtags must all be about that subject.
- The image contains other eye-catching objects, colours and props. Do NOT write the post about them unless they ARE the subject. Example: subject "3-layer lighting in a living room" → write about the lighting layers (ambient / task / accent, warmth, placement), NOT the sofa, rug or art — even if they dominate the frame.
- If the subject and the most prominent object differ, the SUBJECT wins every time.

THE IMAGE: ${imageRef}

${contentAngle.instruction}

HOOK FORMULA FOR THIS GENERATION:
${hookStyle.instruction}
Open the gap with this structure — do not copy the example literally, and do NOT resolve it. The payoff stays behind the link.

TITLE FORMULA FOR THIS GENERATION:
${titleFormula.instruction}
Write a title that follows this structure — do not copy the example literally. Vary your sentence structure and starting word.

CTA FOR THIS GENERATION (use it verbatim as the closing line of the Pinterest description and the Instagram/Facebook captions):
"${ctaStyle}"

⚠️ MANDATORY NON-NEGOTIABLES — failure on any of these is unacceptable:
1. ON SUBJECT: Every field — title, hook, description, caption, hashtags — is about the SUBJECT (see TOPIC DISCIPLINE). The Pinterest title MUST contain the subject's main keyword. Off-subject copy is an automatic failure no matter how well it reads.
2. CLICK GAP: Make the link the only way to get the specifics. Never list the actual products, full steps, prices or the full list in the caption — name the payoff, then point to the link.
3. CTA: End every description/caption with the assigned CTA above, exactly as written. Never "on the blog", never "link in bio".
4. EMOJIS: Include 1-2 emojis in every caption/description, placed naturally. Pick from: 🌿 💡 🚿 🛏️ 🏺 🌱 🪵 🏡 ✨ 👇 🪴 🧼
5. HOOK: First sentence must use the hook formula — short, punchy, and it must leave something unresolved.
6. TONE: Warm, conversational, like a knowledgeable friend. Not dry, not clinical, not a product listing.
7. VARIETY: Every generation must feel distinct. Do not reuse the same opening word, sentence structure, or angle across title/description/caption.
8. SELF-CHECK before returning: Does the title name the subject and read like a real search? Would someone who wants the subject click? Are the hashtags about the subject, not incidental props? If any field drifts off-subject, rewrite it.

BANNED WORDS: stunning, gorgeous, amazing, game-changing, transform, elevate, discover, nobody tells you, the secret to, say hello to, find the perfect, level up, bullet points, "nestled", "tucked". Avoid first-person "I" except inside a natural CTA (e.g. "I linked every piece").
BANNED TITLE PATTERNS: "The [noun] that [verb]" is overused — only use it if it's the assigned title formula. Never start every title with "The".

${platformSpecs}

Return ONLY valid JSON for the selected platform(s): ${platforms.join(", ")}. Do NOT include keys for any other platform.
${jsonSchema}
Return ONLY the JSON. No markdown.${language && language !== "en" ? `\n\nLANGUAGE: Write ALL output in ${LANGUAGE_NAMES[language] ?? language} as a native speaker. Hashtags: joinedwords, no spaces.` : ""}`

  return {
    prompt: body,
    variants: {
      hook: hookStyle.name,
      title: titleFormula.name,
      angle: contentAngle.name,
      cta: ctaStyle,
    },
  }
}
