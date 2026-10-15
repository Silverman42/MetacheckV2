<script setup lang="ts">
import { buildPreview, getChannel } from '#layers/previews/shared/utils/channels'

const { draft } = useMetaState()
const preview = computed(() => buildPreview(draft.value, getChannel('facebook')))
</script>

<template>
  <div class="mx-auto max-w-[500px] overflow-hidden rounded-lg bg-white font-[Helvetica,Arial,sans-serif] ring-1 ring-[#dddfe2] transition-colors duration-[var(--duration-base)] dark:bg-[#242526] dark:ring-[#3e4042]">
    <PreviewImage v-if="preview.card === 'large'" :src="preview.image" />
    <div class="border-t border-[#dddfe2] bg-[#f0f2f5] px-3 py-2.5 dark:border-[#3e4042] dark:bg-[#3a3b3c]">
      <p class="truncate text-[12px] text-[#65676b] dark:text-[#b0b3b8]">
        {{ preview.displayUrl }}
      </p>
      <p class="mt-0.5 line-clamp-2 text-[16px] leading-5 font-semibold text-[#050505] dark:text-[#e4e6eb]">
        {{ preview.title || preview.domain }}
      </p>
      <p v-if="preview.description" class="mt-0.5 line-clamp-1 text-[14px] leading-5 text-[#65676b] dark:text-[#b0b3b8]">
        {{ preview.description }}
      </p>
    </div>
  </div>
</template>
