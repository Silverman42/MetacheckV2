<script setup lang="ts">
import { FIELD_GUIDANCE } from '#layers/editor/shared/utils/field-guidance'

// The metadata panel (FR-3.x). Edits go to the draft; the fetched snapshot never changes (FR-3.7).
const { draft, fetched, isDirty, state, reset, clear } = useMetaState()
const { show } = useToast()

useEditorFocus(['title', 'description', 'image'])

const isEmpty = computed(() => JSON.stringify(draft.value) === JSON.stringify(createEmptyMeta()))

/** Reset and Clear can be undone from the toast. */
function withUndo(action: () => void, title: string) {
  const before = JSON.parse(JSON.stringify(state.value.draft))
  action()
  show({
    tone: 'neutral',
    title,
    action: { label: 'Undo', run: () => { state.value.draft = before } },
  })
}
</script>

<template>
  <section aria-labelledby="editor-heading" class="flex flex-col gap-5">
    <header class="flex items-center gap-2">
      <h2 id="editor-heading" class="flex-1 text-headline font-semibold text-fg">
        Metadata
        <Transition name="editor-fade">
          <span v-if="isDirty" class="ml-1.5 inline-block size-2 rounded-full bg-accent align-middle" title="Edited" />
        </Transition>
        <span v-if="isDirty" class="sr-only">(edited)</span>
      </h2>
      <CoreButton
        size="sm"
        variant="ghost"
        icon="lucide:rotate-ccw"
        icon-only
        :disabled="!fetched || !isDirty"
        title="Reset to fetched values"
        @click="withUndo(reset, 'Reset to the page’s values')"
      >
        Reset to fetched values
      </CoreButton>
      <CoreButton
        size="sm"
        variant="ghost"
        icon="lucide:eraser"
        icon-only
        :disabled="isEmpty"
        title="Clear all fields"
        @click="withUndo(clear, 'Cleared all fields')"
      >
        Clear all fields
      </CoreButton>
    </header>

    <CoreTextField
      v-model="draft.base.title"
      data-field="title"
      label="Title"
      placeholder="What the page is called"
      :range="FIELD_GUIDANCE.title.range"
      :hint="FIELD_GUIDANCE.title.hint"
    />
    <CoreTextField
      v-model="draft.base.description"
      data-field="description"
      label="Description"
      placeholder="Describe the page in a sentence or two"
      multiline
      :rows="3"
      :range="FIELD_GUIDANCE.description.range"
      :hint="FIELD_GUIDANCE.description.hint"
    />
    <EditorImageField
      v-model="draft.base.image"
      data-field="image"
      label="Image URL"
      hint="Use 1200 × 630 px (1.91:1) for the largest cards."
    />

    <div class="flex flex-col gap-1 border-t border-line pt-3">
      <EditorOverrides />
      <EditorAdvanced />
    </div>
  </section>
</template>

<style scoped>
.editor-fade-enter-active,
.editor-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.editor-fade-enter-from,
.editor-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
