<script setup lang="ts">
import { checkImageUrl, formatBytes } from '#layers/editor/shared/utils/field-guidance'

// FR-3.4: URL-only image with a thumbnail, load state and validation.
const props = defineProps<{ label: string, placeholder?: string, hint?: string }>()
const model = defineModel<string>({ default: '' })

const { source } = useMetaState()
const check = computed(() => checkImageUrl(model.value))
const url = computed(() => (check.value.state === 'ok' ? check.value.url : null))

type LoadState = 'idle' | 'loading' | 'loaded' | 'failed'
const load = ref<LoadState>('idle')
const natural = ref<{ width: number, height: number } | null>(null)
let loadedFor: string | null = null

// Debounce so typing a URL doesn't fire a request per keystroke.
let timer: ReturnType<typeof setTimeout> | undefined
const shown = ref<string | null>(null)
watch(url, (next) => {
  clearTimeout(timer)
  if (next !== loadedFor) natural.value = null
  if (!next) {
    shown.value = null
    load.value = 'idle'
    return
  }
  load.value = 'loading'
  timer = setTimeout(() => {
    // Back to an image that is already on screen: no new load event will fire.
    if (shown.value === next && loadedFor === next) load.value = 'loaded'
    shown.value = next
  }, 350)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))

function onLoad(event: Event) {
  const img = event.target as HTMLImageElement
  natural.value = { width: img.naturalWidth, height: img.naturalHeight }
  loadedFor = shown.value
  load.value = 'loaded'
}

// What the server learned about this image when the page was fetched (type, bytes).
const probe = computed(() => source.value?.images.find(i => i.url === url.value) ?? null)

const details = computed(() => {
  const parts: string[] = []
  const width = natural.value?.width ?? probe.value?.width
  const height = natural.value?.height ?? probe.value?.height
  if (width && height) parts.push(`${width} × ${height}`)
  if (probe.value?.contentType) parts.push(probe.value.contentType.replace('image/', '').toUpperCase())
  if (probe.value?.bytes) parts.push(formatBytes(probe.value.bytes))
  return parts.join(' · ')
})

const error = computed(() => {
  if (check.value.state === 'invalid') return check.value.message
  if (load.value === 'failed') return 'This image didn’t load. Check that the URL is public and points to an image.'
  return ''
})

const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-callout font-medium text-fg">{{ props.label }}</label>
    <div class="flex items-stretch gap-2">
      <input
        :id="id"
        v-model="model"
        type="url"
        inputmode="url"
        autocomplete="off"
        spellcheck="false"
        :placeholder="placeholder ?? 'https://example.com/og-image.jpg'"
        :aria-invalid="!!error || undefined"
        :aria-describedby="`${id}-status`"
        class="h-11 min-w-0 flex-1 rounded-control bg-inset px-3 text-body text-fg ring-1 ring-line ring-inset transition-[box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none placeholder:text-muted/70 hover:ring-muted/40 focus-visible:ring-2 focus-visible:ring-focus aria-invalid:ring-danger md:h-10"
      >
      <div class="relative h-11 w-[5.25rem] shrink-0 overflow-hidden rounded-control bg-inset ring-1 ring-line ring-inset md:h-10" aria-hidden="true">
        <Transition name="editor-fade">
          <CoreSkeleton v-if="load === 'loading'" class="absolute inset-0 rounded-none" />
        </Transition>
        <img
          v-if="shown"
          :key="shown"
          :src="shown"
          alt=""
          referrerpolicy="no-referrer"
          decoding="async"
          fetchpriority="low"
          :class="['absolute inset-0 size-full object-cover transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]', load === 'loaded' ? 'opacity-100' : 'opacity-0']"
          @load="onLoad"
          @error="loadedFor = null; load = 'failed'"
        >
        <Transition name="editor-fade">
          <Icon v-if="load === 'failed' || load === 'idle'" :name="load === 'failed' ? 'lucide:image-off' : 'lucide:image'" class="absolute inset-0 m-auto size-4 text-muted" />
        </Transition>
      </div>
    </div>
    <div :id="`${id}-status`" aria-live="polite" class="min-h-4">
      <Transition name="editor-fade" mode="out-in">
        <p v-if="error" key="error" class="flex items-start gap-1.5 text-footnote text-danger">
          <Icon name="lucide:circle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {{ error }}
        </p>
        <p v-else-if="load === 'loaded' && details" key="details" class="tabular text-caption text-muted">
          {{ details }}
        </p>
        <p v-else-if="hint" key="hint" class="text-caption text-muted">
          {{ hint }}
        </p>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.editor-fade-enter-active,
.editor-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}
.editor-fade-enter-from,
.editor-fade-leave-to {
  opacity: 0;
}
</style>
