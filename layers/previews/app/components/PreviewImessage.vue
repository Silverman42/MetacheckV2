<script setup lang="ts">
import { buildPreview, getChannel } from '#layers/previews/shared/utils/channels'

const { draft } = useMetaState()
const preview = computed(() => buildPreview(draft.value, getChannel('imessage')))
</script>

<template>
  <div class="mx-auto max-w-[300px] overflow-hidden rounded-[18px] bg-[#e9e9eb] font-[-apple-system,system-ui,sans-serif] dark:bg-[#262628]">
    <PreviewImage v-if="preview.card === 'large'" :src="preview.image" />
    <div class="px-3 py-2">
      <p class="line-clamp-2 text-[15px] leading-5 font-semibold text-black dark:text-white">
        {{ preview.title || preview.domain }}
      </p>
      <p class="text-[13px] text-[#636366] dark:text-[#a1a1a6]">
        {{ preview.displayUrl }}
      </p>
    </div>
  </div>
</template>
