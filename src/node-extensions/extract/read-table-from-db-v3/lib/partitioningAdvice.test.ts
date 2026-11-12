import { describe, expect, it } from 'vitest';

import type {
  DbColumn,
  PartitioningAdviceResponse,
} from '@/shared/gatewayClient';

import {
  buildPartitioningAdviceRequest,
  isSamePartitioningSettings,
  pickPartitioningSettings,
  resolvePartitioningAdvice,
} from './partitioningAdvice';

const columns = [
  { name: 'id', dtype: 'INT' },
  { name: 'created_at', dtype: 'DATETIME' },
  { name: 'email', dtype: 'VARCHAR' },
] as DbColumn[];

const advice = (
  recommendations: Array<{
    rank: number;
    partition_col: string;
    partition_grouping: Record<string, unknown>;
  }>
) => ({ recommendations }) as unknown as PartitioningAdviceResponse;

describe('partitioning advice', () => {
  it('builds the request for the selected table and reader settings', () => {
    expect(
      buildPartitioningAdviceRequest(
        {
          databaseName: 'analytics',
          schemaName: 'public',
          tableName: 'orders',
        },
        { columns: ['id'], npartitions: 8, max_rows_per_partition: 50_000 }
      )
    ).toEqual({
      table_name: 'orders',
      database_name: 'analytics',
      schema_name: 'public',
      read_columns: ['id'],
      npartitions: 8,
      max_rows_per_partition: 50_000,
    });
    // Пустые родители, «все колонки» и незаданные размеры не передаются.
    expect(
      buildPartitioningAdviceRequest(
        { databaseName: 'analytics', schemaName: null, tableName: 'orders' },
        { columns: null, npartitions: null }
      )
    ).toEqual({ table_name: 'orders', database_name: 'analytics' });
  });

  it('takes the best ranked recommendation', () => {
    expect(
      resolvePartitioningAdvice(
        advice([
          {
            rank: 2,
            partition_col: 'email',
            partition_grouping: { mode: 'hash', buckets: 16 },
          },
          {
            rank: 1,
            partition_col: 'id',
            partition_grouping: { mode: 'range' },
          },
        ]),
        columns
      )
    ).toEqual({ partition_col: 'id', partition_grouping: { mode: 'range' } });
  });

  it('rejects advice that the form cannot show', () => {
    expect(resolvePartitioningAdvice(advice([]), columns)).toBeNull();
    // Колонки нет среди колонок таблицы.
    expect(
      resolvePartitioningAdvice(
        advice([
          {
            rank: 1,
            partition_col: 'missing',
            partition_grouping: { mode: 'hash' },
          },
        ]),
        columns
      )
    ).toBeNull();
    // Range недоступен для строковой колонки.
    expect(
      resolvePartitioningAdvice(
        advice([
          {
            rank: 1,
            partition_col: 'email',
            partition_grouping: { mode: 'range' },
          },
        ]),
        columns
      )
    ).toBeNull();
    expect(
      resolvePartitioningAdvice(
        advice([
          {
            rank: 1,
            partition_col: 'id',
            partition_grouping: { mode: 'bogus' },
          },
        ]),
        columns
      )
    ).toBeNull();
  });

  it('compares settings regardless of key order', () => {
    const current = pickPartitioningSettings({
      partition_col: 'created_at',
      partition_grouping: { buckets: 32, mode: 'hash' },
    });

    expect(
      isSamePartitioningSettings(current, {
        partition_col: 'created_at',
        partition_grouping: { mode: 'hash', buckets: 32 },
      })
    ).toBe(true);
    expect(
      isSamePartitioningSettings(current, {
        partition_col: 'created_at',
        partition_grouping: { mode: 'hash', buckets: 64 },
      })
    ).toBe(false);
    expect(pickPartitioningSettings({ partition_col: '' })).toEqual({
      partition_col: null,
      partition_grouping: null,
    });
  });
});
