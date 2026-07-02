import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://ombryth.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The product and API surfaces are auth-gated — keep them out of the index.
      disallow: ["/app", "/api", "/login", "/reset-password", "/forgot-password"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  }
}
