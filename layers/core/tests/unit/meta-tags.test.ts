import { describe, expect, it } from 'vitest'
import { buildTags, displayDomain } from '../../shared/utils/meta-tags'
import { createEmptyMeta } from '../../shared/utils/meta'

function values() {
  const v = createEmptyMeta()
  v.base = { title: 'Title', description: 'Desc', image: 'https://a.test/og.png', url: 'https://a.test/' }
  return v
}

describe('buildTags', () => {
  it('emits only tags with values, in a stable order', () => {
    expect(buildTags(values()).map(t => t.key)).toEqual([
      'title', 'description', 'og:type', 'og:url', 'og:title', 'og:description', 'og:image', 'twitter:card',
    ])
  })

  it('uses name= for X tags and property= for Open Graph (FR-7.3)', () => {
    const tags = buildTags(values())
    expect(tags.find(t => t.key === 'twitter:card')?.attr).toBe('name')
    expect(tags.find(t => t.key === 'og:title')?.attr).toBe('property')
    expect(tags.find(t => t.key === 'title')?.tag).toBe('title')
  })

  it('adds X tags only where they differ from Open Graph', () => {
    const v = values()
    v.overrides.twitter.title = 'For X'
    const keys = buildTags(v).map(t => t.key)
    expect(keys).toContain('twitter:title')
    expect(keys).not.toContain('twitter:description')
  })

  it('includes advanced fields and image details only with an image', () => {
    const v = values()
    Object.assign(v.advanced, { canonical: 'https://a.test/', imageAlt: 'Alt', imageWidth: '1200', themeColor: '#000' })
    const keys = buildTags(v).map(t => t.key)
    expect(keys).toEqual(expect.arrayContaining(['canonical', 'og:image:alt', 'og:image:width', 'twitter:image:alt', 'theme-color']))
    v.base.image = ''
    expect(buildTags(v).map(t => t.key)).not.toContain('og:image:alt')
  })

  it('trims values', () => {
    const v = values()
    v.base.title = '  Spaced  '
    expect(buildTags(v)[0]!.content).toBe('Spaced')
  })
})

describe('displayDomain', () => {
  it('strips www and paths', () => {
    expect(displayDomain('https://www.example.com/a/b')).toBe('example.com')
    expect(displayDomain('not a url/path')).toBe('not a url')
  })
})
