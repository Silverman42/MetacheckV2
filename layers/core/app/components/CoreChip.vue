<script setup lang="ts">
// §9.10.6 labelled toggle chip (replaces v1's icon circles). aria-pressed, check mark when on.
defineProps<{ icon?: string }>()
const pressed = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    :class="[
      'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-callout font-medium md:h-9',
      'ring-1 ring-inset transition-[background-color,color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] active:scale-[0.97]',
      pressed
        ? 'bg-accent/10 text-fg ring-accent'
        : 'bg-surface text-muted ring-line hover:bg-inset hover:text-fg',
    ]"
    @click="pressed = !pressed"
  >
    <Icon v-if="icon" :name="icon" class="size-4" aria-hidden="true" />
    <slot />
    <span
      :class="[
        'grid size-4 place-items-center overflow-hidden transition-[width,opacity] duration-[var(--duration-base)] ease-[var(--ease-standard)]',
        pressed ? 'w-4 opacity-100' : 'w-0 opacity-0',
      ]"
      aria-hidden="true"
    >
      <Icon name="lucide:check" class="size-4 text-accent-text" />
    </span>
  </button>
</template>
