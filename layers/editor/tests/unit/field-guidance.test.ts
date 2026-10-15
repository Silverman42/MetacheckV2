import { describe, expect, it } from 'vitest'
import { checkImageUrl, FIELD_GUIDANCE, formatBytes } from '../../shared/utils/field-guidance'

describe('checkImageUrl (FR-3.4)', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(checkImageUrl(' https://a.test/og.png ')).toEqual({ state: 'ok', url: 'https://a.test/og.png' })
    expect(checkImageUrl('http://a.test/x.jpg').state).toBe('ok')
  })

  it('is empty for blank input', () => {
    expect(checkImageUrl('  ')).toEqual({ state: 'empty' })
  })

  it.each([
    ['/images/og.png', 'full URL'],
    ['images/og.png', 'full URL'],
    ['data:image/png;base64,AAA', 'Only http and https'],
    ['ftp://a.test/x.png', 'Only http and https'],
  ])('rejects %s', (value, message) => {
    const result = checkImageUrl(value)
    expect(result.state).toBe('invalid')
    expect(result.state === 'invalid' && result.message).toContain(message)
  })
})

describe('guidance', () => {
  it('keeps every range ordered', () => {
    for (const { range } of Object.values(FIELD_GUIDANCE)) expect(range[0]).toBeLessThan(range[1])
  })

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(618778)).toBe('604 KB')
    expect(formatBytes(3_500_000)).toBe('3.3 MB')
  })
})
