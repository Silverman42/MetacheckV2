import { describe, expect, it } from 'vitest'
import { addRecent } from '../../shared/utils/recent'
import { demoValues } from '../../shared/utils/demo'

describe('addRecent (FR-1.6)', () => {
  it('puts the newest first, removes duplicates and keeps 10', () => {
    let list: string[] = []
    for (let i = 0; i < 12; i++) list = addRecent(list, `https://a.test/${i}`)
    expect(list).toHaveLength(10)
    expect(list[0]).toBe('https://a.test/11')
    expect(addRecent(list, 'https://a.test/5')[0]).toBe('https://a.test/5')
    expect(addRecent(list, 'https://a.test/5')).toHaveLength(10)
  })
})

describe('demoValues (FR-1.5)', () => {
  it('builds MetaCheck’s own tags for the current origin', () => {
    const v = demoValues('https://metacheckui.netlify.app')
    expect(v.base.image).toBe('https://metacheckui.netlify.app/og-image.jpg')
    expect(v.advanced.canonical).toBe('https://metacheckui.netlify.app/')
  })
})
