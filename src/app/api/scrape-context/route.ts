import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type ScrapedProduct = { name: string; price?: string; rating?: string; reviewCount?: string; scarce?: boolean }

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€", USD: "$", GBP: "£", HUF: "Ft", PLN: "zł", CHF: "CHF", JPY: "¥", CAD: "$", AUD: "$",
}

function formatPrice(rawAmount: unknown, rawCurrency?: unknown): string | undefined {
  const num = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount ?? "").replace(",", "."))
  if (!Number.isFinite(num) || num <= 0) return undefined
  const amount = Number.isInteger(num) ? String(num) : num.toFixed(2)
  const currency = typeof rawCurrency === "string" ? rawCurrency.toUpperCase() : undefined
  if (!currency) return amount
  const symbol = CURRENCY_SYMBOLS[currency]
  return symbol ? `${symbol}${amount}` : `${amount} ${currency}`
}

// Walks parsed JSON-LD looking for schema.org Product nodes — handles single products,
// @graph wrappers, and ItemList/ListItem roundups (common on "best of" affiliate pages).
function collectProductNodes(node: unknown, out: Record<string, unknown>[], depth = 0): void {
  if (depth > 6 || !node || typeof node !== "object") return
  if (Array.isArray(node)) {
    for (const item of node) collectProductNodes(item, out, depth + 1)
    return
  }
  const obj = node as Record<string, unknown>
  const type = obj["@type"]
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) out.push(obj)
  for (const key of ["@graph", "itemListElement", "item", "hasPart"]) {
    if (key in obj) collectProductNodes(obj[key], out, depth + 1)
  }
}

function extractPrice(product: Record<string, unknown>): string | undefined {
  const offers = product["offers"]
  const offerList = Array.isArray(offers) ? offers : offers ? [offers] : []
  const prices: { amount: number; currency?: string }[] = []
  for (const offer of offerList) {
    if (!offer || typeof offer !== "object") continue
    const o = offer as Record<string, unknown>
    const spec = o["priceSpecification"] as Record<string, unknown> | undefined
    // AggregateOffer (common for multi-variant products) has no flat "price", only a lowPrice/highPrice range.
    const rawAmount = o["price"] ?? spec?.["price"] ?? o["lowPrice"]
    const rawCurrency = o["priceCurrency"] ?? spec?.["priceCurrency"]
    const num = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount ?? "").replace(",", "."))
    if (Number.isFinite(num) && num > 0) prices.push({ amount: num, currency: typeof rawCurrency === "string" ? rawCurrency : undefined })
  }
  if (prices.length === 0) return undefined
  const cheapest = prices.reduce((a, b) => (a.amount <= b.amount ? a : b))
  return formatPrice(cheapest.amount, cheapest.currency)
}

// Star rating + review count are a strong, verifiable proof point for hooks
// ("4.8★ from 340 buyers" beats a vague "everyone's asking about it").
function extractRating(product: Record<string, unknown>): { rating?: string; reviewCount?: string } {
  const agg = product["aggregateRating"]
  if (!agg || typeof agg !== "object") return {}
  const o = agg as Record<string, unknown>
  const ratingRaw = o["ratingValue"]
  const countRaw = o["reviewCount"] ?? o["ratingCount"]
  const ratingNum = typeof ratingRaw === "number" ? ratingRaw : parseFloat(String(ratingRaw ?? "").replace(",", "."))
  const countNum = typeof countRaw === "number" ? countRaw : parseInt(String(countRaw ?? "").replace(/[,.]/g, ""), 10)
  const rating = Number.isFinite(ratingNum) && ratingNum > 0 && ratingNum <= 5 ? ratingNum.toFixed(1) : undefined
  const reviewCount = Number.isFinite(countNum) && countNum > 0 ? countNum.toLocaleString("en-US") : undefined
  return { rating, reviewCount }
}

