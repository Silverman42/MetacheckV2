<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  icon?: string
  iconOnly?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  to?: string
  href?: string
}>(), { variant: 'secondary', size: 'md', type: 'button' })

const tag = computed(() => (props.to || props.href ? resolveComponent('NuxtLink') : 'button'))

const classes = computed(() => [
  'inline-flex select-none items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap',
  'transition-[background-color,color,box-shadow,transform,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
  'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
  props.size === 'sm' ? 'h-8 text-footnote' : 'h-11 text-callout md:h-10',
  props.iconOnly ? (props.size === 'sm' ? 'w-8' : 'w-11 md:w-10') : (props.size === 'sm' ? 'px-3' : 'px-4'),
  {
    primary: 'bg-accent text-on-accent shadow-card hover:bg-accent-hover',
    secondary: 'bg-surface text-fg shadow-card ring-1 ring-line hover:bg-inset',
    ghost: 'text-muted hover:bg-inset hover:text-fg',
  }[props.variant],
])
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :disabled="to || href ? undefined : disabled || loading"
    :aria-busy="loading || undefined"
    :class="classes"
  >
    <Transition name="core-swap" mode="out-in">
      <Icon v-if="loading" key="loading" name="lucide:loader-circle" class="size-4 animate-spin" aria-hidden="true" />
      <Icon v-else-if="icon" key="icon" :name="icon" class="size-4" aria-hidden="true" />
    </Transition>
    <span :class="iconOnly && 'sr-only'"><slot /></span>
  </component>
</template>

<style scoped>
.core-swap-enter-active,
.core-swap-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.core-swap-enter-from,
.core-swap-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
