import { describe, expect, it } from 'vitest'
import { cloneMeta, createEmptyMeta } from '../../shared/utils/meta'

describe('meta helpers', () => {
  it('creates blank values with sensible defaults', () => {
    const meta = createEmptyMeta()
    expect(meta.base).toEqual({ title: '', description: '', image: '', url: '' })
    expect(meta.advanced.ogType).toBe('website')
    expect(meta.advanced.twitterCard).toBe('summary_large_image')
  })

  it('clones deeply so edits never touch the original', () => {
    const original = createEmptyMeta()
    const copy = cloneMeta(original)
    copy.base.title = 'Edited'
    copy.overrides.og.image = 'https://example.com/a.png'
    expect(original.base.title).toBe('')
    expect(original.overrides.og.image).toBe('')
  })
})

describe('resolveMeta', () => {
  it('uses the platform override, then (for X) Open Graph, then the base', async () => {
    const { resolveMeta } = await import('../../shared/utils/meta')
    const values = createEmptyMeta()
    values.base = { title: 'Base', description: 'Base desc', image: 'https://a.test/base.png', url: '' }
    values.overrides.og.title = 'OG title'
    values.overrides.twitter.description = 'X desc'
    expect(resolveMeta(values, 'og')).toEqual({ title: 'OG title', description: 'Base desc', image: 'https://a.test/base.png' })
    expect(resolveMeta(values, 'twitter')).toEqual({ title: 'OG title', description: 'X desc', image: 'https://a.test/base.png' })
  })
})
