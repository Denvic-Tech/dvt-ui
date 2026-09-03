import { describe, expect, it } from 'vitest';

import { makeExpressionValue } from '@/shared/lib/node-input-values';

import {
  applySaveParquetDefaults,
  applySaveParquetMode,
  applySaveParquetModeValue,
  getParquetFilenameExample,
  getSaveParquetLayout,
  hydrateSaveParquetDraft,
  normalizeParquetFilenameTemplate,
  normalizeSimpleParquetPath,
  switchSaveParquetToAdvanced,
  switchSaveParquetToSimple,
  upgradeLegacySaveParquetDraft,
  validateParquetFilenameSafety,
  validateSaveParquetExpressionFields,
} from './SaveParquetEditor.helpers';

const validationOptions = {
  compressionDefault: 'snappy',
  compressionOptions: ['snappy', 'zstd'],
  modeDefault: 'create',
  modeOptions: ['create', 'overwrite', 'append'],
  allColumns: ['country', 'created_at'],
};

describe('SaveParquet layout helpers', () => {
  it('uses Simple only for the exact simple contract', () => {
    expect(
      getSaveParquetLayout({
        path: 'reports/orders.parquet',
        mode: 'create',
        filename_template: null,
        row_cap: null,
        partition_on: null,
      })
    ).toBe('simple');

    expect(getSaveParquetLayout({ mode: 'append' })).toBe('advanced');
    expect(getSaveParquetLayout({ row_cap: 1000 })).toBe('advanced');
    expect(getSaveParquetLayout({ partition_on: ['country'] })).toBe(
      'advanced'
    );
    expect(getSaveParquetLayout({ filename_template: '<uuid>.parquet' })).toBe(
      'advanced'
    );
    expect(
      getSaveParquetLayout({
        mode: makeExpressionValue('runtime_mode', 'single'),
      })
    ).toBe('advanced');
  });

  it('transforms Simple to Advanced and assigns increment preset', () => {
    expect(
      switchSaveParquetToAdvanced({
        path: 'reports/orders.parquet',
        mode: 'create',
        row_cap: null,
        partition_on: null,
        filename_template: null,
      })
    ).toMatchObject({
      path: 'reports/orders',
      filename_template: '<increment>.parquet',
    });
  });

  it('transforms Advanced to Simple and clears advanced-only fields', () => {
    expect(
      switchSaveParquetToSimple({
        path: 'reports/orders',
        mode: 'overwrite',
        row_cap: 1000,
        partition_on: ['country'],
        filename_template: '<uuid>.parquet',
      })
    ).toMatchObject({
      path: 'reports/orders.parquet',
      mode: 'overwrite',
      row_cap: null,
      partition_on: null,
      filename_template: null,
    });
  });

  it('normalizes trailing separators during layout transformations', () => {
    for (const path of [
      'reports/orders/',
      'reports/orders////',
      'reports/orders',
      'reports/orders.parquet',
    ]) {
      expect(switchSaveParquetToSimple({ path, mode: 'create' }).path).toBe(
        'reports/orders.parquet'
      );
    }
    expect(
      switchSaveParquetToAdvanced({
        path: 'reports/orders.parquet////',
        mode: 'create',
      }).path
    ).toBe('reports/orders');
  });

  it('append mode automatically switches Simple to Advanced', () => {
    expect(
      applySaveParquetMode(
        {
          path: 'reports/orders.parquet',
          mode: 'create',
          filename_template: null,
        },
        'append'
      )
    ).toMatchObject({
      mode: 'append',
      path: 'reports/orders',
      filename_template: '<increment>.parquet',
    });
  });

  it('mode expression automatically switches Simple configuration to Advanced', () => {
    const mode = makeExpressionValue('runtime_mode', 'single');
    expect(
      applySaveParquetModeValue(
        {
          path: 'reports/orders.parquet',
          mode: 'create',
          filename_template: null,
        },
        mode
      )
    ).toMatchObject({
      mode,
      path: 'reports/orders',
      filename_template: '<increment>.parquet',
    });
  });

  it('does not allow switching append layout to Simple', () => {
    const values = {
      path: 'reports/orders',
      mode: 'append' as const,
      filename_template: '<increment>.parquet',
    };
    expect(switchSaveParquetToSimple(values)).toBe(values);
  });

  it('does not allow switching expression mode layout to Simple or clear advanced fields', () => {
    const mode = makeExpressionValue('runtime_mode', 'single');
    const values = {
      path: 'reports/orders',
      mode,
      filename_template: '<increment>.parquet',
      row_cap: 100,
      partition_on: ['country'],
    };

    const result = switchSaveParquetToSimple(values);

    expect(result).toBe(values);
    expect(getSaveParquetLayout(result)).toBe('advanced');
    expect(result).toEqual(values);
  });

  it('materializes the Advanced filename template during hydration only', () => {
    for (const values of [
      { row_cap: 100 },
      { mode: 'append' as const },
      { partition_on: ['country'] },
      { mode: makeExpressionValue('runtime_mode', 'single') },
    ]) {
      expect(hydrateSaveParquetDraft(values).values.filename_template).toBe(
        '<increment>.parquet'
      );
    }

    expect(
      hydrateSaveParquetDraft({
        mode: 'create',
        row_cap: null,
        partition_on: null,
        filename_template: null,
      }).values.filename_template
    ).toBeNull();
  });

  it('always normalizes editor draft compatibility mode to new', () => {
    expect(upgradeLegacySaveParquetDraft({}).values.compatibility_mode).toBe(
      'new'
    );
    expect(
      upgradeLegacySaveParquetDraft({ compatibility_mode: 'new' }).values
        .compatibility_mode
    ).toBe('new');
  });

  it('upgrades legacy editor draft to new without touching other inputs', () => {
    const source = {
      compatibility_mode: 'legacy' as const,
      path: 'reports/orders.parquet',
      row_cap: 1000,
    };
    const result = upgradeLegacySaveParquetDraft(source);

    expect(result.wasLegacy).toBe(true);
    expect(result.values).toEqual({ ...source, compatibility_mode: 'new' });
  });

  it.each([
    ['row_cap', { row_cap: 100 }],
    ['append', { mode: 'append' as const }],
    ['partition_on', { partition_on: ['country'] }],
    ['existing advanced template', { filename_template: '<uuid>.parquet' }],
  ])(
    'normalizes legacy Advanced literal path for %s',
    (_case, advancedValues) => {
      const result = hydrateSaveParquetDraft({
        compatibility_mode: 'legacy',
        path: 'reports/orders.parquet',
        ...advancedValues,
      });

      expect(result.wasLegacy).toBe(true);
      expect(result.values.compatibility_mode).toBe('new');
      expect(result.values.path).toBe('reports/orders');
      expect(result.values.filename_template).not.toBeNull();
    }
  );

  it('keeps legacy expression path untouched while preserving the warning state', () => {
    const path = makeExpressionValue('output_path', 'single');
    const result = hydrateSaveParquetDraft({
      compatibility_mode: 'legacy',
      path,
      row_cap: 100,
    });

    expect(result.wasLegacy).toBe(true);
    expect(result.values.path).toBe(path);
    expect(result.values.filename_template).toBe('<increment>.parquet');
  });

  it('blocks collision-unsafe templates for append, row_cap and partition_on', () => {
    for (const values of [
      { mode: 'append', filename_template: '<partition_index>.parquet' },
      { row_cap: 10, filename_template: '<partition_index>.parquet' },
      {
        partition_on: ['country'],
        filename_template: '<partition_index>.parquet',
      },
      { mode: 'append', filename_template: 'fixed.parquet' },
      { row_cap: 10, filename_template: 'fixed.parquet' },
      { partition_on: ['country'], filename_template: 'fixed.parquet' },
    ]) {
      expect(validateParquetFilenameSafety(values)).toContain('<increment>');
    }
    expect(
      validateParquetFilenameSafety({
        mode: 'append',
        filename_template: '<uuid>.parquet',
      })
    ).toBeNull();
    expect(
      validateParquetFilenameSafety({
        row_cap: 10,
        filename_template: '<increment>.parquet',
      })
    ).toBeNull();
  });

  it('normalizes simple path and filename extension and renders token preview', () => {
    expect(normalizeSimpleParquetPath('reports/orders')).toBe(
      'reports/orders.parquet'
    );
    expect(normalizeParquetFilenameTemplate('data_<uuid>')).toBe(
      'data_<uuid>.parquet'
    );
    expect(
      getParquetFilenameExample(
        'some_prefix.<increment>_<uuid>.some_postfix.parquet'
      )
    ).toBe(
      'some_prefix.00042_550e8400-e29b-41d4-a716-446655440000.some_postfix.parquet'
    );
  });
});

