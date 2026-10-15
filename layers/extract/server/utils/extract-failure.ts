import type { ExtractError, ExtractErrorCode } from '#layers/core/shared/types/extract'

/** A failure with a code from the API contract (PRD §9.3). Anything else becomes UPSTREAM_ERROR. */
export class ExtractFailure extends Error {
  constructor(
    public readonly code: ExtractErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly upstreamStatus?: number,
  ) {
    super(message)
    this.name = 'ExtractFailure'
  }

  toJSON(): ExtractError {
    const body: ExtractError = { statusCode: this.statusCode, code: this.code, message: this.message }
    if (this.upstreamStatus !== undefined) body.upstreamStatus = this.upstreamStatus
    return body
  }
}
