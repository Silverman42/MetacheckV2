import type { MetaValues } from '#layers/core/shared/types/meta'
import { buildTags, type MetaTag, type MetaTagGroup } from '#layers/core/shared/utils/meta-tags'
import { escapeAttr, escapeText, jsLiteral, jsString } from './escape'

// FR-7.1: every output format is generated from the same tag list (buildTags), so they all agree.

export type OutputFormat = 'html' | 'useSeoMeta' | 'useHead' | 'next' | 'react' | 'vueMeta' | 'astro' | 'json'

export interface FormatInfo {
  id: OutputFormat
  label: string
  /** Shiki language. */
  lang: 'html' | 'typescript' | 'tsx' | 'json'
  filename: string
  mime: string
  instructions: string
}

export const FORMATS: FormatInfo[] = [
  { id: 'html', label: 'HTML', lang: 'html', filename: 'meta-tags.html', mime: 'text/html', instructions: 'Paste these tags inside the <head> of your page.' },
  { id: 'useSeoMeta', label: 'Nuxt · useSeoMeta', lang: 'typescript', filename: 'seo.ts', mime: 'text/typescript', instructions: 'Call this in a page’s <script setup>. useSeoMeta is type-safe and renders the right name or property for each tag.' },
  { id: 'useHead', label: 'Vue · useHead', lang: 'typescript', filename: 'head.ts', mime: 'text/typescript', instructions: 'Call this in <script setup> with Nuxt or @unhead/vue.' },
  { id: 'next', label: 'Next.js · metadata', lang: 'typescript', filename: 'metadata.ts', mime: 'text/typescript', instructions: 'Export these from a layout.tsx or page.tsx in the App Router.' },
  { id: 'react', label: 'React 19', lang: 'tsx', filename: 'PageMeta.tsx', mime: 'text/plain', instructions: 'React 19 moves <title>, <meta> and <link> into <head> from any component. With react-helmet-async, wrap the same tags in <Helmet>.' },
  { id: 'vueMeta', label: 'vue-meta (Nuxt 2)', lang: 'typescript', filename: 'head.js', mime: 'text/javascript', instructions: 'Use as the head() option of a Nuxt 2 page or a component with vue-meta.' },
  { id: 'astro', label: 'Astro', lang: 'html', filename: 'Meta.astro', mime: 'text/plain', instructions: 'Paste inside <head> in a layout or page, or save as a component.' },
  { id: 'json', label: 'JSON', lang: 'json', filename: 'meta-tags.json', mime: 'application/json', instructions: 'The tags as data, for your own templates or tools.' },
]

export function getFormat(id: OutputFormat) {
  return FORMATS.find(f => f.id === id)!
}

export interface GenerateOptions {
  comments: boolean
}

const GROUP_LABELS: Record<MetaTagGroup, string> = {
  basic: 'Primary meta tags',
  og: 'Open Graph: Facebook, LinkedIn, Slack, WhatsApp and most apps',
  twitter: 'X (falls back to Open Graph for anything not set here)',
}

/** The tags with a comment marker before each new group. */
function grouped(tags: MetaTag[]) {
  return tags.map((tag, i) => ({ tag, startsGroup: i === 0 || tags[i - 1]!.group !== tag.group }))
}

const camel = (key: string) => key.replace(/[:_-]+([a-z])/g, (_, c: string) => c.toUpperCase())
const numeric = (value: string) => (/^\d+$/.test(value) ? Number(value) : value)
const metaAttr = (tag: MetaTag) => ({ [tag.attr as string]: tag.key, content: tag.content })
const linkAttr = (tag: MetaTag) => ({ rel: tag.key, href: tag.content })

function html(tags: MetaTag[], o: GenerateOptions, selfClose: boolean, astro = false) {
  const end = selfClose ? ' />' : '>'
  const lines: string[] = []
  for (const { tag, startsGroup } of grouped(tags)) {
    if (o.comments && startsGroup) lines.push(`${lines.length ? '\n' : ''}<!-- ${GROUP_LABELS[tag.group]} -->`)
    if (tag.tag === 'title') lines.push(astro ? `<title>{${jsString(tag.content)}}</title>` : `<title>${escapeText(tag.content)}</title>`)
    else if (tag.tag === 'link') lines.push(`<link rel="${tag.key}" href="${escapeAttr(tag.content)}"${end}`)
    else lines.push(`<meta ${tag.attr}="${tag.key}" content="${escapeAttr(tag.content)}"${end}`)
  }
  return lines.join('\n')
}

function useSeoMeta(tags: MetaTag[], o: GenerateOptions) {
  const meta = tags.filter(t => t.tag !== 'link')
  const links = tags.filter(t => t.tag === 'link')
  const lines = meta.map(({ key, content }) => `  ${camel(key)}: ${jsLiteral(numeric(content))},`)
  let out = `useSeoMeta({\n${lines.join('\n')}\n})`
  if (links.length) {
    out += `\n\n${o.comments ? '// useSeoMeta covers meta tags only; links go through useHead.\n' : ''}useHead({\n  link: ${jsLiteral(links.map(linkAttr), 1)},\n})`
  }
  return out
}

