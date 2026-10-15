<script setup lang="ts">
import type { Grade } from '#layers/checks/shared/utils/rules'

// FR-5.4: overall score as a ring, with a plain-words grade.
const props = defineProps<{ value: number | null, grade: Grade | null }>()
const radius = 26
const circumference = 2 * Math.PI * radius
const offset = computed(() => circumference * (1 - (props.value ?? 0) / 100))
const tone = computed(() => ({ good: 'text-success', fair: 'text-warning', poor: 'text-danger' }[props.grade ?? 'fair']))
const label = computed(() => ({ good: 'Looking good', fair: 'Needs some work', poor: 'Needs work' }[props.grade ?? 'fair']))
</script>

<template>
  <div class="flex items-center gap-4" role="img" :aria-label="value === null ? 'No score yet' : `Score ${value} out of 100: ${label}`">
    <svg viewBox="0 0 64 64" class="size-16 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" :r="radius" fill="none" stroke-width="6" class="stroke-inset" />
      <circle
        cx="32"
        cy="32"
        :r="radius"
        fill="none"
        stroke-width="6"
        stroke-linecap="round"
        stroke="currentColor"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        :class="['transition-[stroke-dashoffset,color] duration-[var(--duration-slow)] ease-[var(--ease-standard)]', tone]"
      />
    </svg>
    <div aria-hidden="true">
      <p :class="['tabular text-title font-semibold transition-colors duration-[var(--duration-base)]', tone]">
        {{ value ?? '–' }}
      </p>
      <p class="text-footnote text-muted">
        {{ value === null ? 'No score yet' : label }}
      </p>
    </div>
  </div>
</template>
