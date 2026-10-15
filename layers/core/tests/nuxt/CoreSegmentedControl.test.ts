import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { CoreSegmentedControl } from '#components'

describe('CoreSegmentedControl', () => {
  it('renders tabs and updates the model when a segment is chosen', async () => {
    let value = 'light'
    const wrapper = await mountSuspended(CoreSegmentedControl, {
      props: {
        'label': 'Theme',
        'modelValue': value,
        'options': [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ],
        'onUpdate:modelValue': (v: string) => { value = v },
      },
    })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(wrapper.find('[role="tablist"]').attributes('aria-label')).toBe('Theme')
    await tabs[1]!.trigger('mousedown', { button: 0 })
    expect(value).toBe('dark')
  })
})
