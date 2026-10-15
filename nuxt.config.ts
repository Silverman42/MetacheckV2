// App-wide configuration only. Module code lives in layers/<module>/ (PRD §9.1),
// which Nuxt registers automatically.
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@nuxt/test-utils/module'],

  runtimeConfig: {
    public: {
      siteUrl: 'https://metacheckui.netlify.app',
      // The v2 repository (decision D4); the header hides the GitHub link while this is empty.
      repoUrl: '',
    },
  },

  // PRD §9.1.2: "/" stays server-rendered so ?url= share links get previews.
  // Add `'/guide': { prerender: true }` and `'/about': { prerender: true }` when the docs layer ships.
  routeRules: {},

  nitro: {
    preset: 'netlify',
    // Ship .br/.gz next to static assets so every server (Netlify, local preview) sends them compressed.
    compressPublicAssets: true,
  },

  typescript: {
    strict: true,
  },
})
