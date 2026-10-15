// Shiki themes from MetaCheck's palette (§9.6, §9.10.2). Every token colour passes 4.5:1 on
// the code block's surface-inset background in its theme.

const scopes = {
  comment: ['comment', 'punctuation.definition.comment'],
  string: ['string', 'string.quoted', 'punctuation.definition.string'],
  keyword: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'entity.name.tag', 'keyword.control'],
  attribute: ['entity.other.attribute-name', 'support.type.property-name', 'meta.object-literal.key', 'variable.other.property', 'meta.property-name'],
  constant: ['constant.numeric', 'constant.language', 'support.constant', 'constant.character.entity'],
  punctuation: ['punctuation', 'meta.brace', 'meta.tag'],
}

function theme(name: string, type: 'light' | 'dark', c: Record<keyof typeof scopes | 'fg' | 'bg', string>) {
  return {
    name,
    type,
    colors: { 'editor.background': c.bg, 'editor.foreground': c.fg },
    tokenColors: [
      { settings: { foreground: c.fg } },
      ...Object.entries(scopes).map(([key, scope]) => ({ scope, settings: { foreground: c[key as keyof typeof scopes] } })),
    ],
  }
}

export const CODE_THEME_LIGHT = theme('metacheck-light', 'light', {
  bg: '#ecf4f2', fg: '#0b1f22', comment: '#4b6366', string: '#0f766e', keyword: '#9f1239', attribute: '#1e40af', constant: '#6d28d9', punctuation: '#4b6366',
})

export const CODE_THEME_DARK = theme('metacheck-dark', 'dark', {
  bg: '#020d0f', fg: '#e6f4f1', comment: '#8fa9a8', string: '#5eead4', keyword: '#fda4af', attribute: '#93c5fd', constant: '#c4b5fd', punctuation: '#8fa9a8',
})
