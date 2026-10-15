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
