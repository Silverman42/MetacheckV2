# MetaCheck — Product Requirements Document

| | |
|---|---|
| **Document** | PRD: MetaCheck v1 baseline and v2 requirements |
| **Status** | Draft for review (rev. 2: open questions resolved, design system added) |
| **Date** | 2026-10-15 |
| **Sources reviewed** | `v1/MetaCheck` (backend API), `v1/MetacheckUI` (web frontend) |
| **v2 target stack** | Nuxt 4.6.1 + Tailwind CSS v4, Figtree font, light and dark mode, hosted on Netlify at `metacheckui.netlify.app`, own repository |

---

## 1. Summary

MetaCheck is a free, open-source web tool that lets developers **check** the meta tags of any live webpage and **generate** the meta tags a page should have. A user enters a URL, MetaCheck scrapes the page's `<title>` and `<meta>` tags, shows how the page will look when shared on Google and social platforms, and lets the user edit the title, description and image before copying ready-to-paste HTML or a `vue-meta` head object.

v1 has two parts:

- **MetaCheck API** (`v1/MetaCheck`): Express + Puppeteer service with one endpoint, `GET /api/fetch?url=…`, deployed to Heroku.
- **MetaCheck UI** (`v1/MetacheckUI`): Nuxt 2 single-page app (static, client-only) styled with Tailwind CSS v2, deployed to Netlify, proxying `/api/*` to the Heroku backend.

This document has two jobs:

1. **Describe v1 as built** (§3–§6): features, behaviour, data model, and known defects, so nothing is lost in the rewrite.
2. **Define v2** (§7–§13): what to keep, fix and add, built as a single Nuxt 4.6.1 app with Tailwind CSS v4, plus the v2 design system (§9.10).

> **Scope note:** this PRD does not start v2 implementation. It is the input for planning that work.

---

## 2. Problem and audience

### 2.1 Problem
Meta tags (title, description, Open Graph, Twitter Card) control how a page appears in search results and link previews. They are easy to forget, tedious to write by hand, and hard to verify: you only see the result after sharing a link. The author built MetaCheck because they kept skipping meta tags under time pressure despite their SEO value.

### 2.2 Target users
| Persona | Need |
|---|---|
| **Front-end / full-stack developer** (primary) | Generate correct meta tags quickly and paste them into a page or framework head config. |
| **Developer auditing an existing site** | See what tags a live URL exposes and how its link previews will render. |
| **Content / marketing person** (secondary, mostly v2) | Check that a page's share preview looks right before posting it. |

### 2.3 Jobs to be done
1. "When I finish a page, give me the meta tags I need so I can paste them in."
2. "When I share a link, show me what people will see on each platform."
3. "When a preview looks wrong, tell me which tag is missing or broken."  *(barely covered in v1; core to v2)*

---

## 3. v1 system overview

```
Browser (Nuxt 2 SPA, Netlify)
   │  GET /api/fetch?url=<target>
   ▼
Netlify redirect / @nuxtjs/proxy  ──►  Heroku: Express (index.js)
                                          │
                                          ▼
                                  ScrapeController.js
                                  puppeteer.launch() per request
                                  page.goto(url, domcontentloaded)
                                  collect <meta> + <title>
                                          │
                                          ▼
                              { message, pageTitle, data: Meta[] }
```

### 3.1 v1 tech stack
| Layer | v1 choice |
|---|---|
| Frontend framework | Nuxt 2.15 (Vue 2), `ssr: false`, `target: 'static'` |
| Styling | Tailwind CSS 2 via `@nuxtjs/tailwindcss` 4, custom Sofia Pro and SF Mono fonts, IcoFont icons, `vue-feather-icons` |
| HTTP | `@nuxtjs/axios`, `@nuxtjs/proxy` |
| Extras | `vue-code-highlight` (syntax highlighting), `vue-custom-scrollbar` |
| Frontend hosting | Netlify (`yarn generate`, `@aceforth/nuxt-netlify` redirects) |
| Backend | Node (README says ^10), Express 4, Puppeteer 10, validatorjs |
| Backend hosting | Heroku (`Procfile: web: node index.js`) |
| Tooling | ESLint + Prettier; no tests, no TypeScript |

---

## 4. v1 functional inventory — Backend (`v1/MetaCheck`)

### 4.1 Endpoint
| Item | Behaviour |
|---|---|
| Route | `GET /api/fetch` (the README wrongly documents `POST`) |
| Input | Query string `url` (required, must pass validatorjs `url` rule, so a protocol is required) |
| Catch-all | Any other route → `404 { error: "You entered an invalid route… '/fetch'…" }` (the message names the wrong path) |

### 4.2 Scrape flow (`controller/ScrapeController.js`)
1. Validate `req.query.url`. On failure → **HTTP 403** with validatorjs error map (`{ url: ["The url format is invalid."] }`).
2. Launch a **new headless Chromium per request** (`--no-sandbox`, `--disable-setuid-sandbox`).
3. Open a page with a 1300×700 viewport and `goto(url, { waitUntil: 'domcontentloaded' })`.
4. For every `<meta>` element, read four attributes: `http-equiv`, `name`, `property`, `content` (one `page.evaluate` round-trip per attribute per element).
5. Read `<title>` `innerText`.
6. Close the browser and respond.

### 4.3 Response contract
```json
{
  "message": "Metadata succesfully searched",
  "pageTitle": "Example Domain",
  "data": [
    { "httpEquiv": null, "name": "description", "property": null, "content": "…" },
    { "httpEquiv": null, "name": null, "property": "og:image", "content": "https://…" }
  ]
}
```
Errors: `403` (validation), intended `500` (`"Meta search faced an internal issue. Please try again"`).

### 4.4 Backend defects and risks found in review
| # | Issue | Impact |
|---|---|---|
| B1 | `return` inside `finally` always sends a 200 after the `catch` already sent a 500. | On any scrape failure Express raises *headers already sent*; the client may get a 500 or a broken response. Error handling is effectively broken. |
| B2 | Pages without a `<title>` make `GetPageTtile` throw (null element). | Valid pages fail entirely instead of returning their meta tags. |
| B3 | Chromium is launched and torn down on every request; `browser.close()` is not awaited; there are no timeouts or concurrency limits. | Slow responses (seconds), high memory, and an easy denial-of-service vector. |
| B4 | No SSRF protection: any URL, including `localhost`, private IP ranges and cloud metadata addresses, is fetched. | Security risk on any shared host. |
| B5 | Validation failures return 403 instead of 400/422. | Misleading status code. |
| B6 | Only `<meta>` and `<title>` are collected. Canonical, favicon, `lang`, `theme-color` link tags, JSON-LD, `robots`, image dimensions, and final URL after redirects are ignored. | Limits the "check" use case. |
| B7 | Relative `og:image` / `twitter:image` URLs are returned as-is. | Previews break for sites that use relative paths (and those tags are invalid anyway; nothing flags it). |
| B8 | No CORS, rate limiting, caching, logging or health check. | Works only behind the Netlify proxy; repeated lookups cost a full browser launch each time. |
| B9 | Heroku's free tier ended in Nov 2022, so the production API (`metacheck.herokuapp.com`) is presumably down; Node 10 and Puppeteer 10 are long out of support. | v1 as deployed likely does not work today. |
| B10 | `package.json` metadata is copied from another project ("Currency Exchange API", `CurrencyExchange` repo); `start` runs nodemon in production paths. | Housekeeping. |

