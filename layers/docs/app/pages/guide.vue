<script setup lang="ts">
useSeoMeta({
  title: 'Guide',
  description: 'How to use MetaCheck, and what each meta tag does for search results and link previews.',
  ogTitle: 'MetaCheck guide: meta tags for search and social',
})

const tags = [
  { tag: '<title>', where: 'Search results, browser tabs, fallback for every card', tip: '30–60 characters. Put the important words first.' },
  { tag: 'description', where: 'Search snippet, card text', tip: '110–160 characters. One or two plain sentences.' },
  { tag: 'og:title', where: 'Facebook, LinkedIn, Slack, WhatsApp, iMessage…', tip: 'Can differ from <title>, e.g. without your brand suffix.' },
  { tag: 'og:description', where: 'Card text on most apps', tip: 'Some platforms hide it; don’t rely on it for key information.' },
  { tag: 'og:image', where: 'Every large card', tip: 'Absolute URL, 1200 × 630 px, under 5 MB.' },
  { tag: 'og:image:alt', where: 'Screen readers', tip: 'Describe what the image shows.' },
  { tag: 'og:url', where: 'Attribution of shares and likes', tip: 'Use the canonical URL.' },
  { tag: 'og:type', where: 'How platforms classify the page', tip: 'website for most pages, article for posts.' },
  { tag: 'twitter:card', where: 'X', tip: 'summary_large_image for a full-width image; summary for a thumbnail.' },
  { tag: 'twitter:title / description / image', where: 'X only', tip: 'Optional: X uses og:* when these are missing.' },
  { tag: 'canonical', where: 'Search engines', tip: 'The preferred URL when a page is reachable at several.' },
  { tag: 'robots', where: 'Search engines', tip: 'Leave unset to allow indexing. noindex hides the page.' },
  { tag: 'theme-color', where: 'Browser UI on phones, Discord embeds', tip: 'A hex colour that matches your brand.' },
]
</script>

<template>
  <DocsPage title="Guide" intro="Check a page, fix its tags, and copy the code. Here’s how, and what each tag is for.">
    <h2>Using MetaCheck</h2>
    <ol>
      <li><strong>Check a URL.</strong> Type a page address in the field at the top (no need for https://) and press Check. Press <code>/</code> or <code>⌘K</code> to jump to it.</li>
      <li><strong>See the previews.</strong> The Preview view shows how the link looks on each platform. Pick platforms with the chips; More holds the rest.</li>
      <li><strong>Read the checks.</strong> The Checks view lists errors and warnings, why they matter and how to fix them.</li>
      <li><strong>Edit.</strong> Change the title, description and image in the editor; previews and checks update as you type. Per-platform text and Advanced hold the rest.</li>
      <li><strong>Copy the code.</strong> The Code view writes the tags for HTML, Nuxt, Vue, Next.js, React, Astro or JSON.</li>
    </ol>
    <p>The page address updates as you check, so you can share or bookmark any result. Start from scratch to write tags for a page that isn’t live yet.</p>

    <h2>What each tag does</h2>
    <div class="overflow-x-auto">
      <table>
        <thead>
          <tr><th scope="col">Tag</th><th scope="col">Used by</th><th scope="col">Tip</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in tags" :key="row.tag">
            <td><code>{{ row.tag }}</code></td>
            <td>{{ row.where }}</td>
            <td>{{ row.tip }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>Why previews differ from what you see</h2>
    <p>Platforms cache link previews. After changing your tags, ask them to fetch again:</p>
    <ul>
      <li>Facebook: <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener" class="transition-opacity duration-[var(--duration-fast)] hover:opacity-80">Sharing Debugger</a></li>
      <li>LinkedIn: <a href="https://www.linkedin.com/post-inspector/" target="_blank" rel="noopener" class="transition-opacity duration-[var(--duration-fast)] hover:opacity-80">Post Inspector</a></li>
      <li>X, Slack and others refresh on their own, usually within a day.</li>
    </ul>
    <p>MetaCheck reads the HTML your server sends, without running JavaScript, as social platforms do. If your tags are added by JavaScript in the browser, platforms won’t see them either.</p>
  </DocsPage>
</template>
