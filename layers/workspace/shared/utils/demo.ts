import type { MetaValues } from '#layers/core/shared/types/meta'
import { createEmptyMeta } from '#layers/core/shared/utils/meta'

// FR-1.5: on a first visit the workspace shows MetaCheck's own tags, so it is never empty.
// Built locally (no fetch) so the first paint is instant.
export function demoValues(origin: string): MetaValues {
  const values = createEmptyMeta()
  values.base = {
    title: 'MetaCheck — preview and fix your link’s meta tags',
    description: 'Preview how your link looks on Google, Facebook, X, LinkedIn and Slack, check the meta tags behind it and copy the code to fix them.',
    image: `${origin}/og-image.jpg`,
    url: `${origin}/`,
  }
  Object.assign(values.advanced, {
    canonical: `${origin}/`,
    siteName: 'MetaCheck',
    locale: 'en_GB',
    imageAlt: 'The MetaCheck logo',
    imageWidth: '1200',
    imageHeight: '630',
    themeColor: '#002029',
    favicon: `${origin}/favicon.png`,
  })
  return values
}
