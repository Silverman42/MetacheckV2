<script setup lang="ts">
// v1's right-hand "about" column moves here (§9.10.5).
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-line">
    <div class="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-8 text-footnote text-muted md:flex-row md:items-center md:justify-between md:px-6">
      <p class="max-w-prose">
        MetaCheck shows how your link looks when it’s shared, checks the tags behind it and writes the code to fix them.
      </p>
      <nav aria-label="Footer" class="flex items-center gap-4">
        <NuxtLink to="/guide" class="transition-colors duration-[var(--duration-fast)] hover:text-fg">Guide</NuxtLink>
        <NuxtLink to="/about" class="transition-colors duration-[var(--duration-fast)] hover:text-fg">About</NuxtLink>
        <span>© {{ year }} MetaCheck</span>
        <a
          href="https://fibreware.dev"
          target="_blank"
          rel="noopener"
          class="flex shrink-0 items-center gap-1.5 whitespace-nowrap opacity-80 transition-opacity duration-[var(--duration-fast)] hover:opacity-100"
        >
          <span>Built by</span>
          <img src="/fibreware-logo-monochrome-light.png" alt="Fibreware" width="1631" height="347" class="h-3.5 w-auto max-w-none dark:hidden">
          <img src="/fibreware-logo-monochrome-dark.png" alt="Fibreware" width="1631" height="347" class="hidden h-3.5 w-auto max-w-none dark:block">
        </a>
      </nav>
    </div>
  </footer>
</template>
