import { describe, expect, it } from 'vitest'
import { normalizeTargetUrl } from '../../shared/utils/target-url'

describe('normalizeTargetUrl (FR-1.1)', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['  https://Example.COM/path?q=1#frag  ', 'https://example.com/path?q=1'],
    ['http://example.com', 'http://example.com/'],
    ['example.com:8080/a', 'https://example.com:8080/a'],
    ['//example.com/x', 'https://example.com/x'],
    ['93.184.216.34', 'https://93.184.216.34/'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeTargetUrl(input)).toEqual({ ok: true, url: expected })
  })

  it.each([
    ['', 'Enter a URL'],
    ['   ', 'Enter a URL'],
    ['ftp://example.com', 'Only http and https'],
    ['javascript:alert(1)', 'Only http and https'],
    ['localhost', 'full domain'],
    ['localhost:3000', 'full domain'],
    ['https://user:pw@example.com', 'username and password'],
    ['https://exa mple.com', 'doesn’t look like'],
    [`https://example.com/${'a'.repeat(2100)}`, 'too long'],
  ])('rejects %j', (input, reason) => {
    const result = normalizeTargetUrl(input)
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toContain(reason)
  })
})