---

## 5. v1 functional inventory — Frontend (`v1/MetacheckUI`)

v1 is a **single page** (`pages/index.vue`) with a sticky header and three columns on desktop.

### 5.1 Layout
| Region | Content |
|---|---|
| **Header** (`Navbar.vue`) | Logo; URL input + search button (submit form); nav links **Guide**, **Metainfo** (both placeholder `#` links) and **Github** (MetacheckUI repo). On mobile the nav links are fixed to the bottom of the screen. |
| **Left column** (`Metadata.vue`, desktop only) | "Metadata" editor: Title, Description, Image. Sticky. **Hidden below `lg` breakpoint**, so mobile users cannot edit. |
| **Centre column** | "Channels" selector and "Preview" tabs. |
| **Right column** (`Bottom.vue`) | Logo, product blurb, "Built with NuxtJs, TailwindCSS and ♥ by Sylvester Uche Nkeze". |

Visual design: dark teal theme (`primaryBg #002029`, Tailwind `teal` primary, `rose` secondary), Sofia Pro body font, SF Mono for code.

### 5.2 Features

#### F1 — Fetch metadata for a URL
- URL input pre-filled with `http://metacheckui.netlify.app`; on page load the app **automatically fetches** this URL so the screen is never empty.
- Submitting calls `GET /api/fetch?url=<url>` (URL not encoded).
- While loading: search button shows a spinner; preview area shows a skeleton card.
- On success: `pageTitle` becomes the title; each returned meta tag is stored in `metaSchema` keyed by its `name` or `property` (tags with neither are skipped). `og:image` and `twitter:image` are also copied into `code_og:image` / `code_twitter:image` for code output.
- On error: loading stops. **No message is shown** (the error is swallowed).

#### F2 — Edit metadata
| Field | Control | Fans out to |
|---|---|---|
| Title | text input | `title`, `og:title`, `twitter:title` |
| Description | textarea (5 rows) | `description`, `og:description`, `twitter:description` |
| Image | file picker ("Choose File.. / Browse") | Read as a base64 **data URL** into `og:image`, `twitter:image` (previews only; code output keeps the fetched image URL) |

Each new fetch first clears title, description and image.

#### F3 — Channel selection
Six circular toggles (icon-only): **Google, Facebook, Twitter, LinkedIn, Pinterest, Slack**. Default selected: Google and Facebook. Toggling shows/hides that channel's preview in the Webview tab. Selection is not persisted.

#### F4 — Preview tabs
Three tabs: **Webview** (default), **Code**, **JSON**.

**Webview** — a mock-up card per selected channel:
| Channel | Shows | Source fields (fallbacks) |
|---|---|---|
| Google | Blue title, green URL, description | `title`, `url`, `description` |
| Facebook | Image, uppercase URL, title, description | `og:image`; `og:title`→`title`; `og:description`→`description` |
| Twitter | Image, title, description, URL | `twitter:image`; `twitter:title`→`title`; `twitter:description`→`description` |
| LinkedIn | Image, title, URL | `og:image`; `og:title`→`title` |
| Pinterest | Small rounded image, title, ⋮ icon | `og:image`; `og:title`→`title` |
| Slack | Left border, URL, title, description, image | `og:*` with fallbacks |

The URL displayed is the URL typed in the search box, not the scraped `og:url`.

**Code** — instruction "Copy the generated HTML code and place it between the `head` tag", then a highlighted block with a **Copy** button (shows "Copied" for 1 s):
```html
<title>…</title>
<!--Metadata-->
<meta name="title" content="…">
<meta name="description" content="…">
<!--Facebook / Opengraph metatags-->
<meta property="og:type" content="website">
<meta property="og:url" content="…">
<meta property="og:title" content="…">
<meta property="og:description" content="…">
<meta property="og:image" content="…">
<!--Twitter metatags-->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="…">
<meta property="twitter:title" content="…">
<meta property="twitter:description" content="…">
<meta property="twitter:image" content="…">
```

**JSON** — instruction pointing to vue-meta, then a copyable `head: { title, meta: [...] }` JavaScript object with the same 11 tags.

#### F5 — Theme
Dark mode is effectively always on (the page root hard-codes the `dark` class). Code exists to read `localStorage.theme` / `prefers-color-scheme`, but there is no toggle and light-mode styles are incomplete.

#### F6 — Site SEO for MetaCheck itself
`nuxt.config.js` sets the app's own title, description, `theme-color`, Open Graph and Twitter tags pointing to `metacheckui.netlify.app` and `/metaimage.png`.

### 5.3 v1 data model (client)
`assets/defaultMetaSchema.js` seeds a flat map keyed by tag name:

`description`, `twitter:url`, `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:image`, `twitter:description`, `og:type` (`website`), `og:title`, `og:image`, `og:description`, `og:url`, `code_og:image`, `code_twitter:image`

Each entry: `{ httpEquiv, name, property, content }`. Page-level `title` and `url` are merged in as plain strings (`extraSchema`).

### 5.4 Frontend defects and gaps found in review
| # | Issue | Impact |
|---|---|---|
| U1 | Fetch errors are swallowed; the axios error plugin and alert/validation/auth store modules it uses are **not registered or not present**. | User sees nothing when a URL fails. |
| U2 | Metadata editor is `hidden` below `lg`. | No editing on mobile/tablet. |
| U3 | Uploaded images become base64 data URLs. | Not usable as a real `og:image`; code output silently keeps the old URL, so preview and code disagree. |
| U4 | Generated HTML/JS is built by string interpolation with no escaping. | A `"` in a description breaks the HTML; an `'` breaks the JS object. |
| U5 | Twitter tags use `property=` instead of `name=`; `<meta name="title">` is non-standard; `og:type`/`twitter:card` are hard-coded. | Output works on most platforms but isn't spec-correct or configurable. |
| U6 | `defaultMetaSchema` typos: `twitter:title.property` is `og:title`; `og:description.property` is `og:decsription`. The schema is shallow-copied, so edits mutate the shared default. | Latent data bugs. |
| U7 | Scraped tags outside the 11 known keys are stored but never shown or exported. | The "check" use case can't show the full set of tags. |
| U8 | Previews are approximations: no character truncation (Google ~60/160 chars), full URL instead of domain, Slack shows a stray `k` after the URL and an empty favicon `<img>`. | Previews can mislead. |
| U9 | No length counters, warnings, or validation of any field. | No guidance — the core value of a "check" tool. |
| U10 | URL must include a protocol; URL not encoded in the request; current URL not reflected in the page address. | Friction; results can't be shared or bookmarked. |
| U11 | Navbar "Guide" and "Metainfo" are dead links. | Unfinished UI. |
| U12 | Accessibility: icon-only channel toggles with no accessible name; search input has no label; tabs lack ARIA roles; `label for="email"` hard-coded in `Input/Container.vue`. | Fails basic WCAG checks. |
| U13 | Unused code and dependencies: Modal, Select, Switch, Tag, ELink, ILink, Alert components; `netlify-cli` as a runtime dependency; package named `GasappAdmin`; committed `dist/_redirects` points `/api/*` to an unrelated host; 370 KB `.patch` file in repo root. | Maintenance noise; the committed build is wrong. |
| U14 | Nuxt 2 / Vue 2 reached end of life (Vue 2 EOL Dec 2023). | Must migrate regardless. |

