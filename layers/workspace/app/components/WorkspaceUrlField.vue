<script setup lang="ts">
// §9.10.6 URL field: large target, inline Check button, "/" and ⌘K to focus (FR-8.5),
// recent lookups as suggestions (FR-1.6).
const props = defineProps<{ pending: boolean }>()
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [url: string] }>()
const { recent } = useWorkspace()

const input = useTemplateRef<HTMLInputElement>('input')
const isMac = ref(false)

function onKeydown(event: KeyboardEvent) {
  const target = event.target instanceof Element ? event.target : null
  const typing = target?.closest('input, textarea, select, [contenteditable="true"]')
  if ((event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey))) {
    event.preventDefault()
    input.value?.focus()
    input.value?.select()
  }
}
onMounted(() => {
  isMac.value = /Mac|iPhone|iPad/.test(navigator.platform)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function submit() {
  if (!props.pending) emit('submit', model.value)
}
</script>

<template>
  <form role="search" class="group relative mx-auto w-full max-w-2xl" @submit.prevent="submit">
    <label for="url-field" class="sr-only">Page URL</label>
    <Icon name="lucide:search" class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
    <input
      id="url-field"
      ref="input"
      v-model="model"
      type="text"
      inputmode="url"
      autocomplete="url"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="go"
      list="url-recent"
      placeholder="Enter a URL, e.g. example.com"
      aria-keyshortcuts="/ Meta+K Control+K"
      class="workspace-url h-11 w-full rounded-full bg-inset pr-28 pl-10 text-body text-fg ring-1 ring-line ring-inset transition-[box-shadow,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none placeholder:text-muted/80 hover:ring-muted/40 focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
    >
    <datalist id="url-recent">
      <option v-for="url in recent" :key="url" :value="url" />
    </datalist>
    <span class="pointer-events-none absolute top-1/2 right-24 hidden -translate-y-1/2 items-center gap-1 transition-opacity duration-[var(--duration-fast)] group-focus-within:opacity-0 lg:flex" aria-hidden="true">
      <kbd class="rounded border border-line px-1.5 font-sans text-caption text-muted">{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
    </span>
    <CoreButton
      type="submit"
      variant="primary"
      size="sm"
      :loading="pending"
      class="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full!"
    >
      Check
    </CoreButton>
  </form>
</template>

<style scoped>
/* Recent lookups still appear as you type; Chrome's extra dropdown arrow would crowd the button. */
.workspace-url::-webkit-calendar-picker-indicator {
  display: none !important;
}
</style>
