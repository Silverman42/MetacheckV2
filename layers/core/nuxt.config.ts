import tailwindcss from '@tailwindcss/vite'
import { createResolver } from '@nuxt/kit'

// core: the foundation every other layer builds on (PRD §9.1.1).
// Design tokens, fonts, theme switching, UI primitives, layout and shared state.
const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
  modules: ['@nuxtjs/color-mode', '@nuxt/fonts', '@nuxt/icon'],

  css: [resolve('./app/assets/css/main.css')],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#f5f9f8', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#002029', media: '(prefers-color-scheme: dark)' },
      ],
    },
  },

  // FR-8.1: Light / Dark / System, defaults to System, no flash on load.
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'metacheck-color-mode',
  },

  // §9.10.3: Figtree for UI, JetBrains Mono for code; self-hosted at build.
  fonts: {
    defaults: {
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
    families: [
      { name: 'Figtree', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500] },
    ],
  },

  icon: {
    mode: 'svg',
    serverBundle: { collections: ['lucide', 'simple-icons'] },
  },
})
