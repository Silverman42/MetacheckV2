import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { extractPage } from '../../server/utils/extract-page'
import type { ExtractFailure } from '../../server/utils/extract-failure'

// A local fixture server; allowPrivate skips the SSRF guard only for these tests.
const png = Buffer.from('89504e470d0a1a0a0000000d49484452000004b000000276080600000000', 'hex')
let base = ''
let bodyBytesSent = 0

const server = createServer((req, res) => {
  const path = req.url ?? '/'
  if (path === '/page') {
    res.setHeader('content-type', 'text/html; charset=utf-8')
    return res.end(`<html lang="en"><head><title>Hello</title>
      <meta property="og:image" content="/og.png"><meta name="twitter:image" content="/missing.png">
      </head><body>…</body></html>`)
  }
  if (path === '/og.png') {
    res.setHeader('content-type', 'image/png')
    res.setHeader('content-length', '5120')
    return res.end(Buffer.concat([png, Buffer.alloc(5120 - png.length)]))
  }
  if (path === '/redirect') {
    res.statusCode = 301
    res.setHeader('location', '/page')
    return res.end()
  }
  if (path.startsWith('/loop')) {
    res.statusCode = 302
    res.setHeader('location', `/loop${Number(path.slice(5) || 0) + 1}`)
    return res.end()
  }
  if (path === '/json') {
    res.setHeader('content-type', 'application/json')
    return res.end('{}')
  }
  if (path === '/gone') {
    res.statusCode = 404
    return res.end('not found')
  }
  if (path === '/slow') {
    return setTimeout(() => res.end('<html><head></head></html>'), 2000)
  }
  if (path === '/huge') {
    // Head first, then a 20 MB body: reading must stop at the byte cap.
    res.setHeader('content-type', 'text/html')
    res.write('<html><head><title>Big</title></head><body>')
    let closed = false
    res.on('close', () => (closed = true))
    const pump = () => {
      while (!closed && bodyBytesSent < 20_000_000) {
        bodyBytesSent += 65536
        if (!res.write('x'.repeat(65536))) return res.once('drain', pump)
      }
      res.end()
    }
    pump()
    return
  }
  if (path === '/jsonld') {
    res.setHeader('content-type', 'text/html')
    return res.end(`<html><head><script type="application/ld+json">{"@type":"WebSite"}</script></head>
      <body><svg><title>Icon</title></svg><meta property="og:title" content="ignored">
      <script type="application/ld+json">{"@type":"Article"}</script></body></html>`)
  }
  if (path === '/latin1') {
    res.setHeader('content-type', 'text/html; charset=iso-8859-1')
    return res.end(Buffer.from('<html><head><title>Café</title></head></html>', 'latin1'))
  }
  res.statusCode = 404
  res.end()
})

const options = { pageTimeoutMs: 1000, probeTimeoutMs: 1000, maxHtmlBytes: 1_500_000, maxImages: 4, allowPrivate: true }
const failure = (promise: Promise<unknown>) => promise.then(() => { throw new Error('expected a failure') }, (e: ExtractFailure) => e.toJSON())

beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => {
  server.closeAllConnections()
  server.close()
})

describe('extractPage', () => {
  it('fetches, parses and probes images', async () => {
    const result = await extractPage(`${base}/page`, options)
    expect(result).toMatchObject({ status: 200, contentType: 'text/html', lang: 'en', title: 'Hello', redirects: [] })
    expect(result.images).toEqual([
      { url: `${base}/og.png`, tag: 'og:image', relative: true, ok: true, status: 200, contentType: 'image/png', bytes: 5120, width: 1200, height: 630 },
      { url: `${base}/missing.png`, tag: 'twitter:image', relative: true, ok: false, status: 404 },
    ])
  })

  it('follows redirects and reports the chain (FR-1.4)', async () => {
    const result = await extractPage(`${base}/redirect`, options)
    expect(result.finalUrl).toBe(`${base}/page`)
    expect(result.redirects).toEqual([{ url: `${base}/redirect`, status: 301 }])
  })

  it('stops after 5 redirects', async () => {
    expect(await failure(extractPage(`${base}/loop0`, options))).toMatchObject({ code: 'TOO_MANY_REDIRECTS', statusCode: 502 })
  })

  it('refuses non-HTML responses', async () => {
    expect(await failure(extractPage(`${base}/json`, options))).toMatchObject({ code: 'NOT_HTML', statusCode: 422 })
  })

  it('reports the target’s HTTP errors', async () => {
    expect(await failure(extractPage(`${base}/gone`, options))).toMatchObject({ code: 'HTTP_ERROR', upstreamStatus: 404 })
  })

  it('times out', async () => {
    expect(await failure(extractPage(`${base}/slow`, { ...options, pageTimeoutMs: 200 }))).toMatchObject({ code: 'TIMEOUT', statusCode: 504 })
  })

  it('stops reading at the byte cap', async () => {
    const result = await extractPage(`${base}/huge`, options)
    expect(result.title).toBe('Big')
    expect(bodyBytesSent).toBeLessThan(5_000_000)
  })

  it('finds JSON-LD in the body', async () => {
    const result = await extractPage(`${base}/jsonld`, options)
    expect(result.jsonLd.map(b => (b.parsed as { '@type': string })['@type'])).toEqual(['WebSite', 'Article'])
  })

  it('decodes the declared charset', async () => {
    expect((await extractPage(`${base}/latin1`, options)).title).toBe('Café')
  })

  it('blocks private addresses when the guard is on (fixes B4)', async () => {
    expect(await failure(extractPage(`${base}/page`, { ...options, allowPrivate: false }))).toMatchObject({ code: 'BLOCKED_ADDRESS', statusCode: 400 })
  })
})
