// Shared helpers for the MetaCheck v2 Claude Code hooks.
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

export const projectDir =
  process.env.CLAUDE_PROJECT_DIR || resolve(import.meta.dirname, '..', '..')

export const config = JSON.parse(
  readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'),
)

export const layerRe = new RegExp(config.layerPattern)
const allowedRes = config.allowedOutsideLayers.map((p) => new RegExp(p))

export function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

// Project-relative POSIX path, or null when the file is outside the project.
export function toRel(filePath) {
  if (!filePath) return null
  const abs = isAbsolute(filePath) ? filePath : resolve(projectDir, filePath)
  const rel = relative(projectDir, abs)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return null
  return rel.split('\\').join('/')
}

export function absPath(rel) {
  return join(projectDir, rel)
}

export function isModuleSource(rel) {
  if (rel.endsWith('.d.ts')) return false
  return config.moduleExtensions.some((ext) => rel.endsWith(ext))
}

export function isAllowedOutsideLayers(rel) {
  return allowedRes.some((re) => re.test(rel))
}

// Names of skills invoked in this session: Skill tool calls and /slash-command skills.
export function usedSkills(transcriptPath) {
  const found = new Set()
  if (!transcriptPath || !existsSync(transcriptPath)) return []
  const walk = (v) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(/<command-name>\/?([^<\s]+)<\/command-name>/g)) found.add(m[1])
      return
    }
    if (Array.isArray(v)) return v.forEach(walk)
    if (v && typeof v === 'object') {
      if (v.type === 'tool_use' && v.name === 'Skill' && v.input?.skill) found.add(String(v.input.skill))
      Object.values(v).forEach(walk)
    }
  }
  for (const line of readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.includes('"Skill"') && !line.includes('command-name')) continue
    try {
      walk(JSON.parse(line))
    } catch {}
  }
  return [...found]
}

export function missingSkills(transcriptPath) {
  const used = usedSkills(transcriptPath)
  const missing = config.requiredSkills.filter(
    (s) => !used.some((u) => new RegExp(s.match, 'i').test(u)),
  )
  return { used, missing }
}
