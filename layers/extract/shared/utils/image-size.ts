// Read pixel dimensions from the first bytes of an image (FR-2.7), so probes never download
// whole files. Covers the formats platforms accept for link previews.

export interface ImageSize { width: number, height: number, type: string }

export function sniffImageSize(bytes: Uint8Array): ImageSize | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length))

  // PNG: IHDR is the first chunk.
  if (bytes.length >= 24 && bytes[0] === 0x89 && ascii(1, 3) === 'PNG') {
    return { type: 'png', width: view.getUint32(16), height: view.getUint32(20) }
  }

  // GIF
  if (bytes.length >= 10 && ascii(0, 3) === 'GIF') {
    return { type: 'gif', width: view.getUint16(6, true), height: view.getUint16(8, true) }
  }

  // WebP: lossy (VP8), lossless (VP8L) and extended (VP8X).
  if (bytes.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const chunk = ascii(12, 4)
    if (chunk === 'VP8 ') return { type: 'webp', width: view.getUint16(26, true) & 0x3FFF, height: view.getUint16(28, true) & 0x3FFF }
    if (chunk === 'VP8L') {
      const b = view.getUint32(21, true)
      return { type: 'webp', width: (b & 0x3FFF) + 1, height: ((b >> 14) & 0x3FFF) + 1 }
    }
    if (chunk === 'VP8X') {
      const w = bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16)
      const h = bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16)
      return { type: 'webp', width: w + 1, height: h + 1 }
    }
  }

  // JPEG: walk segments to the first start-of-frame marker.
  if (bytes.length >= 4 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xFF) return null
      const marker = bytes[offset + 1]!
      if (marker === 0xFF) {
        offset++
        continue
      }
      const isSof = marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC
      if (isSof) return { type: 'jpeg', height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) }
      offset += 2 + view.getUint16(offset + 2)
    }
    return null
  }

  // SVG: width/height attributes, else the viewBox.
  const head = new TextDecoder().decode(bytes.subarray(0, 4096))
  const svg = head.match(/<svg\b[^>]*>/i)?.[0]
  if (svg) {
    const num = (attr: string) => {
      const value = svg.match(new RegExp(`\\s${attr}\\s*=\\s*["']\\s*([\\d.]+)(?:px)?\\s*["']`, 'i'))?.[1]
      return value ? Math.round(Number(value)) : null
    }
    const width = num('width')
    const height = num('height')
    if (width && height) return { type: 'svg', width, height }
    const box = svg.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (box) return { type: 'svg', width: Math.round(Number(box[1])), height: Math.round(Number(box[2])) }
  }

  return null
}
