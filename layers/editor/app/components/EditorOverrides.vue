<script setup lang="ts">
import { resolveMeta, type MetaPlatform } from '#layers/core/shared/utils/meta'
import { FIELD_GUIDANCE } from '#layers/editor/shared/utils/field-guidance'

// FR-3.6: per-platform values. Empty fields inherit, and the placeholder shows what they inherit.
const { draft } = useMetaState()
const platform = ref<MetaPlatform>('og')
const open = ref(false)

useEditorFocus(['og.title', 'og.description', 'og.image', 'twitter.title', 'twitter.description', 'twitter.image'], (field) => {
  open.value = true
  platform.value = field.startsWith('twitter.') ? 'twitter' : 'og'
})
const platforms = [
  { value: 'og' as const, label: 'Open Graph' },
  { value: 'twitter' as const, label: 'X' },
]

const override = computed(() => draft.value.overrides[platform.value])
// What this platform would show if its own fields were empty.
const inherited = computed(() => resolveMeta({
  ...draft.value,
  overrides: { ...draft.value.overrides, [platform.value]: { title: '', description: '', image: '' } },
}, platform.value))
const guidance = computed(() => platform.value === 'og'
  ? { title: FIELD_GUIDANCE.ogTitle, description: FIELD_GUIDANCE.ogDescription }
  : { title: FIELD_GUIDANCE.twitterTitle, description: FIELD_GUIDANCE.twitterDescription })

const count = computed(() => {
  const { og, twitter } = draft.value.overrides
  return [og, twitter].flatMap(o => [o.title, o.description, o.image]).filter(Boolean).length
})

const inheritHint = computed(() => platform.value === 'og'
  ? 'Used by Facebook, LinkedIn, Slack, WhatsApp and most apps. Empty fields use the values above.'
  : 'Used by X. Empty fields use Open Graph, then the values above.')

function clearPlatform() {
  draft.value.overrides[platform.value] = { title: '', description: '', image: '' }
}
</script>

<template>
  <CoreDisclosure v-model:open="open" title="Per-platform text" description="Give social platforms different values" :badge="count ? `${count} set` : undefined">
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <CoreSegmentedControl v-model="platform" :options="platforms" label="Platform" size="sm" />
        <Transition name="editor-fade">
          <CoreButton
            v-if="override.title || override.description || override.image"
            size="sm"
            variant="ghost"
            icon="lucide:eraser"
            @click="clearPlatform"
          >
            Clear
          </CoreButton>
        </Transition>
      </div>
      <p class="text-caption text-muted">
        {{ inheritHint }}
      </p>
      <Transition name="editor-swap" mode="out-in">
        <div :key="platform" class="flex flex-col gap-4">
          <CoreTextField
            v-model="draft.overrides[platform].title"
            :data-field="`${platform}.title`"
            :label="platform === 'og' ? 'og:title' : 'twitter:title'"
            :placeholder="inherited.title || 'Inherits the title'"
            :range="override.title ? guidance.title.range : undefined"
            :hint="guidance.title.hint"
          />
          <CoreTextField
            v-model="draft.overrides[platform].description"
            :data-field="`${platform}.description`"
            :label="platform === 'og' ? 'og:description' : 'twitter:description'"
            :placeholder="inherited.description || 'Inherits the description'"
            :range="override.description ? guidance.description.range : undefined"
            multiline
            :rows="2"
          />
          <EditorImageField
            v-model="draft.overrides[platform].image"
            :data-field="`${platform}.image`"
            :label="platform === 'og' ? 'og:image' : 'twitter:image'"
            :placeholder="inherited.image || 'Inherits the image'"
          />
        </div>
      </Transition>
    </div>
  </CoreDisclosure>
</template>

<style scoped>
.editor-fade-enter-active,
.editor-fade-leave-active,
.editor-swap-enter-active,
.editor-swap-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.editor-fade-enter-from,
.editor-fade-leave-to {
  opacity: 0;
}
.editor-swap-enter-from {
  opacity: 0;
  transform: translateX(6px);
}
.editor-swap-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