---

## 6. What v1 gets right (keep in v2)

- **One-screen workflow**: URL in → previews + code out, no sign-up.
- **Auto-loaded demo URL** so first-time visitors see a populated screen.
- **Edit once, fan out** to standard, Open Graph and Twitter fields.
- **Per-channel preview toggles** and the **Webview / Code / JSON** split.
- **Copy-to-clipboard** with confirmation.
- **Skeleton loading state.**
- Distinctive **dark teal brand**, logo assets and favicon.
- **Free and open source.**

---

## 7. v2 goals and non-goals

### 7.1 Goals
1. **Feature parity** with v1 (§5.2), with every defect in §4.4 and §5.4 fixed.
2. **One deployable app**: frontend and API in one Nuxt project in `v2/`, with the API as Nitro server routes.
3. **Make "check" real**: audit the scraped tags and explain what's missing or wrong, not only render previews.
4. **Accurate previews** that follow each platform's real truncation and layout rules.
5. **Useful output** for modern frameworks, not only raw HTML and vue-meta.
6. **Fast, safe, cheap to host**: sub-second typical lookups, SSRF-safe, rate-limited, cacheable.
7. **Accessible and responsive**: full functionality on mobile; WCAG 2.2 AA.
8. **Modern, polished UI** that keeps v1's teal identity, with first-class light and dark modes (§9.10).

### 7.2 Non-goals (v2)
- User accounts, saved projects or teams.
- Crawling whole sites or scheduled monitoring.
- Full SEO auditing beyond head metadata (performance, content, backlinks).
- **Image upload or hosting.** Images are referenced by absolute URL only (decision D6).
- **A public API.** The extraction endpoint exists only to serve the MetaCheck UI (decision D7).
- A browser extension or CLI (can follow; see §12).

---

## 8. v2 functional requirements

Priority: **P0** = required for launch (parity + fixes), **P1** = launch target, **P2** = post-launch.

### 8.1 URL input and fetching
| ID | Requirement | Pri |
|---|---|---|
| FR-1.1 | Accept URLs with or without a protocol (`example.com` → `https://example.com`); trim whitespace; show inline validation. | P0 |
| FR-1.2 | Reflect the current URL in the page address (`/?url=…`) so results are shareable, bookmarkable and survive reload; load it on entry. | P0 |
| FR-1.3 | Show clear, specific errors: invalid URL, DNS failure, timeout, non-HTML response, blocked/private address, HTTP 4xx/5xx from target, rate-limited. | P0 |
| FR-1.4 | Show the final URL after redirects and the redirect chain if any. | P1 |
| FR-1.5 | Keep a demo URL that auto-loads on first visit (v1 behaviour), switchable to an empty "generate from scratch" mode. | P0 |
| FR-1.6 | Recent lookups list (last 10, stored locally in the browser, clearable). | P1 |
| FR-1.7 | "Render JavaScript" option for client-rendered sites whose tags only appear after JS runs (see §9.2). | P2 |

### 8.2 Extraction (server)
The API must return everything relevant in the document `<head>`, normalised:

| ID | Requirement | Pri |
|---|---|---|
| FR-2.1 | All `<meta>` tags (`name`, `property`, `http-equiv`, `charset`, `itemprop`, `content`), in document order. | P0 |
| FR-2.2 | `<title>`; return an empty value without failing when missing (fixes B2). | P0 |
| FR-2.3 | `<link>` tags: `canonical`, icons (`icon`, `apple-touch-icon`, `mask-icon`), `manifest`, `alternate` (hreflang, RSS). | P1 |
| FR-2.4 | `<html lang>`, viewport, charset. | P1 |
| FR-2.5 | JSON-LD blocks (`<script type="application/ld+json">`), parsed, with parse errors reported. | P2 |
| FR-2.6 | Resolve relative URLs (images, canonical, icons) against the final URL, and flag that they were relative. | P0 |
| FR-2.7 | Probe `og:image` / `twitter:image`: reachable, content type, byte size, pixel dimensions. | P1 |
| FR-2.8 | Fetch metadata: final URL, HTTP status, response time, content type. | P1 |

### 8.3 Metadata editor
| ID | Requirement | Pri |
|---|---|---|
| FR-3.1 | Edit Title, Description and Image URL; changes fan out to standard, OG and Twitter fields (v1 behaviour). | P0 |
| FR-3.2 | Editor available on all screen sizes (fixes U2), e.g. a collapsible panel or bottom sheet on mobile. | P0 |
| FR-3.3 | Live character counters with platform-aware guidance (e.g. title ~50–60, description ~110–160 characters). | P0 |
| FR-3.4 | Image: **URL-only**. An absolute image URL field with a thumbnail, load-state indicator and validation (must be `http(s)`, must load as an image). v1's file picker is removed, so preview and code always use the same image (fixes U3; decision D6). | P0 |
| FR-3.5 | "Advanced" fields: canonical URL, `og:type`, `og:site_name`, `og:locale`, `og:image:alt`, image width/height, `twitter:card` type, `twitter:site`/`twitter:creator`, `robots`, `theme-color`, favicon. | P1 |
| FR-3.6 | Per-platform overrides: decouple OG and Twitter title/description/image from the base values when needed. | P1 |
| FR-3.7 | "Reset to fetched values" and "Clear all" actions; edits never mutate the fetched snapshot (fixes U6). | P0 |
| ~~FR-3.8~~ | ~~Image upload to storage.~~ Dropped: v2 is URL-only (decision D6). | — |

