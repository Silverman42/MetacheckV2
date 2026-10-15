import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { collectImages, parseHead } from '../../shared/utils/parse-head'

const html = readFileSync(new URL('../fixtures/full.html', import.meta.url), 'utf8')
const page = 'https://example.org/blog/post'

describe('parseHead', () => {
  const head = parseHead(html, page)

  it('reads lang and a whitespace-normalised, entity-decoded title (FR-2.2, FR-2.4)', () => {
    expect(head.lang).toBe('en-GB')
    expect(head.title).toBe('Fixture & Co — Home')
  })

  it('returns every head <meta> in document order with all attribute kinds (FR-2.1)', () => {
    expect(head.meta[0]).toEqual({ charset: 'utf-8', content: null })
    expect(head.meta.find(m => m.httpEquiv)).toEqual({ httpEquiv: 'x-ua-compatible', content: 'ie=edge' })
    expect(head.meta.find(m => m.itemprop)).toEqual({ itemprop: 'name', content: 'Fixture' })
    expect(head.meta.map(m => m.property ?? m.name).filter(Boolean)).toContain('og:image')
  })

  it('ignores tags after the head', () => {
    expect(head.meta.filter(m => m.property === 'og:title')).toHaveLength(1)
    expect(head.title).not.toBe('Not this')
  })

  it('keeps meaningful links, drops stylesheets, resolves against <base> (FR-2.3, FR-2.6)', () => {
    expect(head.links.map(l => l.rel)).toEqual(['canonical', 'icon', 'alternate'])
    expect(head.links[1]).toMatchObject({ href: '/favicon.ico', resolvedHref: 'https://example.org/favicon.ico', sizes: '32x32' })
    expect(head.links[2]).toMatchObject({ hreflang: 'fr', resolvedHref: 'https://example.org/fr/' })
  })

  it('parses JSON-LD and reports errors (FR-2.5)', () => {
    expect(head.jsonLd[0]!.parsed).toEqual({ '@type': 'Organization', 'name': 'Fixture' })
    expect(head.jsonLd[1]!.error).toBeTruthy()
    expect(head.jsonLd[1]!.parsed).toBeUndefined()
  })

  it('returns a null title instead of failing when there is none (fixes B2)', () => {
    expect(parseHead('<html><head><meta name="a" content="b"></head></html>', page).title).toBeNull()
  })

  it('copes with a document cut off mid-head', () => {
    const cut = parseHead('<html><head><title>Cut</title><meta property="og:title" content="x"><meta na', page)
    expect(cut.title).toBe('Cut')
    expect(cut.meta).toHaveLength(1)
  })
})

describe('collectImages', () => {
  it('resolves relative image URLs and flags them (FR-2.6, fixes B7)', () => {
    const { meta } = parseHead(html, page)
    expect(collectImages(meta, page)).toEqual([
      { url: 'https://example.org/blog/images/og.png', tag: 'og:image', relative: true },
      { url: 'https://cdn.example.org/tw.jpg', tag: 'twitter:image', relative: false },
    ])
  })

  it('skips empty, non-http and duplicate values but keeps each tag', () => {
    const meta = [
      { property: 'og:image', content: ' ' },
      { property: 'og:image', content: 'data:image/png;base64,xx' },
      { property: 'og:image', content: 'https://a.test/x.png' },
      { property: 'og:image', content: 'https://a.test/x.png' },
      { name: 'twitter:image', content: 'https://a.test/x.png' },
    ]
    expect(collectImages(meta, page).map(i => i.tag)).toEqual(['og:image', 'twitter:image'])
  })
})
