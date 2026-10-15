import type { MetaValues } from '../types/meta'
import { resolveMeta } from './meta'

// The tags a set of values produces (FR-7.2–7.4). One list, so the code output and the checks
// always agree. Only tags with values are included; X tags are added only where they differ from
// Open Graph, because X falls back to og:* (FR-7.3).

export type MetaTagGroup = 'basic' | 'og' | 'twitter'

export interface MetaTag {
  tag: 'title' | 'meta' | 'link'
  /** meta: `name` or `property`; link: always `rel`. */
  attr?: 'name' | 'property' | 'rel'
  /** Meta name/property, link rel, or "title". */
  key: string
  content: string
  group: MetaTagGroup
}

export function buildTags(values: MetaValues): MetaTag[] {
  const { base, advanced } = values
  const og = resolveMeta(values, 'og')
  const tw = resolveMeta(values, 'twitter')
  const tags: MetaTag[] = []
  const add = (tag: MetaTag['tag'], attr: MetaTag['attr'], key: string, content: string, group: MetaTagGroup) => {
    const value = content.trim()
    if (value) tags.push({ tag, attr, key, content: value, group })
  }

  add('title', undefined, 'title', base.title, 'basic')
  add('meta', 'name', 'description', base.description, 'basic')
  add('meta', 'name', 'robots', advanced.robots, 'basic')
  add('meta', 'name', 'theme-color', advanced.themeColor, 'basic')
  add('link', 'rel', 'canonical', advanced.canonical, 'basic')
  add('link', 'rel', 'icon', advanced.favicon, 'basic')

  add('meta', 'property', 'og:type', advanced.ogType, 'og')
  add('meta', 'property', 'og:url', base.url || advanced.canonical, 'og')
  add('meta', 'property', 'og:site_name', advanced.siteName, 'og')
  add('meta', 'property', 'og:locale', advanced.locale, 'og')
  add('meta', 'property', 'og:title', og.title, 'og')
  add('meta', 'property', 'og:description', og.description, 'og')
  add('meta', 'property', 'og:image', og.image, 'og')
  if (og.image) {
    add('meta', 'property', 'og:image:alt', advanced.imageAlt, 'og')
    add('meta', 'property', 'og:image:width', advanced.imageWidth, 'og')
    add('meta', 'property', 'og:image:height', advanced.imageHeight, 'og')
  }

  add('meta', 'name', 'twitter:card', advanced.twitterCard, 'twitter')
  add('meta', 'name', 'twitter:site', advanced.twitterSite, 'twitter')
  add('meta', 'name', 'twitter:creator', advanced.twitterCreator, 'twitter')
  if (tw.title !== og.title) add('meta', 'name', 'twitter:title', tw.title, 'twitter')
  if (tw.description !== og.description) add('meta', 'name', 'twitter:description', tw.description, 'twitter')
  if (tw.image !== og.image) add('meta', 'name', 'twitter:image', tw.image, 'twitter')
  if (tw.image) add('meta', 'name', 'twitter:image:alt', advanced.imageAlt, 'twitter')

  return tags
}

/** Host without www., for platforms that show only the domain. */
export function displayDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  }
  catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] ?? ''
  }
}
