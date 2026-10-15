import * as v from 'valibot'
import { normalizeTargetUrl } from '../../shared/utils/target-url'
import { isAllowedCaller } from '../utils/caller-guard'
import { extractPage } from '../utils/extract-page'
import { ExtractFailure } from '../utils/extract-failure'

// GET /api/extract?url= — internal to the MetaCheck UI, not a public API (PRD §9.3, decision D7).

const Query = v.object({
  url: v.pipe(v.string('Enter a URL to check.'), v.trim(), v.minLength(1, 'Enter a URL to check.'), v.maxLength(2048, 'That URL is too long.')),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  setResponseHeaders(event, {
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex',
    'x-content-type-options': 'nosniff',
  })

  try {
    const allowed = isAllowedCaller({
      secFetchSite: getRequestHeader(event, 'sec-fetch-site'),
      origin: getRequestHeader(event, 'origin'),
      referer: getRequestHeader(event, 'referer'),
      host: getRequestHeader(event, 'x-forwarded-host') ?? getRequestHeader(event, 'host'),
      internalToken: getRequestHeader(event, 'x-metacheck-internal'),
    }, { siteUrl: config.public.siteUrl, internalToken: config.extract.internalToken })
    if (!allowed) throw new ExtractFailure('FORBIDDEN', 403, 'This endpoint is only available to the MetaCheck app.')

    const query = v.safeParse(Query, getQuery(event))
    if (!query.success) throw new ExtractFailure('INVALID_URL', 400, query.issues[0].message)

    const target = normalizeTargetUrl(query.output.url)
    if (!target.ok) throw new ExtractFailure('INVALID_URL', 400, target.reason)

    return await extractPage(target.url, {
      pageTimeoutMs: config.extract.pageTimeoutMs,
      probeTimeoutMs: config.extract.probeTimeoutMs,
      maxHtmlBytes: config.extract.maxHtmlBytes,
      maxImages: config.extract.maxImages,
    })
  }
  catch (error) {
    const failure = error instanceof ExtractFailure
      ? error
      : new ExtractFailure('UPSTREAM_ERROR', 502, 'Something went wrong while checking that page.')
    if (!(error instanceof ExtractFailure)) console.error('[extract]', error)
    setResponseStatus(event, failure.statusCode)
    return failure.toJSON()
  }
})
