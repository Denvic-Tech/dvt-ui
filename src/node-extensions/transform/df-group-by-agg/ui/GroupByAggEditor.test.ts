import { describe, expect, it } from 'vitest';

import type { DataFrameMetadata } from '@/shared/gatewayClient';

import { getAvailableAggregationFunctions } from '../lib/aggregation-functions';

describe('getAvailableAggregationFunctions', () => {
  it('keeps all backend functions available while dataframe metadata is unknown', () => {
    expect(
      getAvailableAggregationFunctions({
        columnName: 'amount',
        inputMetadata: undefined,
        currentFunction: 'sum',
      })
    ).toContain('sum');
  });

  it('keeps a saved function visible even when current metadata no longer classifies the column as numeric', () => {
    const inputMetadata = {
      columns: [{ name: 'amount', dtype: 'STRING' }],
    } as DataFrameMetadata;

    const functions = getAvailableAggregationFunctions({
      columnName: 'amount',
      inputMetadata,
      currentFunction: 'sum',
    });

    expect(functions).toContain('sum');
    expect(functions).toContain('count');
  });

  it('still restricts a new non-numeric selection to supported non-numeric functions', () => {
    const inputMetadata = {
      columns: [{ name: 'category', dtype: 'STRING' }],
    } as DataFrameMetadata;

    const functions = getAvailableAggregationFunctions({
      columnName: 'category',
      inputMetadata,
    });

    expect(functions).not.toContain('sum');
    expect(functions).toContain('count');
    expect(functions).toContain('min');
  });
});
