import type { WorkspaceView } from './useWorkspace'

/** FR-8.5. The URL field owns "/" and ⌘K; these are the rest. */
export const SHORTCUTS: { keys: string, label: string }[] = [
  { keys: '/', label: 'Focus the URL field (also ⌘K or Ctrl K)' },
  { keys: '1', label: 'Preview' },
  { keys: '2', label: 'Checks' },
  { keys: '3', label: 'Tags' },
  { keys: '4', label: 'Code' },
  { keys: 'E', label: 'Show the editor' },
  { keys: 'C', label: 'Copy the code in the selected format' },
  { keys: '?', label: 'Show these shortcuts' },
]

const VIEW_KEYS: Record<string, WorkspaceView> = { 1: 'preview', 2: 'checks', 3: 'tags', 4: 'code' }

export function useWorkspaceShortcuts() {
  const { view, inspectorOpen } = useWorkspace()
  const { code, info } = useOutputCode()
  const { show } = useToast()
  const helpOpen = useState('mc-shortcuts-open', () => false)

  async function copyCode() {
    if (!code.value) {
      show({ tone: 'warning', title: 'Nothing to copy yet', description: 'Add a title or description first.' })
      return
    }
    try {
      await navigator.clipboard.writeText(code.value)
      show({ tone: 'success', title: `Copied ${info.value.label}`, duration: 2500 })
    }
    catch {
      show({ tone: 'danger', title: 'Couldn’t copy', description: 'Your browser blocked clipboard access.' })
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return

    const key = event.key
    if (VIEW_KEYS[key]) view.value = VIEW_KEYS[key]
    else if (key === 'e' || key === 'E') {
      if (matchMedia('(max-width: 767px)').matches) view.value = 'edit'
      else inspectorOpen.value = true
    }
    else if (key === 'c' || key === 'C') copyCode()
    else if (key === '?') helpOpen.value = true
    else return
    event.preventDefault()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

  return { helpOpen }
}
