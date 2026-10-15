// FR-3.3: recommended lengths and the platform note behind each one.

export interface FieldGuidance {
  /** [min, max] recommended characters. */
  range: [number, number]
  hint: string
}

export const FIELD_GUIDANCE = {
  title: { range: [30, 60], hint: 'Google shows about 60 characters; social cards cut off around 70.' },
  description: { range: [110, 160], hint: 'Google shows about 160 characters; LinkedIn and X show less.' },
  ogTitle: { range: [30, 70], hint: 'Facebook and LinkedIn truncate after about 70 characters.' },
  ogDescription: { range: [60, 200], hint: 'Often 2–3 lines on Facebook; hidden on some layouts.' },
  twitterTitle: { range: [30, 70], hint: 'X truncates after about 70 characters.' },
  twitterDescription: { range: [60, 200], hint: 'X shows up to 2 lines on large image cards.' },
  imageAlt: { range: [1, 420], hint: 'Describe the image for people using screen readers.' },
} satisfies Record<string, FieldGuidance>

export type ImageUrlCheck =
  | { state: 'empty' }
  | { state: 'invalid', message: string }
  | { state: 'ok', url: string }

/** FR-3.4: the image must be an absolute http(s) URL; relative paths are rejected by platforms. */
export function checkImageUrl(value: string): ImageUrlCheck {
  const trimmed = value.trim()
  if (!trimmed) return { state: 'empty' }
  if (!/^https?:\/\//i.test(trimmed)) {
    return { state: 'invalid', message: trimmed.startsWith('/') || !trimmed.includes(':')
      ? 'Use the full URL, starting with https://. Platforms ignore relative paths.'
      : 'Only http and https image URLs work.' }
  }
  try {
    return { state: 'ok', url: new URL(trimmed).toString() }
  }
  catch {
    return { state: 'invalid', message: 'That doesn’t look like a valid URL.' }
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
