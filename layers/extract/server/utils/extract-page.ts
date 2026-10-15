import type { ExtractResponse } from '#layers/core/shared/types/extract'
import { collectImages, parseHead } from '../../shared/utils/parse-head'
import { ExtractFailure } from './extract-failure'
import { guardedFetch, readLimited } from './guarded-fetch'
import { probeImage } from './probe-image'

export interface ExtractOptions {
  pageTimeoutMs: number
  probeTimeoutMs: number
  maxHtmlBytes: number
  maxImages: number
  allowPrivate?: boolean
}

const HTML_TYPES = ['text/html', 'application/xhtml+xml']
const HEAD_END = /<\/head\s*>|<body[\s>]/i

/**
 * Plain fetch + parse of the document head (PRD §9.2): what social crawlers see, since they
 * don't run JavaScript. Stops reading at </head> or the byte cap.
 */
export async function extractPage(url: string, options: ExtractOptions): Promise<ExtractResponse> {
  const started = performance.now()
  const signal = AbortSignal.timeout(options.pageTimeoutMs)

  const { response, finalUrl, redirects } = await guardedFetch(url, {
    signal,
    accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
    allowPrivate: options.allowPrivate,
  })

  const contentTypeHeader = response.headers.get('content-type') ?? ''
  const contentType = contentTypeHeader.split(';')[0]!.trim().toLowerCase()

  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    throw new ExtractFailure('HTTP_ERROR', 502, `The site responded with HTTP ${response.status}.`, response.status)
  }
  if (contentType && !HTML_TYPES.includes(contentType)) {
    await response.body?.cancel().catch(() => {})
    throw new ExtractFailure('NOT_HTML', 422, `That URL returns ${contentType}, not a web page.`)
  }

  // Look for the end of <head> across chunk boundaries with a small rolling window.
  let tail = ''
  const latin1 = new TextDecoder('latin1')
  let body: Awaited<ReturnType<typeof readLimited>>
  try {
    body = await readLimited(response, options.maxHtmlBytes, (chunk) => {
      const text = tail + latin1.decode(chunk)
      tail = text.slice(-16)
      return HEAD_END.test(text)
    })
  }
  catch {
    throw signal.aborted
      ? new ExtractFailure('TIMEOUT', 504, 'The site didn’t finish sending the page in time.')
      : new ExtractFailure('UPSTREAM_ERROR', 502, 'The connection dropped while reading the page.')
  }

  const html = decodeHtml(body.bytes, contentTypeHeader)
  if (!contentType && !/^\s*(?:<!doctype html|<html|<head|<meta|<title)/i.test(html)) {
    throw new ExtractFailure('NOT_HTML', 422, 'That URL doesn’t return a web page.')
  }

  const head = parseHead(html, finalUrl)
  const imageRefs = collectImages(head.meta, finalUrl).slice(0, options.maxImages)
  // Probe each distinct URL once, even when og:image and twitter:image share it.
  const probes = new Map<string, ReturnType<typeof probeImage>>()
  const images = await Promise.all(imageRefs.map(async (image) => {
    if (!probes.has(image.url)) {
      probes.set(image.url, probeImage(image, { timeoutMs: options.probeTimeoutMs, allowPrivate: options.allowPrivate }))
    }
    return { ...(await probes.get(image.url)!), tag: image.tag, relative: image.relative }
  }))

  return {
    requestedUrl: url,
    finalUrl,
    redirects,
    status: response.status,
    contentType: contentType || 'text/html',
    timingMs: Math.round(performance.now() - started),
    lang: head.lang,
    title: head.title,
    meta: head.meta,
    links: head.links,
    jsonLd: head.jsonLd,
    images,
  }
}

/** Charset from the header, else a <meta charset> in the first bytes, else UTF-8. */
export function decodeHtml(bytes: Uint8Array, contentTypeHeader: string) {
  const fromHeader = contentTypeHeader.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]
  const sniffed = new TextDecoder('latin1').decode(bytes.subarray(0, 2048))
    .match(/<meta[^>]+charset\s*=\s*["']?([\w-]+)/i)?.[1]
  for (const label of [fromHeader, sniffed, 'utf-8']) {
    if (!label) continue
    try {
      return new TextDecoder(label).decode(bytes)
    }
    catch {
      // Unknown label: try the next one.
    }
  }
  return new TextDecoder().decode(bytes)
}
