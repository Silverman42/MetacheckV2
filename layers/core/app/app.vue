<script setup lang="ts">
// FR-8.4: MetaCheck's own pages ship complete meta tags. Pages override title/description.
const { public: { siteUrl } } = useRuntimeConfig()
const route = useRoute()
const description = 'Preview how your link looks on Google, Facebook, X, LinkedIn and Slack, check the meta tags behind it and copy the code to fix them.'

useHead({
  titleTemplate: title => (title ? `${title} · MetaCheck` : 'MetaCheck — preview and fix your link’s meta tags'),
  link: [{ rel: 'canonical', href: () => siteUrl + route.path }],
})

useSeoMeta({
  description,
  ogType: 'website',
  ogSiteName: 'MetaCheck',
  ogTitle: 'MetaCheck — preview and fix your link’s meta tags',
  ogDescription: description,
  ogUrl: () => siteUrl + route.path,
  ogImage: `${siteUrl}/og-image.jpg`,
  ogImageAlt: 'The MetaCheck logo',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
