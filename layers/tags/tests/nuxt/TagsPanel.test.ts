import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { TagsPanel } from '#components'

describe('TagsPanel', () => {
  it('asks for a URL when nothing was fetched', async () => {
    useMetaState().state.value = { fetched: null, draft: createEmptyMeta(), source: null }
    const wrapper = await mountSuspended(TagsPanel)
    expect(wrapper.text()).toContain('Check a URL')
  })

  it('lists and filters the page’s tags (FR-6.1)', async () => {
    useMetaState().load(createEmptyMeta(), {
      requestedUrl: 'https://a.test/', finalUrl: 'https://a.test/', redirects: [], status: 200, contentType: 'text/html', timingMs: 1, lang: 'en',
      title: 'Hi', meta: [{ property: 'og:title', content: 'OG' }, { name: 'robots', content: 'index' }], links: [], jsonLd: [], images: [],
    })
    const wrapper = await mountSuspended(TagsPanel)
    expect(wrapper.findAll('li')).toHaveLength(3)
    await wrapper.find('input[type="search"]').setValue('robots')
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('1 shown')
  })
})
