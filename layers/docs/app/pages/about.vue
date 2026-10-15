<script setup lang="ts">
useSeoMeta({
  title: 'About',
  description: 'MetaCheck previews, checks and fixes the meta tags behind your link previews.',
  ogTitle: 'About MetaCheck',
})
const { public: { repoUrl } } = useRuntimeConfig()
</script>

<template>
  <DocsPage title="About MetaCheck" intro="A small tool for one job: making sure your links look right wherever they’re shared.">
    <h2>What it does</h2>
    <p>MetaCheck fetches a page the way social platforms do, shows how its link looks on Google, Facebook, X, LinkedIn, Slack and more, checks the tags against each platform’s rules, and writes the code to fix them.</p>

    <h2>Privacy</h2>
    <p>MetaCheck stores no account or personal data. The pages you check are fetched by MetaCheck’s server and kept in a short-lived cache for a few minutes. Your recent lookups and channel choices stay in your browser.</p>

    <h2>Version 2</h2>
    <p>This version is a rebuild: faster fetching without a headless browser, more platforms, checks with fixes, more code formats, light and dark mode, and editing on every screen size.</p>

    <h2>Credits</h2>
    <p>
      Built with Nuxt and Tailwind CSS by Sylvester Uche Nkeze.
      <template v-if="repoUrl">
        The source is on <a :href="repoUrl" target="_blank" rel="noopener" class="transition-opacity duration-[var(--duration-fast)] hover:opacity-80">GitHub</a>.
      </template>
    </p>
  </DocsPage>
</template>
