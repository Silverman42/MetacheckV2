import { brotliCompressSync, gzipSync } from 'node:zlib'

// Netlify compresses pages at the edge. A plain Node server (local preview, the Lighthouse
// hook) doesn't, so do it here for that preset only, keeping local audits close to production.
export default defineNitroPlugin((nitro) => {
  if (import.meta.preset !== 'node-server') return
  nitro.hooks.hook('render:response', (response, { event }) => {
    // Nuxt's renderer doesn't always fill response.headers, so recognise the page by its body.
    if (typeof response.body !== 'string' || !/^\s*<!DOCTYPE html/i.test(response.body)) return
    const accept = getRequestHeader(event, 'accept-encoding') ?? ''
    const encoding = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null
    if (!encoding) return
    response.body = (encoding === 'br' ? brotliCompressSync(response.body) : gzipSync(response.body)) as unknown as string
    response.headers = { ...response.headers, 'content-encoding': encoding, 'vary': 'accept-encoding' }
  })
})
