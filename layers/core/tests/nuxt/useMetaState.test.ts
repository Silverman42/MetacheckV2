import { describe, expect, it } from 'vitest'
import { createEmptyMeta } from '../../shared/utils/meta'

describe('useMetaState', () => {
  function fetchedValues() {
    const values = createEmptyMeta()
    values.base.title = 'Fetched title'
    return values
  }

  it('loads a snapshot that edits never mutate (FR-3.7)', () => {
    const meta = useMetaState()
    meta.load(fetchedValues())
    meta.state.value.draft.base.title = 'Edited'
    expect(meta.fetched.value?.base.title).toBe('Fetched title')
    expect(meta.isDirty.value).toBe(true)
  })

  it('resets the draft to the fetched values', () => {
    const meta = useMetaState()
    meta.load(fetchedValues())
    meta.state.value.draft.base.title = 'Edited'
    meta.reset()
    expect(meta.draft.value.base.title).toBe('Fetched title')
    expect(meta.isDirty.value).toBe(false)
  })

  it('clears the draft but keeps the snapshot', () => {
    const meta = useMetaState()
    meta.load(fetchedValues())
    meta.clear()
    expect(meta.draft.value.base.title).toBe('')
    expect(meta.fetched.value?.base.title).toBe('Fetched title')
  })

  it('is shared between callers', () => {
    useMetaState().load(fetchedValues())
    expect(useMetaState().draft.value.base.title).toBe('Fetched title')
  })
})
