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
      // Requests per minute per IP (§9.4).
      rateLimit: 30,
      // FR-1.7: a Browserless-compatible rendering service. Off unless a URL is set
      // (NUXT_EXTRACT_RENDERER_URL, NUXT_EXTRACT_RENDERER_TOKEN).
      renderer: { url: '', token: '', timeoutMs: 8000 },
    },
    public: {
      // Shows the "Render JavaScript" option; set NUXT_PUBLIC_JS_RENDERING=true with the renderer.
      jsRendering: false,
    },
  },

  // On Netlify the extraction cache lives in Netlify Blobs so all function instances share it;
  // elsewhere (dev, local preview) Nitro's default storage is used.
  nitro: process.env.NETLIFY
    ? { storage: { cache: { driver: 'netlify-blobs', name: 'metacheck-cache' } } }
    : {},
})
