<script setup lang="ts" generic="T extends string">
import { TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'

// §9.10.6: pill track, sliding selection indicator, ARIA tabs semantics and keyboard support.
defineProps<{
  /** `shortcut` is announced to assistive tech (aria-keyshortcuts) and shown in the tooltip. */
  options: { value: T, label: string, icon?: string, badge?: number, class?: string, shortcut?: string }[]
  label: string
  size?: 'sm' | 'md'
  iconOnly?: boolean
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <TabsRoot v-model="model" :unmount-on-hide="false" activation-mode="automatic">
    <TabsList
      :aria-label="label"
      class="relative inline-flex rounded-full bg-inset p-1"
    >
      <TabsIndicator
        class="absolute top-1 bottom-1 left-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) rounded-full bg-surface shadow-card transition-[width,translate] duration-[var(--duration-slow)] ease-[var(--ease-standard)] dark:bg-raised"
      />
      <TabsTrigger
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :aria-label="iconOnly ? option.label : undefined"
        :aria-keyshortcuts="option.shortcut"
        :title="iconOnly || option.shortcut ? `${option.label}${option.shortcut ? ` (${option.shortcut})` : ''}` : undefined"
        :class="[
          option.class,
          'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full font-medium',
          'text-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
          'hover:text-fg data-[state=active]:text-fg',
          size === 'sm' ? 'h-8 text-footnote' : 'h-9 text-callout',
          iconOnly ? (size === 'sm' ? 'w-8' : 'w-9') : 'px-3.5',
        ]"
      >
        <Icon v-if="option.icon" :name="option.icon" class="size-4" aria-hidden="true" />
        <span v-if="!iconOnly">{{ option.label }}</span>
        <Transition name="core-badge">
          <span
            v-if="option.badge"
            class="tabular min-w-5 rounded-full bg-danger px-1.5 text-caption text-white dark:text-canvas"
          >{{ option.badge }}</span>
        </Transition>
      </TabsTrigger>
    </TabsList>
  </TabsRoot>
</template>

<style scoped>
.core-badge-enter-active,
.core-badge-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard);
}
.core-badge-enter-from,
.core-badge-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
</style>
