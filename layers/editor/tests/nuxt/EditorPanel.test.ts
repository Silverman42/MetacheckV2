import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import { EditorPanel } from '#components'

function fetchedValues() {
  const values = createEmptyMeta()
  values.base = { title: 'Fetched title', description: 'Fetched description', image: 'https://a.test/og.png', url: 'https://a.test/' }
  return values
}

describe('EditorPanel', () => {
  beforeEach(() => {
    useMetaState().load(fetchedValues())
    useToast().toasts.value = []
  })

  it('shows the draft and writes edits back to it, never to the snapshot (FR-3.1, FR-3.7)', async () => {
    const wrapper = await mountSuspended(EditorPanel)
    const title = wrapper.find('input[type="text"]')
    expect((title.element as HTMLInputElement).value).toBe('Fetched title')
    await title.setValue('New title')
    const { draft, fetched, isDirty } = useMetaState()
    expect(draft.value.base.title).toBe('New title')
    expect(fetched.value?.base.title).toBe('Fetched title')
    expect(isDirty.value).toBe(true)
  })

  it('shows live counters (FR-3.3)', async () => {
    const wrapper = await mountSuspended(EditorPanel)
    expect(wrapper.text()).toContain(`${'Fetched title'.length}/60`)
  })

  it('resets to the fetched values with an undo toast', async () => {
    const wrapper = await mountSuspended(EditorPanel)
    await wrapper.find('input[type="text"]').setValue('Changed')
    await wrapper.find('button[title="Reset to fetched values"]').trigger('click')
    expect(useMetaState().draft.value.base.title).toBe('Fetched title')
    const toast = useToast().toasts.value.at(-1)!
    expect(toast.title).toContain('Reset')
    toast.action!.run()
    expect(useMetaState().draft.value.base.title).toBe('Changed')
  })

  it('clears every field but keeps the snapshot', async () => {
    const wrapper = await mountSuspended(EditorPanel)
    await wrapper.find('button[title="Clear all fields"]').trigger('click')
    expect(useMetaState().draft.value.base).toEqual({ title: '', description: '', image: '', url: '' })
    expect(useMetaState().fetched.value?.base.title).toBe('Fetched title')
  })

  it('rejects relative image URLs (FR-3.4)', async () => {
    const wrapper = await mountSuspended(EditorPanel)
    await wrapper.find('input[type="url"]').setValue('/og.png')
    expect(wrapper.text()).toContain('Use the full URL')
    expect(wrapper.find('input[type="url"]').attributes('aria-invalid')).toBe('true')
  })
})
