<script setup lang="ts">
// §9.10.6 skeleton: shaped like what it stands in for; shimmer stops under reduced motion.
defineProps<{ rounded?: 'control' | 'card' | 'full' }>()
</script>

<template>
  <div
    aria-hidden="true"
    :class="[
      'animate-shimmer bg-[length:200%_100%]',
      'bg-[linear-gradient(90deg,var(--color-inset)_0%,color-mix(in_srgb,var(--color-inset)_50%,var(--color-surface))_50%,var(--color-inset)_100%)]',
      rounded === 'full' ? 'rounded-full' : rounded === 'card' ? 'rounded-card' : 'rounded-control',
    ]"
  />
</template>
