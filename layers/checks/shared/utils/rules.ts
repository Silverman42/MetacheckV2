import type { ExtractResponse } from '#layers/core/shared/types/extract'
import type { MetaValues } from '#layers/core/shared/types/meta'
import { buildTags } from '#layers/core/shared/utils/meta-tags'

// FR-5.x: audit rules. Pure functions of a context, so they run on the client against the edited
// state (FR-5.5) and could run anywhere else (e.g. a CLI) unchanged.

export type CheckCategory = 'search' | 'social'
export type CheckSeverity = 'error' | 'warning'
export type CheckStatus = 'pass' | 'fail' | 'skip'

/**
 * live: the page as fetched, read from its real tags.
 * edited: the tags MetaCheck would generate from your edits.
 * draft: no page fetched; the tags you are writing from scratch.
 */
export type CheckMode = 'live' | 'edited' | 'draft'

export interface CheckTag { key: string, attr?: string, content: string }

export interface ImageFacts {
  url: string
  ok?: boolean
  relative?: boolean
  width?: number
  height?: number
  bytes?: number
}

export interface CheckContext {
  mode: CheckMode
  values: MetaValues
  tags: CheckTag[]
  source: ExtractResponse | null
  image: ImageFacts | null
}

export interface CheckRule {
  id: string
  category: CheckCategory
  severity: CheckSeverity
  title: string
  why: string
  fix: string
  docs: { label: string, url: string }
  /** Editor field that fixes it (see useFieldFocus). */
  field?: string
  run: (ctx: CheckContext) => { status: CheckStatus, detail?: string }
}

export interface CheckResult extends Omit<CheckRule, 'run'> {
  status: CheckStatus
  detail?: string
}

