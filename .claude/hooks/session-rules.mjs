// SessionStart: remind Claude of the module rules up front, so it plans for them
// instead of discovering them when a write is denied.
import { config, readInput } from './lib.mjs'

readInput()
const skills = config.requiredSkills.map((s) => s.label).join(' and ')
const lh = config.lighthouse

const rules = `MetaCheck v2 module rules (enforced by hooks in .claude/settings.json):
1. Before implementing any module, invoke the ${skills} skills with the Skill tool and follow them, together with the design system in PRD.md §9.10. Module writes are denied until both have been used in the session.
2. Each module lives in its own Nuxt layer: layers/<module-name>/ (with its own nuxt.config.ts). Shared tokens, fonts, theme and the global reduced-motion rule go in a base layer (layers/core/). Module code outside layers/ is denied.
3. Every interaction and visible state change gets a subtle transition or animation (about 150–250ms, never over ${config.animation.maxDurationMs}ms), disabled under prefers-reduced-motion. .vue files without it are sent back for fixing.
4. When a turn changes app code, the app is built and audited with Lighthouse (${lh.formFactor}); ${lh.categories.join(', ')} must each score at least ${lh.minScore} before the turn can end.`

process.stdout.write(
  JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: rules } }),
)
