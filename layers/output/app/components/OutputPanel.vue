<script setup lang="ts">
import { FORMATS, generate, getFormat, type OutputFormat } from '#layers/output/shared/utils/formats'

// The Code view (FR-7.x): pick a format, copy or download the tags for the edited values.
const { draft } = useMetaState()
const format = useState<OutputFormat>('mc-output-format', () => 'html')
const comments = useState('mc-output-comments', () => true)

const info = computed(() => getFormat(format.value))
const code = computed(() => generate(draft.value, format.value, { comments: comments.value }))
// Shiki escapes the code it highlights, so this HTML is safe to render.
const highlighted = useHighlighter(code, computed(() => info.value.lang))

const options = FORMATS.map(f => ({ value: f.id, label: f.label }))
const block = useTemplateRef<{ copy: () => Promise<void> }>('block')
</script>

<template>
  <div class="flex flex-col gap-4 pb-20 md:pb-0">
    <h2 class="sr-only">
      Code
    </h2>
    <div class="flex flex-wrap items-end gap-x-6 gap-y-3">
      <CoreSelect v-model="format" label="Format" :options="options" class="w-full sm:w-64" />
      <CoreSwitch v-model="comments" label="Include comments" class="pb-2" />
    </div>
    <Transition name="output-fade" mode="out-in">
      <p :key="format" class="text-callout text-muted">
        {{ info.instructions }}
      </p>
    </Transition>

    <Transition name="output-fade" mode="out-in">
      <div v-if="!code" key="empty" class="rounded-panel border border-dashed border-line px-6 py-12 text-center text-callout text-muted">
        Add a title or description in the editor to generate tags.
      </div>
      <CoreCodeBlock
        v-else
        ref="block"
        key="code"
        :code="code"
        :label="info.label"
        :filename="info.filename"
        :mime="info.mime"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="highlighted" class="output-code" v-html="highlighted" />
        <pre v-else class="m-0 whitespace-pre"><code>{{ code }}</code></pre>
      </CoreCodeBlock>
    </Transition>

    <!-- §9.10.5: on phones a full-width Copy button sits within thumb reach. -->
    <div v-if="code" class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-header p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
      <CoreButton variant="primary" icon="lucide:copy" class="w-full" @click="block?.copy()">
        Copy {{ info.label }}
      </CoreButton>
    </div>
  </div>
</template>

<style scoped>
.output-fade-enter-active,
.output-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.output-fade-enter-from,
.output-fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* Shiki emits both themes as CSS variables; pick one per colour mode. Unscoped on purpose:
   scoped :global(.dark) would compile to a bare .dark rule that recolours the whole page. */
.output-code pre {
  margin: 0;
  background: transparent !important;
  white-space: pre;
}
.output-code .shiki span {
  color: var(--shiki-light);
}
.dark .output-code .shiki span {
  color: var(--shiki-dark);
}
</style>