const DOCS = {
  google: { label: 'Google Search Central', url: 'https://developers.google.com/search/docs/appearance/title-link' },
  snippet: { label: 'Google Search Central', url: 'https://developers.google.com/search/docs/appearance/snippet' },
  canonical: { label: 'Google Search Central', url: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls' },
  robots: { label: 'Google Search Central', url: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag' },
  ogp: { label: 'ogp.me', url: 'https://ogp.me/' },
  fbImages: { label: 'Meta for Developers', url: 'https://developers.facebook.com/docs/sharing/webmasters/images' },
  xCards: { label: 'X Cards docs', url: 'https://developer.x.com/en/docs/x-for-websites/cards/overview/markup' },
  lang: { label: 'MDN: lang', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang' },
  viewport: { label: 'MDN: viewport', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag' },
}

const get = (ctx: CheckContext, key: string) => ctx.tags.find(t => t.key === key)?.content.trim() ?? ''
const pass = { status: 'pass' as const }
const skip = { status: 'skip' as const }
const fail = (detail?: string) => ({ status: 'fail' as const, detail })
const length = (key: string, [min, max]: [number, number]) => (ctx: CheckContext) => {
  const value = get(ctx, key)
  if (!value) return skip
  if (value.length < min) return fail(`${value.length} characters; aim for ${min}–${max}.`)
  if (value.length > max) return fail(`${value.length} characters; platforms cut it off after about ${max}.`)
  return pass
}
const present = (key: string) => (ctx: CheckContext) => (get(ctx, key) ? pass : fail())
/** Rules about the page itself (lang, viewport, duplicates) need a fetched page. */
const pageOnly = (run: (source: ExtractResponse) => ReturnType<CheckRule['run']>) =>
  (ctx: CheckContext) => (ctx.source ? run(ctx.source) : skip)

const normalizeUrl = (url: string) => {
  try {
    const u = new URL(url)
    u.hash = ''
    return `${u.protocol}//${u.host.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '') || '/'}${u.search}`
  }
  catch {
    return url
  }
}

const SINGLE_VALUED = ['description', 'og:title', 'og:description', 'og:url', 'og:type', 'og:site_name', 'twitter:card', 'twitter:title', 'twitter:description', 'robots', 'viewport']

export const RULES: CheckRule[] = [
  // Search
  { id: 'title-missing', category: 'search', severity: 'error', field: 'title', title: 'Page has a title', why: 'The title is the headline of your search result and the fallback for every share card.', fix: 'Add a <title> that names the page in under 60 characters.', docs: DOCS.google, run: present('title') },
  { id: 'title-length', category: 'search', severity: 'warning', field: 'title', title: 'Title length is 30–60 characters', why: 'Google cuts titles off at about 60 characters; very short titles waste the space.', fix: 'Put the most important words first and keep it under 60 characters.', docs: DOCS.google, run: length('title', [30, 60]) },
  { id: 'description-missing', category: 'search', severity: 'error', field: 'description', title: 'Page has a meta description', why: 'Without one, Google and most apps pick text from the page, which is often a menu or cookie banner.', fix: 'Add a meta description that summarises the page.', docs: DOCS.snippet, run: present('description') },
  { id: 'description-length', category: 'search', severity: 'warning', field: 'description', title: 'Description length is 110–160 characters', why: 'Google shows about 160 characters; shorter descriptions leave space unused.', fix: 'Write one or two sentences of 110–160 characters.', docs: DOCS.snippet, run: length('description', [110, 160]) },
  { id: 'canonical-missing', category: 'search', severity: 'warning', field: 'canonical', title: 'Canonical URL is set', why: 'A canonical link tells search engines which URL to index when the same page has several.', fix: 'Add <link rel="canonical"> with the page’s preferred URL.', docs: DOCS.canonical, run: present('canonical') },
  {
    id: 'canonical-mismatch', category: 'search', severity: 'warning', field: 'canonical', title: 'Canonical URL matches the page', why: 'A canonical that points elsewhere asks Google to index the other URL instead of this one.', fix: 'Point the canonical at this page, unless it really is a duplicate.', docs: DOCS.canonical,
    run: (ctx) => {
      const canonical = get(ctx, 'canonical')
      const url = ctx.source?.finalUrl || ctx.values.base.url
      if (!canonical || !url) return skip
      return normalizeUrl(canonical) === normalizeUrl(url) ? pass : fail(`Canonical points to ${canonical}`)
    },
  },
  { id: 'robots-noindex', category: 'search', severity: 'error', field: 'robots', title: 'Page can be indexed', why: 'A noindex robots tag keeps the page out of search results entirely.', fix: 'Remove noindex unless you mean to hide this page from search.', docs: DOCS.robots, run: ctx => (/noindex|\bnone\b/i.test(get(ctx, 'robots')) ? fail(`robots is “${get(ctx, 'robots')}”`) : pass) },
  { id: 'lang-missing', category: 'search', severity: 'warning', title: 'Page declares its language', why: 'The lang attribute helps search engines, translation and screen readers.', fix: 'Add a lang attribute to <html>, e.g. <html lang="en">.', docs: DOCS.lang, run: pageOnly(s => (s.lang ? pass : fail())) },
  { id: 'viewport-missing', category: 'search', severity: 'warning', title: 'Page has a viewport tag', why: 'Without it, phones render the page zoomed out, and Google treats it as not mobile-friendly.', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.', docs: DOCS.viewport, run: pageOnly(s => (s.meta.some(m => m.name?.toLowerCase() === 'viewport') ? pass : fail())) },
  {
    id: 'duplicate-tags', category: 'search', severity: 'warning', title: 'No duplicate tags', why: 'When a tag appears twice, platforms pick one unpredictably.', fix: 'Remove the extra copies so each tag appears once.', docs: DOCS.ogp,
    run: pageOnly((s) => {
      const counts = new Map<string, number>()
      for (const m of s.meta) {
        const key = (m.property ?? m.name ?? '').toLowerCase()
        if (SINGLE_VALUED.includes(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      const canonicals = s.links.filter(l => l.rel.split(' ').includes('canonical')).length
      if (canonicals > 1) counts.set('canonical', canonicals)
      const dupes = [...counts].filter(([, n]) => n > 1).map(([k, n]) => `${k} ×${n}`)
      return dupes.length ? fail(dupes.join(', ')) : pass
    }),
  },

  // Social
  { id: 'og-title-missing', category: 'social', severity: 'warning', field: 'og.title', title: 'og:title is set', why: 'Facebook, LinkedIn, Slack and most apps read og:title for the card headline.', fix: 'Add <meta property="og:title">.', docs: DOCS.ogp, run: present('og:title') },
  { id: 'og-description-missing', category: 'social', severity: 'warning', field: 'og.description', title: 'og:description is set', why: 'Share cards use og:description for the text under the title.', fix: 'Add <meta property="og:description">.', docs: DOCS.ogp, run: present('og:description') },
  { id: 'og-image-missing', category: 'social', severity: 'error', field: 'image', title: 'og:image is set', why: 'Links without an image get small, easy-to-miss cards or none at all.', fix: 'Add <meta property="og:image"> with an absolute URL to a 1200 × 630 image.', docs: DOCS.fbImages, run: present('og:image') },
  { id: 'og-url-missing', category: 'social', severity: 'warning', title: 'og:url is set', why: 'og:url is the address platforms attribute shares and likes to.', fix: 'Add <meta property="og:url"> with the canonical URL.', docs: DOCS.ogp, run: present('og:url') },
  { id: 'image-relative', category: 'social', severity: 'error', field: 'image', title: 'Image URL is absolute', why: 'Platforms do not resolve relative image paths, so the card shows no image.', fix: 'Use the full URL, starting with https://.', docs: DOCS.ogp, run: ctx => (!ctx.image ? skip : ctx.image.relative ? fail(ctx.image.url) : pass) },
  { id: 'image-unreachable', category: 'social', severity: 'error', field: 'image', title: 'Image loads', why: 'If the image fails to load for the platform’s crawler, the card has no image.', fix: 'Check the URL is public, returns 200 and serves an image.', docs: DOCS.fbImages, run: ctx => (ctx.image?.ok === undefined ? skip : ctx.image.ok ? pass : fail(ctx.image.url)) },
  {
    id: 'image-dimensions', category: 'social', severity: 'warning', field: 'image', title: 'Image is at least 1200 × 630 (1.91:1)', why: 'Smaller or differently shaped images are shown small or cropped.', fix: 'Use a 1200 × 630 px image.', docs: DOCS.fbImages,
    run: (ctx) => {
      const { width, height } = ctx.image ?? {}
      if (!width || !height) return skip
      const ratio = width / height
      if (width < 1200 || height < 630) return fail(`${width} × ${height}`)
      if (Math.abs(ratio - 1.91) / 1.91 > 0.1) return fail(`${width} × ${height} is ${ratio.toFixed(2)}:1`)
      return pass
    },
  },
  { id: 'image-bytes', category: 'social', severity: 'warning', field: 'image', title: 'Image is under 5 MB', why: 'Large images are slow to fetch and some platforms skip them.', fix: 'Compress the image or export it as JPEG or WebP.', docs: DOCS.fbImages, run: ctx => (!ctx.image?.bytes ? skip : ctx.image.bytes > 5 * 1024 * 1024 ? fail(`${(ctx.image.bytes / 1024 / 1024).toFixed(1)} MB`) : pass) },
  { id: 'image-alt-missing', category: 'social', severity: 'warning', field: 'imageAlt', title: 'Image has alt text', why: 'og:image:alt describes the image to people using screen readers.', fix: 'Add <meta property="og:image:alt">.', docs: DOCS.ogp, run: ctx => (!get(ctx, 'og:image') ? skip : get(ctx, 'og:image:alt') || get(ctx, 'twitter:image:alt') ? pass : fail()) },
  { id: 'twitter-card-missing', category: 'social', severity: 'warning', field: 'twitterCard', title: 'twitter:card is set', why: 'Without twitter:card, X shows a small summary card instead of a large image.', fix: 'Add <meta name="twitter:card" content="summary_large_image">.', docs: DOCS.xCards, run: present('twitter:card') },
  {
    id: 'twitter-property', category: 'social', severity: 'warning', title: 'X tags use name=', why: 'X’s spec uses name= for twitter:* tags; property= is not guaranteed to be read.', fix: 'Change property="twitter:…" to name="twitter:…".', docs: DOCS.xCards,
    run: pageOnly((s) => {
      const wrong = s.meta.filter(m => m.property?.toLowerCase().startsWith('twitter:')).map(m => m.property!)
      return wrong.length ? fail(wrong.join(', ')) : pass
    }),
  },
]

/** The tag set the rules read: the live page's tags, or the tags MetaCheck would generate. */
export function contextTags(values: MetaValues, source: ExtractResponse | null, mode: CheckMode): CheckTag[] {
  if (mode === 'live' && source) {
    const tags: CheckTag[] = []
    if (source.title) tags.push({ key: 'title', content: source.title })
    for (const m of source.meta) {
      const key = (m.property ?? m.name ?? '').toLowerCase()
      if (key && m.content) tags.push({ key, attr: m.property ? 'property' : 'name', content: m.content })
    }
    for (const l of source.links) for (const rel of l.rel.split(' ')) tags.push({ key: rel, attr: 'rel', content: l.resolvedHref })
    return tags
  }
  return buildTags(values).map(t => ({ key: t.key, attr: t.attr, content: t.content }))
}

export function runChecks(ctx: CheckContext): CheckResult[] {
  return RULES.map(({ run, ...rule }) => ({ ...rule, ...run(ctx) }))
}

export function summarize(results: CheckResult[]) {
  const failed = (severity: CheckSeverity) => results.filter(r => r.status === 'fail' && r.severity === severity)
  const score = (category: CheckCategory) => {
    const counted = results.filter(r => r.category === category && r.status !== 'skip')
    return counted.length ? Math.round((counted.filter(r => r.status === 'pass').length / counted.length) * 100) : null
  }
  return {
    errors: failed('error'),
    warnings: failed('warning'),
    passed: results.filter(r => r.status === 'pass'),
    skipped: results.filter(r => r.status === 'skip'),
    scores: { search: score('search'), social: score('social') },
  }
}
