import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { ChecksPanel } from '#components'

describe('ChecksPanel', () => {
  it('groups failures and updates as the draft changes (FR-5.1, FR-5.5)', async () => {
    useMetaState().load(createEmptyMeta())
    const wrapper = await mountSuspended(ChecksPanel)
    expect(wrapper.text()).toContain('Errors')
    expect(wrapper.text()).toContain('Page has a title')

    useMetaState().state.value.draft.base.title = 'A perfectly reasonable page title here'
    await nextTick()
    const errors = wrapper.find('section[aria-labelledby="checks-errors"]')
    expect(errors.text()).not.toContain('Page has a title')
  })

  it('“Edit in MetaCheck” requests focus on the right field', async () => {
    useMetaState().load(createEmptyMeta())
    const wrapper = await mountSuspended(ChecksPanel)
    const row = wrapper.findAll('li button[aria-expanded]').find(b => b.text().includes('Page has a title'))!
    await row.trigger('click')
    const edit = wrapper.findAll('button').find(b => b.text().includes('Edit in MetaCheck'))!
    await edit.trigger('click')
    expect(useFieldFocus().request.value?.field).toBe('title')
  })
})
