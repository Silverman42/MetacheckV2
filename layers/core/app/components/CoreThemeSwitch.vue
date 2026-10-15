<script setup lang="ts">
// FR-8.1: Light / Dark / System, persisted by @nuxtjs/color-mode.
type Preference = 'light' | 'dark' | 'system'
const colorMode = useColorMode()

const preference = computed<Preference>({
  get: () => colorMode.preference as Preference,
  set: (value) => { colorMode.preference = value },
})

const options: { value: Preference, label: string, icon: string }[] = [
  { value: 'light', label: 'Light', icon: 'lucide:sun' },
  { value: 'dark', label: 'Dark', icon: 'lucide:moon' },
  { value: 'system', label: 'System', icon: 'lucide:monitor' },
]
</script>

<template>
  <ClientOnly>
    <CoreSegmentedControl v-model="preference" :options="options" label="Theme" size="sm" icon-only />
    <template #fallback>
      <div class="h-10 w-[6.5rem] rounded-full bg-inset" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
