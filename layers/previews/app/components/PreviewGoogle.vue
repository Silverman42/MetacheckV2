<script setup lang="ts">
import { buildPreview, getChannel } from '#layers/previews/shared/utils/channels'

// FR-4.4: desktop and mobile results, favicon, site name and breadcrumb URL. Google's own light
// and dark result colours (FR-4.6).
const { draft } = useMetaState()
const device = ref<'desktop' | 'mobile'>('desktop')
const devices = [
  { value: 'desktop' as const, label: 'Desktop', icon: 'lucide:monitor' },
  { value: 'mobile' as const, label: 'Mobile', icon: 'lucide:smartphone' },
]
const preview = computed(() => buildPreview(draft.value, getChannel('google'), { descriptionMax: device.value === 'mobile' ? 120 : 160 }))
const faviconFailed = ref(false)
watch(() => preview.value.favicon, () => (faviconFailed.value = false))
</script>

<template>
  <div>
    <div class="mb-3 flex justify-end">
      <CoreSegmentedControl v-model="device" :options="devices" label="Google result size" size="sm" icon-only />
    </div>
    <Transition name="preview-swap" mode="out-in">
      <div
        :key="device"
        :class="['font-[arial,sans-serif] transition-[max-width] duration-[var(--duration-base)]', device === 'mobile' ? 'mx-auto max-w-[380px] rounded-2xl bg-white p-4 shadow-sm dark:bg-[#303134]' : 'max-w-[600px]']"
      >
        <div class="flex items-center gap-3">
          <span class="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f1f3f4] ring-1 ring-[#dadce0] dark:bg-[#3c4043] dark:ring-[#5f6368]">
            <img
              v-if="preview.favicon && !faviconFailed"
              :src="preview.favicon"
              alt=""
              class="size-[18px] object-contain"
              referrerpolicy="no-referrer"
              @error="faviconFailed = true"
            >
            <Icon v-else name="lucide:globe" class="size-4 text-[#5f6368] dark:text-[#9aa0a6]" aria-hidden="true" />
          </span>
          <span class="min-w-0 leading-tight">
            <span class="block truncate text-[14px] text-[#202124] dark:text-[#dadce0]">{{ preview.siteName }}</span>
            <span class="block truncate text-[12px] text-[#4d5156] dark:text-[#bdc1c6]">{{ preview.displayUrl }}</span>
          </span>
        </div>
        <h3 :class="['mt-1.5 font-normal text-[#1a0dab] dark:text-[#99c3ff]', device === 'mobile' ? 'text-[18px] leading-6' : 'text-[20px] leading-[1.3]']">
          {{ preview.title || 'Untitled page' }}
        </h3>
        <p class="mt-1 text-[14px] leading-[1.58] text-[#4d5156] dark:text-[#bdc1c6]">
          {{ preview.description || 'Google picks text from the page when there is no description.' }}
        </p>
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
