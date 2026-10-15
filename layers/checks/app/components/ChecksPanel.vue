<script setup lang="ts">
// The Checks view (FR-5.1): errors, warnings and passed checks, with a score per category.
const { mode, summary } = useChecks()

const modeNote = computed(() => ({
  live: 'Checking the page as it is live now.',
  edited: 'Checking your edited tags. Copy them from the Code view to apply the fixes.',
  draft: 'Checking the tags you’re writing.',
}[mode.value]))

const groups = computed(() => [
  { key: 'errors', label: 'Errors', items: summary.value.errors },
  { key: 'warnings', label: 'Warnings', items: summary.value.warnings },
])

const scoreTone = (score: number | null) =>
  score === null ? 'text-muted' : score >= 90 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-danger'
</script>

<template>
  <div class="flex flex-col gap-5">
    <h2 class="sr-only">
      Checks
    </h2>
    <div class="flex flex-wrap items-center gap-3">
      <p class="flex-1 text-callout text-muted">
        <Transition name="checks-fade" mode="out-in">
          <span :key="mode">{{ modeNote }}</span>
        </Transition>
      </p>
      <div class="flex gap-2">
        <div
          v-for="category in (['search', 'social'] as const)"
          :key="category"
          class="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 shadow-card"
        >
          <span class="text-footnote text-muted capitalize">{{ category }}</span>
          <span :class="['tabular text-footnote font-semibold transition-colors duration-[var(--duration-base)]', scoreTone(summary.scores[category])]">
            {{ summary.scores[category] ?? '–' }}<span v-if="summary.scores[category] !== null">%</span>
          </span>
        </div>
      </div>
    </div>

    <Transition name="checks-fade" mode="out-in">
      <div
        v-if="!summary.errors.length && !summary.warnings.length"
        key="clear"
        class="flex items-center gap-3 rounded-panel bg-surface p-5 shadow-card"
      >
        <Icon name="lucide:party-popper" class="size-6 text-success" aria-hidden="true" />
        <p class="text-callout text-fg">
          Everything checks out. Nice work.
        </p>
      </div>
    </Transition>

    <template v-for="group in groups" :key="group.key">
      <section v-if="group.items.length" :aria-labelledby="`checks-${group.key}`" class="overflow-hidden rounded-panel bg-surface shadow-card">
        <h3 :id="`checks-${group.key}`" class="flex items-center gap-2 border-b border-line px-4 py-3 text-headline font-semibold">
          {{ group.label }}
          <span class="tabular rounded-full bg-inset px-2 text-caption text-muted">{{ group.items.length }}</span>
        </h3>
        <TransitionGroup tag="ul" name="checks-row">
          <ChecksRow v-for="result in group.items" :key="result.id" :result="result" />
        </TransitionGroup>
      </section>
    </template>

    <section v-if="summary.passed.length" class="rounded-panel bg-surface px-4 py-2 shadow-card">
      <CoreDisclosure title="Passed" :badge="String(summary.passed.length)">
        <TransitionGroup tag="ul" name="checks-row" class="-mx-4">
          <ChecksRow v-for="result in summary.passed" :key="result.id" :result="result" />
        </TransitionGroup>
      </CoreDisclosure>
    </section>

    <p v-if="summary.skipped.length" class="text-footnote text-muted">
      {{ summary.skipped.length }} {{ summary.skipped.length === 1 ? 'check doesn’t' : 'checks don’t' }} apply yet{{ mode === 'draft' ? ': page checks need a fetched URL.' : '.' }}
    </p>
  </div>
</template>

<style scoped>
.checks-fade-enter-active,
.checks-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}
.checks-fade-enter-from,
.checks-fade-leave-to {
  opacity: 0;
}
.checks-row-enter-active,
.checks-row-move {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.checks-row-leave-active {
  transition: opacity var(--duration-fast) var(--ease-exit);
}
.checks-row-enter-from,
.checks-row-leave-to {
  opacity: 0;
}
</style>
