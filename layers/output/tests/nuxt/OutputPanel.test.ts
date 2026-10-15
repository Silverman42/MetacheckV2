import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { OutputPanel } from '#components'

describe('OutputPanel', () => {
  it('generates code for the draft and switches formats (FR-7.1)', async () => {
    const values = createEmptyMeta()
    values.base = { title: 'Say "hi"', description: '', image: '', url: 'https://a.test/' }
    useMetaState().load(values)

    const wrapper = await mountSuspended(OutputPanel)
    expect(wrapper.text()).toContain('<title>Say "hi"</title>')

    await wrapper.find('select').setValue('useSeoMeta')
    expect(wrapper.text()).toContain('useSeoMeta({')
    expect(wrapper.text()).toContain('title: \'Say "hi"\'')
  })

  it('shows an empty state when there is nothing to generate', async () => {
    const empty = createEmptyMeta()
    empty.advanced.ogType = ''
    useMetaState().load(empty)
    useMetaState().state.value.draft.advanced.twitterCard = '' as never
    const wrapper = await mountSuspended(OutputPanel)
    expect(wrapper.text()).toContain('Add a title or description')
  })
})
