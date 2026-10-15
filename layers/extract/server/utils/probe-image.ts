import type { ExtractedImage } from '#layers/core/shared/types/extract'
import { sniffImageSize } from '../../shared/utils/image-size'
import { guardedFetch, readLimited } from './guarded-fetch'

const SNIFF_BYTES = 64 * 1024

/**
 * FR-2.7: is the image reachable, what type and size is it, how many pixels.
 * Goes through the same SSRF guard and reads only the first bytes.
 */
export async function probeImage(
  image: Pick<ExtractedImage, 'url' | 'tag' | 'relative'>,
  options: { timeoutMs: number, allowPrivate?: boolean },
): Promise<ExtractedImage> {
  try {
    const { response } = await guardedFetch(image.url, {
      signal: AbortSignal.timeout(options.timeoutMs),
      accept: 'image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*;q=0.8',
      allowPrivate: options.allowPrivate,
    })
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || undefined
    const length = Number(response.headers.get('content-length'))
    const { bytes, complete } = await readLimited(response, SNIFF_BYTES)
    const size = sniffImageSize(bytes)
    const result: ExtractedImage = {
      ...image,
      ok: response.ok && (contentType?.startsWith('image/') ?? !!size),
      status: response.status,
    }
    if (contentType) result.contentType = contentType
    if (response.ok) {
      if (Number.isFinite(length) && length > 0) result.bytes = length
      else if (complete && bytes.byteLength > 0) result.bytes = bytes.byteLength
    }
    if (size) {
      result.width = size.width
      result.height = size.height
    }
    return result
  }
  catch {
    return { ...image, ok: false }
  }
}
