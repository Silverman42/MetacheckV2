import { addRecent } from '#layers/workspace/shared/utils/recent'

export type WorkspaceView = 'edit' | 'preview' | 'checks' | 'tags' | 'code'
/** demo: MetaCheck's own tags · page: a fetched URL · scratch: writing tags from nothing. */
export type WorkspaceMode = 'demo' | 'page' | 'scratch'

const RECENT_KEY = 'metacheck-recent'

export function useWorkspace() {
  const view = useState<WorkspaceView>('mc-view', () => 'preview')
  const mode = useState<WorkspaceMode>('mc-mode', () => 'demo')
  const inspectorOpen = useState('mc-inspector', () => false)
  const recent = useState<string[]>('mc-recent', () => [])

  function loadRecent() {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
      if (Array.isArray(saved)) recent.value = saved.filter((u): u is string => typeof u === 'string').slice(0, 10)
    }
    catch {
      // Storage blocked or corrupt.
    }
  }
  function saveRecent() {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value))
    }
    catch {
      // Storage blocked: keep the list for this visit only.
    }
  }

  return {
    view,
    mode,
    inspectorOpen,
    recent: readonly(recent),
    loadRecent,
    remember: (url: string) => {
      recent.value = addRecent(recent.value, url)
      saveRecent()
    },
    clearRecent: () => {
      recent.value = []
      saveRecent()
    },
  }
}
