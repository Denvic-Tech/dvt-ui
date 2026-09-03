import { describe, expect, it } from 'vitest';

import {
  getPolicyColumnDiff,
  normalizeSchemaPolicy,
  parseFillValue,
  syncPolicyWithSchema,
} from './helpers';

describe('schema-policy helpers', () => {
  it('creates defaults for missing schema columns and removes stale columns', () => {
    const policy = normalizeSchemaPolicy({
      columns: {
        id: {
          on_missing: 'fill',
          fill_value: 0,
          on_type_mismatch: 'cast',
        },
        stale: {
          on_missing: 'ignore',
          fill_value: null,
          on_type_mismatch: 'ignore',
        },
      },
      on_extra_columns: 'drop',
    });

    const result = syncPolicyWithSchema(policy, [
      { name: 'id', dtype: 'BIGINT' },
      { name: 'title', dtype: 'TEXT' },
    ]);

    expect(result).toEqual({
      columns: {
        id: {
          on_missing: 'fill',
          fill_value: 0,
          on_type_mismatch: 'cast',
        },
        title: {
          on_missing: 'error',
          fill_value: null,
          on_type_mismatch: 'error',
        },
      },
      on_extra_columns: 'drop',
    });
    expect(
      getPolicyColumnDiff(result, [{ name: 'id' }, { name: 'title' }])
    ).toEqual({ missing: [], unknown: [] });
  });

  it('parses fill values while preserving values for string columns', () => {
    expect(parseFillValue('42', 'BIGINT')).toBe(42);
    expect(parseFillValue('true', 'BOOLEAN')).toBe(true);
    expect(parseFillValue('{"enabled":true}', 'DICTIONARY')).toEqual({
      enabled: true,
    });
    expect(parseFillValue('001', 'VARCHAR(10)')).toBe('001');
    expect(parseFillValue('', 'FLOAT')).toBeNull();
  });
});
