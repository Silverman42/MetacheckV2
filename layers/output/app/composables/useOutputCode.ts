import { generate, getFormat, type OutputFormat } from '#layers/output/shared/utils/formats'

/** The code for the chosen format, shared by the Code view and the copy shortcut. */
export function useOutputCode() {
  const { draft } = useMetaState()
  const format = useState<OutputFormat>('mc-output-format', () => 'html')
  const comments = useState('mc-output-comments', () => true)
  const info = computed(() => getFormat(format.value))
  const code = computed(() => generate(draft.value, format.value, { comments: comments.value }))
  return { format, comments, info, code }
}
