import { describe, expect, it } from 'vitest'
import { createRateLimiter } from '../../server/utils/rate-limit'

describe('createRateLimiter', () => {
  it('allows up to the limit per window, per key', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 })
    expect([1, 2, 3].map(() => limiter.hit('a', 1000).ok)).toEqual([true, true, true])
    expect(limiter.hit('a', 1000)).toEqual({ ok: false, remaining: 0, retryAfter: 60 })
    expect(limiter.hit('b', 1000).ok).toBe(true)
  })

  it('slides: old hits expire', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000 })
    limiter.hit('a', 0)
    limiter.hit('a', 5_000)
    expect(limiter.hit('a', 9_000)).toMatchObject({ ok: false, retryAfter: 1 })
    expect(limiter.hit('a', 10_001)).toMatchObject({ ok: true, remaining: 0 })
  })
})
