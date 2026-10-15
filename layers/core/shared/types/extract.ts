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
  url: string
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
}

export type ExtractErrorCode =
  | 'INVALID_URL'
  | 'BLOCKED_ADDRESS'
  | 'TIMEOUT'
  | 'NOT_HTML'
  | 'UPSTREAM_ERROR'
  | 'RATE_LIMITED'

export interface ExtractError {
  statusCode: number
  code: ExtractErrorCode
  message: string
}
