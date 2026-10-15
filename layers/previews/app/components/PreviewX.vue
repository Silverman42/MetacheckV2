<script setup lang="ts">
import { buildPreview, getChannel } from '#layers/previews/shared/utils/channels'

// X: large cards show the image with the title overlaid and "From domain" below;
// summary cards show a square thumbnail beside the text.
const { draft } = useMetaState()
const preview = computed(() => buildPreview(draft.value, getChannel('x')))
</script>

<template>
  <div class="mx-auto max-w-[540px] rounded-xl bg-white p-3 font-[system-ui,sans-serif] dark:bg-black">
    <Transition name="preview-swap" mode="out-in">
      <div v-if="preview.card === 'large'" key="large">
        <div class="relative overflow-hidden rounded-2xl ring-1 ring-[#cfd9de] dark:ring-[#2f3336]">
          <PreviewImage :src="preview.image" />
          <span class="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded bg-black/75 px-1.5 py-0.5 text-[13px] text-white">
            {{ preview.title || preview.domain }}
          </span>
        </div>
        <p class="mt-1 text-[13px] text-[#536471] dark:text-[#71767b]">
          From {{ preview.domain }}
        </p>
      </div>
      <div v-else key="small" class="flex overflow-hidden rounded-2xl bg-white ring-1 ring-[#cfd9de] dark:bg-black dark:ring-[#2f3336]">
        <div v-if="preview.card === 'small'" class="w-[130px] shrink-0 border-r border-[#cfd9de] dark:border-[#2f3336]">
          <PreviewImage :src="preview.image" aspect="1 / 1" />
        </div>
        <div v-else class="grid w-[130px] shrink-0 place-items-center border-r border-[#cfd9de] bg-[#f7f9f9] dark:border-[#2f3336] dark:bg-[#16181c]">
          <Icon name="lucide:file-text" class="size-7 text-[#536471] dark:text-[#71767b]" aria-hidden="true" />
        </div>
        <div class="flex min-w-0 flex-col justify-center gap-0.5 px-3 py-2.5 text-[15px] leading-5">
          <span class="truncate text-[#536471] dark:text-[#71767b]">{{ preview.domain }}</span>
          <span class="truncate text-[#0f1419] dark:text-[#e7e9ea]">{{ preview.title || preview.domain }}</span>
          <span v-if="preview.description" class="line-clamp-2 text-[#536471] dark:text-[#71767b]">{{ preview.description }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.preview-swap-enter-active,
.preview-swap-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.preview-swap-enter-from,
.preview-swap-leave-to {
  opacity: 0;
}
</style>
