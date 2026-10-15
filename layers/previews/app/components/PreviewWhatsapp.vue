<script setup lang="ts">
import { buildPreview, getChannel } from '#layers/previews/shared/utils/channels'

const { draft } = useMetaState()
const preview = computed(() => buildPreview(draft.value, getChannel('whatsapp')))
</script>

<template>
  <div class="rounded-xl bg-[#efeae2] p-4 font-[system-ui,sans-serif] dark:bg-[#0b141a]">
    <div class="ml-auto max-w-[330px] rounded-lg rounded-tr-none bg-[#d9fdd3] p-1 shadow-sm dark:bg-[#005c4b]">
      <div class="overflow-hidden rounded-md bg-[#d1f4cc] dark:bg-[#025144]">
        <PreviewImage v-if="preview.card === 'large'" :src="preview.image" />
        <div class="px-2.5 py-2">
          <p class="line-clamp-2 text-[14px] leading-[19px] font-medium text-[#111b21] dark:text-[#e9edef]">
            {{ preview.title || preview.domain }}
          </p>
          <p v-if="preview.description" class="mt-0.5 line-clamp-2 text-[13px] leading-[17px] text-[#4f5f68] dark:text-[#b0bec5]">
            {{ preview.description }}
          </p>
          <p class="mt-0.5 text-[12px] text-[#4f5f68] dark:text-[#b0bec5]">
            {{ preview.displayUrl }}
          </p>
        </div>
      </div>
      <p class="px-1.5 pt-1 text-[14px] text-[#027eb5] dark:text-[#53bdeb]">
        https://{{ preview.domain }}
      </p>
    </div>
  </div>
</template>
