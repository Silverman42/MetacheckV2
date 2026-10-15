<script setup lang="ts">
// §9.10.4 materials: the one translucent surface. The workspace layer fills the centre slot
// with the URL field.
const { public: { repoUrl } } = useRuntimeConfig()
const links = [
  { label: 'Guide', to: '/guide' },
  { label: 'About', to: '/about' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-header backdrop-blur-xl backdrop-saturate-150 transition-colors duration-[var(--duration-base)]">
    <div class="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 md:px-6">
      <NuxtLink
        to="/"
        class="shrink-0 rounded-control transition-opacity duration-[var(--duration-fast)] hover:opacity-80"
        aria-label="MetaCheck home"
      >
        <CoreLogo wordmark />
      </NuxtLink>

      <div class="min-w-0 flex-1">
        <slot />
      </div>

      <nav aria-label="Main" class="hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-control px-3 py-2 text-callout font-medium text-muted transition-colors duration-[var(--duration-fast)] hover:bg-inset hover:text-fg"
          active-class="text-fg"
        >
          {{ link.label }}
        </NuxtLink>
        <CoreButton
          v-if="repoUrl"
          :href="repoUrl"
          variant="ghost"
          icon="simple-icons:github"
          icon-only
          target="_blank"
          rel="noopener"
        >
          MetaCheck on GitHub
        </CoreButton>
      </nav>

      <CoreThemeSwitch />
    </div>
  </header>
</template>
