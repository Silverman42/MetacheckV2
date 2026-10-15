// Internal extraction API contract (PRD §9.3). Owned by core so every layer shares one shape;
// implemented by the extract layer.

export interface ExtractedMeta {
  name?: string
  property?: string
  httpEquiv?: string
  charset?: string
  itemprop?: string
  content: string | null
}

export interface ExtractedLink {
  rel: string
  href: string
  resolvedHref: string
  sizes?: string
  type?: string
  hreflang?: string
}

export interface ExtractedJsonLd {
  raw: string
  parsed?: unknown
  error?: string
}

export interface ExtractedImage {
  /** Absolute URL, resolved against the final page URL (FR-2.6). */
  url: string
  /** The tag it came from, e.g. og:image or twitter:image. */
  tag: string
  /** True when the page used a relative URL, which platforms reject. */
  relative: boolean
  ok: boolean
  status?: number
  contentType?: string
  bytes?: number
  width?: number
  height?: number
}

export interface ExtractResponse {
  requestedUrl: string
  finalUrl: string
  redirects: { url: string, status: number }[]
  status: number
  contentType: string
  timingMs: number
  lang: string | null
  title: string | null
  meta: ExtractedMeta[]
  links: ExtractedLink[]
  jsonLd: ExtractedJsonLd[]
  images: ExtractedImage[]
  /**
   * Present when the page was rendered with JavaScript (FR-1.7). Lists the tags that differ from
   * the plain HTML that social platforms see, as "name" or "property" keys.
   */
  rendering?: ExtractRendering
}

export interface ExtractRendering {
  added: string[]
  changed: string[]
  removed: string[]
}

export type ExtractErrorCode =
  | 'INVALID_URL'
  | 'BLOCKED_ADDRESS'
  | 'DNS_ERROR'
  | 'TIMEOUT'
  | 'NOT_HTML'
  | 'HTTP_ERROR'
  | 'TOO_MANY_REDIRECTS'
  | 'UPSTREAM_ERROR'
  | 'RATE_LIMITED'
  | 'FORBIDDEN'
  | 'RENDER_UNAVAILABLE'

export interface ExtractError {
  statusCode: number
  code: ExtractErrorCode
  message: string
  /** The target's HTTP status, for HTTP_ERROR. */
  upstreamStatus?: number
}
