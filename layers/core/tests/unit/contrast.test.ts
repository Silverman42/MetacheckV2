import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// §9.10.2: every text/background pair must pass WCAG AA in both themes.
const css = readFileSync(new URL('../../app/assets/css/main.css', import.meta.url), 'utf8')

function tokens(selector: string) {
  const block = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
  return Object.fromEntries([...block.matchAll(/--mc-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1], m[2]]))
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const text = ['text', 'muted', 'accent-text', 'danger', 'warning', 'success']
const backgrounds = ['canvas', 'surface', 'inset']

describe.each([['light', ':root'], ['dark', '.dark']])('%s theme', (_name, selector) => {
  const t = tokens(selector)

  it.each(text.flatMap(fg => backgrounds.map(bg => [fg, bg])))('%s on %s ≥ 4.5:1', (fg, bg) => {
    expect(contrast(t[fg!]!, t[bg!]!)).toBeGreaterThanOrEqual(4.5)
  })

  it('on-accent on accent ≥ 4.5:1', () => {
    expect(contrast(t['on-accent']!, t.accent!)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(backgrounds)('focus ring on %s ≥ 3:1', (bg) => {
    expect(contrast(t.focus!, t[bg]!)).toBeGreaterThanOrEqual(3)
  })
})
