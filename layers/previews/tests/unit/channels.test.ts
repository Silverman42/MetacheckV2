import { describe, expect, it } from 'vitest'
import { createEmptyMeta } from '#layers/core/shared/utils/meta'
import { breadcrumb, buildPreview, CHANNELS, getChannel, truncate } from '../../shared/utils/channels'

function values() {
  const v = createEmptyMeta()
  v.base = { title: 'Page title', description: 'Page description', image: 'https://a.test/og.png', url: 'https://www.a.test/docs/getting-started' }
  return v
}

describe('truncate', () => {
  it('leaves short text alone and normalises whitespace', () => {
    expect(truncate('  Hello   world ', 60)).toEqual({ text: 'Hello world', truncated: false })
  })

  it('cuts at a nearby word boundary and adds an ellipsis', () => {
    const result = truncate('The quick brown fox jumps over the lazy dog', 20)
    expect(result).toEqual({ text: 'The quick brown fox…', truncated: true })
    expect(result.text.length).toBeLessThanOrEqual(20)
  })

  it('cuts mid-word when there is no close boundary', () => {
    expect(truncate('Supercalifragilisticexpialidocious', 10).text).toBe('Supercali…')
  })
})

describe('breadcrumb', () => {
  it('shows host and path segments', () => {
    expect(breadcrumb('https://www.a.test/docs/getting-started')).toBe('a.test › docs › getting-started')
  })
})

describe('buildPreview (FR-4.3)', () => {
  it('Google uses the base title, a breadcrumb and no image', () => {
    const preview = buildPreview(values(), getChannel('google'))
    expect(preview).toMatchObject({ title: 'Page title', displayUrl: 'a.test › docs › getting-started', card: 'none', image: '' })
  })

  it('Facebook uses Open Graph values and an upper-case domain', () => {
    const v = values()
    v.overrides.og.title = 'Social title'
    expect(buildPreview(v, getChannel('facebook'))).toMatchObject({ title: 'Social title', displayUrl: 'A.TEST', card: 'large' })
  })

  it('X shows a small card for twitter:card=summary', () => {
    const v = values()
    v.advanced.twitterCard = 'summary'
    expect(buildPreview(v, getChannel('x')).card).toBe('small')
    v.advanced.twitterCard = 'summary_large_image'
    expect(buildPreview(v, getChannel('x')).card).toBe('large')
  })

  it('shows no image card when there is no image (FR-4.7)', () => {
    const v = values()
    v.base.image = ''
    for (const rule of CHANNELS) expect(buildPreview(v, rule).card).toBe('none')
  })

  it('hides descriptions on platforms that do not show them', () => {
    expect(buildPreview(values(), getChannel('linkedin')).description).toBe('')
  })

  it('marks truncation', () => {
    const v = values()
    v.base.title = 'x '.repeat(80)
    const preview = buildPreview(v, getChannel('google'))
    expect(preview.truncated.title).toBe(true)
    expect(preview.title.endsWith('…')).toBe(true)
  })

  it('has a unique id and docs link for every channel', () => {
    expect(new Set(CHANNELS.map(c => c.id)).size).toBe(CHANNELS.length)
    for (const c of CHANNELS) expect(c.docs).toMatch(/^https:\/\//)
  })
})
