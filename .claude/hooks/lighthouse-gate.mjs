// Stop: before Claude finishes a turn that changed app code, build the app, serve it
// locally and run Lighthouse. If any category scores below the minimum, Claude is sent
// back to fix it. Skips when nothing changed since the last passing run, and gives up
// (telling the user) after maxConsecutiveBlocks failed attempts so it cannot loop forever.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { join } from 'node:path'
import { config, projectDir, readInput } from './lib.mjs'

const lh = config.lighthouse
const cacheDir = join(projectDir, '.claude', '.cache')
const passFile = join(cacheDir, 'lighthouse-pass.json')
const blocksFile = join(cacheDir, 'lighthouse-blocks')

readInput()

const pkgPath = join(projectDir, 'package.json')
if (!existsSync(pkgPath)) process.exit(0) // v2 not scaffolded yet
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
if (!pkg.dependencies?.nuxt && !pkg.devDependencies?.nuxt) process.exit(0)

// Skip when no watched file changed since the last passing run.
function latestMtime(p) {
  if (!existsSync(p)) return 0
  const st = statSync(p)
  if (!st.isDirectory()) return st.mtimeMs
  let max = 0
  for (const e of readdirSync(p)) {
    if (e === 'node_modules' || e.startsWith('.')) continue
    max = Math.max(max, latestMtime(join(p, e)))
  }
  return max
}
const changedAt = Math.max(...lh.watch.map((w) => latestMtime(join(projectDir, w))))
if (existsSync(passFile) && statSync(passFile).mtimeMs >= changedAt) process.exit(0)

mkdirSync(cacheDir, { recursive: true })
const blocks = existsSync(blocksFile) ? Number(readFileSync(blocksFile, 'utf8')) || 0 : 0

function say(message) {
  process.stdout.write(JSON.stringify({ systemMessage: message }))
  process.exit(0)
}
function block(reason) {
  if (blocks + 1 >= lh.maxConsecutiveBlocks) {
    writeFileSync(blocksFile, '0')
    say(`Lighthouse gate: still failing after ${lh.maxConsecutiveBlocks} attempts, so Claude has stopped for your review.\n${reason}`)
  }
  writeFileSync(blocksFile, String(blocks + 1))
  process.stderr.write(`Lighthouse gate (attempt ${blocks + 1}/${lh.maxConsecutiveBlocks}): ${reason}`)
  process.exit(2)
}

// Lighthouse needs a Chromium-based browser.
function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ]
  for (const c of candidates) if (existsSync(c)) return c
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const r = spawnSync('which', [bin], { encoding: 'utf8' })
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim()
  }
  return null
}
const chrome = findChrome()
if (!chrome) say('Lighthouse gate skipped: no Chrome/Chromium/Brave/Edge found. Install one or set CHROME_PATH.')

const pm = existsSync(join(projectDir, 'pnpm-lock.yaml'))
  ? 'pnpm'
  : existsSync(join(projectDir, 'yarn.lock'))
    ? 'yarn'
    : existsSync(join(projectDir, 'bun.lock')) || existsSync(join(projectDir, 'bun.lockb'))
      ? 'bun'
      : 'npm'

// Build with the node-server preset so the output can be served locally (production uses Netlify).
const build = spawnSync(pm, ['run', 'build'], {
  cwd: projectDir,
  env: { ...process.env, NITRO_PRESET: 'node-server' },
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
if (build.status !== 0) block(`the production build failed:\n${(build.stdout + build.stderr).slice(-3000)}`)

const port = await new Promise((res) => {
  const s = createServer().listen(0, '127.0.0.1', () => {
    const p = s.address().port
    s.close(() => res(p))
  })
})
const server = spawn(process.execPath, [join(projectDir, '.output', 'server', 'index.mjs')], {
  cwd: projectDir,
  env: { ...process.env, PORT: String(port), NITRO_PORT: String(port), HOST: '127.0.0.1', NITRO_HOST: '127.0.0.1' },
  stdio: 'ignore',
})
const stopServer = () => server.kill()
process.on('exit', stopServer)

const base = `http://127.0.0.1:${port}`
let up = false
for (let i = 0; i < 60 && !up; i++) {
  try {
    up = (await fetch(base)).status < 500
  } catch {}
  if (!up) await new Promise((r) => setTimeout(r, 500))
}
if (!up) block(`the built app did not start on ${base}.`)

const failures = []
const summary = []
for (const path of lh.paths) {
  const args = [
    '--yes',
    `lighthouse@${lh.lighthouseVersion}`,
    base + path,
    '--output=json',
    '--output-path=stdout',
    '--quiet',
    `--only-categories=${lh.categories.join(',')}`,
    '--chrome-flags=--headless=new --no-sandbox',
  ]
  if (lh.formFactor === 'desktop') args.push('--preset=desktop')
  const run = spawnSync('npx', args, {
    cwd: projectDir,
    env: { ...process.env, CHROME_PATH: chrome },
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
  let report
  try {
    report = JSON.parse(run.stdout)
  } catch {
    stopServer()
    say(`Lighthouse gate could not run Lighthouse on ${path}:\n${(run.stderr || '').slice(-1500)}`)
  }
  for (const id of lh.categories) {
    const cat = report.categories?.[id]
    const score = Math.round((cat?.score ?? 0) * 100)
    summary.push(`${path} ${id} ${score}`)
    if (score < lh.minScore) {
      const audits = (cat?.auditRefs ?? [])
        .filter((r) => r.weight > 0)
        .map((r) => report.audits[r.id])
        .filter((a) => a && a.score !== null && a.score < 0.9)
        .slice(0, 6)
        .map((a) => `    • ${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`)
      failures.push(`${path} ${id}: ${score} (needs ${lh.minScore})\n${audits.join('\n')}`)
    }
  }
}
stopServer()

if (failures.length) {
  block(`Lighthouse scores below ${lh.minScore} (${lh.formFactor}). Fix these before finishing:\n${failures.join('\n')}`)
}

writeFileSync(blocksFile, '0')
writeFileSync(passFile, JSON.stringify({ at: new Date().toISOString(), formFactor: lh.formFactor, summary }, null, 2))
say(`Lighthouse ✓ (${lh.formFactor}): ${summary.join(' · ')}`)
