import { describe, expect, it } from 'vitest';

import {
  DEFAULT_UNSET_SENTINEL,
  parseDefaultLiteralDraft,
  parseLiteralValue,
} from './defaultLiteral';

describe('defaultLiteral', () => {
  it('parses JSON literals including null and arrays', () => {
    expect(parseLiteralValue('null')).toEqual({ value: null });
    expect(parseLiteralValue('[1, 2, 3]')).toEqual({ value: [1, 2, 3] });
    expect(parseLiteralValue('{"ok":true}')).toEqual({
      value: { ok: true },
    });
  });

  it('rejects wrapped node input payloads', () => {
    expect(
      parseLiteralValue(
        '{"__dvt_type":"expr","value":"foo","expression_kind":"single"}'
      )
    ).toEqual({
      error:
        'Введите JSON literal: `null`, `true`, `123`, `"text"`, массив или объект.',
    });
    expect(
      parseLiteralValue(
        '{"__dvt_type":"link","node_id":"1","output_name":"value"}'
      )
    ).toEqual({
      error:
        'Введите JSON literal: `null`, `true`, `123`, `"text"`, массив или объект.',
    });
  });

  it('treats empty default draft as unset sentinel', () => {
    expect(parseDefaultLiteralDraft('')).toEqual({
      isUnset: true,
      value: DEFAULT_UNSET_SENTINEL,
    });
  });
});
