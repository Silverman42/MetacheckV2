export type ToastTone = 'neutral' | 'success' | 'danger' | 'warning'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  description?: string
  /** ms; 0 keeps it until dismissed. Errors that need action should pass 0. */
  duration: number
  action?: { label: string, run: () => void }
}

let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()

/** FR-8.2 toast system. Rendered once by <CoreToaster> in the default layout. */
export function useToast() {
  const toasts = useState<Toast[]>('mc-toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
    clearTimeout(timers.get(id))
    timers.delete(id)
  }

  function show(input: Omit<Toast, 'id' | 'duration'> & { duration?: number }) {
    const toast: Toast = { duration: 5000, ...input, id: nextId++ }
    toasts.value = [...toasts.value.slice(-2), toast]
    if (import.meta.client && toast.duration > 0) {
      timers.set(toast.id, setTimeout(() => dismiss(toast.id), toast.duration))
    }
    return toast.id
  }

  return { toasts, show, dismiss }
}