### 8.4 Previews
| ID | Requirement | Pri |
|---|---|---|
| FR-4.1 | Keep v1 channels: Google, Facebook, X (Twitter), LinkedIn, Pinterest, Slack. | P0 |
| FR-4.2 | Add channels: Discord, WhatsApp, Telegram, iMessage, Bluesky, Mastodon, Threads. | P1 |
| FR-4.3 | Each preview follows the platform's real rules: domain vs full URL, truncation lengths, image aspect ratio and crop, small vs large card by `twitter:card`, fallback order when a tag is missing. Store these rules in one config per channel. | P0 |
| FR-4.4 | Google preview: desktop and mobile variants, favicon and site name, breadcrumb-style URL. | P1 |
| FR-4.5 | Channel toggles have accessible labels and persist locally between visits. | P0 |
| FR-4.6 | Previews follow the active light/dark theme, using each platform's own light and dark styling (e.g. X dim/dark, Slack dark, Google dark results). | P1 |
| FR-4.7 | Missing image state shows the platform's real behaviour (no image / placeholder), not a broken `<img>`. | P0 |

### 8.5 Audit ("Check") — new in v2
| ID | Requirement | Pri |
|---|---|---|
| FR-5.1 | A **Checks** tab listing results grouped as Errors, Warnings, Passed. | P1 |
| FR-5.2 | Rules include at least: missing title/description; length out of range; missing `og:title`/`og:description`/`og:image`/`og:url`; relative or unreachable image; image under 1200×630 or wrong aspect ratio; image over 5 MB; missing `twitter:card`; missing canonical; canonical mismatches final URL; missing `lang`; missing viewport; `noindex` present; duplicate tags; Twitter tags using `property` instead of `name`. | P1 |
| FR-5.3 | Each result explains why it matters and how to fix it, linking to the relevant spec (ogp.me, X Cards docs, Google Search Central). | P1 |
| FR-5.4 | A summary score or badge per category (Search, Social). | P2 |
| FR-5.5 | Rules run on the client against the edited state so fixes show immediately. | P1 |

### 8.6 Raw tags view — new in v2
| ID | Requirement | Pri |
|---|---|---|
| FR-6.1 | A **Tags** tab listing every extracted tag exactly as found (fixes U7), searchable and copyable. | P1 |

### 8.7 Code output
| ID | Requirement | Pri |
|---|---|---|
| FR-7.1 | Output targets: **HTML** (v1), **Nuxt `useSeoMeta`**, **Nuxt/Vue `useHead`**, **Next.js `metadata`**, **React 19 / Helmet**, **vue-meta** (v1 JSON tab), **Astro**, **plain JSON**. | P0 for HTML, Nuxt `useSeoMeta`, vue-meta; P1 for the rest |
| FR-7.2 | Generate output from a data structure with proper escaping for each format (fixes U4). | P0 |
| FR-7.3 | Spec-correct attributes: Twitter tags use `name=`, no `<meta name="title">`, `og:type` and `twitter:card` from editor state (fixes U5). | P0 |
| FR-7.4 | Include only tags that have values; option to include comments. | P0 |
| FR-7.5 | Copy button with accessible confirmation; download as file. | P0 copy / P2 download |
| FR-7.6 | Syntax highlighting (e.g. Shiki) themed to match the app. | P0 |

### 8.8 App-wide
| ID | Requirement | Pri |
|---|---|---|
| FR-8.1 | **Light and dark mode** (fixes F5): a Light / Dark / System control in the header; defaults to System; choice persisted; no flash of the wrong theme on load; every screen, component and preview designed and contrast-checked in both themes (§9.10). | P0 |
| FR-8.2 | Toast/alert system for errors and confirmations, actually wired up (fixes U1). | P0 |
| FR-8.3 | Replace dead nav links with real pages: **Guide** (how to use MetaCheck, what each tag does) and **About**; GitHub link points to the new v2 repository (decision D4). | P1 |
| FR-8.4 | MetaCheck's own pages ship complete, correct meta tags and an OG image (dogfooding). | P0 |
| FR-8.5 | Keyboard shortcuts: focus URL (`/`), switch tabs, copy output. | P2 |
| FR-8.6 | The extraction endpoint is **internal to the app**: undocumented, same-origin only, and its contract may change without notice (decision D7; see §9.4). | P0 |

---

## 9. v2 technical requirements

### 9.1 Architecture: one app, one Nuxt layer per module

v2 is a single Nuxt 4.6.1 app (its own Git repository) built from **Nuxt layers**. Every module lives in its own layer under `layers/`, which Nuxt registers automatically. The root holds only app-wide configuration; there is no root `app/`, `server/` or `shared/` directory (decision D9).

```
v2/
├─ nuxt.config.ts            # app-wide only: Netlify preset, runtimeConfig (siteUrl), routeRules
├─ package.json
├─ public/                   # logos, favicon, MetaCheck's own OG image
├─ tests/e2e/                # Playwright journeys across layers
└─ layers/
   ├─ core/                  # foundation every other layer builds on
   ├─ extract/               # server-side page fetching and parsing
   ├─ editor/                # metadata editor
   ├─ previews/              # channel rules and preview cards
   ├─ checks/                # audit rules and Checks view
   ├─ tags/                  # raw Tags view
   ├─ output/                # code generators and Code view
   ├─ workspace/             # the "/" page that composes the modules
   └─ docs/                  # Guide and About pages
```

Each layer has the same shape, using only the folders it needs:
```
layers/<module>/
├─ nuxt.config.ts            # the layer's own modules, CSS and config
├─ app/                      # components/, composables/, pages/, layouts/, assets/
├─ server/                   # api/, utils/, middleware/ (server-side layers only)
├─ shared/                   # framework-free types and logic usable on client and server
└─ tests/                    # Vitest unit and component tests for this layer
```

#### 9.1.1 Layers
| Layer | Owns | PRD requirements | Phase |
|---|---|---|---|
| **core** | Design tokens and Tailwind entry (`app/assets/css/main.css`), Figtree / JetBrains Mono, `@nuxtjs/color-mode` and the theme switch, UI primitives (button, segmented control, text field, chip, toast, skeleton, code block shell), global reduced-motion rule, `app.vue`, default layout (header, footer), MetaCheck's own SEO, shared types (`MetaState`, `ExtractResponse`, error codes) and the shared editing state (`useMetaState`) | FR-8.1, FR-8.2, FR-8.4, §9.6, §9.8, §9.10 | 0 |
| **extract** | `server/api/extract.get.ts`, fetcher, HTML parser, URL normalisation, SSRF guard, redirect handling, image probe, cache, rate limit, same-origin check; client composable `useExtract` | FR-1.3, FR-1.4, FR-1.7, FR-2.x, FR-8.6, §9.2–§9.5 | 1 (core), 2 (probe, cache, rate limit) |
| **editor** | Metadata panel: title, description, image URL, counters, advanced fields, per-platform overrides, reset/clear | FR-3.x | 1, 2 |
| **previews** | Channel rule config per platform (`shared/`), preview card per channel, channel chips and their persistence | FR-4.x | 1 (6 channels), 2 (new channels) |
| **checks** | Audit rules (`shared/`, framework-free), Checks view, per-category summary | FR-5.x | 2 |
| **tags** | Raw tags view, search and copy | FR-6.1 | 2 |
| **output** | Output generators and escaping per format (`shared/`), format picker, Shiki highlighting, copy and download | FR-7.x | 1 (HTML, `useSeoMeta`, vue-meta), 2 (rest) |
| **workspace** | The `/` page: URL field, `?url=` deep links, demo URL, recent lookups, segmented view switcher, responsive two-column / inspector / mobile layouts that place the module components | FR-1.1, FR-1.2, FR-1.5, FR-1.6, FR-8.5, §9.10.5 | 1, 2 |
| **docs** | `/guide` and `/about` pages (prerendered) | FR-8.3 | 2 |

