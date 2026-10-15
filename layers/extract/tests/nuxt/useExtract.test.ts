import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import type { ExtractResponse } from '#layers/core/shared/types/extract'

const ok: ExtractResponse = {
  requestedUrl: 'https://example.org/',
  finalUrl: 'https://example.org/',
  redirects: [],
  status: 200,
  contentType: 'text/html',
  timingMs: 90,
  lang: 'en',
  title: 'Example',
  meta: [{ name: 'description', content: 'An example page' }],
  links: [],
  jsonLd: [],
  images: [],
}

// @nuxt/test-utils mounts mock endpoints on h3 v2, so the event exposes a web Request.
registerEndpoint('/api/extract', (event: { req: Request }) => {
  const url = new URL(event.req.url).searchParams.get('url')
  if (url === 'https://down.example/') {
    return Response.json({ statusCode: 504, code: 'TIMEOUT', message: 'The site didn’t respond in time.' }, { status: 504 })
  }
  return Response.json({ ...ok, requestedUrl: url, finalUrl: url })
})

describe('useExtract', () => {
  it('normalises the URL, fetches and loads the shared state', async () => {
    const { extract, error, pending } = useExtract()
    const response = await extract('example.org')
    expect(response?.finalUrl).toBe('https://example.org/')
    expect(error.value).toBeNull()
    expect(pending.value).toBe(false)
    const { draft, fetched, source } = useMetaState()
    expect(draft.value.base).toMatchObject({ title: 'Example', description: 'An example page', url: 'https://example.org/' })
    expect(fetched.value?.base.title).toBe('Example')
    expect(source.value?.timingMs).toBe(90)
  })

  it('rejects invalid input without calling the API', async () => {
    const { extract, error } = useExtract()
    expect(await extract('not a url')).toBeNull()
    expect(error.value?.code).toBe('INVALID_URL')
  })

  it('exposes API errors and can retry', async () => {
    const { extract, retry, error, lastUrl } = useExtract()
    expect(await extract('https://down.example')).toBeNull()
    expect(error.value).toMatchObject({ code: 'TIMEOUT', statusCode: 504 })
    expect(lastUrl.value).toBe('https://down.example/')
    expect(await retry()).toBeNull()
    expect(error.value?.code).toBe('TIMEOUT')
  })
})
