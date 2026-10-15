<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'

// A labelled section that opens and closes with a height animation.
defineProps<{ title: string, description?: string, badge?: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <CollapsibleRoot v-model:open="open">
    <CollapsibleTrigger
      class="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-control px-2 py-2 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-inset"
    >
      <Icon
        name="lucide:chevron-right"
        class="size-4 shrink-0 text-muted transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] group-data-[state=open]:rotate-90"
        aria-hidden="true"
      />
      <span class="flex-1">
        <span class="block text-callout font-medium text-fg">{{ title }}</span>
        <span v-if="description" class="block text-caption text-muted">{{ description }}</span>
      </span>
      <span v-if="badge" class="tabular rounded-full bg-inset px-2 text-caption text-muted">{{ badge }}</span>
    </CollapsibleTrigger>
    <CollapsibleContent class="core-collapsible overflow-hidden">
      <div class="pt-3">
        <slot />
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>

<style scoped>
.core-collapsible[data-state='open'] {
  animation: core-open var(--duration-slow) var(--ease-standard);
}
.core-collapsible[data-state='closed'] {
  animation: core-close var(--duration-base) var(--ease-exit);
}
@keyframes core-open {
  from { height: 0; opacity: 0; }
  to { height: var(--reka-collapsible-content-height); opacity: 1; }
}
@keyframes core-close {
  from { height: var(--reka-collapsible-content-height); opacity: 1; }
  to { height: 0; opacity: 0; }
}
</style>
