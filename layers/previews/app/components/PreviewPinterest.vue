<script setup lang="ts">
import { buildPreview, getChannel } from '#layers/previews/shared/utils/channels'

const { draft } = useMetaState()
const preview = computed(() => buildPreview(draft.value, getChannel('pinterest')))
</script>

<template>
  <div class="mx-auto w-[236px] font-[system-ui,sans-serif]">
    <div v-if="preview.card === 'large'" class="overflow-hidden rounded-2xl transition-shadow duration-[var(--duration-base)]">
      <PreviewImage :src="preview.image" aspect="2 / 3" />
    </div>
    <div v-else class="grid aspect-[2/3] place-items-center rounded-2xl bg-[#efefef] text-center text-[13px] text-[#5f5f5f] dark:bg-[#333] dark:text-[#b5b5b5]">
      <span class="px-6">Pinterest needs an image to create a Pin.</span>
    </div>
    <div class="mt-2 flex items-start gap-1 px-1">
      <p class="line-clamp-2 flex-1 text-[14px] leading-[18px] font-semibold text-[#111] dark:text-white">
        {{ preview.title }}
      </p>
      <Icon name="lucide:ellipsis" class="mt-0.5 size-4 shrink-0 text-[#111] dark:text-white" aria-hidden="true" />
    </div>
  </div>
</template>
