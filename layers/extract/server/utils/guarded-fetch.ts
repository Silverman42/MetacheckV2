import { Agent, fetch } from 'undici'
import type { Dispatcher, Response } from 'undici'
import { assertFetchableUrl, guardedLookup } from './address-guard'
import { ExtractFailure } from './extract-failure'

export const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36 MetaCheck/2.0 (+https://metacheckui.netlify.app)'
export const MAX_REDIRECTS = 5

const guardedAgent = new Agent({ connect: { lookup: guardedLookup }, connections: 16 })
let unguardedAgent: Agent | undefined

export interface GuardedFetchOptions {
  signal: AbortSignal
  accept: string
  /** Tests only: skip the address guard so a local fixture server can be used. */
  allowPrivate?: boolean
}

export interface GuardedResponse {
  response: Response
  finalUrl: string
  redirects: { url: string, status: number }[]
}

/** GET with manual redirects; every hop is re-validated (PRD §9.4). */
export async function guardedFetch(target: string, options: GuardedFetchOptions): Promise<GuardedResponse> {
  const dispatcher: Dispatcher = options.allowPrivate ? (unguardedAgent ??= new Agent()) : guardedAgent
  const redirects: { url: string, status: number }[] = []
  let current = new URL(target)

  for (;;) {
    if (!options.allowPrivate) assertFetchableUrl(current)
    let response: Response
    try {
      response = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: options.signal,
        dispatcher,
        headers: {
          'user-agent': USER_AGENT,
          'accept': options.accept,
          'accept-language': 'en;q=0.9, *;q=0.5',
        },
      })
    }
    catch (error) {
      throw toNetworkFailure(error, options.signal)
    }

    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel().catch(() => {})
      redirects.push({ url: current.toString(), status: response.status })
      if (redirects.length > MAX_REDIRECTS) {
        throw new ExtractFailure('TOO_MANY_REDIRECTS', 502, `The page redirected more than ${MAX_REDIRECTS} times.`)
      }
      try {
        current = new URL(location, current)
      }
      catch {
        throw new ExtractFailure('UPSTREAM_ERROR', 502, 'The page redirected to an invalid address.')
      }
      continue
    }
    return { response, finalUrl: current.toString(), redirects }
  }
}

function toNetworkFailure(error: unknown, signal: AbortSignal): ExtractFailure {
  if (error instanceof ExtractFailure) return error
  if (signal.aborted) return new ExtractFailure('TIMEOUT', 504, 'The site didn’t respond in time.')
  const cause = (error as { cause?: { code?: string } })?.cause
  switch (cause?.code) {
    case 'EBLOCKED':
      return new ExtractFailure('BLOCKED_ADDRESS', 400, 'That site points to a private or reserved address, so it can’t be checked.')
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
    case 'EAI_NODATA':
    case 'EAI_NONAME':
      return new ExtractFailure('DNS_ERROR', 502, 'The domain doesn’t resolve. Check the spelling.')
    case 'UND_ERR_CONNECT_TIMEOUT':
    case 'UND_ERR_HEADERS_TIMEOUT':
    case 'UND_ERR_BODY_TIMEOUT':
      return new ExtractFailure('TIMEOUT', 504, 'The site didn’t respond in time.')
    default:
      return new ExtractFailure('UPSTREAM_ERROR', 502, 'The connection to the site failed.')
  }
}

/**
 * Read a body up to `maxBytes`, stopping early once `stop` says enough has arrived.
 * The rest of the response is discarded.
 */
export async function readLimited(response: Response, maxBytes: number, stop?: (received: Uint8Array) => boolean) {
  const chunks: Uint8Array[] = []
  let total = 0
  let complete = true
  const reader = response.body?.getReader()
  if (!reader) return { bytes: new Uint8Array(), complete }
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      total += value.byteLength
      if (total >= maxBytes || stop?.(value)) {
        complete = false
        break
      }
    }
  }
  finally {
    if (!complete) await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
  const bytes = new Uint8Array(Math.min(total, maxBytes))
  let offset = 0
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, bytes.length - offset)
    bytes.set(slice, offset)
    offset += slice.length
    if (offset >= bytes.length) break
  }
  return { bytes, complete }
}
