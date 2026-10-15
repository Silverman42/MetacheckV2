import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Index from '../../app/pages/index.vue'

registerEndpoint('/api/extract', (event: { req: Request }) => {
  const url = new URL(event.req.url).searchParams.get('url')
  return Response.json({
    requestedUrl: url, finalUrl: url, redirects: [], status: 200, contentType: 'text/html', timingMs: 42, lang: 'en',
    title: 'Fetched page', meta: [{ name: 'description', content: 'Fetched description' }], links: [], jsonLd: [], images: [],
  })
})

describe('workspace page', () => {
  it('shows the demo on a first visit (FR-1.5)', async () => {
    useState('mc-mode').value = 'demo'
    useMetaState().state.value = { fetched: null, draft: createEmptyMeta(), source: null }
    const wrapper = await mountSuspended(Index, { route: '/' })
    expect(wrapper.text()).toContain('MetaCheck’s own tags')
    expect(useMetaState().draft.value.base.title).toContain('MetaCheck')
  })

  it('checks a URL, loads the state and reflects it in the address (FR-1.2)', async () => {
    const wrapper = await mountSuspended(Index, { route: '/' })
    const input = wrapper.find('#url-field')
    await input.setValue('a.test')
    await wrapper.find('form[role="search"]').trigger('submit')
    await new Promise(r => setTimeout(r, 50))
    expect(useMetaState().draft.value.base.title).toBe('Fetched page')
    expect(useRoute().query.url).toBe('https://a.test/')
    expect(wrapper.text()).toContain('HTTP 200')
  })

  it('starts from scratch with an empty editor (FR-1.5)', async () => {
    useState('mc-mode').value = 'demo'
    useExtract()
    useState('mc-extract-error').value = null
    const wrapper = await mountSuspended(Index, { route: '/' })
    const button = wrapper.findAll('button').find(b => b.text().includes('Start from scratch'))!
    expect(button).toBeTruthy()
    await button.trigger('click')
    expect(useMetaState().draft.value.base.title).toBe('')
    expect(useMetaState().fetched.value).toBeNull()
    expect(useState('mc-mode').value).toBe('scratch')
  })
})
