<script setup lang="ts">
// Placeholder "/" until the workspace layer ships (PRD §12, phase 1). It doubles as a review page
// for the core primitives in both themes. Delete this file when layers/workspace adds its index page.
useSeoMeta({ title: '' })

type View = 'preview' | 'checks' | 'tags' | 'code'
const view = ref<View>('preview')
const views = [
  { value: 'preview' as const, label: 'Preview', icon: 'lucide:eye' },
  { value: 'checks' as const, label: 'Checks', icon: 'lucide:list-checks', badge: 3 },
  { value: 'tags' as const, label: 'Tags', icon: 'lucide:tags' },
  { value: 'code' as const, label: 'Code', icon: 'lucide:code' },
]

const title = ref('MetaCheck — preview and fix your link’s meta tags')
const description = ref('')
const image = ref('https://metacheckui.netlify.app/og-image.png')
const imageError = computed(() => (image.value && !/^https?:\/\//.test(image.value) ? 'Use an absolute http(s) URL.' : ''))

const channels = reactive({ google: true, facebook: true, x: false, linkedin: false })
const loading = ref(false)
const { show } = useToast()

function simulate() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    show({ tone: 'success', title: 'Metadata loaded', description: 'This is how a confirmation toast looks.' })
  }, 900)
}

const sample = `<title>MetaCheck</title>
<meta name="description" content="Preview and fix your link’s meta tags.">
<meta property="og:image" content="https://metacheckui.netlify.app/og-image.png">`
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-16">
    <section class="animate-fade-in">
      <p class="text-footnote font-medium text-accent-text">
        MetaCheck v2 · core layer
      </p>
      <h1 class="mt-2 text-display font-bold text-fg">
        See your link before anyone else does.
      </h1>
      <p class="mt-3 max-w-prose text-body text-muted">
        The building blocks every module uses. The workspace that fetches, edits and previews a URL replaces this page in the next phase.
      </p>
    </section>

    <div class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <section aria-labelledby="meta-heading" class="flex flex-col gap-5 rounded-panel bg-surface p-5 shadow-card md:p-6">
        <h2 id="meta-heading" class="text-headline font-semibold">
          Metadata
        </h2>
        <CoreTextField v-model="title" label="Title" :range="[30, 60]" />
        <CoreTextField v-model="description" label="Description" multiline :range="[110, 160]" placeholder="Describe the page in a sentence or two" />
        <CoreTextField v-model="image" label="Image URL" type="url" :error="imageError" hint="Absolute URL, ideally 1200 × 630." />
        <div class="flex gap-2">
          <CoreButton variant="primary" icon="lucide:search" :loading="loading" @click="simulate">
            Check
          </CoreButton>
          <CoreButton variant="ghost" icon="lucide:rotate-ccw" @click="show({ tone: 'danger', title: 'Couldn’t reach that page', description: 'The request timed out after 8 seconds.', duration: 0, action: { label: 'Retry', run: simulate } })">
            Show error
          </CoreButton>
        </div>
      </section>

      <section aria-labelledby="views-heading" class="flex min-w-0 flex-col gap-5">
        <h2 id="views-heading" class="sr-only">
          Views
        </h2>
        <div class="overflow-x-auto">
          <CoreSegmentedControl v-model="view" :options="views" label="View" />
        </div>
        <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="group" aria-label="Channels">
          <CoreChip v-model="channels.google" icon="simple-icons:google">
            Google
          </CoreChip>
          <CoreChip v-model="channels.facebook" icon="simple-icons:facebook">
            Facebook
          </CoreChip>
          <CoreChip v-model="channels.x" icon="simple-icons:x">
            X
          </CoreChip>
          <CoreChip v-model="channels.linkedin" icon="simple-icons:linkedin">
            LinkedIn
          </CoreChip>
        </div>

        <Transition name="core-view" mode="out-in">
          <div :key="loading ? 'loading' : view" class="rounded-panel bg-surface p-5 shadow-card md:p-6">
            <div v-if="loading" class="flex flex-col gap-3" role="status" aria-label="Loading preview">
              <CoreSkeleton rounded="card" class="aspect-[1.91/1] w-full" />
              <CoreSkeleton class="h-4 w-3/4" />
              <CoreSkeleton class="h-4 w-1/2" />
            </div>
            <CoreCodeBlock v-else-if="view === 'code'" :code="sample" label="HTML" />
            <div v-else class="flex flex-col items-center gap-2 py-10 text-center">
              <Icon :name="views.find(v => v.value === view)!.icon" class="size-6 text-muted" aria-hidden="true" />
              <p class="text-callout text-muted">
                The {{ view }} view arrives with its layer.
              </p>
            </div>
          </div>
        </Transition>
      </section>
    </div>
  </div>
</template>

<style scoped>
.core-view-enter-active,
.core-view-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.core-view-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.core-view-leave-to {
  opacity: 0;
}
</style>
