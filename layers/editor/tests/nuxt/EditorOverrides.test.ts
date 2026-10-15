import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { EditorOverrides } from '#components'

describe('EditorOverrides (FR-3.6)', () => {
  it('shows inherited values as placeholders and writes overrides per platform', async () => {
    const values = createEmptyMeta()
    values.base.title = 'Base title'
    useMetaState().load(values)

    const wrapper = await mountSuspended(EditorOverrides, { props: { open: true } })
    const title = wrapper.find('input[type="text"]')
    expect(title.attributes('placeholder')).toBe('Base title')

    await title.setValue('Social title')
    const { draft } = useMetaState()
    expect(draft.value.overrides.og.title).toBe('Social title')
    expect(draft.value.overrides.twitter.title).toBe('')
    expect(resolveMeta(draft.value, 'twitter').title).toBe('Social title')
  })
})
