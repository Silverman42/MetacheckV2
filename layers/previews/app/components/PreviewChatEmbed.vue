<script setup lang="ts">
import { buildPreview, getChannel } from '#layers/previews/shared/utils/channels'

// Slack, Discord and Telegram unfurl links the same way: a bar on the left, the site name,
// a linked title, the description and a large image. Each keeps its own colours.
const props = defineProps<{ channel: 'slack' | 'discord' | 'telegram' }>()
const { draft } = useMetaState()
const preview = computed(() => buildPreview(draft.value, getChannel(props.channel)))
const faviconFailed = ref(false)

const styles = {
  slack: {
    wrap: 'bg-white dark:bg-[#1a1d21] font-[Lato,system-ui,sans-serif]',
    bar: 'bg-[#dddddd] dark:bg-[#35373b]',
    site: 'font-bold text-[#1d1c1d] dark:text-[#d1d2d3]',
    title: 'font-bold text-[#1264a3] dark:text-[#1d9bd1]',
    text: 'text-[#1d1c1d] dark:text-[#d1d2d3]',
    card: '',
  },
  discord: {
    wrap: 'bg-white dark:bg-[#313338] font-[system-ui,sans-serif]',
    bar: '',
    site: 'text-[12px] text-[#4e5058] dark:text-[#b5bac1]',
    title: 'font-semibold text-[#006ce7] dark:text-[#00a8fc]',
    text: 'text-[#313338] dark:text-[#dbdee1]',
    card: 'rounded bg-[#f2f3f5] dark:bg-[#2b2d31] p-3 border-l-4 border-[#e3e5e8] dark:border-[#1e1f22]',
  },
  telegram: {
    wrap: 'bg-white dark:bg-[#182533] font-[system-ui,sans-serif]',
    bar: 'bg-[#3390ec] dark:bg-[#6ab2f2]',
    site: 'font-semibold text-[#3390ec] dark:text-[#6ab2f2]',
    title: 'font-semibold text-black dark:text-white',
    text: 'text-black dark:text-[#f5f5f5]',
    card: '',
  },
}
const s = computed(() => styles[props.channel])
const borderColor = computed(() => (props.channel === 'discord' && preview.value.themeColor ? { borderLeftColor: preview.value.themeColor } : undefined))
</script>

<template>
  <div :class="['rounded-xl p-4 text-[15px] leading-[22px] transition-colors duration-[var(--duration-base)]', s.wrap]">
    <div :class="['flex max-w-[440px] gap-3', s.card]" :style="borderColor">
      <span v-if="s.bar" :class="['w-1 shrink-0 rounded-full', s.bar]" />
      <div class="min-w-0 flex-1">
        <p :class="['flex items-center gap-1.5', s.site]">
          <img
            v-if="channel === 'slack' && preview.favicon && !faviconFailed"
            :src="preview.favicon"
            alt=""
            class="size-4 rounded-sm object-contain"
            referrerpolicy="no-referrer"
            @error="faviconFailed = true"
          >
          {{ preview.siteName }}
        </p>
        <p :class="['mt-0.5 line-clamp-2', s.title]">
          {{ preview.title || preview.domain }}
        </p>
        <p v-if="preview.description" :class="['mt-0.5 line-clamp-3', s.text]">
          {{ preview.description }}
        </p>
        <div v-if="preview.card === 'large'" class="mt-2 max-w-[360px] overflow-hidden rounded-lg">
          <PreviewImage :src="preview.image" />
        </div>
      </div>
    </div>
  </div>
</template>
