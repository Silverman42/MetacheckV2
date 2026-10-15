<script setup lang="ts">
// v1 mark, redrawn inline so it can follow the theme (§9.10.6: light-mode variant keeps contrast on canvas).
defineProps<{ wordmark?: boolean }>()
const gid = useId()
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <svg viewBox="21 32 360 242" class="h-6 w-auto" aria-hidden="true">
      <defs>
        <linearGradient :id="gid" x1="21" y1="153" x2="381" y2="153" gradientUnits="userSpaceOnUse">
          <stop offset="0" class="[stop-color:#0d9488] dark:[stop-color:#09d9c1]" />
          <stop offset="1" class="[stop-color:#115e59] dark:[stop-color:#0e998b]" />
        </linearGradient>
      </defs>
      <path
        :fill="`url(#${gid})`"
        d="M21 32l360 0 0 242 -49 0c0,-1 0,-3 0,-5 0,-73 -59,-131 -131,-131 -72,0 -131,58 -131,131 0,2 0,4 0,5l-49 0 0 -242zm263 242l-166 0c0,-1 0,-3 0,-5 0,-46 37,-84 83,-84 46,0 83,38 83,84 0,2 0,4 0,5z"
      />
    </svg>
    <span v-if="wordmark" class="text-headline font-semibold tracking-tight text-fg">MetaCheck</span>
  </span>
</template>
