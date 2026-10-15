<script setup lang="ts">
import { summarizeJsonLd } from '#layers/tags/shared/utils/json-ld'

// Structured data found on the page (JSON-LD, head and body). Values are scraped: text only.
const { source } = useMetaState()
const blocks = computed(() => (source.value?.jsonLd ?? []).map(summarizeJsonLd))
const testUrl = computed(() => (source.value ? encodeURIComponent(source.value.finalUrl) : ''))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-footnote">
      <p class="flex-1 basis-60 text-muted">
        Structured data can earn rich results in Google, such as ratings, prices and breadcrumbs.
      </p>
      <a
        :href="`https://search.google.com/test/rich-results?url=${testUrl}`"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1 font-medium text-accent-text transition-opacity duration-[var(--duration-fast)] hover:opacity-80"
      >
        Rich Results Test <Icon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" /><span class="sr-only">(opens in a new tab)</span>
      </a>
      <a
        :href="`https://validator.schema.org/#url=${testUrl}`"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1 font-medium text-accent-text transition-opacity duration-[var(--duration-fast)] hover:opacity-80"
      >
        Schema validator <Icon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" /><span class="sr-only">(opens in a new tab)</span>
      </a>
    </div>

    <p v-if="!blocks.length" class="rounded-panel border border-dashed border-line px-6 py-10 text-center text-callout text-muted">
      This page has no JSON-LD structured data.
    </p>

    <TransitionGroup tag="div" name="tags-block" class="flex flex-col gap-4">
      <section
        v-for="(block, i) in blocks"
        :key="i"
        :aria-label="`Structured data block ${i + 1}`"
        class="overflow-hidden rounded-panel bg-surface shadow-card"
      >
        <div v-if="block.error" class="flex items-start gap-2.5 border-b border-line p-4">
          <Icon name="lucide:circle-x" class="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p class="text-callout font-medium text-fg">
              Invalid JSON
            </p>
            <p class="text-footnote text-muted">
              {{ block.error }}. Search engines ignore this block.
            </p>
          </div>
        </div>
        <ul v-else class="divide-y divide-line">
          <li v-for="(item, j) in block.entities" :key="j" class="p-4">
            <p class="font-mono text-code text-accent-text">
              {{ item.type }}
            </p>
            <dl v-if="item.fields.length" class="mt-2 grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-1 text-footnote">
              <template v-for="field in item.fields" :key="field.key">
                <dt class="truncate text-muted">
                  {{ field.key }}
                </dt>
                <dd class="break-words text-fg">
                  {{ field.value }}
                </dd>
              </template>
            </dl>
          </li>
        </ul>
        <div class="border-t border-line p-3">
          <CoreDisclosure title="JSON">
            <CoreCodeBlock :code="block.pretty" label="application/ld+json" />
          </CoreDisclosure>
        </div>
      </section>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.tags-block-enter-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}
.tags-block-enter-from {
  opacity: 0;
}
</style>
