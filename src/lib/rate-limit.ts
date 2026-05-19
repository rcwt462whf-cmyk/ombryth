// Simple in-memory rate limiter — resets on server restart
// Good enough for a small SaaS; upgrade to Redis/Upstash when scaling

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 8   // max 8 generate calls per user per minute

interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now()
  const entry = store.get(userId)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    store.set(userId, { count: 1, windowStart: now })
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetInMs: WINDOW_MS }
  }

  if (entry.count >= MAX_REQUESTS) {
    const resetInMs = WINDOW_MS - (now - entry.windowStart)
    return { allowed: false, remaining: 0, resetInMs }
  }

  entry.count++
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetInMs: WINDOW_MS - (now - entry.windowStart) }
}
