import { describe, expect, it } from 'vitest'
import { createEmptyMeta } from '#layers/core/shared/utils/meta'
import { FORMATS, generate } from '../../shared/utils/formats'
import { CODE_THEME_DARK, CODE_THEME_LIGHT } from '../../shared/utils/code-themes'

function values() {
  const v = createEmptyMeta()
  v.base = { title: 'Tom & "Jerry"', description: 'It\'s <great>', image: 'https://a.test/og.png', url: 'https://a.test/' }
  v.advanced.canonical = 'https://a.test/'
  v.advanced.themeColor = '#0f766e'
  v.advanced.imageWidth = '1200'
  return v
}

describe('generate (FR-7.x)', () => {
  it('writes spec-correct, escaped HTML (FR-7.3, fixes U4/U5)', () => {
    const html = generate(values(), 'html', { comments: false })
    expect(html).toContain('<title>Tom &amp; "Jerry"</title>')
    expect(html).toContain('<meta name="description" content="It\'s &lt;great&gt;">')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(html).toContain('<meta property="og:image" content="https://a.test/og.png">')
    expect(html).toContain('<link rel="canonical" href="https://a.test/">')
    expect(html).not.toContain('name="title"')
    expect(html).not.toContain('<!--')
  })

  it('adds group comments when asked (FR-7.4)', () => {
    expect(generate(values(), 'html', { comments: true })).toContain('<!-- Open Graph')
  })

  it('writes useSeoMeta with camelCase keys, numbers and a useHead for links', () => {
    const code = generate(values(), 'useSeoMeta', { comments: false })
    expect(code).toContain('title: \'Tom & "Jerry"\',')
    expect(code).toContain('description: \'It\\\'s <great>\',')
    expect(code).toContain('ogImageWidth: 1200,')
    expect(code).toContain('themeColor: \'#0f766e\',')
    expect(code).toContain('useHead({\n  link: [')
  })

  it('writes Next.js metadata with themeColor in viewport', () => {
    const code = generate(values(), 'next', { comments: false })
    expect(code).toContain('import type { Metadata, Viewport } from \'next\'')
    expect(code).toContain('alternates: {\n    canonical: \'https://a.test/\',')
    expect(code).toContain('export const viewport: Viewport')
  })

  it('writes JSX with expression values so quotes are safe', () => {
    expect(generate(values(), 'react', { comments: false })).toContain('<title>{\'Tom & "Jerry"\'}</title>')
  })

  it('writes valid JSON', () => {
    const parsed = JSON.parse(generate(values(), 'json', { comments: true }))
    expect(parsed.title).toBe('Tom & "Jerry"')
    expect(parsed.meta).toContainEqual({ property: 'og:type', content: 'website' })
  })

  it('returns nothing when there are no values', () => {
    const empty = createEmptyMeta()
    empty.advanced.ogType = ''
    empty.advanced.twitterCard = '' as never
    for (const f of FORMATS) expect(generate(empty, f.id)).toBe('')
  })

  it('every format produces output', () => {
    for (const f of FORMATS) expect(generate(values(), f.id).length).toBeGreaterThan(50)
  })

  it('evaluates the JS formats without syntax errors', () => {
    for (const id of ['useSeoMeta', 'useHead'] as const) {
      const fn = new Function('useSeoMeta', 'useHead', generate(values(), id))
      const calls: unknown[] = []
      fn((x: unknown) => calls.push(x), (x: unknown) => calls.push(x))
      expect(calls.length).toBeGreaterThan(0)
    }
  })
})

describe('code themes', () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
  }
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
    return (hi! + 0.05) / (lo! + 0.05)
  }

  it.each([CODE_THEME_LIGHT, CODE_THEME_DARK])('$name token colours pass 4.5:1', (theme) => {
    for (const token of theme.tokenColors) {
      expect(ratio(token.settings.foreground, theme.colors['editor.background'])).toBeGreaterThanOrEqual(4.5)
    }
  })
})
