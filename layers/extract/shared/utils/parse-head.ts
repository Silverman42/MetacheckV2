import { Parser } from 'htmlparser2'
import type { ExtractedImage, ExtractedJsonLd, ExtractedLink, ExtractedMeta } from '#layers/core/shared/types/extract'

export interface ParsedHead {
  lang: string | null
  title: string | null
  meta: ExtractedMeta[]
  links: ExtractedLink[]
  jsonLd: ExtractedJsonLd[]
}

// Resource hints and stylesheets say nothing about how a link is shared.
const IGNORED_RELS = new Set(['stylesheet', 'preload', 'prefetch', 'modulepreload', 'dns-prefetch', 'preconnect', 'prerender'])

const IMAGE_TAGS = ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']

/** Resolve against the page URL; null when it can't be resolved or isn't http(s). */
export function resolveUrl(href: string, base: string): string | null {
  try {
    const url = new URL(href.trim(), base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  }
  catch {
    return null
  }
}

export function isAbsoluteUrl(href: string) {
  return /^https?:\/\//i.test(href.trim())
}

/**
 * Parse the <head> of an HTML document (FR-2.1–2.5). Stops at <body>, so a truncated document
 * is fine. Scraped values are returned as plain strings and must be rendered as text only.
 */
export function parseHead(html: string, baseUrl: string): ParsedHead {
  const result: ParsedHead = { lang: null, title: null, meta: [], links: [], jsonLd: [] }
  let base = baseUrl
  let inTitle = false
  let titleText = ''
  let jsonLdText: string | null = null
  let done = false

  const parser = new Parser({
    onopentag(name, attrs) {
      if (done) return
      switch (name) {
        case 'html':
          result.lang = attrs.lang?.trim() || null
          break
        case 'body':
          done = true
          parser.pause()
          break
        case 'base':
          if (attrs.href) base = resolveUrl(attrs.href, baseUrl) ?? base
          break
        case 'title':
          if (result.title === null) inTitle = true
          break
        case 'meta': {
          const meta: ExtractedMeta = { content: attrs.content ?? null }
          if (attrs.name) meta.name = attrs.name.trim()
          if (attrs.property) meta.property = attrs.property.trim()
          if (attrs['http-equiv']) meta.httpEquiv = attrs['http-equiv'].trim()
          if (attrs.charset) meta.charset = attrs.charset.trim()
          if (attrs.itemprop) meta.itemprop = attrs.itemprop.trim()
          result.meta.push(meta)
          break
        }
        case 'link': {
          const rel = attrs.rel?.trim().toLowerCase().replace(/\s+/g, ' ')
          if (!rel || !attrs.href || rel.split(' ').every(r => IGNORED_RELS.has(r))) break
          const link: ExtractedLink = { rel, href: attrs.href, resolvedHref: resolveUrl(attrs.href, base) ?? attrs.href }
          if (attrs.sizes) link.sizes = attrs.sizes
          if (attrs.type) link.type = attrs.type
          if (attrs.hreflang) link.hreflang = attrs.hreflang
          result.links.push(link)
          break
        }
        case 'script':
          if (attrs.type?.trim().toLowerCase() === 'application/ld+json') jsonLdText = ''
          break
      }
    },
    ontext(text) {
      if (inTitle) titleText += text
      else if (jsonLdText !== null) jsonLdText += text
    },
    onclosetag(name) {
      if (name === 'title' && inTitle) {
        inTitle = false
        result.title = titleText.replace(/\s+/g, ' ').trim()
      }
      else if (name === 'script' && jsonLdText !== null) {
        const raw = jsonLdText.trim()
        const block: ExtractedJsonLd = { raw }
        try {
          block.parsed = JSON.parse(raw)
        }
        catch (error) {
          block.error = error instanceof Error ? error.message : 'Invalid JSON'
        }
        result.jsonLd.push(block)
        jsonLdText = null
      }
      else if (name === 'head') {
        done = true
        parser.pause()
      }
    },
  }, { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true })

  parser.write(html)
  if (!done) parser.end()
  return result
}

/** og:image / twitter:image values, resolved against the page (FR-2.6). One per tag and URL. */
export function collectImages(meta: ExtractedMeta[], baseUrl: string): Pick<ExtractedImage, 'url' | 'tag' | 'relative'>[] {
  const seen = new Set<string>()
  const images: Pick<ExtractedImage, 'url' | 'tag' | 'relative'>[] = []
  for (const m of meta) {
    const tag = (m.property ?? m.name ?? '').toLowerCase()
    if (!IMAGE_TAGS.includes(tag) || !m.content?.trim()) continue
    const url = resolveUrl(m.content, baseUrl)
    if (!url || seen.has(`${tag} ${url}`)) continue
    seen.add(`${tag} ${url}`)
    images.push({ url, tag, relative: !isAbsoluteUrl(m.content) })
  }
  return images
}
