import type { ExtractResponse } from '#layers/core/shared/types/extract'
import type { MetaState, MetaValues } from '#layers/core/shared/types/meta'
import { cloneMeta, createEmptyMeta } from '#layers/core/shared/utils/meta'

/**
 * The one shared editing state (PRD §9.1.2). Modules talk to each other through this,
 * never through each other: extract loads it, editor writes the draft, previews/checks/output read it.
 */
export function useMetaState() {
  const state = useState<MetaState>('mc-meta', () => ({
    fetched: null,
    draft: createEmptyMeta(),
    source: null,
  }))

  /** Load a fetched snapshot; the draft starts as a copy of it. */
  function load(values: MetaValues, source: ExtractResponse | null = null) {
    state.value = { fetched: cloneMeta(values), draft: cloneMeta(values), source }
  }

  /** FR-3.7 "Reset to fetched values". */
  function reset() {
    if (state.value.fetched) state.value.draft = cloneMeta(state.value.fetched)
  }

  /** FR-3.7 "Clear all"; keeps the fetched snapshot so Reset still works. */
  function clear() {
    state.value.draft = createEmptyMeta()
  }

  const isDirty = computed(() =>
    state.value.fetched !== null
    && JSON.stringify(state.value.fetched) !== JSON.stringify(state.value.draft),
  )

  return {
    state,
    draft: computed(() => state.value.draft),
    fetched: computed(() => state.value.fetched),
    source: computed(() => state.value.source),
    isDirty,
    load,
    reset,
    clear,
  }
}
