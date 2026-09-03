import { describe, expect, it } from 'vitest';

import { isDialectSupportsDatabases } from '@/shared/lib/db-metadata';
import { makeExpressionValue } from '@/shared/lib/node-input-values';

import {
  buildInitialOpenSections,
  buildSelectedTableLabel,
  getDatabaseOptions,
  getFilteredTables,
  getFirstErrorSection,
  getInitialActiveSection,
  getPartitionColumnType,
  getReadTableDataPreviewState,
  getReadTablePreviewState,
  getSchemaOptions,
  getSelectorCollapsedValue,
  sanitizeTTLCache,
  toggleColumnSelection,
} from './helpers';
import { validateReadTableFromDBV3 } from './validation';

describe('readTableFromDBV3 helpers', () => {
  it('opens the first unresolved selector by default', () => {
    expect(buildInitialOpenSections()).toEqual(['table']);
    expect(
      buildInitialOpenSections(
        {
          database_name: 'analytics',
        },
        {
          dialect: 'postgresql',
          databases: [],
        } as any
      )
    ).toEqual(['schema']);
    expect(
      buildInitialOpenSections(
        {
          database_name: 'analytics',
        },
        {
          dialect: 'mysql',
          schemas: [],
        } as any
      )
    ).toEqual(['schema']);
    expect(
      buildInitialOpenSections(
        {
          database_name: 'analytics',
          schema_name: 'public',
        },
        {
          dialect: 'postgresql',
          databases: [],
        } as any
      )
    ).toEqual(['table']);
    expect(
      getInitialActiveSection({
        database_name: 'analytics',
        schema_name: 'public',
        table_name: 'orders',
      })
    ).toBe('table');
  });

  it('derives metadata preview states without requesting table data', () => {
    expect(
      getReadTablePreviewState({
        hasExpression: false,
        hasTableName: false,
        loading: false,
        hasSelectedTable: false,
      })
    ).toBe('empty');
    expect(
      getReadTablePreviewState({
        hasExpression: true,
        hasTableName: true,
        loading: false,
        hasSelectedTable: false,
      })
    ).toBe('empty');
    expect(
      getReadTablePreviewState({
        hasExpression: false,
        hasTableName: true,
        loading: true,
        hasSelectedTable: false,
      })
    ).toBe('loading');
    expect(
      getReadTablePreviewState({
        hasExpression: false,
        hasTableName: true,
        loading: false,
        hasSelectedTable: true,
      })
    ).toBe('ready');
    expect(
      getReadTablePreviewState({
        hasExpression: false,
        hasTableName: true,
        loading: false,
        hasSelectedTable: false,
      })
    ).toBe('error');
  });

  it('derives live data preview states', () => {
    expect(
      getReadTableDataPreviewState({
        hasExpression: true,
        hasTableName: true,
        state: 'idle',
      })
    ).toBe('empty');
    expect(
      getReadTableDataPreviewState({
        hasExpression: false,
        hasTableName: true,
        state: 'loading',
      })
    ).toBe('loading');
    expect(
      getReadTableDataPreviewState({
        hasExpression: false,
        hasTableName: true,
        state: 'ready',
      })
    ).toBe('ready');
    expect(
      getReadTableDataPreviewState({
        hasExpression: false,
        hasTableName: true,
        state: 'empty',
      })
    ).toBe('empty');
    expect(
      getReadTableDataPreviewState({
        hasExpression: false,
        hasTableName: true,
        state: 'badGateway',
      })
    ).toBe('error');
  });

  it('selects the first section containing a save error', () => {
    expect(
      getFirstErrorSection({
        table_name: 'Выберите таблицу',
        partition_col: 'Выберите колонку',
      })
    ).toBe('table');
    expect(
      getFirstErrorSection({ partition_grouping: 'Настройте группировку' })
    ).toBe('options');
    expect(getFirstErrorSection({})).toBeNull();
  });

  it('builds full table label from database, schema and table', () => {
    expect(
      buildSelectedTableLabel({
        database_name: 'analytics',
        schema_name: 'public',
        table_name: 'orders',
      })
    ).toBe('analytics.public.orders');
  });

  it('builds selector helpers from metadata and expression values', () => {
    const metadata = {
      dialect: 'postgresql',
      databases: [
        {
          name: 'analytics',
          schemas: [
            {
              name: 'public',
              tables: [
                {
                  name: 'orders',
                  columns: [],
                  type: 'BASE TABLE',
                },
                {
                  name: 'customers',
                  columns: [],
                  type: 'BASE TABLE',
                },
              ],
            },
          ],
        },
        {
          name: 'warehouse',
          schemas: [
            {
              name: 'staging',
              tables: [
                {
                  name: 'events',
                  columns: [],
                  type: 'BASE TABLE',
                },
              ],
            },
          ],
        },
      ],
    } as any;

    expect(getDatabaseOptions(metadata)).toEqual([
      { label: 'analytics', tableCount: 2, value: 'analytics' },
      { label: 'warehouse', tableCount: 1, value: 'warehouse' },
    ]);
    expect(getSchemaOptions(metadata, 'analytics')).toEqual([
      { label: 'public', tableCount: 2, value: 'public' },
    ]);
    expect(
      getFilteredTables(metadata, 'analytics', 'public').map(
        table => table.name
      )
    ).toEqual(['orders', 'customers']);
    expect(metadata && isDialectSupportsDatabases(metadata.dialect)).toBe(true);
    expect(
      getSelectorCollapsedValue(
        makeExpressionValue('source_database', 'single'),
        'База не выбрана'
      )
    ).toBe('Expression');
  });

  it('toggles selected columns and clears selection to null', () => {
    expect(toggleColumnSelection(['id'], 'amount')).toEqual(['id', 'amount']);
    expect(toggleColumnSelection(['id'], 'id')).toBeNull();
  });

  it('normalizes ttl cache and detects partition column type', () => {
    expect(sanitizeTTLCache(undefined)).toBe(0);
    expect(sanitizeTTLCache('12.9')).toBe(12);
    expect(sanitizeTTLCache('-5')).toBe(0);

    expect(
      getPartitionColumnType('created_at', [
        { name: 'created_at', dtype: 'TIMESTAMP' } as never,
      ])
    ).toBe('DATETIME');
  });

  it('validates required partition column for tables without a single primary key', () => {
    const result = validateReadTableFromDBV3({
      inputData: {
        table_name: 'orders',
        npartitions: 4,
      },
      isPartitionColumnRequired: true,
      partitionColumnType: 'UNKNOWN',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.partition_col).toBe(
      'Выберите колонку сегментации для параметров партиционирования'
    );
  });
});
