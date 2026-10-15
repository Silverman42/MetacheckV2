// FR-1.1: accept URLs with or without a protocol, trim, validate. Shared by the URL field
// (inline validation) and the server (which re-validates everything).

export type TargetUrlResult =
  | { ok: true, url: string }
  | { ok: false, reason: string }

const MAX_LENGTH = 2048

export function normalizeTargetUrl(input: string): TargetUrlResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, reason: 'Enter a URL to check.' }
  if (trimmed.length > MAX_LENGTH) return { ok: false, reason: 'That URL is too long.' }

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) && !/^[^/:]+:\d+(?:[/?#]|$)/.test(trimmed)
  const candidate = hasScheme ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`

  let url: URL
  try {
    url = new URL(candidate)
  }
  catch {
    return { ok: false, reason: 'That doesn’t look like a web address.' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https addresses can be checked.' }
  }
  if (url.username || url.password) {
    return { ok: false, reason: 'Remove the username and password from the URL.' }
  }
  const host = url.hostname
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith('[')
  if (!isIp && (!host.includes('.') || host.endsWith('.'))) {
    return { ok: false, reason: 'Include the full domain, like example.com.' }
  }

  url.hash = ''
  return { ok: true, url: url.toString() }
}
