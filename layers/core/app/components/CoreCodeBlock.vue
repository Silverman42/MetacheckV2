<script setup lang="ts">
// §9.10.6 code block shell. Highlighting (Shiki) is added by the output layer through the default slot;
// without it the plain code is shown. Copy confirms for 1.5 s and announces through a live region.
const props = defineProps<{ code: string, label?: string }>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
const { show } = useToast()

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1500)
  }
  catch {
    show({ tone: 'danger', title: 'Couldn’t copy', description: 'Your browser blocked clipboard access. Select the code and copy it manually.' })
  }
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="group relative overflow-hidden rounded-card bg-inset ring-1 ring-line">
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
      <span class="text-footnote text-muted">{{ label ?? 'Code' }}</span>
      <CoreButton
        size="sm"
        variant="ghost"
        :icon="copied ? 'lucide:check' : 'lucide:copy'"
        @click="copy"
      >
        <Transition name="core-swap" mode="out-in">
          <span :key="String(copied)">{{ copied ? 'Copied' : 'Copy' }}</span>
        </Transition>
      </CoreButton>
    </div>
    <div class="overflow-x-auto p-4 font-mono text-code text-fg">
      <slot><pre class="m-0"><code>{{ code }}</code></pre></slot>
    </div>
    <span class="sr-only" aria-live="polite">{{ copied ? 'Copied to clipboard' : '' }}</span>
  </div>
</template>

<style scoped>
.core-swap-enter-active,
.core-swap-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.core-swap-enter-from,
.core-swap-leave-to {
  opacity: 0;
}
</style>
