<script setup lang="ts">
import { SHORTCUTS } from '../composables/useWorkspaceShortcuts'

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <CoreDialog v-model:open="open" title="Keyboard shortcuts" description="They work anywhere on the page except while typing in a field.">
    <dl class="divide-y divide-line">
      <div v-for="shortcut in SHORTCUTS" :key="shortcut.keys" class="flex items-center justify-between gap-4 py-2.5">
        <dt class="text-callout text-fg">
          {{ shortcut.label }}
        </dt>
        <dd>
          <kbd class="inline-grid min-w-7 place-items-center rounded-control border border-line bg-inset px-1.5 py-0.5 font-sans text-footnote font-medium text-fg">{{ shortcut.keys }}</kbd>
        </dd>
      </div>
    </dl>
  </CoreDialog>
</template>
