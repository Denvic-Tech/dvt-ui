import { describe, expect, it } from 'vitest';

import { validateReadTableFromDBV3 } from './validation';

describe('validateReadTableFromDBV3', () => {
  it('does not reject a saved partition column while table metadata is unknown', () => {
    const result = validateReadTableFromDBV3({
      inputData: {
        table_name: 'orders',
        partition_col: 'legacy_id',
        npartitions: 4,
      },
      isPartitionColumnRequired: false,
      partitionColumnType: 'UNKNOWN',
      availablePartitionColumns: null,
    });

    expect(result.errors.partition_col).toBeUndefined();
  });

  it('reports a saved partition column that is absent from loaded table metadata', () => {
    const result = validateReadTableFromDBV3({
      inputData: {
        table_name: 'orders',
        partition_col: 'legacy_id',
        npartitions: 4,
      },
      isPartitionColumnRequired: false,
      partitionColumnType: 'UNKNOWN',
      availablePartitionColumns: ['id', 'amount'],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.partition_col).toContain('отсутствует');
  });
});
