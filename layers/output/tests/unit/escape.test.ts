import { describe, expect, it } from 'vitest'
import { escapeAttr, escapeText, jsLiteral, jsString } from '../../shared/utils/escape'

describe('escaping (FR-7.2, fixes U4)', () => {
  it('escapes HTML attributes and text', () => {
    expect(escapeAttr('Tom & "Jerry" <b>')).toBe('Tom &amp; &quot;Jerry&quot; &lt;b&gt;')
    expect(escapeText('a < b & "c"')).toBe('a &lt; b &amp; "c"')
  })

  it('makes safe single-quoted JS strings', () => {
    expect(jsString('It\'s a \\ test\n')).toBe('\'It\\\'s a \\\\ test\\n\'')
    expect(jsString('</script>')).toBe('\'<\\/script>\'')
    expect(eval(jsString('Quote \' back\\slash \u2028 line'))).toBe('Quote \' back\\slash \u2028 line')
  })

  it('writes object literals with unquoted keys where possible', () => {
    expect(jsLiteral({ title: 'A', 'og:x': 1, skip: undefined, list: [{ a: 'b' }] })).toBe(
      '{\n  title: \'A\',\n  \'og:x\': 1,\n  list: [\n    {\n      a: \'b\',\n    },\n  ],\n}',
    )
  })
})
