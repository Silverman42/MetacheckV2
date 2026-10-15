<script setup lang="ts">
// FR-8.2 / §9.10.6: bottom-centre on mobile, bottom-right on desktop. Announced politely;
// errors use role="alert".
const { toasts, dismiss } = useToast()

const tones = {
  neutral: { icon: 'lucide:info', class: 'text-muted' },
  success: { icon: 'lucide:circle-check', class: 'text-success' },
  warning: { icon: 'lucide:triangle-alert', class: 'text-warning' },
  danger: { icon: 'lucide:circle-x', class: 'text-danger' },
} as const
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:items-end md:p-6"
    aria-live="polite"
  >
    <TransitionGroup name="core-toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :role="toast.tone === 'danger' ? 'alert' : 'status'"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card bg-raised p-4 shadow-float"
      >
        <Icon :name="tones[toast.tone].icon" :class="['mt-0.5 size-5 shrink-0', tones[toast.tone].class]" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <p class="text-callout font-medium text-fg">
            {{ toast.title }}
          </p>
          <p v-if="toast.description" class="mt-0.5 text-footnote text-muted">
            {{ toast.description }}
          </p>
          <button
            v-if="toast.action"
            type="button"
            class="mt-2 text-footnote font-medium text-accent-text transition-opacity duration-[var(--duration-fast)] hover:opacity-80"
            @click="toast.action.run(); dismiss(toast.id)"
          >
            {{ toast.action.label }}
          </button>
        </div>
        <CoreButton size="sm" variant="ghost" icon="lucide:x" icon-only class="-m-1.5" @click="dismiss(toast.id)">
          Dismiss
        </CoreButton>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.core-toast-enter-active {
  transition: opacity var(--duration-slow) var(--ease-standard), transform var(--duration-slow) var(--ease-standard);
}
.core-toast-leave-active {
  transition: opacity var(--duration-fast) var(--ease-exit), transform var(--duration-fast) var(--ease-exit);
}
.core-toast-move {
  transition: transform var(--duration-base) var(--ease-standard);
}
.core-toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
.core-toast-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
