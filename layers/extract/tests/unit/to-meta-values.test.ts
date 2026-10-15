import { describe, expect, it } from 'vitest'
import type { ExtractResponse } from '#layers/core/shared/types/extract'
import { toMetaValues } from '../../shared/utils/to-meta-values'

const response = (overrides: Partial<ExtractResponse> = {}): ExtractResponse => ({
  requestedUrl: 'https://example.org/',
  finalUrl: 'https://www.example.org/',
  redirects: [],
  status: 200,
  contentType: 'text/html',
  timingMs: 120,
  lang: 'en',
  title: 'Page title',
  meta: [
    { name: 'description', content: 'Page description' },
    { property: 'og:title', content: 'Social title' },
    { property: 'og:description', content: 'Page description' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:site', content: '@example' },
    { property: 'og:site_name', content: 'Example' },
  ],
  links: [
    { rel: 'canonical', href: '/', resolvedHref: 'https://www.example.org/' },
    { rel: 'shortcut icon', href: '/f.ico', resolvedHref: 'https://www.example.org/f.ico' },
  ],
  jsonLd: [],
  images: [{ url: 'https://www.example.org/og.png', tag: 'og:image', relative: true, ok: true }],
  ...overrides,
})

describe('toMetaValues', () => {
  it('fills base fields from the page and only overrides where platforms differ (FR-3.1, FR-3.6)', () => {
    const values = toMetaValues(response())
    expect(values.base).toEqual({
      title: 'Page title',
      description: 'Page description',
      image: 'https://www.example.org/og.png',
      url: 'https://www.example.org/',
    })
    expect(values.overrides.og).toEqual({ title: 'Social title', description: '', image: '' })
    expect(values.overrides.twitter).toEqual({ title: '', description: '', image: '' })
  })

  it('maps advanced fields (FR-3.5)', () => {
    const { advanced } = toMetaValues(response())
    expect(advanced).toMatchObject({
      canonical: 'https://www.example.org/',
      favicon: 'https://www.example.org/f.ico',
      twitterCard: 'summary',
      twitterSite: '@example',
      siteName: 'Example',
      ogType: 'website',
    })
  })

  it('falls back to social values when the page has no title or description', () => {
    const values = toMetaValues(response({ title: null, meta: [{ property: 'og:title', content: 'OG' }, { name: 'twitter:description', content: 'TW' }] }))
    expect(values.base.title).toBe('OG')
    expect(values.base.description).toBe('TW')
    expect(values.overrides.og.title).toBe('')
  })
})
