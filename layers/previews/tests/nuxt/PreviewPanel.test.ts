import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { PreviewPanel } from '#components'

describe('PreviewPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    const values = createEmptyMeta()
    values.base = { title: 'Hello world', description: 'A description', image: '', url: 'https://www.a.test/page' }
    useMetaState().load(values)
    useState('mc-channels').value = ['google', 'facebook', 'x', 'linkedin']
  })

  it('renders a labelled card for each selected channel with the draft values (FR-4.x)', async () => {
    const wrapper = await mountSuspended(PreviewPanel)
    await flushPromises()
    const cards = wrapper.findAll('section[aria-label$="preview"]')
    expect(cards.map(c => c.attributes('aria-label'))).toEqual(['Google preview', 'Facebook preview', 'X preview', 'LinkedIn preview'])
    expect(wrapper.text()).toContain('Hello world')
    expect(wrapper.text()).toContain('a.test › page')
    expect(wrapper.text()).toContain('A.TEST')
    // No image: no <img> placeholders (FR-4.7).
    expect(wrapper.findAll('section[aria-label="Facebook preview"] img')).toHaveLength(0)
  })

  it('toggles channels with labelled chips and remembers the choice (FR-4.5)', async () => {
    const wrapper = await mountSuspended(PreviewPanel)
    const chip = wrapper.findAll('button[aria-pressed]').find(b => b.text().includes('Google'))!
    expect(chip.attributes('aria-pressed')).toBe('true')
    await chip.trigger('click')
    expect(useState('mc-channels').value).not.toContain('google')
    expect(JSON.parse(localStorage.getItem('metacheck-channels')!)).toEqual(['facebook', 'x', 'linkedin'])
  })
})
