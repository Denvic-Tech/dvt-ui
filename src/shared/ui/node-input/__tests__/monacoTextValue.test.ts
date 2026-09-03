import { describe, expect, it } from 'vitest';

import { normalizeMonacoTextValue } from '../monacoTextValue';

describe('normalizeMonacoTextValue', () => {
  it('returns empty string for nullish values', () => {
    expect(normalizeMonacoTextValue(undefined)).toBe('');
    expect(normalizeMonacoTextValue(null)).toBe('');
  });

  it('keeps primitive text values readable', () => {
    expect(normalizeMonacoTextValue('SELECT 1')).toBe('SELECT 1');
    expect(normalizeMonacoTextValue(42)).toBe('42');
    expect(normalizeMonacoTextValue(true)).toBe('true');
  });

  it('pretty prints objects and arrays', () => {
    expect(normalizeMonacoTextValue({ query: 'SELECT 1' })).toBe(
      '{\n  "query": "SELECT 1"\n}'
    );
    expect(normalizeMonacoTextValue(['a', 'b'])).toBe('[\n  "a",\n  "b"\n]');
  });
});
