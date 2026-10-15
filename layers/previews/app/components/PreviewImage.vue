<script setup lang="ts">
// A preview image that behaves like the platforms: shimmer while loading, and gone (not a broken
// icon) when it fails to load (FR-4.7).
const props = defineProps<{ src: string, aspect?: string, alt?: string }>()
const state = ref<'loading' | 'loaded' | 'failed'>('loading')
watch(() => props.src, () => (state.value = 'loading'))
</script>

<template>
  <Transition name="preview-image">
    <div v-if="state !== 'failed'" class="relative overflow-hidden bg-black/5 dark:bg-white/5" :style="{ aspectRatio: aspect ?? '1.91 / 1' }">
      <CoreSkeleton v-if="state === 'loading'" class="absolute inset-0 rounded-none" />
      <img
        :key="src"
        :src="src"
        :alt="alt ?? ''"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        referrerpolicy="no-referrer"
        :class="['absolute inset-0 size-full object-cover transition-opacity duration-[var(--duration-base)] ease-[var(--ease-standard)]', state === 'loaded' ? 'opacity-100' : 'opacity-0']"
        @load="state = 'loaded'"
        @error="state = 'failed'"
      >
    </div>
  </Transition>
</template>

<style scoped>
.preview-image-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}
.preview-image-leave-to {
  opacity: 0;
}
</style>
