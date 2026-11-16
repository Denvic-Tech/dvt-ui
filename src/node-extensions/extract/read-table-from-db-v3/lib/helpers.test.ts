import { describe, expect, it } from 'vitest';

import { makeExpressionValue } from '@/shared/lib/node-input-values';

import {
  countChangedAdvancedSettings,
  getPartitionColumnType,
  getReadTableDataPreviewState,
  getSectionErrors,
  hasFilledSelectorValue,
  hasSelectorExpression,
  sanitizeTTLCache,
  toggleColumnSelection,
  toSelectorExpression,
} from './helpers';
import { validateReadTableFromDBV3 } from './validation';

describe('readTableFromDBV3 helpers', () => {
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

  it('detects filled selector values and expressions', () => {
    expect(hasFilledSelectorValue('orders')).toBe(true);
    expect(hasFilledSelectorValue('  ')).toBe(false);
    expect(hasFilledSelectorValue(null)).toBe(false);
    expect(
      hasFilledSelectorValue(makeExpressionValue('{{ table }}', 'single'))
    ).toBe(true);
    expect(hasFilledSelectorValue(makeExpressionValue('', 'single'))).toBe(
      false
    );

    expect(hasSelectorExpression({ table_name: 'orders' })).toBe(false);
    expect(
      hasSelectorExpression({
        schema_name: makeExpressionValue('schema', 'single'),
      })
    ).toBe(true);
  });

  it('turns a literal selector into a string expression', () => {
    expect(toSelectorExpression('orders')).toEqual(
      makeExpressionValue('"orders"', 'single')
    );
    expect(toSelectorExpression(undefined)).toEqual(
      makeExpressionValue('', 'single')
    );

    const expression = makeExpressionValue('{{ table }}', 'template');
    expect(toSelectorExpression(expression)).toBe(expression);
  });

  it('counts advanced settings that differ from defaults', () => {
    expect(countChangedAdvancedSettings(undefined)).toBe(0);
    expect(countChangedAdvancedSettings({ TTL_CACHE: 0 })).toBe(0);
    expect(
      countChangedAdvancedSettings({
        npartitions: 4,
        max_rows_per_partition: null,
        limit: 100,
        TTL_CACHE: 60,
      })
    ).toBe(3);
  });

  it('toggles selected columns in table order and clears selection to null', () => {
    const tableColumns = ['id', 'amount', 'created_at'];

    expect(toggleColumnSelection(tableColumns, ['created_at'], 'id')).toEqual([
      'id',
      'created_at',
    ]);
    expect(toggleColumnSelection(tableColumns, null, 'amount')).toEqual([
      'amount',
    ]);
    expect(toggleColumnSelection(tableColumns, ['id'], 'id')).toBeNull();
  });

  it('maps validation errors to the parameters tab and advanced block', () => {
    expect(getSectionErrors({ table_name: 'Выберите таблицу' })).toEqual({
      table: true,
      options: false,
      advanced: false,
    });
    expect(getSectionErrors({ partition_col: 'Выберите колонку' })).toEqual({
      table: false,
      options: true,
      advanced: false,
    });
    expect(getSectionErrors({ limit: 'Неверный лимит' })).toEqual({
      table: false,
      options: true,
      advanced: true,
    });
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
