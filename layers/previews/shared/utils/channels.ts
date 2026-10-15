import type { MetaValues } from '#layers/core/shared/types/meta'
import { resolveMeta } from '#layers/core/shared/utils/meta'
import { displayDomain } from '#layers/core/shared/utils/meta-tags'

// FR-4.3: each platform's preview rules in one place. Lengths are what the platform shows before
// truncating on a typical desktop layout; they are guidance, as every platform varies by device.

export type ChannelId =
  | 'google' | 'facebook' | 'x' | 'linkedin' | 'pinterest' | 'slack'
  | 'discord' | 'whatsapp' | 'telegram' | 'imessage' | 'bluesky' | 'mastodon' | 'threads'

export interface ChannelRule {
  id: ChannelId
  label: string
  icon: string
  /** v1 channels are shown as chips; the rest live in "More" (FR-4.1, FR-4.2). */
  tier: 'core' | 'more'
  /** Which values the platform reads. */
  source: 'search' | 'og' | 'twitter'
  /** Characters shown before truncation; 0 = not shown at all. */
  title: number
  description: number
  url: 'breadcrumb' | 'domain' | 'domain-upper' | 'none'
  /** How the image is shown when there is one. */
  image: 'none' | 'large' | 'square' | 'card'
  docs: string
}

export const CHANNELS: ChannelRule[] = [
  { id: 'google', label: 'Google', icon: 'simple-icons:google', tier: 'core', source: 'search', title: 60, description: 160, url: 'breadcrumb', image: 'none', docs: 'https://developers.google.com/search/docs/appearance/snippet' },
  { id: 'facebook', label: 'Facebook', icon: 'simple-icons:facebook', tier: 'core', source: 'og', title: 88, description: 110, url: 'domain-upper', image: 'large', docs: 'https://developers.facebook.com/docs/sharing/webmasters' },
  { id: 'x', label: 'X', icon: 'simple-icons:x', tier: 'core', source: 'twitter', title: 70, description: 125, url: 'domain', image: 'card', docs: 'https://developer.x.com/en/docs/x-for-websites/cards/overview/markup' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'simple-icons:linkedin', tier: 'core', source: 'og', title: 70, description: 0, url: 'domain', image: 'large', docs: 'https://www.linkedin.com/help/linkedin/answer/a521928' },
  { id: 'pinterest', label: 'Pinterest', icon: 'simple-icons:pinterest', tier: 'core', source: 'og', title: 50, description: 0, url: 'none', image: 'large', docs: 'https://developers.pinterest.com/docs/web-features/rich-pins-overview/' },
  { id: 'slack', label: 'Slack', icon: 'simple-icons:slack', tier: 'core', source: 'og', title: 100, description: 150, url: 'none', image: 'large', docs: 'https://api.slack.com/reference/messaging/link-unfurling#classic_unfurl' },
  { id: 'discord', label: 'Discord', icon: 'simple-icons:discord', tier: 'more', source: 'og', title: 100, description: 350, url: 'none', image: 'large', docs: 'https://discord.com/developers/docs/resources/message#embed-object' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'simple-icons:whatsapp', tier: 'more', source: 'og', title: 65, description: 80, url: 'domain', image: 'large', docs: 'https://faq.whatsapp.com/' },
  { id: 'telegram', label: 'Telegram', icon: 'simple-icons:telegram', tier: 'more', source: 'og', title: 100, description: 200, url: 'none', image: 'large', docs: 'https://core.telegram.org/api/links' },
  { id: 'imessage', label: 'iMessage', icon: 'simple-icons:apple', tier: 'more', source: 'og', title: 60, description: 0, url: 'domain', image: 'large', docs: 'https://developer.apple.com/library/archive/technotes/tn2444/_index.html' },
  { id: 'bluesky', label: 'Bluesky', icon: 'simple-icons:bluesky', tier: 'more', source: 'og', title: 80, description: 120, url: 'domain', image: 'large', docs: 'https://docs.bsky.app/docs/advanced-guides/posts#website-card-embeds' },
  { id: 'mastodon', label: 'Mastodon', icon: 'simple-icons:mastodon', tier: 'more', source: 'og', title: 80, description: 120, url: 'domain', image: 'large', docs: 'https://docs.joinmastodon.org/entities/PreviewCard/' },
  { id: 'threads', label: 'Threads', icon: 'simple-icons:threads', tier: 'more', source: 'og', title: 70, description: 0, url: 'domain', image: 'large', docs: 'https://developers.facebook.com/docs/sharing/webmasters' },
]

export const DEFAULT_CHANNELS: ChannelId[] = ['google', 'facebook', 'x', 'linkedin']

export function getChannel(id: ChannelId): ChannelRule {
  return CHANNELS.find(c => c.id === id)!
}

/** Cut at a word boundary when one is close, then add an ellipsis. */
export function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (max <= 0 || clean.length <= max) return { text: clean, truncated: false }
  const cut = clean.slice(0, max - 1)
  // The cut already ends a word, or a word boundary is close enough to cut there instead.
  const endsWord = clean[max - 1] === ' '
  const space = cut.lastIndexOf(' ')
  const kept = endsWord || space <= 0 || space <= max - 16 ? cut : cut.slice(0, space)
  return { text: `${kept.replace(/[\s,.;:–—-]+$/, '')}…`, truncated: true }
}

/** "example.com › docs › getting-started", as Google shows it. */
export function breadcrumb(url: string) {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean).map(p => decodeURIComponent(p))
    return [parsed.host.replace(/^www\./, ''), ...parts].join(' › ')
  }
  catch {
    return url
  }
}

export interface PreviewData {
  title: string
  description: string
  image: string
  domain: string
  displayUrl: string
  siteName: string
  favicon: string
  themeColor: string
  /** How the image shows on this platform right now. */
  card: 'large' | 'small' | 'none'
  truncated: { title: boolean, description: boolean }
  /** What the full values were before truncation. */
  full: { title: string, description: string }
}

export function buildPreview(values: MetaValues, rule: ChannelRule, options: { descriptionMax?: number } = {}): PreviewData {
  const resolved = rule.source === 'search'
    ? { title: values.base.title, description: values.base.description, image: '' }
    : resolveMeta(values, rule.source === 'twitter' ? 'twitter' : 'og')
  const url = values.base.url || values.advanced.canonical
  const domain = displayDomain(url)
  const title = truncate(resolved.title, rule.title)
  const description = truncate(rule.description ? resolved.description : '', options.descriptionMax ?? rule.description)

  let card: PreviewData['card'] = 'none'
  if (resolved.image && rule.image !== 'none') {
    card = rule.image === 'square' || (rule.image === 'card' && values.advanced.twitterCard === 'summary') ? 'small' : 'large'
  }

  return {
    title: title.text,
    description: description.text,
    image: card === 'none' ? '' : resolved.image,
    domain,
    displayUrl: rule.url === 'breadcrumb' ? breadcrumb(url) : rule.url === 'domain-upper' ? domain.toUpperCase() : rule.url === 'none' ? '' : domain,
    siteName: values.advanced.siteName || domain,
    favicon: values.advanced.favicon,
    themeColor: /^#(?:[\da-f]{3}){1,2}$/i.test(values.advanced.themeColor) ? values.advanced.themeColor : '',
    card,
    truncated: { title: title.truncated, description: description.truncated },
    full: { title: resolved.title, description: resolved.description },
  }
}
