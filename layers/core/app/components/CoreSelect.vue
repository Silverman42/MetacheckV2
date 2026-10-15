<script setup lang="ts">
// Native select styled like CoreTextField: native pickers are the most usable on touch devices.
defineProps<{
  label: string
  options: { value: string, label: string }[]
  hint?: string
}>()
const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-callout font-medium text-fg">{{ label }}</label>
    <div class="relative">
      <select
        :id="id"
        v-model="model"
        :aria-describedby="hint ? `${id}-hint` : undefined"
        class="h-11 w-full appearance-none rounded-control bg-inset pr-9 pl-3 text-body text-fg ring-1 ring-line ring-inset transition-[box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none hover:ring-muted/40 focus-visible:ring-2 focus-visible:ring-focus md:h-10"
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <Icon name="lucide:chevrons-up-down" class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
    </div>
    <p v-if="hint" :id="`${id}-hint`" class="text-caption text-muted">
      {{ hint }}
    </p>
  </div>
</template>
