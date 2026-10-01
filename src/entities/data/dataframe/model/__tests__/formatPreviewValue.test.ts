import { describe, expect, it } from 'vitest';

import { formatPreviewValue } from '../formatPreviewValue';

describe('dataframe preview presentation', () => {
  it('shows nested headers, duplicates and null without changing values', () => {
    const headers = [
      { key: 'same', value: '<binary: 2 bytes>' },
      { key: 'same', value: null },
    ];
    const before = structuredClone(headers);
    expect(formatPreviewValue(headers)).toBe(
      '[{"key":"same","value":"<binary: 2 bytes>"},{"key":"same","value":null}]'
    );
    expect(headers).toEqual(before);
    expect(formatPreviewValue([])).toBe('[]');
    expect(formatPreviewValue(null)).toBe('null');
    expect(formatPreviewValue('<binary: 0 bytes>')).toBe('<binary: 0 bytes>');
    expect(formatPreviewValue(0)).toBe('0');
  });
});
