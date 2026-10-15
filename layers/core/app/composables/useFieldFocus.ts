/**
 * A request to focus an editor field (e.g. from a Checks "Fix" action). Layers never call each
 * other: the requester sets the field here and the editor watches it (PRD §9.1.2).
 */
export type EditorField =
  | 'title' | 'description' | 'image'
  | 'og.title' | 'og.description' | 'og.image'
  | 'twitter.title' | 'twitter.description' | 'twitter.image'
  | 'canonical' | 'imageAlt' | 'imageWidth' | 'twitterCard' | 'robots' | 'locale' | 'siteName'

export function useFieldFocus() {
  const request = useState<{ field: EditorField, at: number } | null>('mc-field-focus', () => null)
  return {
    request: readonly(request),
    focus: (field: EditorField) => { request.value = { field, at: Date.now() } },
    done: () => { request.value = null },
  }
}
