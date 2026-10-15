<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-dark.svg">
    <img src=".github/assets/logo-light.svg" alt="MetaCheck" width="360">
  </picture>
</p>

<p align="center">
  Preview, check and fix the meta tags behind your link previews.
</p>

---

## About

When you share a link on Google, Facebook, X, LinkedIn, Slack or WhatsApp, what people see (the title, description and image) comes from meta tags in the page's HTML. Those tags are easy to get wrong and hard to test: every platform reads them a little differently, truncates at different lengths and caches what it finds.

MetaCheck fetches a page the way those platforms do, shows how its link looks on each one, checks the tags against each platform's rules, and writes the code to fix them. You can also start from scratch and write tags for a page that isn't live yet.

Version 2 is a rebuild of the original [MetaCheck](https://metacheckui.netlify.app). It drops the headless browser for a fast plain fetch, adds more platforms, checks with fixes, more code formats, light and dark mode, and editing on every screen size. Product requirements and decisions are in [PRD.md](PRD.md).

## Features

**Check any page**
- Enter a URL with or without `https://`. Results are shareable: the address updates to `/?url=…` and links render on the server.
- See the final URL, HTTP status, response time and any redirects.
- Optional **Render JavaScript** for client-side apps, which lists the tags that only appear after JavaScript runs (and that social platforms therefore never see).
- Recent lookups are kept in your browser; a demo shows MetaCheck's own tags on your first visit.

**Previews for 13 platforms**
- Google (desktop and mobile), Facebook, X, LinkedIn, Pinterest and Slack, plus Discord, WhatsApp, Telegram, iMessage, Bluesky, Mastodon and Threads.
- Each preview follows its platform's rules for truncation, domain display, card size and missing images, in that platform's own light and dark styles.

**Edit**
- Title, description and image URL, with live character counters and guidance for each platform.
- Separate text for Open Graph and X when you want them to differ.
- Advanced fields: canonical URL, `og:type`, locale, site name, image alt text and size, X card type and handles, robots, theme colour and favicon.
- Reset to the page's values or clear everything, with undo.

**Checks**
- 21 rules covering titles, descriptions, Open Graph and X tags, image size, type and reachability, canonical URLs, `noindex`, language, viewport, duplicate tags and more.
- Each result explains why it matters and how to fix it, links to the spec, and can jump straight to the field that fixes it.
- An overall score plus scores for Search and Social. Checks update as you type.

**Tags and structured data**
- Every tag the page ships, exactly as found, with search and copy.
- A structured data view that summarises JSON-LD blocks, flags invalid JSON and links to Google's Rich Results Test.

**Code**
- Generate tags as HTML, Nuxt `useSeoMeta`, Vue `useHead`, Next.js `metadata`, React 19, vue-meta, Astro or JSON, escaped correctly for each.
- Syntax highlighting, optional comments, copy and download.

**Everywhere**
- Light, dark and system themes; responsive layouts for desktop, tablet and phone.
- Keyboard shortcuts: `/` or `⌘K` to focus the URL field, `1`–`4` to switch views, `E` for the editor, `C` to copy the code, `?` for the full list.
- Built to WCAG 2.2 AA and fast: on mobile, Lighthouse scores 94–98 for performance and 100 for accessibility, best practices and SEO.

## Installation

**Requirements:** Node.js 22.22.3 or later (22.x, 24.15+ or 26+) and npm.

```bash
git clone <repository-url> metacheck
cd metacheck
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

If `npm install` fails with `Cannot read properties of null (reading 'edgesOut')`, that's a bug in npm 10.9. Install with npm 11 instead:

```bash
npx npm@11 install
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for Netlify (`NITRO_PRESET=node-server npm run build` builds a standalone Node server) |
| `npm run preview` | Preview the production build |
| `npm run test` | Run all tests (unit and component) |
| `npm run test:layer layers/<name>` | Run one layer's tests |
| `npm run typecheck` | Check types |
| `npm run lint` | Lint |

### Configuration

All settings are optional environment variables.

| Variable | Purpose |
|---|---|
| `NUXT_PUBLIC_SITE_URL` | The site's own URL for canonical and Open Graph tags (default `https://metacheckui.netlify.app`) |
| `NUXT_PUBLIC_REPO_URL` | GitHub link in the header and About page (hidden when empty) |
| `NUXT_EXTRACT_RENDERER_URL`, `NUXT_EXTRACT_RENDERER_TOKEN` | A Browserless-compatible service for **Render JavaScript** |
| `NUXT_PUBLIC_JS_RENDERING` | Set to `true` to show the **Render JavaScript** switch (with the renderer configured) |
| `NUXT_EXTRACT_INTERNAL_TOKEN` | Fixed token for server-side rendering calls to the API (otherwise generated per build) |

### Deployment

MetaCheck is set up for Netlify (`netlify.toml` is included): pages are served from the CDN, `/guide` and `/about` are prerendered, and the extraction API runs as a Netlify Function with its cache in Netlify Blobs.

## Dependencies

### Runtime

| Package | Used for |
|---|---|
| [Nuxt](https://nuxt.com) 4.6.1 and [Vue](https://vuejs.org) 3.5 | The app framework |
| [Tailwind CSS](https://tailwindcss.com) 4 (`tailwindcss`, `@tailwindcss/vite`) | Styling and design tokens |
| [Reka UI](https://reka-ui.com) | Accessible headless components (tabs, dialogs, popovers, switches) |
| [`@nuxtjs/color-mode`](https://color-mode.nuxtjs.org) | Light, dark and system themes |
| [`@nuxt/fonts`](https://fonts.nuxt.com) | Self-hosted Figtree and JetBrains Mono |
| [`@nuxt/icon`](https://nuxt.com/modules/icon) | Lucide and Simple Icons |
| [Shiki](https://shiki.style) | Code highlighting, loaded on demand |
| [htmlparser2](https://github.com/fb55/htmlparser2) | Parsing fetched HTML |
| [undici](https://undici.nodejs.org) | HTTP client with a DNS-level address guard |
| [ipaddr.js](https://github.com/whitequark/ipaddr.js) | Blocking private and reserved addresses (SSRF protection) |
| [Valibot](https://valibot.dev) | Validating API input |
| [`@netlify/blobs`](https://docs.netlify.com/blobs/overview/) | The extraction cache on Netlify |

### Development

| Package | Used for |
|---|---|
| [TypeScript](https://www.typescriptlang.org) 6 and `vue-tsc` | Type checking |
| [Vitest](https://vitest.dev) 4, [`@nuxt/test-utils`](https://nuxt.com/docs/getting-started/testing), `@vue/test-utils`, happy-dom | Unit and component tests |
| [ESLint](https://eslint.org) 10 and `@nuxt/eslint` | Linting |
| `@iconify-json/lucide`, `@iconify-json/simple-icons` | Icon sets bundled at build time |

## Project structure

Every module is a [Nuxt layer](https://nuxt.com/docs/getting-started/layers) in `layers/`, with its own config, components, server code, shared logic and tests (PRD §9.1):

| Layer | What it does |
|---|---|
| `core` | Design tokens, theme, fonts, UI components, layout, shared state and the tag model |
| `extract` | The page extraction API, address guard, cache, rate limit and optional JavaScript rendering |
| `editor` | The metadata editor |
| `previews` | Platform rules and preview cards |
| `checks` | Audit rules, scores and the Checks view |
| `tags` | The tags and structured data views |
| `output` | Code generators and the Code view |
| `workspace` | The main page that puts the modules together, plus keyboard shortcuts |
| `docs` | The Guide and About pages |

Feature layers depend only on `core`; `workspace` composes them. Claude Code hooks in `.claude/` enforce the project's build rules: each module in its own layer, subtle motion on every interaction, and a Lighthouse floor of 90 (PRD §9.11).

## Credits

Built by Sylvester Uche Nkeze.
