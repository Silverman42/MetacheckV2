import { fetch } from 'undici'
import type { ExtractRendering, ExtractResponse } from '#layers/core/shared/types/extract'
import { collectImages, parseHead } from '../../shared/utils/parse-head'
import { assertFetchableUrl, assertPublicHost } from './address-guard'
import { ExtractFailure } from './extract-failure'
import { extractPage, type ExtractOptions } from './extract-page'
import { probeImage } from './probe-image'

// FR-1.7: render client-side pages with a hosted headless browser (Browserless-compatible
// /content API) and report which tags only exist after JavaScript runs (PRD §9.2).

export interface RendererConfig {
  /** Base URL of the service, e.g. https://production-sfo.browserless.io */
  url: string
  token: string
  timeoutMs: number
}

export async function renderHtml(target: string, renderer: RendererConfig): Promise<string> {
  const endpoint = new URL('/content', renderer.url)
  if (renderer.token) endpoint.searchParams.set('token', renderer.token)
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(renderer.timeoutMs),
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: target,
        gotoOptions: { waitUntil: 'networkidle2', timeout: renderer.timeoutMs - 500 },
        // Tags don't depend on these; skipping them makes rendering much faster.
        rejectResourceTypes: ['image', 'media', 'font', 'stylesheet'],
      }),
    })
  }
  catch {
    throw new ExtractFailure('TIMEOUT', 504, 'Rendering the page with JavaScript took too long.')
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    throw new ExtractFailure('UPSTREAM_ERROR', 502, `The rendering service failed (HTTP ${response.status}).`)
  }
  return response.text()
}

const tagKey = (m: { name?: string, property?: string }) => (m.property ?? m.name ?? '').toLowerCase()

// Only tags that shape previews and search results. Pages also carry per-request values
// (nonces, request ids) that differ between any two fetches and would only be noise.
const RELEVANT = /^(?:title|description|robots|googlebot|theme-color|viewport|og:.+|twitter:.+|fb:.+|article:.+|product:.+)$/

/** Which relevant tags JavaScript added, changed or removed compared with the plain HTML. */
export function diffTags(plain: ExtractResponse, rendered: Pick<ExtractResponse, 'title' | 'meta'>): ExtractRendering {
  const toMap = (r: Pick<ExtractResponse, 'title' | 'meta'>) => {
    const map = new Map<string, string>()
    if (r.title !== null) map.set('title', r.title)
    for (const m of r.meta) {
      const key = tagKey(m)
      if (RELEVANT.test(key) && !map.has(key)) map.set(key, m.content ?? '')
    }
    return map
  }
  const before = toMap(plain)
  const after = toMap(rendered)
  return {
    added: [...after.keys()].filter(k => !before.has(k)),
    changed: [...after.keys()].filter(k => before.has(k) && before.get(k) !== after.get(k)),
    removed: [...before.keys()].filter(k => !after.has(k)),
  }
}

/** Plain fetch and JavaScript rendering side by side; the result shows the rendered tags. */
export async function extractRendered(url: string, options: ExtractOptions & { renderer: RendererConfig }): Promise<ExtractResponse> {
  const parsed = new URL(url)
  if (!options.allowPrivate) {
    assertFetchableUrl(parsed)
    await assertPublicHost(parsed.hostname)
  }
  const started = performance.now()
  const [plain, html] = await Promise.all([
    extractPage(url, { ...options, maxImages: 0 }),
    renderHtml(url, options.renderer),
  ])
  const head = parseHead(html, plain.finalUrl)
  const refs = collectImages(head.meta, plain.finalUrl).slice(0, options.maxImages)
  const images = await Promise.all(refs.map(image =>
    probeImage(image, { timeoutMs: options.probeTimeoutMs, allowPrivate: options.allowPrivate })))

  return {
    ...plain,
    timingMs: Math.round(performance.now() - started),
    lang: head.lang,
    title: head.title,
    meta: head.meta,
    links: head.links,
    jsonLd: head.jsonLd,
    images,
    rendering: diffTags(plain, head),
  }
}
