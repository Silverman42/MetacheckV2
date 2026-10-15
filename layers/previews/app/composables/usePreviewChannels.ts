import { CHANNELS, DEFAULT_CHANNELS, type ChannelId } from '#layers/previews/shared/utils/channels'

const STORAGE_KEY = 'metacheck-channels'

/** FR-4.5: which channels are shown, remembered on this device. */
export function usePreviewChannels() {
  const selected = useState<ChannelId[]>('mc-channels', () => [...DEFAULT_CHANNELS])

  if (import.meta.client) {
    onMounted(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
        if (Array.isArray(saved)) {
          const valid = saved.filter((id): id is ChannelId => CHANNELS.some(c => c.id === id))
          selected.value = CHANNELS.map(c => c.id).filter(id => valid.includes(id))
        }
      }
      catch {
        // Storage blocked or corrupt: keep the defaults.
      }
    })
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected.value))
    }
    catch {
      // Storage blocked: the choice lasts for this visit only.
    }
  }

  function toggle(id: ChannelId, on = !selected.value.includes(id)) {
    const next = new Set(selected.value)
    if (on) next.add(id)
    else next.delete(id)
    // Keep the configured order so cards don't jump around.
    selected.value = CHANNELS.map(c => c.id).filter(c => next.has(c))
    save()
  }

  return { selected: readonly(selected), toggle, isOn: (id: ChannelId) => selected.value.includes(id) }
}
