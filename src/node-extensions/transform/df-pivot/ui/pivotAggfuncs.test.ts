import { describe, expect, it } from 'vitest';

import {
  getAllowedPivotAggFuncs,
  normalizePivotAggFunc,
  PIVOT_AGG_FUNCS,
} from './pivotAggfuncs';

describe('pivotAggfuncs', () => {
  it('allows the full backend function set for numeric, boolean and duration columns', () => {
    expect(getAllowedPivotAggFuncs('FLOAT')).toEqual(PIVOT_AGG_FUNCS);
    expect(getAllowedPivotAggFuncs('Nullable(Int64)')).toEqual(PIVOT_AGG_FUNCS);
    expect(getAllowedPivotAggFuncs('BOOLEAN')).toEqual(PIVOT_AGG_FUNCS);
    expect(getAllowedPivotAggFuncs('timedelta64[ns]')).toEqual(PIVOT_AGG_FUNCS);
  });

  it('limits temporal, string-like and unknown columns to safe aggregations', () => {
    expect(getAllowedPivotAggFuncs('TIMESTAMP')).toEqual([
      'count',
      'first',
      'last',
    ]);
    expect(getAllowedPivotAggFuncs('STRING')).toEqual([
      'count',
      'first',
      'last',
    ]);
    expect(getAllowedPivotAggFuncs('CATEGORY')).toEqual([
      'count',
      'first',
      'last',
    ]);
    expect(getAllowedPivotAggFuncs('OBJECT')).toEqual([
      'count',
      'first',
      'last',
    ]);
  });

  it('normalizes unsupported aggregations back to first', () => {
    expect(normalizePivotAggFunc('mean', 'STRING')).toBe('first');
    expect(normalizePivotAggFunc('sum', 'TIMESTAMP')).toBe('first');
    expect(normalizePivotAggFunc('unknown', 'FLOAT')).toBe('first');
    expect(normalizePivotAggFunc('mean', 'FLOAT')).toBe('mean');
  });
});