function useHead(tags: MetaTag[], o: GenerateOptions) {
  const title = tags.find(t => t.tag === 'title')
  const meta = tags.filter(t => t.tag === 'meta').map(metaAttr)
  const link = tags.filter(t => t.tag === 'link').map(linkAttr)
  const head = { title: title?.content, meta: meta.length ? meta : undefined, link: link.length ? link : undefined }
  return `${o.comments ? '// Twitter/X tags use name, Open Graph tags use property.\n' : ''}useHead(${jsLiteral(head)})`
}

function vueMeta(tags: MetaTag[], o: GenerateOptions) {
  const title = tags.find(t => t.tag === 'title')
  // hid lets child components override a tag instead of duplicating it.
  const meta = tags.filter(t => t.tag === 'meta').map(t => ({ hid: t.key, ...metaAttr(t) }))
  const link = tags.filter(t => t.tag === 'link').map(linkAttr)
  const head = { title: title?.content, meta: meta.length ? meta : undefined, link: link.length ? link : undefined }
  return `${o.comments ? '// hid lets child components replace a tag rather than duplicate it.\n' : ''}head() {\n  return ${jsLiteral(head, 1)}\n},`
}

function next(tags: MetaTag[], o: GenerateOptions) {
  const get = (key: string) => tags.find(t => t.key === key)?.content
  const image = get('og:image')
  const twitterImage = get('twitter:image')
  const metadata = {
    title: get('title'),
    description: get('description'),
    robots: get('robots'),
    alternates: get('canonical') ? { canonical: get('canonical') } : undefined,
    icons: get('icon') ? { icon: get('icon') } : undefined,
    openGraph: {
      type: get('og:type'),
      url: get('og:url'),
      siteName: get('og:site_name'),
      locale: get('og:locale'),
      title: get('og:title'),
      description: get('og:description'),
      images: image
        ? [{ url: image, alt: get('og:image:alt'), width: get('og:image:width') ? numeric(get('og:image:width')!) : undefined, height: get('og:image:height') ? numeric(get('og:image:height')!) : undefined }]
        : undefined,
    },
    twitter: {
      card: get('twitter:card'),
      site: get('twitter:site'),
      creator: get('twitter:creator'),
      title: get('twitter:title'),
      description: get('twitter:description'),
      images: twitterImage ? [{ url: twitterImage, alt: get('twitter:image:alt') }] : undefined,
    },
  }
  const themeColor = get('theme-color')
  const imports = themeColor ? 'Metadata, Viewport' : 'Metadata'
  let out = `import type { ${imports} } from 'next'\n\n`
  if (o.comments) out += '// Next.js writes the matching <meta> tags; twitter.* falls back to openGraph.\n'
  out += `export const metadata: Metadata = ${jsLiteral(metadata)}\n`
  if (themeColor) out += `\n${o.comments ? '// theme-color belongs to the viewport export since Next.js 14.\n' : ''}export const viewport: Viewport = ${jsLiteral({ themeColor })}\n`
  return out.trimEnd()
}

function react(tags: MetaTag[], o: GenerateOptions) {
  const lines: string[] = []
  for (const { tag, startsGroup } of grouped(tags)) {
    if (o.comments && startsGroup) lines.push(`      {/* ${GROUP_LABELS[tag.group]} */}`)
    if (tag.tag === 'title') lines.push(`      <title>{${jsString(tag.content)}}</title>`)
    else if (tag.tag === 'link') lines.push(`      <link rel="${tag.key}" href={${jsString(tag.content)}} />`)
    else lines.push(`      <meta ${tag.attr}="${tag.key}" content={${jsString(tag.content)}} />`)
  }
  return `export function PageMeta() {\n  return (\n    <>\n${lines.join('\n')}\n    </>\n  )\n}`
}

function json(tags: MetaTag[]) {
  const title = tags.find(t => t.tag === 'title')
  return JSON.stringify({
    title: title?.content,
    meta: tags.filter(t => t.tag === 'meta').map(metaAttr),
    link: tags.filter(t => t.tag === 'link').map(linkAttr),
  }, null, 2)
}

export function generate(values: MetaValues, format: OutputFormat, options: GenerateOptions = { comments: true }) {
  const tags = buildTags(values)
  if (!tags.length) return ''
  switch (format) {
    case 'html': return html(tags, options, false)
    case 'astro': return html(tags, options, true, true)
    case 'useSeoMeta': return useSeoMeta(tags, options)
    case 'useHead': return useHead(tags, options)
    case 'vueMeta': return vueMeta(tags, options)
    case 'next': return next(tags, options)
    case 'react': return react(tags, options)
    case 'json': return json(tags)
  }
}
