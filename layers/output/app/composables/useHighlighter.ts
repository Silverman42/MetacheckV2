import type { HighlighterCore } from 'shiki/core'
import { CODE_THEME_DARK, CODE_THEME_LIGHT } from '#layers/output/shared/utils/code-themes'

let highlighter: Promise<HighlighterCore> | null = null

/** Shiki, loaded on first use in the browser only, so it never weighs on the first page load. */
function load() {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
    ])
    return createHighlighterCore({
      themes: [CODE_THEME_LIGHT, CODE_THEME_DARK],
      langs: [
        import('@shikijs/langs/html'),
        import('@shikijs/langs/typescript'),
        import('@shikijs/langs/tsx'),
        import('@shikijs/langs/json'),
      ],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighter
}

/** Highlighted HTML for `code`, or null until Shiki has loaded (show plain code meanwhile). */
export function useHighlighter(code: Ref<string>, lang: Ref<string>) {
  const html = ref<string | null>(null)
  if (import.meta.client) {
    watch([code, lang], async ([c, l]) => {
      const h = await load()
      // Ignore results for code that has since changed.
      if (c !== code.value || l !== lang.value) return
      html.value = h.codeToHtml(c, {
        lang: l,
        themes: { light: 'metacheck-light', dark: 'metacheck-dark' },
        defaultColor: false,
      })
    }, { immediate: true })
  }
  return html
}
