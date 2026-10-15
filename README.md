# MetaCheck v2

Preview, check and fix the meta tags behind link previews. Product requirements and decisions: [PRD.md](PRD.md).

Nuxt 4.6.1 + Tailwind CSS v4, deployed to Netlify. Every module is a Nuxt layer in `layers/` (PRD §9.1):

| Layer | What it does |
|---|---|
| `core` | Design tokens, light/dark theme, fonts, UI primitives, layout, shared state (`useMetaState`) and the tag model (`buildTags`) |
| `extract` | `GET /api/extract`: fetches and parses a page's `<head>`, probes images, SSRF guard, cache, rate limit; `useExtract()` |
| `editor` | The metadata editor |
| `previews` | Channel rules and preview cards for 13 platforms |
| `checks` | Audit rules and the Checks view |
| `tags` | Every tag found on the page |
| `output` | Code generators (HTML, Nuxt, Vue, Next.js, React, vue-meta, Astro, JSON) and the Code view |
| `workspace` | The `/` page that puts the modules together |
| `docs` | `/guide` and `/about` (prerendered) |

```bash
npm install          # npm 10.9 has an install bug with this tree; use npx npm@11 install if it fails
npm run dev          # http://localhost:3000
npm run test         # all layers
npm run test:layer layers/checks
npm run typecheck
npm run lint
npm run build        # Netlify output; NITRO_PRESET=node-server for a local server
```

## Configuration

| Variable | Purpose |
|---|---|
| `NUXT_PUBLIC_REPO_URL` | GitHub link in the header and About page (hidden when empty) |
| `NUXT_EXTRACT_RENDERER_URL`, `NUXT_EXTRACT_RENDERER_TOKEN` | Optional Browserless-compatible service for "Render JavaScript" |
| `NUXT_PUBLIC_JS_RENDERING=true` | Show the "Render JavaScript" switch (set with the renderer) |
| `NUXT_EXTRACT_INTERNAL_TOKEN` | Fixed token for in-process SSR calls (otherwise generated per build) |

Keyboard: `/` or ⌘K focuses the URL field, `1`–`4` switch views, `E` shows the editor, `C` copies the code, `?` lists shortcuts.

Claude Code hooks in `.claude/` enforce the module rules: layers, motion, required design skills and a Lighthouse floor of 90 (PRD §9.11).
