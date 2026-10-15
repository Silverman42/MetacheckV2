<script setup lang="ts">
import type { ExtractRendering } from '#layers/core/shared/types/extract'

// FR-1.7: when JavaScript changes the tags, social platforms (which don't run it) won't see
// the rendered version, so say so plainly.
const props = defineProps<{ rendering: ExtractRendering }>()
const changes = computed(() => [...props.rendering.added, ...props.rendering.changed])
const list = (keys: string[]) => keys.slice(0, 6).join(', ') + (keys.length > 6 ? ` and ${keys.length - 6} more` : '')
</script>

<template>
  <Transition name="render-note" appear>
    <div
      v-if="changes.length || rendering.removed.length"
      role="note"
      class="flex items-start gap-2.5 rounded-card bg-warning/10 p-3 text-footnote ring-1 ring-warning/30"
    >
      <Icon name="lucide:triangle-alert" class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <p class="text-fg">
        <span class="font-medium">These tags only exist after JavaScript runs: {{ list(changes) }}.</span>
        <span class="text-muted"> Facebook, X, LinkedIn, Slack and most apps don’t run JavaScript, so they won’t see them. Put the tags in the HTML your server sends.</span>
        <span v-if="rendering.removed.length" class="block text-muted">JavaScript removes: {{ list(rendering.removed) }}.</span>
      </p>
    </div>
    <p v-else class="flex items-center gap-2 text-footnote text-muted">
      <Icon name="lucide:circle-check" class="size-4 text-success" aria-hidden="true" />
      JavaScript doesn’t change the tags, so every platform sees the same ones.
    </p>
  </Transition>
</template>

<style scoped>
.render-note-enter-active {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.render-note-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
