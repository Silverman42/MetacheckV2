<script setup lang="ts">
import { displayDomain } from '#layers/core/shared/utils/meta-tags'
import { EXTRACT_ERROR_TITLES, RETRYABLE_EXTRACT_ERRORS } from '#layers/extract/shared/utils/extract-errors'
import { demoValues } from '#layers/workspace/shared/utils/demo'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const requestUrl = useRequestURL()
const meta = useMetaState()
const { extract, retry, pending, error } = useExtract()
const { view, mode, inspectorOpen, loadRecent, remember } = useWorkspace()
const { summary } = useChecks()
const { show } = useToast()
const { request: focusRequest } = useFieldFocus()

const queryUrl = () => (typeof route.query.url === 'string' ? route.query.url : '')
const urlInput = ref(queryUrl())

async function lookup(input: string, options: { refresh?: boolean, updateUrl?: boolean } = {}) {
  const result = await extract(input, options)
  if (result) {
    mode.value = 'page'
    urlInput.value = result.requestedUrl
    if (import.meta.client) remember(result.requestedUrl)
    if (options.updateUrl !== false && queryUrl() !== result.requestedUrl) {
      await router.replace({ query: { url: result.requestedUrl } })
    }
  }
  else if (error.value && import.meta.client) {
    // FR-8.2: errors also surface as a toast, with Retry where it can help.
    show({
      tone: 'danger',
      title: EXTRACT_ERROR_TITLES[error.value.code],
      description: error.value.message,
      duration: RETRYABLE_EXTRACT_ERRORS.includes(error.value.code) ? 0 : 6000,
      action: RETRYABLE_EXTRACT_ERRORS.includes(error.value.code) ? { label: 'Retry', run: () => retry() } : undefined,
    })
  }
  return result
}

function startScratch() {
  meta.state.value = { fetched: null, draft: createEmptyMeta(), source: null }
  mode.value = 'scratch'
  urlInput.value = ''
  if (route.query.url) router.replace({ query: {} })
  if (import.meta.client && matchMedia('(max-width: 767px)').matches) view.value = 'edit'
  else inspectorOpen.value = true
}

// FR-1.2: /?url= loads on entry, on the server too, so shared links render with results.
// FR-1.5: otherwise show MetaCheck's own tags.
if (queryUrl() && !meta.source.value) await lookup(queryUrl(), { updateUrl: false })
else if (!queryUrl() && mode.value === 'demo' && !meta.fetched.value) meta.load(demoValues(requestUrl.origin))

// Back/forward between lookups.
watch(() => route.query.url, (url) => {
  if (typeof url === 'string' && url && url !== meta.source.value?.requestedUrl) lookup(url, { updateUrl: false })
})

// Phones show one view at a time; "Edit" exists only there. Tablets use the inspector instead.
onMounted(() => {
  loadRecent()
  const wide = matchMedia('(min-width: 768px)')
  const sync = () => {
    if (wide.matches && view.value === 'edit') {
      view.value = 'preview'
      inspectorOpen.value = true
    }
  }
  sync()
  wide.addEventListener('change', sync)
  onBeforeUnmount(() => wide.removeEventListener('change', sync))
})

// "Edit in MetaCheck" from a check: make sure the editor is on screen.
watch(focusRequest, (req) => {
  if (!req || !import.meta.client) return
  if (matchMedia('(max-width: 767px)').matches) view.value = 'edit'
  else inspectorOpen.value = true
})

const views = computed(() => [
  { value: 'edit' as const, label: 'Edit', icon: 'lucide:pencil', class: 'md:hidden' },
  { value: 'preview' as const, label: 'Preview', icon: 'lucide:eye' },
  { value: 'checks' as const, label: 'Checks', icon: 'lucide:list-checks', badge: summary.value.errors.length || undefined },
  { value: 'tags' as const, label: 'Tags', icon: 'lucide:tags' },
  { value: 'code' as const, label: 'Code', icon: 'lucide:code' },
])
const contentView = computed(() => (view.value === 'edit' ? 'preview' : view.value))

// MetaCheck's own SEO stays on; a checked page gets a descriptive title.
useSeoMeta({
  title: () => (mode.value === 'page' && meta.source.value ? `Link preview for ${displayDomain(meta.source.value.finalUrl)}` : ''),
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header>
      <WorkspaceUrlField v-model="urlInput" :pending="pending" @submit="lookup($event)" />
    </template>

    <div class="mx-auto max-w-screen-2xl px-4 py-5 md:px-6 md:py-6">
      <h1 class="sr-only">
        MetaCheck: preview, check and fix your link’s meta tags
      </h1>
      <WorkspaceStatus
        class="mb-5"
        @retry="retry()"
        @refresh="retry({ refresh: true })"
        @scratch="startScratch"
        @pick="lookup($event)"
      />

      <!-- Phones: the switcher sits above everything, so it stays reachable from the Edit view. -->
      <div class="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] md:hidden">
        <CoreSegmentedControl v-model="view" :options="views" label="View" />
      </div>

      <div
        :class="[
          'md:grid md:gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:gap-8',
          inspectorOpen ? 'md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]' : 'md:grid-cols-1',
        ]"
      >
        <aside
          aria-label="Editor"
          :class="[
            'workspace-editor xl:block',
            view === 'edit' ? 'max-md:block' : 'max-md:hidden',
            inspectorOpen ? 'md:block' : 'md:hidden',
          ]"
        >
          <div class="rounded-panel bg-surface p-5 shadow-card md:sticky md:top-20 md:max-h-[calc(100dvh-6rem)] md:overflow-y-auto">
            <EditorPanel />
          </div>
        </aside>

        <div :class="['min-w-0', view === 'edit' && 'max-md:hidden']">
          <div class="mb-5 hidden items-center gap-2 md:flex">
            <CoreButton
              class="hidden md:inline-flex xl:hidden"
              size="sm"
              :variant="inspectorOpen ? 'secondary' : 'ghost'"
              :icon="inspectorOpen ? 'lucide:panel-left-close' : 'lucide:panel-left-open'"
              :aria-pressed="inspectorOpen"
              @click="inspectorOpen = !inspectorOpen"
            >
              Editor
            </CoreButton>
            <div class="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
              <CoreSegmentedControl v-model="view" :options="views" label="View" />
            </div>
          </div>

          <div :class="['transition-opacity duration-[var(--duration-base)]', pending && 'pointer-events-none opacity-60']" :aria-busy="pending">
            <Transition name="workspace-view" mode="out-in">
              <KeepAlive>
                <PreviewPanel v-if="contentView === 'preview'" key="preview" />
                <LazyChecksPanel v-else-if="contentView === 'checks'" key="checks" />
                <LazyTagsPanel v-else-if="contentView === 'tags'" key="tags" />
                <LazyOutputPanel v-else key="code" />
              </KeepAlive>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.workspace-view-enter-active,
.workspace-view-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.workspace-view-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.workspace-view-leave-to {
  opacity: 0;
}
</style>