#### 9.1.2 Layer rules
- **Dependency direction**: feature layers (`extract`, `editor`, `previews`, `checks`, `tags`, `output`) depend only on `core`; they never import from each other. `workspace` composes feature layers through their public components and composables. `docs` depends only on `core`. Imports across layers use Nuxt's named layer aliases (e.g. `#layers/core/...`) rather than relative paths.
- **Public surface**: a layer exposes what it puts in `app/components`, `app/composables`, `shared/` and `server/api`; everything else is internal. Components are prefixed with the layer name (`EditorPanel`, `PreviewFacebook`, `ChecksList`, `OutputCodeBlock`) so auto-imports never collide.
- **Shared state** sits in `core` (`useMetaState`), so modules communicate through one state object instead of through each other.
- **Pure logic in `shared/`**: channel rules (`previews`), audit rules (`checks`), output generators (`output`) and parsing (`extract`) are framework-free functions, easy to unit test and reusable later (e.g. a CLI).
- **Self-contained**: a layer carries its own `nuxt.config.ts`, styles and tests; removing a feature layer should not break the build of the others (only `workspace` would lose that view).
- **Rendering**: set in the root `nuxt.config.ts` with `routeRules`: prerender `/guide` and `/about`; SSR or SPA for `/`. SSR on `/?url=` would also let MetaCheck's own share links show the target's preview.
- **Language and state**: TypeScript throughout; Vue composables (`useState`) for state, no Vuex/Pinia unless state grows.

### 9.2 Extraction strategy
v1's per-request headless Chromium is the main cost and reliability problem. v2:

1. **Default: plain HTTP fetch + HTML parse.** `$fetch`/`ofetch` with a browser-like User-Agent, then parse with a lightweight parser (e.g. `htmlparser2`/`cheerio` or `linkedom`). Most sites serve meta tags in the initial HTML because social crawlers don't run JavaScript, so this matches what Facebook/X/Slack see. Read only the `<head>` (stop after `</head>` or a byte cap, e.g. 1–2 MB).
2. **Optional: JS rendering (FR-1.7, P2)** through a hosted headless browser service (e.g. Browserless) called from the Netlify Function, or `@sparticuz/chromium` inside the function if it fits Netlify's function size and timeout limits. Behind a flag, with strict timeouts. When results differ from the plain fetch, tell the user: "social platforms will not see these tags".

### 9.3 API contract (internal)
`GET /api/extract?url=<encoded>` — consumed only by the MetaCheck UI; not a public API (decision D7).

```ts
type ExtractResponse = {
  requestedUrl: string
  finalUrl: string
  redirects: { url: string; status: number }[]
  status: number
  contentType: string
  timingMs: number
  lang: string | null
  title: string | null
  meta: { name?: string; property?: string; httpEquiv?: string;
          charset?: string; itemprop?: string; content: string | null }[]
  links: { rel: string; href: string; resolvedHref: string;
           sizes?: string; type?: string; hreflang?: string }[]
  jsonLd: { raw: string; parsed?: unknown; error?: string }[]
  images: { url: string; ok: boolean; status?: number; contentType?: string;
            bytes?: number; width?: number; height?: number }[]
}
```
Errors use one shape `{ statusCode, code, message }` with codes such as `INVALID_URL`, `BLOCKED_ADDRESS`, `TIMEOUT`, `NOT_HTML`, `UPSTREAM_ERROR`, `RATE_LIMITED`. Validation errors return **400** (fixes B5). Validate input with a schema library (e.g. Zod or Valibot).

### 9.4 Security
- **SSRF guard** (fixes B4): allow only `http`/`https` on ports 80/443; resolve DNS and reject loopback, private, link-local, CGNAT and cloud metadata ranges (IPv4 and IPv6); re-check on every redirect; cap redirects (5).
- Timeouts (e.g. 8 s total), response size cap, HTML content-type check.
- **Internal-only endpoint** (decision D7): no CORS headers (browsers on other origins are blocked); reject requests whose `Sec-Fetch-Site` is not `same-origin` or whose `Origin`/`Referer` is not `metacheckui.netlify.app` (or a Netlify deploy preview of it); not listed in any docs. This deters casual reuse; rate limiting is what actually bounds abuse from scripts.
- Rate limiting per IP (e.g. 30 requests/min) using Netlify's rate-limiting rules where the plan allows, with a Nitro middleware fallback.
- Treat scraped content as untrusted: render it as text only, never `v-html`.
- Image probes go through the same SSRF guard and only read headers and the first bytes needed for dimensions.
- Security headers (CSP, etc.) via `nuxt-security` or route rules.

