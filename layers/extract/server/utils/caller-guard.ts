// FR-8.6 / decision D7: the extraction endpoint is internal to the app. Browsers on other
// origins are refused; this deters casual reuse (rate limiting is what bounds scripts).

export interface CallerHeaders {
  secFetchSite?: string
  origin?: string
  referer?: string
  host?: string
  internalToken?: string
}

function hostOf(value?: string) {
  if (!value) return null
  try {
    return new URL(value).host.toLowerCase()
  }
  catch {
    return null
  }
}

export function isAllowedCaller(headers: CallerHeaders, options: { siteUrl: string, internalToken: string }) {
  // Server-side rendering of /?url= calls the API in-process with the private token.
  if (options.internalToken && headers.internalToken === options.internalToken) return true

  const site = (headers.secFetchSite ?? '').toLowerCase()
  if (site) return site === 'same-origin'

  // Older browsers: fall back to Origin, then Referer.
  const callerHost = hostOf(headers.origin) ?? hostOf(headers.referer)
  if (!callerHost) return false
  const allowed = new Set([hostOf(options.siteUrl), headers.host?.toLowerCase()].filter(Boolean))
  return allowed.has(callerHost)
}
