import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  { ignores: ['.claude/**'] },
  {
    rules: {
      // Optional TS props are undefined by default; forcing defaults adds noise.
      'vue/require-default-prop': 'off',
    },
  },
)
