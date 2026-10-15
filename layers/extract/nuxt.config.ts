import { randomUUID } from 'node:crypto'

// extract: server-side page fetching and parsing behind GET /api/extract (PRD §9.1.1).
export default defineNuxtConfig({
  runtimeConfig: {
    extract: {
      // Lets server-side rendering call the API in-process. Private; regenerated per build
      // unless NUXT_EXTRACT_INTERNAL_TOKEN is set.
      internalToken: randomUUID(),
      // Netlify synchronous functions stop at 10 s, so page + image probes stay under that.
      pageTimeoutMs: 6000,
      probeTimeoutMs: 3000,
      maxHtmlBytes: 1_500_000,
      maxImages: 4,
    },
  },
})
