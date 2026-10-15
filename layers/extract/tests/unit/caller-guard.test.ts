import { describe, expect, it } from 'vitest'
import { isAllowedCaller } from '../../server/utils/caller-guard'

const options = { siteUrl: 'https://metacheckui.netlify.app', internalToken: 'secret' }

describe('isAllowedCaller (FR-8.6)', () => {
  it('allows same-origin browser requests', () => {
    expect(isAllowedCaller({ secFetchSite: 'same-origin' }, options)).toBe(true)
  })

  it.each(['cross-site', 'same-site', 'none'])('refuses Sec-Fetch-Site: %s', (secFetchSite) => {
    expect(isAllowedCaller({ secFetchSite, origin: 'https://metacheckui.netlify.app' }, options)).toBe(false)
  })

  it('allows the internal token used by server-side rendering', () => {
    expect(isAllowedCaller({ internalToken: 'secret' }, options)).toBe(true)
    expect(isAllowedCaller({ internalToken: 'wrong' }, options)).toBe(false)
    expect(isAllowedCaller({ internalToken: '' }, { ...options, internalToken: '' })).toBe(false)
  })

  it('falls back to Origin / Referer for older browsers', () => {
    expect(isAllowedCaller({ origin: 'https://metacheckui.netlify.app' }, options)).toBe(true)
    expect(isAllowedCaller({ referer: 'https://deploy-preview-4--metacheckui.netlify.app/?url=x', host: 'deploy-preview-4--metacheckui.netlify.app' }, options)).toBe(true)
    expect(isAllowedCaller({ origin: 'https://evil.example' }, options)).toBe(false)
  })

  it('refuses requests with no browser headers at all', () => {
    expect(isAllowedCaller({ host: 'metacheckui.netlify.app' }, options)).toBe(false)
  })
})