### 9.5 Performance and caching
- Cache successful extractions by normalised URL for a short TTL (e.g. 10 min) using `cachedEventHandler` backed by Netlify Blobs (Nitro's Netlify driver), plus `Netlify-CDN-Cache-Control` headers; expose a "refresh" action to bypass.
- Targets: p50 lookup < 1.5 s, p95 < 4 s for the plain-fetch path; Lighthouse ≥ 95 on Performance, Accessibility, Best Practices and SEO for MetaCheck's own pages.
- Load channel preview components lazily.

### 9.6 Frontend stack
| Concern | v2 choice |
|---|---|
| Framework | **Nuxt 4.6.1** (pinned), Vue 3.5+, `<script setup lang="ts">` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`; CSS-first config with `@theme` tokens (§9.10) |
| Theme | `@nuxtjs/color-mode` (class strategy, `classSuffix: ''`, preference `system`) + Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));` |
| Brand tokens | v1 palette carried over unchanged in hue: teal primary, rose secondary, `#002029` / `#001c23` / `#020d0f` dark surfaces; light equivalents defined in §9.10 |
| Icons | `@nuxt/icon` (Iconify): Lucide for UI glyphs, Simple Icons for platform logos — replacing IcoFont and vue-feather-icons |
| Fonts | `@nuxt/fonts` with the Google provider (self-hosted at build, no runtime Google request): **Figtree** for all UI text (decision D3); **JetBrains Mono** (also Google Fonts) for code |
| Highlighting | Shiki, with a light and a dark theme tuned to the palette |
| Components | Headless accessible primitives (Reka UI) styled with our own tokens, so the look stays ours rather than a component library's default |
| SEO for MetaCheck itself | `useSeoMeta`, `@nuxtjs/seo` or `nuxt-og-image` for a dynamic OG image |
| Lint/format | `@nuxt/eslint` (flat config) |

### 9.7 Quality
- Tests live in each layer's `tests/` folder and run per layer as well as together, so a module can be verified on its own.
- **Unit tests** (Vitest): parser, URL normalisation, SSRF guard (`extract`); every audit rule (`checks`); every output generator including escaping (`output`); channel truncation rules (`previews`).
- **Component tests** (`@nuxt/test-utils`): editor fan-out (`editor`), channel toggles (`previews`), view switching (`workspace`), theme switch (`core`).
- **E2E** (Playwright): fetch → edit → copy flow, error states, mobile viewport; axe accessibility checks.
- Fixture HTML pages for extraction tests; no live-network tests in CI.
- CI on every PR: typecheck, lint, test, build.

### 9.8 Accessibility (WCAG 2.2 AA)
- Labelled inputs; channel toggles as labelled toggle buttons (`aria-pressed`) or checkboxes.
- Tabs follow the ARIA tabs pattern with keyboard support.
- Visible focus states; 4.5:1 contrast in both themes.
- Copy confirmation and errors announced through a live region.
- Respect `prefers-reduced-motion`.

### 9.9 Hosting and operations
- **Netlify** (decision D2): one deployment using Nitro's `netlify` preset. Pages are served from the CDN (prerendered where possible); `/api/extract` runs as a Netlify Function. No separate backend host.
- **Domain**: `metacheckui.netlify.app` (decision D5). All of MetaCheck's own canonical, `og:url` and OG image URLs use it; set it once as `runtimeConfig.public.siteUrl`.
- Deploy previews per pull request from the new v2 repository (decision D4).
- Environment config through `runtimeConfig`; no hard-coded API hosts.
- Structured server logs; error tracking (e.g. Sentry) optional.
- Privacy-friendly analytics (e.g. Plausible) optional; no personal data stored. Looked-up URLs held only in the short-lived cache.

### 9.10 Design system and UI

v2 keeps v1's identity (dark teal, teal accent, rose for emphasis) and modernises the execution. The guidance follows Apple's Human Interface Guidelines (clarity, deference to content, depth through layering) and a restrained visual approach: fewer lines and boxes, one accent colour, hierarchy carried by type and spacing.

#### 9.10.1 Principles
| Principle | What it means for MetaCheck |
|---|---|
| **Content first** | The previews are the product. Chrome (header, panels, controls) is quiet and neutral; colour and weight go to the previews and the audit results. |
| **Hierarchy through type and space** | v1 separated everything with borders. v2 groups with spacing and surface tone, and uses hairline dividers only where grouping is ambiguous. |
| **One accent, used for meaning** | Teal marks the primary action, selection and focus. Rose marks errors only. Amber marks warnings. Nothing else is coloured. |
| **Depth, not decoration** | Layers are told apart by surface tone and (in light mode) soft shadows. No gradients, neon glows or heavy glass effects; the one translucent surface is the sticky header. |
| **Direct, labelled controls** | No icon-only toggles for anything important (v1 channel circles become labelled chips). Text labels in sentence case. |
| **Calm motion** | Motion explains changes (tab switch, panel open, copy confirmation); 150–250 ms, no bounce on content; disabled under `prefers-reduced-motion`. |
| **Both themes are first-class** | Every component is designed and reviewed in light and dark; neither is an inverted afterthought. |

#### 9.10.2 Colour

v1 palette carried over: Tailwind **teal** (primary), Tailwind **rose** (secondary), and the three v1 dark surfaces. Values below are starting points; each text/background pair must pass WCAG AA (4.5:1 body text, 3:1 large text and UI boundaries) before sign-off.

| Semantic token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#F5F9F8` (teal-tinted off-white) | `#002029` (v1 `primaryBg`) | Page background |
| `surface` | `#FFFFFF` | `#001C23` (v1 `primaryBg2`) | Panels, cards |
| `surface-inset` | `#ECF4F2` | `#020D0F` (v1 `primaryBg3`) | Inputs, code blocks, preview frames |
| `surface-raised` | `#FFFFFF` + shadow | `#06303A` | Popovers, menus, toasts |
| `border` | `#DCE8E6` | `rgb(255 255 255 / 0.08)` | Hairlines, input outlines |
| `text` | `#0B1F22` | `#E6F4F1` | Primary text |
| `text-muted` | `#4B6366` | `#8FA9A8` | Secondary text, captions |
| `accent` | teal-700 `#0F766E` | teal-500 `#14B8A6` | Primary buttons, selected states |
| `on-accent` | `#FFFFFF` | `#002029` | Text on accent fills (v1 used dark text on teal in dark mode) |
| `accent-text` | teal-700 `#0F766E` | teal-300 `#5EEAD4` | Links, active tab label |
| `focus-ring` | teal-600 `#0D9488` | teal-400 `#2DD4BF` | 2 px focus outline with 2 px offset |
| `danger` | rose-700 `#BE123C` | rose-400 `#FB7185` | Errors, failed checks |
| `warning` | amber-800 `#92400E` | amber-400 `#FBBF24` | Warnings |
| `success` | teal-700 `#0F766E` | teal-300 `#5EEAD4` | Passed checks (paired with an icon, never colour alone) |

Light mode uses teal-700 rather than v1's teal-500/600 for the accent because white text on teal-500/600 fails contrast. Danger and warning use rose-700 and amber-800 in light mode because rose-600 and amber-700 fail 4.5:1 on the tinted `canvas` and `surface-inset` backgrounds (checked by `layers/core/tests/unit/contrast.test.ts`).

Platform previews use each platform's own colours **inside the preview frame only**; they never leak into MetaCheck's chrome.

#### 9.10.3 Typography
**Figtree** (Google Fonts, decision D3) for all UI text; **JetBrains Mono** for code. Weights limited to 400, 500, 600 (700 only for the display size). Counters and numbers use `font-variant-numeric: tabular-nums`.

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| Display | 32 / 40, tracking −0.02em | 700 | Guide/About page titles |
| Title | 24 / 32, −0.01em | 600 | Section titles |
| Headline | 17 / 24 | 600 | Panel titles, preview card labels |
| Body | 15 / 24 | 400 | Default text, inputs |
| Callout | 14 / 20 | 400 / 500 | Helper text, check descriptions |
| Footnote | 13 / 18 | 500 | Counters, metadata |
| Caption | 12 / 16 | 500 | Badges, field hints |
| Code | 13 / 20 (JetBrains Mono) | 400 | Code output, Tags view |

Section labels use sentence case ("Metadata", "Channels") instead of v1's uppercase wide-tracked labels; one small eyebrow style may be kept for the brand.

#### 9.10.4 Spacing, shape, elevation
- **Spacing**: 4 pt grid (4, 8, 12, 16, 20, 24, 32, 48, 64). Panel padding 20–24; gap between preview cards 24–32.
- **Radii**: 8 (inputs, buttons, chips' inner elements), 12 (cards, preview frames), 16–20 (panels, sheets), full (pills, segmented control track). Nested corners are concentric: inner radius = outer radius − padding.
- **Elevation**: light mode uses two soft shadows (`sm` for cards, `lg` for popovers/toasts). Dark mode uses lighter surfaces plus a hairline border instead of shadows.
- **Hit targets**: at least 44 × 44 px on touch devices, 32 px minimum height on desktop controls.
- **Materials**: the sticky header is a translucent `surface` (~80% opacity) with `backdrop-blur`, so content scrolls visibly beneath it.

#### 9.10.5 Layout

**Desktop (≥ 1280 px)** — two columns. v1's right-hand "about" column moves to the footer, giving previews the space.
```
┌──────────────────────────────────────────────────────────────────────────┐
│ ◧ MetaCheck     [ ⌕  example.com                           Check ⏎ ]   Guide  About  GitHub  ◐ │ ← sticky, translucent
├────────────────────────┬─────────────────────────────────────────────────┤
│ Metadata          ↺    │  ( Preview | Checks ③ | Tags | Code )            │ ← segmented control
│                        │                                                  │
│ Title           42/60  │  Google ✓  Facebook ✓  X  LinkedIn  Slack  …  ⋯  │ ← labelled chips
│ [MetaCheck — check…  ] │                                                  │
│ Description    128/160 │  ┌──────────── Google ─────────────┐              │
│ [                    ] │  │ preview                          │              │
│ Image URL              │  └──────────────────────────────────┘              │
│ [https://…/og.png ] ▣  │  ┌──────────── Facebook ───────────┐              │
│                        │  │ preview                          │              │
│ ▸ Advanced             │  └──────────────────────────────────┘              │
│                        │                                                  │
│ ● 2 errors ▲ 3 warnings│                                                  │
└────────────────────────┴─────────────────────────────────────────────────┘
  Editor: 340–380 px, sticky          Content: fluid, max ~880 px, centred
```

**Tablet (768–1279 px)** — the editor becomes a collapsible inspector panel (toggle in the header); content takes full width when it is closed.

**Mobile (< 768 px)** — single column. The URL field stays in the header; a segmented control switches **Edit / Preview / Checks / Code**. Channel chips scroll horizontally. On the Code view a full-width "Copy" button sits fixed at the bottom within thumb reach. All editing is available (fixes U2).

#### 9.10.6 Key components
| Component | Spec |
|---|---|
| **URL field** | Spotlight-style: search icon, large hit area, inline "Check" button, `⌘K` / `/` to focus, protocol shown dimmed, inline error text below with a Retry action. |
| **Segmented control** | Used for main views and the Light / Dark / System theme switch. Pill track on `surface-inset`, selected segment on `surface` with a soft shadow (light) or `surface-raised` (dark); animated selection indicator; ARIA tabs semantics. Checks segment shows a count badge. |
| **Channel chips** | Platform logo + name, `aria-pressed`; selected = accent outline + check mark; overflow channels in a "More" menu. Replaces v1's 64 px icon circles. |
| **Text fields** | `surface-inset` fill, hairline border, accent focus ring; label above; live character counter right-aligned that turns amber/rose past the recommended range. |
| **Preview card** | Platform name + icon as the label, then the preview inside a neutral frame that mimics the platform's surface in the active theme. Missing values show the platform's real behaviour, never a broken image. |
| **Check row** | Status icon (rose ✕ / amber ▲ / teal ✓) + title + one-line fix; expands to explain why and link the spec. Clicking a fixable row focuses the related editor field. |
| **Code block** | `surface-inset`, Shiki highlighting with matched light/dark themes, format picker above, Copy button top-right that changes to "Copied ✓" for 1.5 s and announces through a live region. |
| **Toast** | Bottom-centre on mobile, bottom-right on desktop; `surface-raised`; auto-dismiss 5 s except errors that need action. |
| **Skeletons** | Shaped like the card they stand in for (Google = text lines, social = image block + lines); shimmer disabled with reduced motion. |
| **Logo** | v1 logo retained; add a light-mode variant that keeps contrast on `canvas`. |

#### 9.10.7 States to design
Each view needs: first visit (demo URL loaded), loading, success, partial (page fetched but key tags missing), empty "generate from scratch", and error (invalid URL, blocked, timeout, not HTML, rate-limited). All in both themes and at all three breakpoints.

#### 9.10.8 Implementation notes (Tailwind v4)
```css
/* layers/core/app/assets/css/main.css */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: "Figtree", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --radius-control: 0.5rem;
  --radius-card: 0.75rem;
  --radius-panel: 1.25rem;
  --ease-standard: cubic-bezier(0.32, 0.72, 0, 1);
}

:root {
  --mc-canvas: #f5f9f8;  --mc-surface: #ffffff;  --mc-inset: #ecf4f2;
  --mc-text: #0b1f22;    --mc-muted: #4b6366;    --mc-accent: #0f766e;
  /* … remaining tokens from §9.10.2 */
}
.dark {
  --mc-canvas: #002029;  --mc-surface: #001c23;  --mc-inset: #020d0f;
  --mc-text: #e6f4f1;    --mc-muted: #8fa9a8;    --mc-accent: #14b8a6;
}

@theme inline {
  --color-canvas: var(--mc-canvas);
  --color-surface: var(--mc-surface);
  --color-inset: var(--mc-inset);
  --color-fg: var(--mc-text);
  --color-muted: var(--mc-muted);
  --color-accent: var(--mc-accent);
}
```
These tokens live only in the `core` layer; every other layer uses the semantic utilities (`bg-surface`, `text-muted`, `bg-accent`), not raw palette classes, so both themes come from one set of markup. `@nuxtjs/color-mode` sets the `.dark` class before first paint to avoid a theme flash.

#### 9.10.9 Design acceptance criteria
- Every screen reviewed at 375, 768 and 1440 px in both themes.
- All text and UI-boundary contrast pairs pass WCAG AA in both themes (automated axe check + manual spot check of previews).
- No horizontal page scroll at 320 px.
- Theme switch is instant, persists across reloads, and causes no flash on first load.
- Only Figtree and JetBrains Mono are loaded; fonts are self-hosted with `font-display: swap`.

### 9.11 Development guardrails
The v2 repository ships Claude Code hooks (`.claude/settings.json`, scripts in `.claude/hooks/`, settings in `.claude/hooks/config.json`) that enforce these rules while modules are built:
- Module code can only be written inside `layers/<module>/` (§9.1).
- Module code can only be written after the Apple Design and Taste UI skills have been used in the session, alongside §9.10.
- Every interactive `.vue` component must have a subtle transition or animation (no longer than 400 ms) that respects reduced motion (§9.10.1).
- A turn that changes app code ends only when Lighthouse (mobile) scores at least 90 in Performance, Accessibility, Best Practices and SEO. This is the floor while building; the launch target in §9.5 and §11 stays at 95.

---

## 10. v1 → v2 mapping

| v1 | v2 |
|---|---|
| Express `GET /api/fetch` on Heroku (public) | Nitro `GET /api/extract` as a Netlify Function in the same Nuxt app (internal only) |
| Puppeteer per request | HTTP fetch + HTML parser; optional hosted rendering |
| Meta + title only | Meta, title, links, lang, JSON-LD, image probe, redirects |
| Navbar URL input, auto-loads demo | Same, plus `?url=` deep links, protocol-optional input, recent lookups |
| Metadata editor (desktop only) | Responsive editor with counters, advanced fields, per-platform overrides |
| Image file → base64 data URL | Absolute image URL only, with thumbnail and validation |
| 6 channel previews | 6 + Discord, WhatsApp, Telegram, iMessage, Bluesky, Mastodon, Threads; rule-accurate |
| Webview / Code / JSON tabs | Preview / Checks / Tags / Code (multi-framework) |
| HTML + vue-meta output (unescaped) | 8 output formats, escaped, spec-correct |
| Forced dark mode, Sofia Pro, IcoFont, three bordered columns | Light and dark mode (+ System), Figtree, Lucide/Simple Icons, two-column layout from the v2 design system (§9.10) |
| Errors swallowed | Typed errors + toasts |
| Dead Guide / Metainfo links | Guide and About pages |
| No tests, JS | TypeScript, Vitest, Playwright, CI |

---

## 11. Success metrics

| Metric | Target |
|---|---|
| Lookup success rate (valid public URLs) | ≥ 97% |
| Lookup latency (plain fetch) | p50 < 1.5 s, p95 < 4 s |
| Preview accuracy (spot-check against real platforms, 20 sample URLs) | ≥ 90% visually matching on title/description truncation and image crop |
| Copy-code action per session with a lookup | ≥ 40% |
| Lighthouse (all four categories) on `/` and `/guide` | ≥ 95 |
| axe violations (serious/critical) | 0 |
| Monthly hosting cost at 10k lookups/month | Within free/hobby tiers |

---

## 12. Release plan

| Phase | Scope |
|---|---|
| **0 — Setup** | Create the v2 repository; scaffold Nuxt 4.6.1 + Tailwind v4 in `v2/` with the `layers/` structure (§9.1); connect Netlify (deploy previews); build the `core` layer: §9.10 tokens, Figtree/JetBrains Mono, light/dark switching, UI primitives, layout; CI, lint, per-layer test harness. |
| **1 — Parity (v2.0-alpha)** | All P0: internal extraction API with SSRF guard, responsive editor with URL-only image, 6 channels with accurate rules, HTML / `useSeoMeta` / vue-meta output with escaping, light/dark mode, error toasts, deep links. |
| **2 — Check (v2.0)** | P1: audit/Checks tab, Tags tab, advanced fields, per-platform overrides, image probing, new channels, remaining output formats, Guide/About pages, recent lookups, caching, rate limiting. |
| **3 — Extend (v2.x)** | P2: JS rendering, JSON-LD view, scoring, file download, keyboard shortcuts. Candidates beyond: browser extension, CLI / GitHub Action that runs the same checks in CI (would reuse the framework-free `shared/` logic of the `extract`, `checks` and `output` layers rather than call the internal API), OG image generator. |

---

## 13. Decisions log

All questions from rev. 1 are resolved (2026-10-15).

| # | Question | Decision | Effect on this PRD |
|---|---|---|---|
| D1 | Nuxt version | **Nuxt 4.6.1**, pinned | §9.6 stack; upgrades handled as normal dependency updates. |
| D2 | Hosting | **Remain on Netlify** | Nitro `netlify` preset; API as a Netlify Function; cache in Netlify Blobs; JS rendering (P2) via a hosted browser service (§9.2, §9.5, §9.9). |
| D3 | Fonts | **Figtree** (Google Fonts) | UI font everywhere; JetBrains Mono for code; self-hosted via `@nuxt/fonts` (§9.6, §9.10.3). Sofia Pro dropped. |
| D4 | Repository | **v2 gets its own repository** | v1 repos stay as they are (archive once v2 launches); GitHub nav link points to the new repo. |
| D5 | Domain | **Keep `metacheckui.netlify.app`** | Used for MetaCheck's own canonical/OG URLs and the API origin check (§9.4, §9.9). |
| D6 | Image upload | **URL-only** | FR-3.4 rewritten, FR-3.8 dropped, v1 file picker removed; listed as a non-goal. |
| D7 | Public API | **Internal to the app** | FR-8.6 rewritten; same-origin checks and rate limiting in §9.4; listed as a non-goal. |
| D8 | Visual design | **Keep the v1 colour scheme; modernise the UI; add light and dark mode** | New §9.10 design system; FR-8.1 and FR-4.6 strengthened; goal 8 added. |
| D9 | Code structure | **Each module in its own Nuxt layer** under `layers/` | §9.1 rewritten around nine layers with dependency rules; tests, design tokens and release phases mapped to layers. Enforced by the project's Claude Code hooks (§9.11). |

---

## Appendix A — v1 file reference

**Backend** (`v1/MetaCheck`)
- `index.js` — Express app, routes, port
- `controller/ScrapeController.js` — validation, Puppeteer scrape, response
- `Procfile`, `package.json`, `README.md`

**Frontend** (`v1/MetacheckUI`)
- `pages/index.vue` — the whole app: state, fetch, fan-out setters, layout
- `components/Navbar.vue`, `Metadata.vue`, `Bottom.vue`, `ChannelContainer.vue`, `Channel.vue`, `Tab.vue`, `SectionHeader.vue`
- `components/Preview/` — `Google`, `Facebook`, `Twitter`, `Linkedin`, `Pintrest`, `Slack`, `Code`, `Json`, `CodeCard`, `Card`
- `components/Input/` — `Base`, `Textarea`, `File`, `Container` (+ unused `Select`, `Switch`)
- `components/Skeleton/Preview.vue`
- Unused: `components/Modal/*`, `components/Alert/*`, `components/Tag.vue`, `components/Action/ELink.vue`, `ILink.vue`, `plugins/axios.js` (not registered)
- `assets/defaultMetaSchema.js`, `assets/mixins/fetchMetaSchema.js`
- `nuxt.config.js`, `tailwind.config.js`, `netlify.toml`
