// PreToolUse (Write|Edit|MultiEdit): runs before any module source file is written.
// Denies the write unless (1) the Apple Design and Taste UI skills were invoked this
// session and (2) the file lives in its own Nuxt layer under layers/<module>/.
import {
  isAllowedOutsideLayers,
  isModuleSource,
  layerRe,
  missingSkills,
  readInput,
  toRel,
} from './lib.mjs'

const input = readInput()
const rel = toRel(input.tool_input?.file_path)
if (!rel || !isModuleSource(rel)) process.exit(0)

const inLayer = layerRe.test(rel)
if (!inLayer && isAllowedOutsideLayers(rel)) process.exit(0)

const problems = []

if (!inLayer) {
  problems.push(
    `"${rel}" is module code outside a layer. Every module must live in its own Nuxt layer: ` +
      `layers/<module-name>/ (kebab-case), e.g. layers/editor/app/components/EditorPanel.vue, ` +
      `layers/extract/server/api/extract.get.ts. Shared design tokens, fonts and the theme belong in a ` +
      `base layer such as layers/core/.`,
  )
}

const { used, missing } = missingSkills(input.transcript_path)
if (missing.length) {
  problems.push(
    `Before implementing any module, invoke the ${missing.map((s) => s.label).join(' and ')} ` +
      `skill${missing.length > 1 ? 's' : ''} with the Skill tool and apply their guidance ` +
      `(skills used this session: ${used.length ? used.join(', ') : 'none'}). ` +
      `If ${missing.length > 1 ? 'they are' : 'it is'} not installed, stop and tell the user; do not work around this check.`,
  )
}

if (problems.length) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `MetaCheck module gate:\n- ${problems.join('\n- ')}`,
      },
    }),
  )
}
process.exit(0)
