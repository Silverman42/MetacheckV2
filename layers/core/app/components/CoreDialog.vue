<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from 'reka-ui'

// Modal dialog: focus trapped, Escape closes, focus returns to the trigger.
defineProps<{ title: string, description?: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="core-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
      <DialogContent
        class="core-dialog fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel bg-raised p-5 shadow-float md:p-6"
      >
        <div class="mb-4 flex items-start gap-3">
          <div class="flex-1">
            <DialogTitle class="text-headline font-semibold text-fg">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="mt-1 text-footnote text-muted">
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose as-child>
            <CoreButton size="sm" variant="ghost" icon="lucide:x" icon-only class="-m-1.5">
              Close
            </CoreButton>
          </DialogClose>
        </div>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style>
.core-overlay[data-state='open'] { animation: core-fade-in var(--duration-base) var(--ease-standard); }
.core-overlay[data-state='closed'] { animation: core-fade-out var(--duration-fast) var(--ease-exit); }
.core-dialog[data-state='open'] { animation: core-dialog-in var(--duration-slow) var(--ease-standard); }
.core-dialog[data-state='closed'] { animation: core-dialog-out var(--duration-fast) var(--ease-exit); }
@keyframes core-fade-in { from { opacity: 0; } }
@keyframes core-fade-out { to { opacity: 0; } }
@keyframes core-dialog-in { from { opacity: 0; transform: translate(-50%, -48%) scale(0.98); } }
@keyframes core-dialog-out { to { opacity: 0; transform: translate(-50%, -50%) scale(0.98); } }
</style>
