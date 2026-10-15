import type { ExtractError, ExtractResponse } from '#layers/core/shared/types/extract'
import { isExtractError } from '#layers/extract/shared/utils/extract-errors'
import { normalizeTargetUrl } from '#layers/extract/shared/utils/target-url'
import { toMetaValues } from '#layers/extract/shared/utils/to-meta-values'

/**
 * Fetch a page's metadata through the internal API and load it into the shared state
 * (useMetaState), where the editor, previews, checks and output pick it up.
 */
export function useExtract() {
  const meta = useMetaState()
  const pending = useState('mc-extract-pending', () => false)
  const error = useState<ExtractError | null>('mc-extract-error', () => null)
  const lastUrl = useState<string | null>('mc-extract-url', () => null)
  const lastRender = useState('mc-extract-render', () => false)

  // Read the private token now: the Nuxt context isn't available after an await.
  const headers: Record<string, string> = {}
  if (import.meta.server) headers['x-metacheck-internal'] = useRuntimeConfig().extract.internalToken

  let latest = 0

  /** `refresh` skips the server's short-lived cache; `render` runs the page's JavaScript (FR-1.7). */
  async function extract(input: string, options: { refresh?: boolean, render?: boolean } = {}): Promise<ExtractResponse | null> {
    const target = normalizeTargetUrl(input)
    if (!target.ok) {
      error.value = { statusCode: 400, code: 'INVALID_URL', message: target.reason }
      return null
    }

    const request = ++latest
    pending.value = true
    error.value = null
    lastUrl.value = target.url
    lastRender.value = !!options.render
    try {
      const query: Record<string, string> = { url: target.url }
      if (options.refresh) query.refresh = '1'
      if (options.render) query.render = '1'
      const response = await $fetch<ExtractResponse>('/api/extract', { query, headers })
      if (request !== latest) return null // a newer lookup started; drop this one
      meta.load(toMetaValues(response), response)
      return response
    }
    catch (caught) {
      if (request !== latest) return null
      const data = (caught as { data?: unknown }).data
      error.value = isExtractError(data)
        ? data
        : { statusCode: 0, code: 'UPSTREAM_ERROR', message: 'MetaCheck couldn’t be reached. Check your connection and try again.' }
      return null
    }
    finally {
      if (request === latest) pending.value = false
    }
  }

  /** Run the last lookup again (the Retry action). */
  function retry(options: { refresh?: boolean } = {}) {
    return lastUrl.value ? extract(lastUrl.value, { render: lastRender.value, ...options }) : Promise.resolve(null)
  }

  return {
    extract,
    retry,
    pending: readonly(pending),
    error: readonly(error),
    lastUrl: readonly(lastUrl),
    lastRender: readonly(lastRender),
  }
}
