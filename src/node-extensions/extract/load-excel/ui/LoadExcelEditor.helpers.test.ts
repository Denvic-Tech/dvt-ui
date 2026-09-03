import { describe, expect, it } from 'vitest';

import { wrapConstInputValues } from '@/shared/lib/node-input-values';

import {
  buildLoadExcelDtypes,
  findDuplicateDtypeEntryIndexes,
  getNumericSeparatorError,
  getThousandsPayloadValue,
  LOAD_EXCEL_DTYPE_OPTIONS,
  THOUSANDS_DISABLED_VALUE,
  THOUSANDS_SEPARATOR_OPTIONS,
} from './LoadExcelEditor.helpers';

describe('LoadExcelEditor helpers', () => {
  it('builds the default const payload for absent numeric settings', () => {
    expect(
      wrapConstInputValues({
        dtypes: null,
        thousands: null,
        decimal: '.',
      })
    ).toEqual({
      dtypes: { value: null, __dvt_type: 'const' },
      thousands: { value: null, __dvt_type: 'const' },
      decimal: { value: '.', __dvt_type: 'const' },
    });
  });

  it('preserves the exact case and whitespace of completed column names', () => {
    expect(
      buildLoadExcelDtypes([
        { columnName: ' 3 Брусок ', dtype: 'Float64' },
        { columnName: 'Code', dtype: 'string' },
        { columnName: '   ', dtype: 'Int64' },
      ])
    ).toEqual({
      ' 3 Брусок ': 'Float64',
      Code: 'string',
    });
    expect(
      buildLoadExcelDtypes([{ columnName: '', dtype: 'string' }])
    ).toBeNull();
  });

  it('exposes only the four supported pandas dtypes', () => {
    expect(LOAD_EXCEL_DTYPE_OPTIONS.map(option => option.value)).toEqual([
      'string',
      'Float64',
      'Int64',
      'boolean',
    ]);
  });

  it('detects only exact case-sensitive duplicate column names', () => {
    expect(
      findDuplicateDtypeEntryIndexes([
        { columnName: 'Amount', dtype: 'Float64' },
        { columnName: 'amount', dtype: 'Int64' },
        { columnName: 'Amount', dtype: 'string' },
      ])
    ).toEqual([0, 2]);
  });

  it('keeps supported space separators as exact Unicode code points', () => {
    expect(THOUSANDS_SEPARATOR_OPTIONS.map(option => option.value)).toEqual(
      expect.arrayContaining([' ', '\u00a0', '\u202f'])
    );
    expect(getThousandsPayloadValue(THOUSANDS_DISABLED_VALUE)).toBeNull();
    expect(getThousandsPayloadValue(' ')).toBe(' ');
    expect(getThousandsPayloadValue('\u00a0')).toBe('\u00a0');
    expect(getThousandsPayloadValue('\u202f')).toBe('\u202f');
  });

  it('rejects equal or malformed numeric separators', () => {
    expect(getNumericSeparatorError(' ', ',')).toBeNull();
    expect(getNumericSeparatorError(null, '.')).toBeNull();
    expect(getNumericSeparatorError(',', ',')).toContain('должны отличаться');
    expect(getNumericSeparatorError('  ', '.')).toContain('ровно одним');
    expect(getNumericSeparatorError(' ', '..')).toContain('ровно одним');
  });
});
