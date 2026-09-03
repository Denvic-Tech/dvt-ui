import { describe, expect, it } from 'vitest';

import {
  applySelectedVariableDraftRowPatch,
  createSelectedVariableDraftRow,
  getAvailableAggFuncsForColumn,
  hydrateSelectedVariableRows,
  normalizeSelectedVariablesValue,
  serializeSelectedVariableRows,
  validateSelectedVariableRows,
} from './helpers';

describe('dataFrameSelectVariables helpers', () => {
  it('normalizes raw selected_variables payload and keeps only valid records', () => {
    expect(
      normalizeSelectedVariablesValue({
        total_sales: {
          source_column_name: 'sales',
          agg_func: 'sum',
        },
        broken: {
          source_column_name: '',
          agg_func: 'sum',
        },
        wrongAgg: {
          source_column_name: 'sales',
          agg_func: 'median',
        },
      })
    ).toEqual({
      total_sales: {
        source_column_name: 'sales',
        agg_func: 'sum',
      },
    });
  });

  it('hydrates and serializes rows using the node contract', () => {
    const rows = hydrateSelectedVariableRows(
      {
        total_sales: {
          source_column_name: 'sales',
          agg_func: 'sum',
        },
        row_count: {
          source_column_name: 'id',
          agg_func: 'count',
        },
      },
      (() => {
        let index = 0;
        return () => `row-${index++}`;
      })()
    );

    expect(rows).toEqual([
      createSelectedVariableDraftRow('row-0', {
        variableName: 'total_sales',
        sourceColumnName: 'sales',
        aggFunc: 'sum',
      }),
      createSelectedVariableDraftRow('row-1', {
        variableName: 'row_count',
        sourceColumnName: 'id',
        aggFunc: 'count',
      }),
    ]);

    expect(serializeSelectedVariableRows(rows)).toEqual({
      total_sales: {
        source_column_name: 'sales',
        agg_func: 'sum',
      },
      row_count: {
        source_column_name: 'id',
        agg_func: 'count',
      },
    });
  });

  it('exposes numeric-only aggregate functions only for numeric dtypes', () => {
    expect(getAvailableAggFuncsForColumn('INT64')).toEqual([
      'count',
      'nunique',
      'first',
      'last',
      'min',
      'max',
      'sum',
      'mean',
      'std',
      'var',
    ]);

    expect(getAvailableAggFuncsForColumn('STRING')).toEqual([
      'count',
      'nunique',
      'first',
      'last',
      'min',
      'max',
    ]);
  });

  it('applies row patch without losing manual drafts and defaults agg on source change', () => {
    const patched = applySelectedVariableDraftRowPatch({
      row: createSelectedVariableDraftRow('row-1', {
        variableName: '',
        sourceColumnName: '',
        aggFunc: '',
      }),
      patch: {
        sourceColumnName: 'sales',
      },
      getColumnDtype: columnName => (columnName === 'sales' ? 'FLOAT' : null),
    });

    expect(patched).toEqual(
      createSelectedVariableDraftRow('row-1', {
        variableName: 'sales',
        sourceColumnName: 'sales',
        aggFunc: 'count',
      })
    );

    expect(
      applySelectedVariableDraftRowPatch({
        row: patched,
        patch: {
          variableName: 'custom_sales',
          aggFunc: 'sum',
        },
        getColumnDtype: columnName => (columnName === 'sales' ? 'FLOAT' : null),
      })
    ).toEqual(
      createSelectedVariableDraftRow('row-1', {
        variableName: 'custom_sales',
        sourceColumnName: 'sales',
        aggFunc: 'sum',
      })
    );
  });

  it('ignores fully blank rows but rejects duplicates and missing fields', () => {
    const result = validateSelectedVariableRows({
      rows: [
        createSelectedVariableDraftRow('row-1', {
          variableName: 'total_sales',
          sourceColumnName: 'sales',
          aggFunc: 'sum',
        }),
        createSelectedVariableDraftRow('row-2'),
        createSelectedVariableDraftRow('row-3', {
          variableName: 'total_sales',
          sourceColumnName: 'missing_column',
          aggFunc: '',
        }),
      ],
      availableColumnNames: ['sales', 'id'],
    });

    expect(result.isValid).toBe(false);
    expect(result.readyRowsCount).toBe(1);
    expect(result.rowErrors['row-3']).toEqual({
      variableName: 'Имя переменной должно быть уникальным.',
      sourceColumnName:
        'Выбранная колонка отсутствует в подключённом DataFrame.',
      aggFunc: 'Выберите функцию агрегации.',
    });
    expect(result.flatErrors).toContain(
      'Строка 3: Имя переменной должно быть уникальным.'
    );
  });
});
