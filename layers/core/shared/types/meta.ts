import type { ExtractResponse } from './extract'

// The editable metadata every module reads and writes through useMetaState (PRD §9.1.2).

/** Fields the editor fans out to standard, Open Graph and Twitter tags (FR-3.1). */
export interface MetaBase {
  title: string
  description: string
  /** Absolute http(s) URL only (FR-3.4, decision D6). */
  image: string
  url: string
}

/** FR-3.5 advanced fields. */
export interface MetaAdvanced {
  canonical: string
  ogType: string
  siteName: string
  locale: string
  imageAlt: string
  imageWidth: string
  imageHeight: string
  twitterCard: 'summary' | 'summary_large_image'
  twitterSite: string
  twitterCreator: string
  robots: string
  themeColor: string
  favicon: string
}

/** FR-3.6 per-platform overrides; empty means "inherit from base". */
export interface MetaOverride {
  title: string
  description: string
  image: string
}

export interface MetaValues {
  base: MetaBase
  advanced: MetaAdvanced
  overrides: { og: MetaOverride, twitter: MetaOverride }
}

export interface MetaState {
  /** What the page actually ships; never mutated by edits (FR-3.7). */
  fetched: MetaValues | null
  /** What the user is editing; previews, checks and output read this. */
  draft: MetaValues
  /** The raw extraction behind `fetched`, for Tags and Checks. */
  source: ExtractResponse | null
}
