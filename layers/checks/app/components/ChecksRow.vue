<script setup lang="ts">
import type { EditorField } from '#layers/core/app/composables/useFieldFocus'
import type { CheckResult } from '#layers/checks/shared/utils/rules'

// FR-5.3: each result says why it matters and how to fix it, with a link to the spec.
const props = defineProps<{ result: CheckResult }>()
const open = ref(false)
const { focus } = useFieldFocus()

const icon = computed(() => {
  if (props.result.status === 'pass') return { name: 'lucide:circle-check', class: 'text-success', label: 'Passed' }
  if (props.result.severity === 'error') return { name: 'lucide:circle-x', class: 'text-danger', label: 'Error' }
  return { name: 'lucide:triangle-alert', class: 'text-warning', label: 'Warning' }
})
const id = useId()
</script>

<template>
  <li class="border-b border-line last:border-b-0">
    <button
      type="button"
      :aria-expanded="open"
      :aria-controls="id"
      class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-inset"
      @click="open = !open"
    >
      <Icon :name="icon.name" :class="['mt-0.5 size-5 shrink-0', icon.class]" aria-hidden="true" />
      <span class="min-w-0 flex-1">
        <span class="sr-only">{{ icon.label }}: </span>
        <span class="block text-callout font-medium text-fg">{{ result.title }}</span>
        <span v-if="result.detail" class="block truncate text-footnote text-muted">{{ result.detail }}</span>
        <span v-else-if="result.status === 'fail'" class="block text-footnote text-muted">{{ result.fix }}</span>
      </span>
      <Icon
        name="lucide:chevron-down"
        :class="['mt-0.5 size-4 shrink-0 text-muted transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)]', open && 'rotate-180']"
        aria-hidden="true"
      />
    </button>
    <Transition name="checks-expand">
      <div v-show="open" :id="id" class="px-4 pb-4 pl-12">
        <p class="text-footnote text-muted">
          {{ result.why }}
        </p>
        <p v-if="result.status === 'fail'" class="mt-2 text-footnote text-fg">
          <span class="font-medium">How to fix:</span> {{ result.fix }}
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <CoreButton
            v-if="result.status === 'fail' && result.field"
            size="sm"
            variant="secondary"
            icon="lucide:pencil"
            @click="focus(result.field as EditorField)"
          >
            Edit in MetaCheck
          </CoreButton>
          <a
            :href="result.docs.url"
            target="_blank"
            rel="noopener"
            class="inline-flex h-8 items-center gap-1 rounded-control px-2 text-footnote font-medium text-accent-text transition-opacity duration-[var(--duration-fast)] hover:opacity-80"
          >
            {{ result.docs.label }}
            <Icon name="lucide:arrow-up-right" class="size-3.5" aria-hidden="true" />
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </Transition>
  </li>
</template>

<style scoped>
.checks-expand-enter-active,
.checks-expand-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.checks-expand-enter-from,
.checks-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
