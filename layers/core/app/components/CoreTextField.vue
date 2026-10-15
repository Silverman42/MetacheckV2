<script setup lang="ts">
// §9.10.6 text field: inset fill, hairline border, accent focus ring, label above,
// live counter that turns amber/rose past the recommended range (FR-3.3).
const props = defineProps<{
  label: string
  hint?: string
  error?: string
  placeholder?: string
  multiline?: boolean
  rows?: number
  type?: string
  /** Recommended [min, max] length; shows a counter when set. */
  range?: [number, number]
}>()

const model = defineModel<string>({ default: '' })
const id = useId()

const length = computed(() => model.value.length)
const counterTone = computed(() => {
  if (!props.range) return ''
  const [min, max] = props.range
  if (length.value > max * 1.25) return 'text-danger'
  if (length.value > max || (length.value > 0 && length.value < min)) return 'text-warning'
  return 'text-muted'
})
const describedBy = computed(() => [props.hint && `${id}-hint`, props.error && `${id}-error`].filter(Boolean).join(' ') || undefined)

const fieldClass = [
  'w-full rounded-control bg-inset px-3 text-body text-fg placeholder:text-muted/70',
  'ring-1 ring-line ring-inset outline-none',
  'transition-[box-shadow,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
  'hover:ring-muted/40 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none',
  'aria-invalid:ring-danger',
]
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-3">
      <label :for="id" class="text-callout font-medium text-fg">{{ label }}</label>
      <span
        v-if="range"
        :class="['tabular text-footnote transition-colors duration-[var(--duration-base)]', counterTone]"
        aria-live="polite"
      >
        {{ length }}<span class="text-muted">/{{ range[1] }}</span>
      </span>
    </div>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      :rows="rows ?? 3"
      :placeholder="placeholder"
      :aria-invalid="!!error || undefined"
      :aria-describedby="describedBy"
      :class="[fieldClass, 'min-h-11 resize-y py-2.5']"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :aria-invalid="!!error || undefined"
      :aria-describedby="describedBy"
      :class="[fieldClass, 'h-11 md:h-10']"
    >
    <p v-if="hint" :id="`${id}-hint`" class="text-caption text-muted">
      {{ hint }}
    </p>
    <Transition name="core-reveal">
      <p v-if="error" :id="`${id}-error`" class="flex items-center gap-1.5 text-footnote text-danger">
        <Icon name="lucide:circle-alert" class="size-3.5 shrink-0" aria-hidden="true" />
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.core-reveal-enter-active,
.core-reveal-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard);
}
.core-reveal-enter-from,
.core-reveal-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
