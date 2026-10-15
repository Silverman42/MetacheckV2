import type { ExtractResponse } from '#layers/core/shared/types/extract'
import type { MetaValues } from '#layers/core/shared/types/meta'
import { createEmptyMeta } from '#layers/core/shared/utils/meta'

/**
 * Turn an extraction into editor values (FR-3.1, FR-3.6). Base fields hold what most platforms
 * show; OG / Twitter overrides are set only where the page ships different values for them.
 */
export function toMetaValues(response: ExtractResponse): MetaValues {
  const values = createEmptyMeta()
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const hit = response.meta.find(m => (m.property ?? m.name ?? '').toLowerCase() === key && m.content?.trim())
      if (hit) return hit.content!.trim()
    }
    return ''
  }
  const image = (...tags: string[]) => response.images.find(i => tags.includes(i.tag))?.url ?? ''
  const link = (...rels: string[]) => response.links.find(l => l.rel.split(' ').some(r => rels.includes(r)))?.resolvedHref ?? ''

  const og = { title: get('og:title'), description: get('og:description'), image: image('og:image', 'og:image:url', 'og:image:secure_url') }
  const tw = { title: get('twitter:title'), description: get('twitter:description'), image: image('twitter:image', 'twitter:image:src') }

  values.base = {
    title: response.title || og.title || tw.title,
    description: get('description') || og.description || tw.description,
    image: og.image || tw.image,
    url: response.finalUrl,
  }

  const differs = (value: string, base: string) => (value && value !== base ? value : '')
  values.overrides.og = {
    title: differs(og.title, values.base.title),
    description: differs(og.description, values.base.description),
    image: differs(og.image, values.base.image),
  }
  values.overrides.twitter = {
    title: differs(tw.title, values.base.title),
    description: differs(tw.description, values.base.description),
    image: differs(tw.image, values.base.image),
  }

  const card = get('twitter:card')
  values.advanced = {
    ...values.advanced,
    canonical: link('canonical'),
    ogType: get('og:type') || values.advanced.ogType,
    siteName: get('og:site_name'),
    locale: get('og:locale'),
    imageAlt: get('og:image:alt', 'twitter:image:alt'),
    imageWidth: get('og:image:width'),
    imageHeight: get('og:image:height'),
    twitterCard: card === 'summary' ? 'summary' : 'summary_large_image',
    twitterSite: get('twitter:site'),
    twitterCreator: get('twitter:creator'),
    robots: get('robots'),
    themeColor: get('theme-color'),
    favicon: link('icon', 'apple-touch-icon'),
  }
  return values
}
