<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only z-50 rounded-control bg-surface px-4 py-2 text-callout font-medium shadow-float transition-transform duration-[var(--duration-fast)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >Skip to content</a>
    <CoreHeader>
      <slot name="header" />
    </CoreHeader>
    <main id="main" class="flex-1">
      <slot />
    </main>
    <CoreFooter />
    <CoreToaster />
  </div>
</template>
