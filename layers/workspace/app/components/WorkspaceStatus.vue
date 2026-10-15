<script setup lang="ts">
import { EXTRACT_ERROR_TITLES, RETRYABLE_EXTRACT_ERRORS } from '#layers/extract/shared/utils/extract-errors'

// What the workspace is showing: the fetched page (FR-1.4, FR-2.8), the demo, scratch mode,
// a lookup in progress, or an error with Retry (FR-1.3).
const emit = defineEmits<{ retry: [], refresh: [], scratch: [], pick: [url: string] }>()
const { mode, recent, clearRecent } = useWorkspace()
const { pending, error } = useExtract()
const { source } = useMetaState()

const redirectsOpen = ref(false)
const display = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
</script>

<template>
  <div aria-live="polite">
    <Transition name="status-swap" mode="out-in">
      <div v-if="pending" key="pending" class="flex items-center gap-2 text-callout text-muted">
        <Icon name="lucide:loader-circle" class="size-4 animate-spin" aria-hidden="true" />
        Fetching the page…
      </div>

      <div v-else-if="error" key="error" role="alert" class="flex flex-wrap items-start gap-3 rounded-card bg-danger/10 p-4 ring-1 ring-danger/30">
        <Icon name="lucide:circle-x" class="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
        <div class="min-w-0 flex-1 basis-60">
          <p class="text-callout font-medium text-fg">
            {{ EXTRACT_ERROR_TITLES[error.code] }}
          </p>
          <p class="text-footnote text-muted">
            {{ error.message }}
          </p>
        </div>
        <div class="flex gap-2">
          <CoreButton v-if="RETRYABLE_EXTRACT_ERRORS.includes(error.code)" size="sm" icon="lucide:rotate-cw" @click="emit('retry')">
            Retry
          </CoreButton>
          <CoreButton size="sm" variant="ghost" @click="emit('scratch')">
            Start from scratch
          </CoreButton>
        </div>
      </div>

      <div v-else-if="mode === 'page' && source" key="page" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-footnote text-muted">
        <span class="inline-flex min-w-0 items-center gap-1.5">
          <Icon name="lucide:globe" class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate font-medium text-fg">{{ display(source.finalUrl) }}</span>
        </span>
        <span class="tabular">HTTP {{ source.status }}</span>
        <span class="tabular">{{ source.timingMs }} ms</span>
        <button
          v-if="source.redirects.length"
          type="button"
          :aria-expanded="redirectsOpen"
          class="inline-flex items-center gap-1 rounded-control text-accent-text transition-opacity duration-[var(--duration-fast)] hover:opacity-80"
          @click="redirectsOpen = !redirectsOpen"
        >
          {{ source.redirects.length }} {{ source.redirects.length === 1 ? 'redirect' : 'redirects' }}
          <Icon name="lucide:chevron-down" :class="['size-3.5 transition-transform duration-[var(--duration-base)]', redirectsOpen && 'rotate-180']" aria-hidden="true" />
        </button>
        <span class="flex-1" />
        <CoreButton size="sm" variant="ghost" icon="lucide:refresh-cw" @click="emit('refresh')">
          Refresh
        </CoreButton>
        <Transition name="status-swap">
          <ol v-if="redirectsOpen" class="basis-full space-y-1 rounded-card bg-inset p-3 font-mono text-caption">
            <li v-for="hop in source.redirects" :key="hop.url" class="flex gap-2">
              <span class="tabular text-warning">{{ hop.status }}</span>
              <span class="min-w-0 break-all text-fg">{{ hop.url }}</span>
            </li>
            <li class="flex gap-2">
              <span class="tabular text-success">{{ source.status }}</span>
              <span class="min-w-0 break-all text-fg">{{ source.finalUrl }}</span>
            </li>
          </ol>
        </Transition>
      </div>

      <div v-else key="intro" class="flex flex-wrap items-center gap-x-3 gap-y-2 text-callout text-muted">
        <p class="flex-1 basis-72">
          <template v-if="mode === 'demo'">
            You’re looking at MetaCheck’s own tags. Enter a URL above to check yours.
          </template>
          <template v-else>
            Writing tags from scratch. Fill in the editor and copy the code.
          </template>
        </p>
        <CoreButton v-if="mode === 'demo'" size="sm" variant="ghost" icon="lucide:file-plus" @click="emit('scratch')">
          Start from scratch
        </CoreButton>
        <div v-if="recent.length" class="flex basis-full flex-wrap items-center gap-1.5">
          <span class="text-footnote">Recent:</span>
          <button
            v-for="url in recent.slice(0, 5)"
            :key="url"
            type="button"
            class="max-w-56 truncate rounded-full bg-surface px-2.5 py-1 text-footnote text-fg shadow-card transition-colors duration-[var(--duration-fast)] hover:bg-inset"
            @click="emit('pick', url)"
          >
            {{ display(url) }}
          </button>
          <button
            type="button"
            class="rounded-control px-1.5 py-1 text-footnote text-muted transition-colors duration-[var(--duration-fast)] hover:text-fg"
            @click="clearRecent"
          >
            Clear
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.status-swap-enter-active,
.status-swap-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.status-swap-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.status-swap-leave-to {
  opacity: 0;
}
</style>