describe('SaveParquet expression helpers', () => {
  it('does not replace hydrated expressions with literal defaults', () => {
    const mode = makeExpressionValue('runtime_mode', 'single');
    const compression = makeExpressionValue('runtime_codec', 'single');
    const values = { mode, compression };

    const result = applySaveParquetDefaults(values, 'create', 'snappy');

    expect(result).toBe(values);
    expect(result).toEqual({ mode, compression });
  });

  it('applies defaults only to empty literal values', () => {
    expect(applySaveParquetDefaults({}, 'create', 'snappy')).toEqual({
      mode: 'create',
      compression: 'snappy',
    });
  });

  it('restores defaults after modal hydration replaces the initial draft', () => {
    const initialDraft = applySaveParquetDefaults({}, 'create', 'snappy');
    expect(initialDraft.mode).toBe('create');

    const hydratedDraft = {};

    expect(applySaveParquetDefaults(hydratedDraft, 'create', 'snappy')).toEqual(
      {
        mode: 'create',
        compression: 'snappy',
      }
    );
  });

  it('accepts non-empty expressions without applying literal validation', () => {
    const expression = (value: string) => makeExpressionValue(value, 'single');

    expect(
      validateSaveParquetExpressionFields({
        ...validationOptions,
        values: {
          row_cap: expression('runtime_limit'),
          compression: expression('runtime_codec'),
          mode: expression('runtime_mode'),
          partition_on: expression('runtime_partitions'),
          write_index: expression('include_index'),
        },
      })
    ).toEqual({});
  });

  it('rejects an empty expression for every supported field', () => {
    const emptyExpression = makeExpressionValue('   ', 'single');

    expect(
      validateSaveParquetExpressionFields({
        ...validationOptions,
        values: {
          row_cap: emptyExpression,
          compression: emptyExpression,
          mode: emptyExpression,
          partition_on: emptyExpression,
          write_index: emptyExpression,
        },
      })
    ).toEqual({
      row_cap: 'Укажите expression для row_cap',
      compression: 'Укажите expression для compression',
      mode: 'Укажите expression для mode',
      partition_on: 'Укажите expression для partition_on',
      write_index: 'Укажите expression для write_index',
    });
  });

  it('keeps the existing literal validation rules', () => {
    expect(
      validateSaveParquetExpressionFields({
        ...validationOptions,
        values: {
          row_cap: 0,
          compression: 'unknown',
          mode: 'merge',
          partition_on: ['missing_column'],
          write_index: true,
        },
      })
    ).toEqual({
      row_cap: 'row_cap должен быть целым числом >= 1',
      compression: 'Недопустимое значение сжатия (compression)',
      mode: 'Недопустимое значение режима записи (mode)',
      partition_on: 'Некоторые столбцы отсутствуют во входных данных',
    });
  });
});
