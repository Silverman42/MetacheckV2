<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'

defineProps<{ label: string }>()
const model = defineModel<boolean>({ default: false })
const id = useId()
</script>

<template>
  <div class="inline-flex items-center gap-2.5">
    <SwitchRoot
      :id="id"
      v-model="model"
      class="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-inset ring-1 ring-line ring-inset transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] data-[state=checked]:bg-accent data-[state=checked]:ring-accent"
    >
      <SwitchThumb
        class="block size-5 translate-x-0.5 rounded-full bg-white shadow-card transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] data-[state=checked]:translate-x-[1.125rem]"
      />
    </SwitchRoot>
    <label :for="id" class="text-footnote text-muted select-none">{{ label }}</label>
  </div>
</template>
