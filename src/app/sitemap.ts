import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ombryth.com"

// Only the public marketing/legal pages belong in the sitemap — the /app product and
// auth pages are gated and shouldn't be indexed.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ]
}
