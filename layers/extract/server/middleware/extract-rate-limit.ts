import { createRateLimiter } from '../utils/rate-limit'
import { ExtractFailure } from '../utils/extract-failure'

let limiter: ReturnType<typeof createRateLimiter> | undefined

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/extract')) return
  const config = useRuntimeConfig(event).extract
  // Server-side rendering calls in-process; the visitor's page request was the one to count.
  if (getRequestHeader(event, 'x-metacheck-internal') === config.internalToken) return

  limiter ??= createRateLimiter({ limit: config.rateLimit, windowMs: 60_000 })
  const ip = getRequestHeader(event, 'x-nf-client-connection-ip') ?? getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const result = limiter.hit(ip)
  setResponseHeader(event, 'ratelimit-limit', config.rateLimit)
  setResponseHeader(event, 'ratelimit-remaining', result.remaining)
  if (!result.ok) {
    setResponseHeader(event, 'retry-after', result.retryAfter)
    setResponseHeader(event, 'cache-control', 'no-store')
    setResponseStatus(event, 429)
    return new ExtractFailure('RATE_LIMITED', 429, `You’ve checked a lot of pages in a short time. Try again in ${result.retryAfter} seconds.`).toJSON()
  }
})
