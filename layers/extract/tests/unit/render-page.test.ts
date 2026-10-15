import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { diffTags, extractRendered } from '../../server/utils/render-page'
import type { ExtractFailure } from '../../server/utils/extract-failure'

// One local server plays both the page (plain HTML, as crawlers see it) and a
// Browserless-compatible /content endpoint (the page after JavaScript runs).
let base = ''
let renderRequest: { url?: string, token?: string | null } = {}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  if (url.pathname === '/spa') {
    res.setHeader('content-type', 'text/html')
    return res.end('<html><head><title>Loading…</title><meta name="description" content="Old"></head><body><div id="app"></div></body></html>')
  }
  if (url.pathname === '/content' && req.method === 'POST') {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      renderRequest = { url: JSON.parse(body).url, token: url.searchParams.get('token') }
      if (JSON.parse(body).url.endsWith('/broken')) {
        res.statusCode = 500
        return res.end('boom')
      }
      res.setHeader('content-type', 'text/html')
      res.end('<html><head><title>Real title</title><meta property="og:title" content="Real title"><meta property="og:image" content="/og.png"></head><body></body></html>')
    })
    return
  }
  if (url.pathname === '/broken') {
    res.setHeader('content-type', 'text/html')
    return res.end('<html><head></head></html>')
  }
  if (url.pathname === '/og.png') {
    res.setHeader('content-type', 'image/png')
    return res.end(Buffer.from('89504e470d0a1a0a0000000d49484452000004b000000276', 'hex'))
  }
  res.statusCode = 404
  res.end()
})

beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => {
  server.closeAllConnections()
  server.close()
})

const options = () => ({
  pageTimeoutMs: 2000, probeTimeoutMs: 1000, maxHtmlBytes: 1_500_000, maxImages: 4, allowPrivate: true,
  renderer: { url: base, token: 'secret', timeoutMs: 3000 },
})

describe('extractRendered (FR-1.7)', () => {
  it('returns the rendered tags and what JavaScript changed', async () => {
    const result = await extractRendered(`${base}/spa`, options())
    expect(renderRequest).toEqual({ url: `${base}/spa`, token: 'secret' })
    expect(result.title).toBe('Real title')
    expect(result.rendering).toEqual({ added: ['og:title', 'og:image'], changed: ['title'], removed: ['description'] })
    expect(result.images[0]).toMatchObject({ url: `${base}/og.png`, ok: true, width: 1200, height: 630 })
  })

  it('reports a failing rendering service', async () => {
    const error = await extractRendered(`${base}/broken`, options()).catch((e: ExtractFailure) => e.toJSON())
    expect(error).toMatchObject({ code: 'UPSTREAM_ERROR', statusCode: 502 })
  })

  it('blocks private addresses before calling the service', async () => {
    const error = await extractRendered(`${base}/spa`, { ...options(), allowPrivate: false }).catch((e: ExtractFailure) => e.toJSON())
    expect(error).toMatchObject({ code: 'BLOCKED_ADDRESS' })
  })
})

describe('diffTags', () => {
  it('lists added, changed and removed tags', () => {
    const plain = { title: 'A', meta: [{ name: 'description', content: 'x' }, { property: 'og:type', content: 'website' }, { name: 'request-id', content: '1' }] }
    const rendered = { title: 'A', meta: [{ name: 'description', content: 'y' }, { property: 'og:title', content: 'T' }, { name: 'request-id', content: '2' }, { name: 'csrf-token', content: 'z' }] }
    expect(diffTags(plain as never, rendered)).toEqual({ added: ['og:title'], changed: ['description'], removed: ['og:type'] })
  })
})
