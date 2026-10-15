import type { EditorField } from '#layers/core/app/composables/useFieldFocus'

/**
 * Answer focus requests (useFieldFocus) for the fields a component owns: open whatever hides the
 * field, then focus it and scroll it into view. Immediate, so a request made before the editor
 * was on screen (e.g. on mobile) is handled when it mounts.
 */
export function useEditorFocus(fields: EditorField[], prepare?: (field: EditorField) => void) {
  const { request, done } = useFieldFocus()
  watch(request, async (req) => {
    if (!import.meta.client || !req || !fields.includes(req.field)) return
    prepare?.(req.field)
    await nextTick()
    // Let a disclosure start opening before measuring where the field is.
    await new Promise(resolve => requestAnimationFrame(resolve))
    const el = document.querySelector<HTMLElement>(`[data-field="${req.field}"] :is(input, textarea, select, button)`)
    if (el) {
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
      el.focus({ preventScroll: true })
    }
    done()
  }, { immediate: true })
}
