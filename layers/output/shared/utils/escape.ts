// FR-7.2: escaping per target, so a quote or angle bracket in a value never breaks the output (fixes U4).

/** For HTML attribute values in double quotes. */
export function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** For HTML text content, e.g. inside <title>. */
export function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** A single-quoted JavaScript/TypeScript string literal. */
export function jsString(value: string) {
  return `'${value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/<\/(script)/gi, '<\\/$1')}'`
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/** A JS/TS object literal with single-quoted strings and unquoted keys where possible. */
export function jsLiteral(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  const inner = '  '.repeat(indent + 1)
  if (typeof value === 'string') return jsString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (!value.length) return '[]'
    return `[\n${value.map(v => `${inner}${jsLiteral(v, indent + 1)},`).join('\n')}\n${pad}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    if (!entries.length) return '{}'
    return `{\n${entries.map(([k, v]) => `${inner}${IDENTIFIER.test(k) ? k : jsString(k)}: ${jsLiteral(v, indent + 1)},`).join('\n')}\n${pad}}`
  }
  return 'undefined'
}
