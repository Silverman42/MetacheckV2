import { describe, expect, it } from 'vitest'
import { sniffImageSize } from '../../shared/utils/image-size'

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap(p => (typeof p === 'string' ? [...p].map(c => c.charCodeAt(0)) : p)))
const u32be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
const u16be = (n: number) => [(n >> 8) & 255, n & 255]
const u16le = (n: number) => [n & 255, (n >> 8) & 255]

describe('sniffImageSize (FR-2.7)', () => {
  it('reads PNG', () => {
    const png = bytes([0x89], 'PNG', [13, 10, 26, 10], u32be(13), 'IHDR', u32be(1200), u32be(630))
    expect(sniffImageSize(png)).toEqual({ type: 'png', width: 1200, height: 630 })
  })

  it('reads GIF', () => {
    expect(sniffImageSize(bytes('GIF89a', u16le(300), u16le(200)))).toEqual({ type: 'gif', width: 300, height: 200 })
  })

  it('reads JPEG after APP segments', () => {
    const jpeg = bytes(
      [0xFF, 0xD8],
      [0xFF, 0xE0], u16be(16), new Array(14).fill(0),
      [0xFF, 0xC0], u16be(17), [8], u16be(630), u16be(1200), new Array(10).fill(0),
    )
    expect(sniffImageSize(jpeg)).toEqual({ type: 'jpeg', width: 1200, height: 630 })
  })

  it('reads WebP (VP8X)', () => {
    const webp = bytes('RIFF', [0, 0, 0, 0], 'WEBP', 'VP8X', [10, 0, 0, 0], [0, 0, 0, 0], [0xAF, 0x04, 0], [0x75, 0x02, 0])
    expect(sniffImageSize(webp)).toEqual({ type: 'webp', width: 1200, height: 630 })
  })

  it('reads SVG width/height, then viewBox', () => {
    const enc = new TextEncoder()
    expect(sniffImageSize(enc.encode('<svg xmlns="http://www.w3.org/2000/svg" width="64px" height="32">'))).toEqual({ type: 'svg', width: 64, height: 32 })
    expect(sniffImageSize(enc.encode('<?xml version="1.0"?><svg viewBox="0 0 400 300">'))).toEqual({ type: 'svg', width: 400, height: 300 })
  })

  it('returns null for unknown data', () => {
    expect(sniffImageSize(new TextEncoder().encode('<html>'))).toBeNull()
  })
})
