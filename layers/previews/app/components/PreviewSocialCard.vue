<script setup lang="ts">
import { buildPreview, getChannel } from '#layers/previews/shared/utils/channels'

// LinkedIn, Bluesky, Mastodon and Threads: an image-topped card with the domain and title
// (and a description where the platform shows one), each in its own colours.
const props = defineProps<{ channel: 'linkedin' | 'bluesky' | 'mastodon' | 'threads' }>()
const { draft } = useMetaState()
const preview = computed(() => buildPreview(draft.value, getChannel(props.channel)))

const styles = {
  linkedin: {
    card: 'rounded-lg bg-white ring-[#e0dfdc] dark:bg-[#1b1f23] dark:ring-[#38434f]',
    body: 'bg-[#eef3f8] dark:bg-[#38434f]',
    title: 'text-[14px] font-semibold text-black/90 dark:text-white/90',
    muted: 'text-[12px] text-black/60 dark:text-white/60',
    domainFirst: false,
  },
  bluesky: {
    card: 'rounded-xl bg-white ring-[#d4dbe2] dark:bg-[#161e27] dark:ring-[#2e4052]',
    body: '',
    title: 'text-[15px] font-semibold text-[#0b0f14] dark:text-[#f1f3f5]',
    muted: 'text-[13px] text-[#52667a] dark:text-[#aebbc9]',
    domainFirst: false,
  },
  mastodon: {
    card: 'rounded-lg bg-white ring-[#c0cdd9] dark:bg-[#282c37] dark:ring-[#393f4f]',
    body: '',
    title: 'text-[15px] font-bold text-[#282c37] dark:text-white',
    muted: 'text-[13px] text-[#606984] dark:text-[#9baec8]',
    domainFirst: true,
  },
  threads: {
    card: 'rounded-xl bg-white ring-[#e5e5e5] dark:bg-[#101010] dark:ring-[#333]',
    body: '',
    title: 'text-[15px] font-semibold text-black dark:text-[#f3f5f7]',
    muted: 'text-[13px] text-[#6b6b6b] dark:text-[#8f8f8f]',
    domainFirst: true,
  },
}
const s = computed(() => styles[props.channel])
</script>

<template>
  <div :class="['mx-auto max-w-[520px] overflow-hidden font-[system-ui,sans-serif] ring-1 transition-colors duration-[var(--duration-base)]', s.card]">
    <PreviewImage v-if="preview.card === 'large'" :src="preview.image" />
    <div :class="['flex flex-col gap-0.5 px-3 py-2.5', s.body, preview.card === 'large' && 'border-t border-black/5 dark:border-white/10']">
      <p v-if="s.domainFirst" :class="['truncate', s.muted]">
        {{ preview.domain }}
      </p>
      <p :class="['line-clamp-2 leading-5', s.title]">
        {{ preview.title || preview.domain }}
      </p>
      <p v-if="preview.description" :class="['line-clamp-2 leading-[18px]', s.muted]">
        {{ preview.description }}
      </p>
      <p v-if="!s.domainFirst" :class="['truncate', s.muted, channel === 'bluesky' && 'mt-1 border-t border-[#d4dbe2] pt-1.5 dark:border-[#2e4052]']">
        <Icon v-if="channel === 'bluesky'" name="lucide:globe" class="mr-1 inline size-3 align-[-1px]" aria-hidden="true" />{{ preview.domain }}
      </p>
    </div>
  </div>
</template>
