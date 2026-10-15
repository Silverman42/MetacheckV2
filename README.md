# MetaCheck v2

Preview, audit and generate the meta tags behind link previews. Product requirements: [PRD.md](PRD.md).

Nuxt 4.6.1 + Tailwind CSS v4, deployed to Netlify. Every module is a Nuxt layer in `layers/` (PRD §9.1); `core` holds the design tokens, theme, UI primitives, layout and shared state.

```bash
npm install
npm run dev          # http://localhost:3000
npm run test         # all layers
npm run test:layer layers/core
npm run typecheck
npm run lint
npm run build        # Netlify output; NITRO_PRESET=node-server for a local server
```

Claude Code hooks in `.claude/` enforce the module rules (PRD §9.11).
