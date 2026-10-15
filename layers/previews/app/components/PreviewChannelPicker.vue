<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { CHANNELS } from '#layers/previews/shared/utils/channels'

// FR-4.5: labelled channel toggles; v1's six as chips, the rest in "More".
const { toggle, isOn, selected } = usePreviewChannels()
const core = CHANNELS.filter(c => c.tier === 'core')
const more = CHANNELS.filter(c => c.tier === 'more')
const moreOn = computed(() => more.filter(c => selected.value.includes(c.id)).length)
</script>

<template>
  <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Channels">
    <CoreChip
      v-for="channel in core"
      :key="channel.id"
      :model-value="isOn(channel.id)"
      :icon="channel.icon"
      @update:model-value="toggle(channel.id, $event)"
    >
      {{ channel.label }}
    </CoreChip>
    <PopoverRoot>
      <PopoverTrigger
        class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3.5 text-callout font-medium text-muted ring-1 ring-line ring-inset transition-[background-color,color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-inset hover:text-fg md:h-9"
      >
        More
        <span v-if="moreOn" class="tabular rounded-full bg-accent px-1.5 text-caption text-on-accent">{{ moreOn }}</span>
        <Icon name="lucide:chevron-down" class="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="end"
          :side-offset="8"
          class="preview-popover z-50 w-60 rounded-card bg-raised p-1.5 shadow-float"
        >
          <p class="px-2.5 pt-1 pb-2 text-caption text-muted">
            More channels
          </p>
          <button
            v-for="channel in more"
            :key="channel.id"
            type="button"
            :aria-pressed="isOn(channel.id)"
            class="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-left text-callout text-fg transition-colors duration-[var(--duration-fast)] hover:bg-inset"
            @click="toggle(channel.id)"
          >
            <Icon :name="channel.icon" class="size-4 text-muted" aria-hidden="true" />
            <span class="flex-1">{{ channel.label }}</span>
            <Icon
              name="lucide:check"
              :class="['size-4 text-accent-text transition-opacity duration-[var(--duration-fast)]', isOn(channel.id) ? 'opacity-100' : 'opacity-0']"
              aria-hidden="true"
            />
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>

<style>
.preview-popover[data-state='open'] {
  animation: preview-pop-in var(--duration-base) var(--ease-standard);
}
.preview-popover[data-state='closed'] {
  animation: preview-pop-out var(--duration-fast) var(--ease-exit);
}
@keyframes preview-pop-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
}
@keyframes preview-pop-out {
  to { opacity: 0; transform: scale(0.98); }
}
</style>
