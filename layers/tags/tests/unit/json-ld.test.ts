import { describe, expect, it } from 'vitest'
import { summarizeJsonLd } from '../../shared/utils/json-ld'

describe('summarizeJsonLd', () => {
  it('summarises a single entity with its key fields', () => {
    const parsed = { '@type': 'Article', 'headline': 'Hello', 'author': { '@type': 'Person', 'name': 'Ada' }, 'image': ['https://a.test/1.png', 'https://a.test/2.png'], 'wordCount': 900 }
    const summary = summarizeJsonLd({ raw: JSON.stringify(parsed), parsed })
    expect(summary.entities).toEqual([{ type: 'Article', fields: [
      { key: 'headline', value: 'Hello' },
      { key: 'image', value: 'https://a.test/1.png, https://a.test/2.png' },
      { key: 'author', value: 'Ada' },
    ] }])
    expect(summary.pretty).toContain('\n  "headline": "Hello"')
  })

  it('expands @graph and arrays of roots', () => {
    const parsed = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', 'name': 'A' }, { '@type': ['Organization', 'Brand'], 'logo': 'https://a.test/l.png' }] }
    expect(summarizeJsonLd({ raw: '', parsed }).entities.map(e => e.type)).toEqual(['WebSite', 'Organization, Brand'])
    expect(summarizeJsonLd({ raw: '', parsed: [{ '@type': 'A' }, { '@type': 'B' }] }).entities).toHaveLength(2)
  })

  it('reports invalid JSON with the raw text', () => {
    expect(summarizeJsonLd({ raw: '{bad', error: 'Unexpected token' })).toEqual({ entities: [], pretty: '{bad', error: 'Unexpected token' })
  })
})
