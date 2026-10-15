// §9.4 fallback rate limit: a sliding window per key, in memory. Each server instance counts on
// its own, so this bounds bursts rather than global use; platform-level limits are the real cap.

export interface RateLimitResult {
  ok: boolean
  remaining: number
  /** Seconds until a request is allowed again. */
  retryAfter: number
}

export function createRateLimiter({ limit, windowMs }: { limit: number, windowMs: number }) {
  const hits = new Map<string, number[]>()
  let lastSweep = 0

  function sweep(now: number) {
    if (now - lastSweep < windowMs) return
    lastSweep = now
    for (const [key, times] of hits) {
      if (!times.length || times[times.length - 1]! <= now - windowMs) hits.delete(key)
    }
  }

  return {
    hit(key: string, now = Date.now()): RateLimitResult {
      sweep(now)
      const recent = (hits.get(key) ?? []).filter(t => t > now - windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((recent[0]! + windowMs - now) / 1000)) }
      }
      recent.push(now)
      hits.set(key, recent)
      return { ok: true, remaining: limit - recent.length, retryAfter: 0 }
    },
  }
}
