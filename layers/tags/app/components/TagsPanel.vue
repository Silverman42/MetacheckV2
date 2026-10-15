<script setup lang="ts">
import { filterTags, rawTags, type RawTag } from '#layers/tags/shared/utils/raw-tags'

// The Tags view (FR-6.1). Scraped values are rendered as text only (§9.4).
const { source } = useMetaState()
const { show } = useToast()
const query = ref('')

const rows = computed(() => (source.value ? rawTags(source.value) : []))
const visible = computed(() => filterTags(rows.value, query.value))
const counts = computed(() => ({
  meta: rows.value.filter(r => r.kind === 'meta').length,
  link: rows.value.filter(r => r.kind === 'link').length,
  jsonLd: rows.value.filter(r => r.kind === 'json-ld').length,
}))

const copiedKey = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    clearTimeout(timer)
    timer = setTimeout(() => (copiedKey.value = null), 1500)
  }
  catch {
    show({ tone: 'danger', title: 'Couldn’t copy', description: 'Your browser blocked clipboard access.' })
  }
}
onBeforeUnmount(() => clearTimeout(timer))

const rowKey = (row: RawTag, i: number) => `${i}-${row.label}`
const kindIcon = { 'title': 'lucide:heading', 'meta': 'lucide:tag', 'link': 'lucide:link', 'json-ld': 'lucide:braces' } as const
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="sr-only">
      Tags found on the page
    </h2>
    <div v-if="!source" class="rounded-panel border border-dashed border-line px-6 py-12 text-center text-callout text-muted">
      Check a URL to see every tag its page ships.
    </div>
    <template v-else>
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative min-w-0 flex-1 basis-60">
          <Icon name="lucide:search" class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            v-model="query"
            type="search"
            aria-label="Filter tags"
            placeholder="Filter by name or value"
            class="h-11 w-full rounded-control bg-surface pr-3 pl-9 text-body text-fg shadow-card ring-1 ring-line ring-inset transition-[box-shadow] duration-[var(--duration-fast)] outline-none placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-focus md:h-10"
          >
        </div>
        <CoreButton size="sm" icon="lucide:copy" @click="copy(visible.map(r => r.html).join('\n'), 'all')">
          {{ copiedKey === 'all' ? 'Copied' : query ? `Copy ${visible.length}` : 'Copy all' }}
        </CoreButton>
      </div>
      <p class="tabular text-footnote text-muted" aria-live="polite">
        {{ counts.meta }} meta · {{ counts.link }} link · {{ counts.jsonLd }} JSON-LD<template v-if="query">
          · {{ visible.length }} shown
        </template>
      </p>

      <div class="overflow-hidden rounded-panel bg-surface shadow-card">
        <p v-if="!visible.length" class="px-4 py-8 text-center text-callout text-muted">
          No tags match “{{ query }}”.
        </p>
        <TransitionGroup v-else tag="ul" name="tags-row">
          <li
            v-for="(row, i) in visible"
            :key="rowKey(row, i)"
            class="group flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0"
          >
            <Icon :name="kindIcon[row.kind]" class="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <p class="truncate font-mono text-code text-accent-text">
                {{ row.label }}
              </p>
              <p :class="['mt-0.5 text-footnote break-words text-fg', row.kind === 'json-ld' ? 'line-clamp-4 font-mono' : '']">
                {{ row.value || '—' }}
              </p>
            </div>
            <CoreButton
              size="sm"
              variant="ghost"
              :icon="copiedKey === rowKey(row, i) ? 'lucide:check' : 'lucide:copy'"
              icon-only
              class="shrink-0 opacity-100 transition-opacity duration-[var(--duration-fast)] md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
              @click="copy(row.html, rowKey(row, i))"
            >
              Copy {{ row.label }}
            </CoreButton>
          </li>
        </TransitionGroup>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tags-row-enter-active,
.tags-row-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.tags-row-enter-from,
.tags-row-leave-to {
  opacity: 0;
}
</style>
