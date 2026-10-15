import { describe, expect, it } from 'vitest'
import type { ExtractResponse } from '#layers/core/shared/types/extract'
import { filterTags, rawTags } from '../../shared/utils/raw-tags'

const source: ExtractResponse = {
  requestedUrl: 'https://a.test/', finalUrl: 'https://a.test/', redirects: [], status: 200, contentType: 'text/html', timingMs: 1, lang: 'en',
  title: 'A & B',
  meta: [
    { charset: 'utf-8', content: null },
    { property: 'og:title', content: 'Say "hi"' },
    { httpEquiv: 'refresh', content: '5' },
  ],
  links: [{ rel: 'alternate', href: '/fr/', resolvedHref: 'https://a.test/fr/', hreflang: 'fr' }],
  jsonLd: [{ raw: '{"@type":"Article"}', parsed: { '@type': 'Article' } }, { raw: '{bad', error: 'x' }],
  images: [],
}

describe('rawTags (FR-6.1)', () => {
  const rows = rawTags(source)

  it('lists every tag as found, in order', () => {
    expect(rows.map(r => r.label)).toEqual([
      'title', 'charset="utf-8"', 'property="og:title"', 'http-equiv="refresh"', 'rel="alternate" hreflang="fr"', 'JSON-LD · Article', 'JSON-LD (invalid)',
    ])
  })

  it('rebuilds escaped HTML for copying', () => {
    expect(rows[0]!.html).toBe('<title>A &amp; B</title>')
    expect(rows[2]!.html).toBe('<meta property="og:title" content="Say &quot;hi&quot;">')
    expect(rows[4]!.html).toBe('<link rel="alternate" href="/fr/" hreflang="fr">')
  })

  it('filters by label or value, case-insensitively', () => {
    expect(filterTags(rows, 'OG:').map(r => r.label)).toEqual(['property="og:title"'])
    expect(filterTags(rows, 'a.test/fr')).toHaveLength(1)
    expect(filterTags(rows, '  ')).toHaveLength(rows.length)
  })
})
