import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceRenderNote } from '#components'
import Index from '../../app/pages/index.vue'

const press = (key: string, target: EventTarget = window) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

describe('keyboard shortcuts (FR-8.5)', () => {
  it('switches views, opens help, copies code, and ignores keys typed into fields', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const values = createEmptyMeta()
    values.base.title = 'Shortcut test'
    useMetaState().load(values)
    useState('mc-mode').value = 'page'

    const wrapper = await mountSuspended(Index, { route: '/' })
    const view = useState('mc-view')

    press('2')
    expect(view.value).toBe('checks')
    press('4')
    expect(view.value).toBe('code')

    press('3', wrapper.find('#url-field').element)
    expect(view.value).toBe('code')

    press('c')
    await new Promise(r => setTimeout(r, 0))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('<title>Shortcut test</title>'))
    expect(useToast().toasts.value.at(-1)?.title).toBe('Copied HTML')

    press('?')
    expect(useState('mc-shortcuts-open').value).toBe(true)
    wrapper.unmount()
  })
})

describe('WorkspaceRenderNote (FR-1.7)', () => {
  it('warns about tags that only exist after JavaScript', async () => {
    const wrapper = await mountSuspended(WorkspaceRenderNote, { props: { rendering: { added: ['og:title', 'og:image'], changed: ['title'], removed: [] } } })
    expect(wrapper.text()).toContain('only exist after JavaScript runs: og:title, og:image, title')
  })

  it('confirms when JavaScript changes nothing', async () => {
    const wrapper = await mountSuspended(WorkspaceRenderNote, { props: { rendering: { added: [], changed: [], removed: [] } } })
    expect(wrapper.text()).toContain('doesn’t change the tags')
  })
})
