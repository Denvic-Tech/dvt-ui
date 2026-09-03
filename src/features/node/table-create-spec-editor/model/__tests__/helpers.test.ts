import { describe, expect, it } from 'vitest';

import {
  createDefaultTableCreateSpecDraft,
  hydrateTableCreateSpecDraft,
  serializeTableCreateSpecDraft,
  validateTableCreateSpecDraft,
} from '../helpers';

describe('tableCreateSpec helpers', () => {
  it('hydrates and serializes the full clickhouse contract', () => {
    const draft = hydrateTableCreateSpecDraft({
      primary_key_cols: ['id', 'date'],
      indexes: [
        {
          columns: ['id'],
          name: 'ix_id',
          unique: true,
        },
      ],
      foreign_keys: [
        {
          columns: ['user_id'],
          name: 'fk_users',
          ref_columns: ['id'],
          ref_schema: 'public',
          ref_table: 'users',
        },
      ],
      clickhouse: {
        engine_name: 'ReplicatedVersionedCollapsingMergeTree',
        order_by: ['date'],
        partition_by: ['date'],
        primary_key: ['id'],
        sample_by: ['id'],
        ttl_expression: 'date + INTERVAL 7 DAY',
        version_column: 'version',
        sign_column: 'sign',
        summing_columns: ['amount'],
        table_path: '/clickhouse/tables/{shard}/events',
        replica_name: '{replica}',
        settings: {
          index_granularity: 8192,
        },
      },
    });

    expect(serializeTableCreateSpecDraft(draft)).toEqual({
      primary_key_cols: ['id', 'date'],
      indexes: [
        {
          columns: ['id'],
          name: 'ix_id',
          unique: true,
        },
      ],
      foreign_keys: [
        {
          columns: ['user_id'],
          name: 'fk_users',
          ref_columns: ['id'],
          ref_schema: 'public',
          ref_table: 'users',
        },
      ],
      clickhouse: {
        engine_name: 'ReplicatedVersionedCollapsingMergeTree',
        order_by: ['date'],
        partition_by: ['date'],
        primary_key: ['id'],
        sample_by: ['id'],
        ttl_expression: 'date + INTERVAL 7 DAY',
        version_column: 'version',
        sign_column: 'sign',
        summing_columns: ['amount'],
        table_path: '/clickhouse/tables/{shard}/events',
        replica_name: '{replica}',
        settings: {
          index_granularity: 8192,
        },
      },
    });
  });

  it('validates required clickhouse fields for replicated versioned engine', () => {
    const draft = createDefaultTableCreateSpecDraft();
    draft.clickhouse.engineName = 'ReplicatedVersionedCollapsingMergeTree';

    const validation = validateTableCreateSpecDraft(draft, []);

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toEqual([
      'ClickHouse: для replicated engine обязателен table path.',
      'ClickHouse: для replicated engine обязательно имя replica.',
      'ClickHouse: для VersionedCollapsing engine обязателен sign column.',
      'ClickHouse: для VersionedCollapsing engine обязателен version column.',
    ]);
  });
});
