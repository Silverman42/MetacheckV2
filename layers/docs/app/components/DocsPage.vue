<script setup lang="ts">
// Shared frame for the docs pages: title, intro, readable measure, and a "back to MetaCheck" link.
defineProps<{ title: string, intro: string }>()
</script>

<template>
  <article class="docs mx-auto max-w-3xl animate-fade-in px-4 py-10 md:px-6 md:py-16">
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-1 rounded-control text-footnote font-medium text-accent-text transition-opacity duration-[var(--duration-fast)] hover:opacity-80"
    >
      <Icon name="lucide:arrow-left" class="size-3.5" aria-hidden="true" />
      Back to MetaCheck
    </NuxtLink>
    <h1 class="mt-4 text-display font-bold text-fg">
      {{ title }}
    </h1>
    <p class="mt-3 text-headline font-normal text-muted">
      {{ intro }}
    </p>
    <div class="mt-10">
      <slot />
    </div>
  </article>
</template>

<style scoped>
.docs :deep(h2) {
  margin-top: 2.5rem;
  font-size: var(--text-title);
  line-height: var(--text-title--line-height);
  letter-spacing: var(--text-title--letter-spacing);
  font-weight: 600;
  color: var(--color-fg);
}
.docs :deep(h3) {
  margin-top: 1.75rem;
  font-size: var(--text-headline);
  line-height: var(--text-headline--line-height);
  font-weight: 600;
  color: var(--color-fg);
}
.docs :deep(p),
.docs :deep(li) {
  color: var(--color-muted);
}
.docs :deep(p) {
  margin-top: 0.75rem;
}
.docs :deep(ul),
.docs :deep(ol) {
  margin-top: 0.75rem;
  padding-left: 1.25rem;
}
.docs :deep(ul) { list-style: disc; }
.docs :deep(ol) { list-style: decimal; }
.docs :deep(li + li) { margin-top: 0.375rem; }
.docs :deep(strong) { color: var(--color-fg); font-weight: 600; }
.docs :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.875em;
  color: var(--color-fg);
  background: var(--color-inset);
  border-radius: 0.375rem;
  padding: 0.1em 0.35em;
}
.docs :deep(a:not(.inline-flex)) {
  color: var(--color-accent-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.docs :deep(a:not(.inline-flex):hover) { opacity: 0.8; }
.docs :deep(table) {
  margin-top: 1rem;
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-callout);
}
.docs :deep(th),
.docs :deep(td) {
  border-bottom: 1px solid var(--color-line);
  padding: 0.6rem 0.75rem 0.6rem 0;
  text-align: left;
  vertical-align: top;
}
.docs :deep(th) { color: var(--color-fg); font-weight: 600; }
.docs :deep(td) { color: var(--color-muted); }
</style>