// Reads schema.org Offer.availability (e.g. "https://schema.org/LimitedAvailability").
// unavailable = never tease something the reader can't actually buy.
// scarce = a real, honest urgency signal ("almost sold out") — only ever true from real data.
function extractAvailability(product: Record<string, unknown>): { unavailable: boolean; scarce: boolean } {
  const offers = product["offers"]
  const offerList = Array.isArray(offers) ? offers : offers ? [offers] : []
  let sawAny = false
  let anyAvailable = false
  let anyUnavailable = false
  let anyLimited = false
  for (const offer of offerList) {
    if (!offer || typeof offer !== "object") continue
    const raw = (offer as Record<string, unknown>)["availability"]
    if (typeof raw !== "string") continue
    const token = raw.split("/").pop()?.toLowerCase() ?? ""
    if (!token) continue
    sawAny = true
    if (token === "outofstock" || token === "soldout" || token === "discontinued") anyUnavailable = true
    else anyAvailable = true
    if (token === "limitedavailability") anyLimited = true
  }
  if (!sawAny) return { unavailable: false, scarce: false } // no data = assume available, don't guess
  return { unavailable: anyUnavailable && !anyAvailable, scarce: anyLimited }
}

// Pulls real product names + prices out of a page's JSON-LD structured data so captions can
// tease ONE concrete detail instead of a vague "prices in the link". OG-tag and microdata
// fallbacks for pages with no JSON-LD live in the route handler, where the attribute-order-safe
// getMeta/getMicrodata helpers already exist — no need to duplicate that parsing here.
function extractProducts(html: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = []
  const seen = new Set<string>()

  const scriptBlocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).slice(0, 20)
  for (const match of scriptBlocks) {
    const raw = match[1].slice(0, 50000).trim()
    if (!raw) continue
    let parsed: unknown
    try { parsed = JSON.parse(raw) } catch { continue }
    const nodes: Record<string, unknown>[] = []
    collectProductNodes(parsed, nodes)
    for (const node of nodes) {
      const name = typeof node["name"] === "string" ? node["name"].trim() : ""
      if (!name || seen.has(name.toLowerCase())) continue
      const { unavailable, scarce } = extractAvailability(node)
      if (unavailable) continue // never tease a product the reader can't actually buy
      seen.add(name.toLowerCase())
      products.push({ name, price: extractPrice(node), ...extractRating(node), scarce: scarce || undefined })
      if (products.length >= 8) return products
    }
  }

  return products
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body as { url?: string }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ title: "", description: "", url: "", error: "Missing URL" }, { status: 400 })
    }

    if (url.length > 500 || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return NextResponse.json({ title: "", description: "", url, error: "Invalid URL" }, { status: 400 })
    }

    // SSRF protection: block private/internal IP ranges
    try {
      const parsed = new URL(url)
      const hostname = parsed.hostname.toLowerCase()
      const isPrivate =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        // IPv4 private ranges
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
        // AWS/GCP/Azure metadata endpoints
        hostname === "169.254.169.254" ||
        hostname === "metadata.google.internal" ||
        hostname.endsWith(".internal") ||
        hostname.endsWith(".local")
      if (isPrivate) {
        return NextResponse.json({ title: "", description: "", url, error: "Invalid URL" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ title: "", description: "", url, error: "Invalid URL" }, { status: 400 })
    }

    let html: string
    try {
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      })

      if (!resp.ok) {
        return NextResponse.json({ title: "", description: "", url, error: "Could not fetch page" }, { status: 200 })
      }

      html = await resp.text()
    } catch {
      return NextResponse.json({ title: "", description: "", url, error: "Could not fetch page" }, { status: 200 })
    }

    const getMeta = (name: string): string => {
      const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']{1,500})["']`, "i"))
        ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+(?:name|property)=["']${name}["']`, "i"))
      return m ? m[1].trim() : ""
    }

    const getTag = (tag: string): string => {
      const m = html.match(new RegExp(`<${tag}[^>]*>([^<]{1,300})<\/${tag}>`, "i"))
      return m ? m[1].replace(/\s+/g, " ").trim() : ""
    }

    // schema.org Microdata (older pattern, still seen on some WooCommerce/legacy themes) —
    // same dual-attribute-order handling as getMeta, since HTML attribute order isn't guaranteed.
    const getMicrodata = (itemprop: string): string => {
      const m = html.match(new RegExp(`<[^>]+itemprop=["']${itemprop}["'][^>]+content=["']([^"']{1,500})["']`, "i"))
        ?? html.match(new RegExp(`<[^>]+content=["']([^"']{1,500})["'][^>]+itemprop=["']${itemprop}["']`, "i"))
      return m ? m[1].trim() : ""
    }

    // Title: prefer og:title or article-specific h1 over generic <title>
    const ogTitle = getMeta("og:title")
    const h1 = getTag("h1")
    const pageTitle = getTag("title")
    const title = ogTitle || h1 || pageTitle

    // Description: prefer og:description, then pull first meaty paragraph from article body
    const ogDesc = getMeta("og:description")
    const metaDesc = getMeta("description")

    // Extract real article content — find paragraphs with actual substance
    let articleContent = ""
    if (!ogDesc || ogDesc.length < 60) {
      const paragraphs = Array.from(html.matchAll(/<p[^>]*>([^<]{80,600})<\/p>/gi))
        .map(m => m[1].replace(/\s+/g, " ").trim())
        .filter(p => !p.includes("cookie") && !p.includes("privacy") && !p.includes("©"))
        .slice(0, 3)
      if (paragraphs.length > 0) {
        articleContent = paragraphs.join(" ").slice(0, 400)
      }
    }

    // Also extract h2 headings as topic keywords
    const h2s = Array.from(html.matchAll(/<h2[^>]*>([^<]{5,100})<\/h2>/gi))
      .map(m => m[1].replace(/\s+/g, " ").trim())
      .slice(0, 5)
    const h2Keywords = h2s.join(", ")

    const description = ogDesc || articleContent || metaDesc
    const keywords = h2Keywords ? `Topics: ${h2Keywords}` : ""

    // Tiered product/price extraction — JSON-LD first (most reliable, handles multi-product
    // roundups), then OG product tags, then legacy schema.org microdata. Each tier only runs
    // if the previous one found nothing; all three reuse the attribute-order-safe getMeta/getMicrodata.
    const jsonLdProducts = extractProducts(html)
    const fallbackProductTitle = ogTitle || h1
    const ogPriceAmount = getMeta("product:price:amount")
    const microdataPriceAmount = getMicrodata("price")
    const rawProducts: ScrapedProduct[] = jsonLdProducts.length > 0
      ? jsonLdProducts
      : ogPriceAmount && fallbackProductTitle
        ? [{ name: fallbackProductTitle, price: formatPrice(ogPriceAmount, getMeta("product:price:currency")) }]
        : microdataPriceAmount && fallbackProductTitle
          ? [{ name: fallbackProductTitle, price: formatPrice(microdataPriceAmount, getMicrodata("priceCurrency")) }]
          : []

    // Strip control chars and anything that looks like prompt injection
    // before this content enters an AI system prompt
    const scrub = (s: string, max: number) =>
      s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
       .replace(/\b(ignore|disregard|forget|override)\b.{0,80}(instruction|prompt|previous|above)/gi, "[…]")
       .trim()
       .slice(0, max)

    const products = rawProducts
      .map((p) => ({
        name: scrub(p.name, 80),
        price: p.price ? scrub(p.price, 20) : undefined,
        rating: p.rating ? scrub(p.rating, 6) : undefined,
        reviewCount: p.reviewCount ? scrub(p.reviewCount, 12) : undefined,
        scarce: p.scarce || undefined,
      }))
      .filter((p) => p.name)
      .slice(0, 8)

    return NextResponse.json({
      title: scrub(title, 200),
      description: scrub([description, keywords].filter(Boolean).join(" | "), 600),
      products,
      url,
    })
  } catch (err) {
    console.error("[/api/scrape-context]", err)
    return NextResponse.json({ title: "", description: "", url: "", error: "Could not fetch page" }, { status: 200 })
  }
}
