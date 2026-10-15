import type { ExtractResponse } from '#layers/core/shared/types/extract'

// FR-6.1 (fixes U7): the page's tags exactly as found, as rows to list, search and copy.

export interface RawTag {
  kind: 'title' | 'meta' | 'link' | 'json-ld'
  /** The identifying attribute, e.g. `property="og:title"`, `rel="canonical"`. */
  label: string
  value: string
  /** The tag as HTML, for copying. */
  html: string
}

const attr = (name: string, value: string) => `${name}="${value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`

export function rawTags(source: ExtractResponse): RawTag[] {
  const rows: RawTag[] = []
  if (source.title !== null) {
    rows.push({ kind: 'title', label: 'title', value: source.title, html: `<title>${source.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>` })
  }
  for (const m of source.meta) {
    const keys = (['charset', 'name', 'property', 'httpEquiv', 'itemprop'] as const).filter(k => m[k] !== undefined)
    const attrs = keys.map(k => attr(k === 'httpEquiv' ? 'http-equiv' : k, m[k]!))
    if (m.content !== null) attrs.push(attr('content', m.content))
    const first = keys[0]
    rows.push({
      kind: 'meta',
      label: first ? `${first === 'httpEquiv' ? 'http-equiv' : first}="${m[first]}"` : 'meta',
      value: m.content ?? (m.charset ?? ''),
      html: `<meta ${attrs.join(' ')}>`,
    })
  }
  for (const l of source.links) {
    const attrs = [attr('rel', l.rel), attr('href', l.href)]
    if (l.sizes) attrs.push(attr('sizes', l.sizes))
    if (l.type) attrs.push(attr('type', l.type))
    if (l.hreflang) attrs.push(attr('hreflang', l.hreflang))
    rows.push({ kind: 'link', label: `rel="${l.rel}"${l.hreflang ? ` hreflang="${l.hreflang}"` : ''}`, value: l.resolvedHref, html: `<link ${attrs.join(' ')}>` })
  }
  for (const block of source.jsonLd) {
    const type = (block.parsed as { '@type'?: unknown } | undefined)?.['@type']
    rows.push({
      kind: 'json-ld',
      label: block.error ? 'JSON-LD (invalid)' : `JSON-LD${typeof type === 'string' ? ` · ${type}` : ''}`,
      value: block.raw,
      html: `<script type="application/ld+json">${block.raw}</script>`,
    })
  }
  return rows
}

export function filterTags(rows: RawTag[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(r => r.label.toLowerCase().includes(q) || r.value.toLowerCase().includes(q))
}
