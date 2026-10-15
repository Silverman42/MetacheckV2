import type { ExtractedJsonLd } from '#layers/core/shared/types/extract'

// Structured data view: a readable summary of each JSON-LD block (types and the fields that
// matter for rich results), plus the formatted JSON.

export interface JsonLdEntity {
  type: string
  fields: { key: string, value: string }[]
}

export interface JsonLdSummary {
  entities: JsonLdEntity[]
  pretty: string
  error?: string
}

const KEY_FIELDS = ['name', 'headline', 'description', 'url', 'image', 'logo', 'author', 'datePublished', 'dateModified', 'publisher', 'price', 'priceCurrency', 'ratingValue', 'sameAs']

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    return text(v.name ?? v.url ?? v['@id'] ?? v['@value'] ?? '')
  }
  return ''
}

function entity(node: Record<string, unknown>): JsonLdEntity {
  const raw = node['@type']
  const type = Array.isArray(raw) ? raw.join(', ') : typeof raw === 'string' ? raw : 'Thing'
  const fields = KEY_FIELDS
    .filter(key => node[key] !== undefined)
    .map(key => ({ key, value: text(node[key]) }))
    .filter(f => f.value)
  return { type, fields }
}

export function summarizeJsonLd(block: ExtractedJsonLd): JsonLdSummary {
  if (block.error || block.parsed === undefined) return { entities: [], pretty: block.raw, error: block.error ?? 'Invalid JSON' }
  const roots = Array.isArray(block.parsed) ? block.parsed : [block.parsed]
  const nodes = roots.flatMap((root) => {
    if (!root || typeof root !== 'object') return []
    const graph = (root as Record<string, unknown>)['@graph']
    return Array.isArray(graph) ? graph : [root]
  }).filter((n): n is Record<string, unknown> => !!n && typeof n === 'object')
  return { entities: nodes.map(entity), pretty: JSON.stringify(block.parsed, null, 2) }
}
