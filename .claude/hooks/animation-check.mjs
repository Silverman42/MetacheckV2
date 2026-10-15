// PostToolUse (Write|Edit|MultiEdit): after a .vue file in a layer changes, check that
// every interactive element has a subtle transition/animation. Problems are fed back
// to Claude to fix; the write itself is kept.
import { existsSync, readFileSync } from 'node:fs'
import { absPath, config, layerRe, readInput, toRel } from './lib.mjs'

const input = readInput()
const rel = toRel(input.tool_input?.file_path)
if (!rel || !rel.endsWith('.vue') || !layerRe.test(rel) || !existsSync(absPath(rel))) process.exit(0)

const src = readFileSync(absPath(rel), 'utf8')
const template = src.match(/<template[^>]*>([\s\S]*)<\/template>/)?.[1] ?? ''

// Elements and bindings that represent a user interaction or a visible state change.
const interactiveRe =
  /<(button|a|NuxtLink|RouterLink|input|select|textarea|details|summary|dialog)\b|@(click|submit|change|input|keydown|keyup)\b|v-on:|v-show=|role="(button|tab|switch|checkbox|menuitem|option|dialog)"/i
// Evidence of motion: Vue transitions, Tailwind transition/animate utilities, CSS transitions/keyframes.
const motionRe =
  /<(Transition|TransitionGroup)\b|\btransition(-[a-z]+)?\b|\banimate-[a-z]|\bduration-(\d+|\[)|@keyframes|\banimation\s*:|\btransition\s*:|v-motion|useTransition/

const issues = []

if (interactiveRe.test(template) && !motionRe.test(src)) {
  issues.push(
    `${rel} has interactive UI but no transition or animation. Give every interaction subtle motion ` +
      `(e.g. transition-colors/transition-transform duration-150..250 ease-out on hover/press/focus, ` +
      `<Transition> for elements that appear, disappear or switch), and keep it off under prefers-reduced-motion ` +
      `(motion-reduce: utilities or the global reduced-motion rule in the core layer).`,
  )
}

// "Subtle" means short: flag anything longer than the configured ceiling.
const max = config.animation.maxDurationMs
const toMs = (n, unit) => (unit === 's' ? Number(n) * 1000 : Number(n))
const durations = [
  ...[...src.matchAll(/\bduration-(\d+)\b/g)].map((m) => Number(m[1])),
  ...[...src.matchAll(/\bduration-\[(\d+(?:\.\d+)?)(ms|s)\]/g)].map((m) => toMs(m[1], m[2])),
  ...[...src.matchAll(/(?:transition|animation)(?:-duration)?\s*:[^;{}]*?(\d+(?:\.\d+)?)(ms|s)\b/g)].map((m) =>
    toMs(m[1], m[2]),
  ),
]
const tooLong = durations.filter((d) => d > max)
if (tooLong.length) {
  issues.push(
    `${rel} uses motion longer than ${max}ms (${[...new Set(tooLong)].join('ms, ')}ms). Keep animations subtle: 150–250ms for most interactions.`,
  )
}

if (issues.length) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason: `MetaCheck motion check:\n- ${issues.join('\n- ')}` }))
}
process.exit(0)
