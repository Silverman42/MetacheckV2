import type { MetaOverride, MetaValues } from '../types/meta'

const emptyOverride = (): MetaOverride => ({ title: '', description: '', image: '' })

/** A blank set of values, used for "Clear all" and "generate from scratch". */
export function createEmptyMeta(): MetaValues {
  return {
    base: { title: '', description: '', image: '', url: '' },
    advanced: {
      canonical: '',
      ogType: 'website',
      siteName: '',
      locale: '',
      imageAlt: '',
      imageWidth: '',
      imageHeight: '',
      twitterCard: 'summary_large_image',
      twitterSite: '',
      twitterCreator: '',
      robots: '',
      themeColor: '',
      favicon: '',
    },
    overrides: { og: emptyOverride(), twitter: emptyOverride() },
  }
}

/** Deep copy so the draft and the fetched snapshot never share objects (FR-3.7). */
export function cloneMeta(values: MetaValues): MetaValues {
  // JSON rather than structuredClone: works on Vue reactive proxies and every field is plain data.
  return JSON.parse(JSON.stringify(values)) as MetaValues
}

export type MetaPlatform = 'og' | 'twitter'

/**
 * The values a platform actually gets (FR-3.1, FR-3.6): its override where set, else the base.
 * X falls back to Open Graph tags before the base, as X's crawler does.
 */
export function resolveMeta(values: MetaValues, platform: MetaPlatform): Pick<MetaOverride, 'title' | 'description' | 'image'> {
  const { base, overrides } = values
  const pick = (key: 'title' | 'description' | 'image') =>
    overrides[platform][key]
    || (platform === 'twitter' ? overrides.og[key] : '')
    || base[key]
  return { title: pick('title'), description: pick('description'), image: pick('image') }
}
