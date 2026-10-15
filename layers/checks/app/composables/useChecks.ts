import { resolveMeta } from '#layers/core/shared/utils/meta'
import { contextTags, runChecks, summarize, type CheckMode, type ImageFacts } from '#layers/checks/shared/utils/rules'

// Image sizes learned in the browser for images the server didn't probe, by URL.
const measured = reactive(new Map<string, { ok: boolean, width?: number, height?: number }>())
const pending = new Set<string>()

function measure(url: string) {
  if (!import.meta.client || measured.has(url) || pending.has(url)) return
  pending.add(url)
  const img = new Image()
  img.referrerPolicy = 'no-referrer'
  img.onload = () => {
    measured.set(url, { ok: true, width: img.naturalWidth, height: img.naturalHeight })
    pending.delete(url)
  }
  img.onerror = () => {
    measured.set(url, { ok: false })
    pending.delete(url)
  }
  img.src = url
}

/** FR-5.5: checks run on the client against the current state, so fixes show immediately. */
export function useChecks() {
  const { draft, source, isDirty } = useMetaState()

  const mode = computed<CheckMode>(() => (!source.value ? 'draft' : isDirty.value ? 'edited' : 'live'))

  const image = computed<ImageFacts | null>(() => {
    if (mode.value === 'live') {
      const probe = source.value!.images.find(i => i.tag.startsWith('og:')) ?? source.value!.images[0]
      return probe ?? null
    }
    const url = resolveMeta(draft.value, 'og').image.trim()
    if (!url) return null
    const relative = !/^https?:\/\//i.test(url)
    const probe = source.value?.images.find(i => i.url === url)
    if (probe) return { ...probe, relative }
    if (relative) return { url, relative }
    measure(url)
    return { url, relative, ...measured.get(url) }
  })

  const results = computed(() => runChecks({
    mode: mode.value,
    values: draft.value,
    tags: contextTags(draft.value, source.value, mode.value),
    source: source.value,
    image: image.value,
  }))
  const summary = computed(() => summarize(results.value))

  return { mode, results, summary }
}
