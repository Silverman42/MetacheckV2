<script setup lang="ts">
import { defineAsyncComponent, type Component } from 'vue'
import { getChannel, type ChannelId } from '#layers/previews/shared/utils/channels'
import PreviewChatEmbed from './PreviewChatEmbed.vue'
import PreviewFacebook from './PreviewFacebook.vue'
import PreviewGoogle from './PreviewGoogle.vue'
import PreviewPinterest from './PreviewPinterest.vue'
import PreviewSocialCard from './PreviewSocialCard.vue'
import PreviewX from './PreviewX.vue'

// The Preview view: channel picker plus a card per selected channel.
const { selected } = usePreviewChannels()
const { draft } = useMetaState()

// v1's six channels are on by default, so they ship with the panel; the rest load when chosen (§9.5).
const PreviewMoreChat = defineAsyncComponent(() => import('./PreviewChatEmbed.vue'))
const PreviewMoreSocial = defineAsyncComponent(() => import('./PreviewSocialCard.vue'))
const cards: Record<ChannelId, { component: Component, props?: Record<string, string> }> = {
  google: { component: PreviewGoogle },
  facebook: { component: PreviewFacebook },
  x: { component: PreviewX },
  linkedin: { component: PreviewSocialCard, props: { channel: 'linkedin' } },
  pinterest: { component: PreviewPinterest },
  slack: { component: PreviewChatEmbed, props: { channel: 'slack' } },
  discord: { component: PreviewMoreChat, props: { channel: 'discord' } },
  whatsapp: { component: defineAsyncComponent(() => import('./PreviewWhatsapp.vue')) },
  telegram: { component: PreviewMoreChat, props: { channel: 'telegram' } },
  imessage: { component: defineAsyncComponent(() => import('./PreviewImessage.vue')) },
  bluesky: { component: PreviewMoreSocial, props: { channel: 'bluesky' } },
  mastodon: { component: PreviewMoreSocial, props: { channel: 'mastodon' } },
  threads: { component: PreviewMoreSocial, props: { channel: 'threads' } },
}

const isEmpty = computed(() => !draft.value.base.title && !draft.value.base.description && !draft.value.base.image)
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2 class="sr-only">
      Previews
    </h2>
    <PreviewChannelPicker />

    <Transition name="preview-fade" mode="out-in">
      <div v-if="!selected.length" key="none" class="rounded-panel border border-dashed border-line px-6 py-12 text-center text-callout text-muted">
        Choose a channel above to see how your link looks there.
      </div>
      <TransitionGroup v-else key="list" tag="div" name="preview-card" class="relative flex flex-col gap-6">
        <section
          v-for="id in selected"
          :key="id"
          :aria-label="`${getChannel(id).label} preview`"
          class="rounded-panel bg-surface p-4 shadow-card md:p-5"
        >
          <header class="mb-4 flex items-center gap-2">
            <Icon :name="getChannel(id).icon" class="size-4 text-muted" aria-hidden="true" />
            <h3 class="flex-1 text-headline font-semibold">
              {{ getChannel(id).label }}
            </h3>
            <a
              :href="getChannel(id).docs"
              target="_blank"
              rel="noopener"
              class="rounded-control px-1.5 py-1 text-caption text-muted transition-colors duration-[var(--duration-fast)] hover:text-fg"
            >
              Docs<span class="sr-only"> for {{ getChannel(id).label }} link previews (opens in a new tab)</span>
            </a>
          </header>
          <component :is="cards[id].component" v-bind="cards[id].props" />
        </section>
      </TransitionGroup>
    </Transition>

    <p v-if="isEmpty && selected.length" class="text-center text-footnote text-muted">
      Add a title, description and image in the editor to fill these previews.
    </p>
  </div>
</template>

<style scoped>
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}
.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}
.preview-card-enter-active,
.preview-card-move {
  transition: opacity var(--duration-slow) var(--ease-standard), transform var(--duration-slow) var(--ease-standard);
}
.preview-card-leave-active {
  position: absolute;
  inset-inline: 0;
  transition: opacity var(--duration-fast) var(--ease-exit);
}
.preview-card-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.preview-card-leave-to {
  opacity: 0;
}
</style>
