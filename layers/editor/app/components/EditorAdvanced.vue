<script setup lang="ts">
import { FIELD_GUIDANCE } from '#layers/editor/shared/utils/field-guidance'

// FR-3.5: the tags beyond title, description and image.
const { draft } = useMetaState()
const a = computed(() => draft.value.advanced)

const ogTypes = ['website', 'article', 'profile', 'book', 'video.movie', 'video.other', 'music.song', 'product']
  .map(value => ({ value, label: value }))
const cards = [
  { value: 'summary_large_image' as const, label: 'Large image' },
  { value: 'summary' as const, label: 'Summary' },
]
const robots = [
  { value: '', label: 'Not set (index, follow)' },
  { value: 'index, follow', label: 'index, follow' },
  { value: 'noindex', label: 'noindex' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow' },
  { value: 'max-image-preview:large', label: 'max-image-preview:large' },
]

const filled = computed(() => {
  const { ogType, twitterCard, ...rest } = a.value
  return Object.values(rest).filter(Boolean).length + (ogType !== 'website' ? 1 : 0) + (twitterCard !== 'summary_large_image' ? 1 : 0)
})

const open = ref(false)
useEditorFocus(['canonical', 'imageAlt', 'imageWidth', 'twitterCard', 'robots', 'locale', 'siteName'], () => {
  open.value = true
})

const validColor = computed(() => /^#(?:[\da-f]{3}){1,2}$/i.test(a.value.themeColor.trim()))
</script>

<template>
  <CoreDisclosure v-model:open="open" title="Advanced" description="Canonical, type, image size, X card, robots" :badge="filled ? `${filled} set` : undefined">
    <div class="flex flex-col gap-4">
      <CoreTextField v-model="draft.advanced.canonical" data-field="canonical" label="Canonical URL" type="url" placeholder="https://example.com/page" />
      <div class="grid grid-cols-2 gap-3">
        <CoreSelect v-model="draft.advanced.ogType" label="og:type" :options="ogTypes" />
        <CoreTextField v-model="draft.advanced.locale" data-field="locale" label="og:locale" placeholder="en_GB" />
      </div>
      <CoreTextField v-model="draft.advanced.siteName" data-field="siteName" label="og:site_name" placeholder="Your brand" />
      <CoreTextField
        v-model="draft.advanced.imageAlt" data-field="imageAlt"
        label="Image alt text"
        :hint="FIELD_GUIDANCE.imageAlt.hint"
        multiline
        :rows="2"
      />
      <div class="grid grid-cols-2 gap-3">
        <CoreTextField v-model="draft.advanced.imageWidth" data-field="imageWidth" label="Image width" placeholder="1200" />
        <CoreTextField v-model="draft.advanced.imageHeight" label="Image height" placeholder="630" />
      </div>

      <div class="flex flex-col gap-1.5" data-field="twitterCard">
        <span class="text-callout font-medium text-fg">X card</span>
        <CoreSegmentedControl v-model="draft.advanced.twitterCard" :options="cards" label="X card type" size="sm" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <CoreTextField v-model="draft.advanced.twitterSite" label="twitter:site" placeholder="@brand" />
        <CoreTextField v-model="draft.advanced.twitterCreator" label="twitter:creator" placeholder="@author" />
      </div>

      <CoreSelect v-model="draft.advanced.robots" data-field="robots" label="robots" :options="robots" />
      <div class="flex items-end gap-2">
        <CoreTextField v-model="draft.advanced.themeColor" class="flex-1" label="theme-color" placeholder="#0f766e" />
        <span
          class="size-11 shrink-0 rounded-control md:size-10 ring-1 ring-line ring-inset transition-colors duration-[var(--duration-base)]"
          :style="validColor ? { backgroundColor: draft.advanced.themeColor } : undefined"
          aria-hidden="true"
        />
      </div>
      <CoreTextField v-model="draft.advanced.favicon" label="Favicon URL" type="url" placeholder="https://example.com/favicon.ico" />
    </div>
  </CoreDisclosure>
</template>
