import { describe, expect, it } from 'vitest';

import { isDialectSupportsDatabases } from '@/shared/lib/db-metadata';
import { makeExpressionValue } from '@/shared/lib/node-input-values';

import {
  buildSqlPolicyDrafts,
  getManualColumnNullable,
  getSupportedAggregations,
  hydrateManualTarget,
  hydrateManualVariableDrafts,
  serializeManualVariableDrafts,
  serializeSqlPolicyDrafts,
} from './helpers';
import {
  validateManualDefinition,
  validateSqlPolicyStep,
  validateSqlPreviewState,
} from './validation';

describe('read-variables-from-db helpers', () => {
  it('hydrates and serializes manual rows with shared target duplication', () => {
    const rows = hydrateManualVariableDrafts({
      metric: {
        database_name: 'analytics',
        schema_name: 'public',
        table_name: 'events',
        column_name: 'amount',
        aggregation: 'sum',
        nullable: true,
        default: 0,
      },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.default_literal).toBe('0');
    expect(rows[0]).not.toHaveProperty('database_name');

    expect(
      serializeManualVariableDrafts(rows, {
        database_name: 'analytics',
        schema_name: 'public',
        table_name: 'events',
      })
    ).toEqual({
      metric: {
        database_name: 'analytics',
        schema_name: 'public',
        table_name: 'events',
        column_name: 'amount',
        aggregation: 'sum',
        nullable: true,
        default: 0,
      },
    });
  });

  it('keeps selector expressions in shared manual target payload', () => {
    const rawValue = {
      metric: {
        table_name: makeExpressionValue('input_variables.table_name', 'single'),
        column_name: 'amount',
        aggregation: 'max',
        default: '__DVT_UNSET__',
      },
    };
    const rows = hydrateManualVariableDrafts(rawValue);
    const manualTarget = hydrateManualTarget(rawValue);

    expect(
      serializeManualVariableDrafts(rows, manualTarget.target)['metric']
    ).toMatchObject({
      table_name: makeExpressionValue('input_variables.table_name', 'single'),
    });
  });

  it('detects mixed manual targets and resets shared selector hydration', () => {
    expect(
      hydrateManualTarget({
        first: {
          database_name: 'analytics',
          schema_name: 'public',
          table_name: 'events',
        },
        second: {
          database_name: 'analytics',
          schema_name: 'raw',
          table_name: 'payments',
        },
      })
    ).toEqual({
      hasMixedTargets: true,
      target: {},
    });
  });

  it('derives aggregations from additional_schema and metadata dialect', () => {
    expect(
      getSupportedAggregations({
        connectionMetadata: {
          dialect: 'postgresql',
          tables: [],
        } as never,
        nodeDefinition: {
          additional_schema: {
            read_variables_from_db: {
              manual_mode: {
                aggregations_by_dialect: {
                  postgresql: ['min', 'max'],
                },
              },
            },
          },
        },
      })
    ).toEqual(['min', 'max']);
  });

  it('builds sql policy rows and serializes only configured overrides', () => {
    const rows = buildSqlPolicyDrafts({
      columns: [
        { name: 'total', dtype: 'INT' },
        { name: 'label', dtype: 'STRING' },
      ],
      rawValue: {
        total: {
          nullable: true,
          default: 0,
        },
      },
    });

    expect(rows).toHaveLength(2);
    expect(serializeSqlPolicyDrafts(rows)).toEqual({
      total: {
        nullable: true,
        default: 0,
      },
    });
  });

  it('derives nullable from selected manual table column metadata', () => {
    const table = {
      name: 'events',
      type: 'BASE_TABLE',
      columns: [
        {
          name: 'optional_total',
          dtype: 'INT',
          nullable: true,
        },
        {
          name: 'required_total',
          dtype: 'INT',
          nullable: false,
        },
        {
          name: 'implicit_required',
          dtype: 'INT',
        },
      ],
    } as never;

    expect(
      getManualColumnNullable({
        columnValue: 'optional_total',
        table,
      })
    ).toBe(true);
    expect(
      getManualColumnNullable({
        columnValue: 'required_total',
        table,
      })
    ).toBe(false);
    expect(
      getManualColumnNullable({
        columnValue: 'implicit_required',
        table,
      })
    ).toBe(false);
    expect(
      getManualColumnNullable({
        columnValue: makeExpressionValue(
          'input_variables.column_name',
          'single'
        ),
        table,
      })
    ).toBeUndefined();
    expect(
      getManualColumnNullable({
        columnValue: 'missing_column',
        table,
      })
    ).toBeUndefined();
  });

  it('validates manual target, preview state and policy defaults', () => {
    expect(
      validateManualDefinition({
        connectionID: null,
        connectionMetadata: null,
        manualRows: [],
        manualTarget: {},
        orderByRequiredAggregations: new Set(['first', 'last']),
      })
    ).toEqual([
      'Подключите вход connection к ноде с connection_id.',
      'Добавьте хотя бы одну переменную в manual режиме.',
    ]);

    expect(
      validateSqlPreviewState({
        connectionID: 'conn-id',
        currentFingerprint: 'conn-id::select 1',
        previewState: {
          status: 'loading',
          fingerprint: 'conn-id::select 1',
          metadata: null,
          error: null,
        },
        sqlQueryValue: 'select 1',
      })
    ).toEqual(['Дождитесь, пока загрузится metadata по SQL query.']);

    expect(
      validateSqlPolicyStep([
        {
          id: '1',
          name: 'total',
          nullable: false,
          default_literal: '{bad json',
        },
      ])
    ).toEqual([
      'Колонка 1 (total): Введите JSON literal: `null`, `true`, `123`, `"text"`, массив или объект.',
    ]);
  });

  it('hides database selector when metadata does not expose databases', () => {
    expect(isDialectSupportsDatabases('sqlite')).toBe(false);
  });
});
