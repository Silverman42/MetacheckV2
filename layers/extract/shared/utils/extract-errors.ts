import type { ExtractError, ExtractErrorCode } from '#layers/core/shared/types/extract'

// FR-1.3: specific, actionable error copy, shared by the API and the UI.
export const EXTRACT_ERROR_TITLES: Record<ExtractErrorCode, string> = {
  INVALID_URL: 'That URL isn’t valid',
  BLOCKED_ADDRESS: 'That address can’t be checked',
  DNS_ERROR: 'We couldn’t find that site',
  TIMEOUT: 'The site took too long to respond',
  NOT_HTML: 'That URL isn’t a web page',
  HTTP_ERROR: 'The site returned an error',
  TOO_MANY_REDIRECTS: 'Too many redirects',
  UPSTREAM_ERROR: 'We couldn’t reach that site',
  RATE_LIMITED: 'Too many checks',
  FORBIDDEN: 'Request not allowed',
}

/** Codes where trying again might help, so the UI offers a Retry action. */
export const RETRYABLE_EXTRACT_ERRORS: ExtractErrorCode[] = ['TIMEOUT', 'UPSTREAM_ERROR', 'RATE_LIMITED', 'HTTP_ERROR', 'DNS_ERROR']

export function isExtractError(value: unknown): value is ExtractError {
  return !!value && typeof value === 'object'
    && typeof (value as ExtractError).code === 'string'
    && (value as ExtractError).code in EXTRACT_ERROR_TITLES
}
