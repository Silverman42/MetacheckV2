import { describe, expect, it } from 'vitest'
import type { ExtractResponse } from '#layers/core/shared/types/extract'
import { createEmptyMeta } from '#layers/core/shared/utils/meta'
import { contextTags, RULES, runChecks, summarize, type CheckContext, type ImageFacts } from '../../shared/utils/rules'

function goodValues() {
  const v = createEmptyMeta()
  v.base = {
    title: 'MetaCheck — preview and fix your meta tags',
    description: 'Preview how your link looks on Google, Facebook, X, LinkedIn and Slack, check the tags behind it and copy the code that fixes them.',
    image: 'https://a.test/og.png',
    url: 'https://a.test/',
  }
  v.advanced.canonical = 'https://a.test/'
  v.advanced.imageAlt = 'Screenshot'
  return v
}

function source(overrides: Partial<ExtractResponse> = {}): ExtractResponse {
  return {
    requestedUrl: 'https://a.test/', finalUrl: 'https://a.test/', redirects: [], status: 200, contentType: 'text/html', timingMs: 1,
    lang: 'en', title: 'Short',
    meta: [
      { name: 'viewport', content: 'width=device-width' },
      { name: 'description', content: 'One' },
      { name: 'description', content: 'Two' },
      { property: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex, follow' },
    ],
    links: [{ rel: 'canonical', href: 'https://a.test/other', resolvedHref: 'https://a.test/other' }],
    jsonLd: [], images: [],
    ...overrides,
  }
}

const ctx = (partial: Partial<CheckContext> & Pick<CheckContext, 'mode'>): CheckContext => {
  const values = partial.values ?? goodValues()
  const src = partial.source ?? null
  return { values, source: src, tags: contextTags(values, src, partial.mode), image: null, ...partial }
}
const status = (results: ReturnType<typeof runChecks>, id: string) => results.find(r => r.id === id)?.status

describe('rules', () => {
  it('passes a well-formed draft and skips page-only rules', () => {
    const image: ImageFacts = { url: 'https://a.test/og.png', ok: true, relative: false, width: 1200, height: 630, bytes: 200_000 }
    const results = runChecks(ctx({ mode: 'draft', image }))
    const { errors, warnings, skipped, scores } = summarize(results)
    expect(errors.map(r => r.id)).toEqual([])
    expect(warnings.map(r => r.id)).toEqual([])
    expect(skipped.map(r => r.id).sort()).toEqual(['duplicate-tags', 'lang-missing', 'twitter-property', 'viewport-missing'])
    expect(scores).toEqual({ search: 100, social: 100 })
  })

  it('flags missing title, description and image as errors (FR-5.2)', () => {
    const v = createEmptyMeta()
    const results = runChecks(ctx({ mode: 'draft', values: v }))
    expect(summarize(results).errors.map(r => r.id)).toEqual(['title-missing', 'description-missing', 'og-image-missing'])
  })

  it('reads the live page’s real tags: duplicates, property= on X tags, noindex, canonical mismatch', () => {
    const results = runChecks(ctx({ mode: 'live', source: source() }))
    expect(status(results, 'duplicate-tags')).toBe('fail')
    expect(results.find(r => r.id === 'duplicate-tags')?.detail).toBe('description ×2')
    expect(status(results, 'twitter-property')).toBe('fail')
    expect(status(results, 'robots-noindex')).toBe('fail')
    expect(status(results, 'canonical-mismatch')).toBe('fail')
    expect(status(results, 'og-title-missing')).toBe('fail')
    expect(status(results, 'title-length')).toBe('fail')
    expect(status(results, 'viewport-missing')).toBe('pass')
    expect(status(results, 'lang-missing')).toBe('pass')
  })

  it('in edited mode, checks the tags MetaCheck would generate', () => {
    const results = runChecks(ctx({ mode: 'edited', source: source() }))
    expect(status(results, 'og-title-missing')).toBe('pass')
    expect(status(results, 'robots-noindex')).toBe('pass')
    expect(status(results, 'canonical-mismatch')).toBe('pass')
    // Page rules still describe the page itself.
    expect(status(results, 'duplicate-tags')).toBe('fail')
  })

  it('checks image facts', () => {
    const run = (image: ImageFacts) => runChecks(ctx({ mode: 'draft', image }))
    expect(status(run({ url: '/og.png', relative: true }), 'image-relative')).toBe('fail')
    expect(status(run({ url: 'https://a.test/x', ok: false }), 'image-unreachable')).toBe('fail')
    expect(results(run({ url: 'x', width: 600, height: 315 }), 'image-dimensions')).toBe('600 × 315')
    expect(results(run({ url: 'x', width: 1200, height: 1200 }), 'image-dimensions')).toBe('1200 × 1200 is 1.00:1')
    expect(status(run({ url: 'x', bytes: 6 * 1024 * 1024 }), 'image-bytes')).toBe('fail')
    expect(status(run({ url: 'x' }), 'image-dimensions')).toBe('skip')
  })

  it('every rule explains itself and links a spec (FR-5.3)', () => {
    for (const rule of RULES) {
      expect(rule.why.length).toBeGreaterThan(20)
      expect(rule.fix.length).toBeGreaterThan(10)
      expect(rule.docs.url).toMatch(/^https:\/\//)
    }
    expect(new Set(RULES.map(r => r.id)).size).toBe(RULES.length)
  })
})

function results(list: ReturnType<typeof runChecks>, id: string) {
  return list.find(r => r.id === id)?.detail
}
