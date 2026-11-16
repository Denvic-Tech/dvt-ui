import { describe, expect, it } from 'vitest';

import { formatRowCount, getPreviewRowCountLabel } from './rowCount';

describe('data preview row count', () => {
  it('groups row count digits with a thin space', () => {
    expect(formatRowCount(18)).toBe('18');
    expect(formatRowCount(1000)).toBe('1 000');
    expect(formatRowCount(5_000_000)).toBe('5 000 000');
  });

  it('builds the preview row count label from the table row count', () => {
    expect(
      getPreviewRowCountLabel({
        shownRows: 18,
        rowCount: 5_000_000,
        rowCountExact: false,
      })
    ).toEqual({
      shown: '18',
      total: '5 000 000',
      isEstimate: true,
      unit: 'строк',
    });
    expect(
      getPreviewRowCountLabel({
        shownRows: 1,
        rowCount: 21,
        rowCountExact: true,
      })
    ).toMatchObject({ isEstimate: false, unit: 'строки' });
    expect(
      getPreviewRowCountLabel({
        shownRows: 3,
        rowCount: 3,
        rowCountExact: true,
      })
    ).toMatchObject({ unit: 'строк' });
    expect(
      getPreviewRowCountLabel({
        shownRows: 18,
        rowCount: null,
        rowCountExact: true,
      })
    ).toBeNull();
  });
});
