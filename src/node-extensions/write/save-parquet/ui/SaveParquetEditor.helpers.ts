import type { FileStorageConnectionOverridesValue } from '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers';

import type { NodeInputExpressionValue } from '@/shared/gatewayClient';
import { isExpressionValue } from '@/shared/lib/node-input-values';

const PARQUET_TYPE_GROUPS = {
  Numeric: [
    'int8',
    'int16',
    'int32',
    'int64',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'float16',
    'float32',
    'float64',
    'bool',
  ],
  'String/Binary': ['string', 'large_string', 'binary', 'large_binary'],
  DateTime: [
    'date32',
    'date64',
    'time32[s]',
    'time32[ms]',
    'time64[us]',
    'time64[ns]',
    'timestamp[s]',
    'timestamp[ms]',
    'timestamp[us]',
    'timestamp[ns]',
    'timestamp[us, tz=UTC]',
    'timestamp[ns, tz=UTC]',
    'duration[s]',
    'duration[ms]',
    'duration[us]',
    'duration[ns]',
  ],
  Decimal: [
    'decimal128(10,2)',
    'decimal128(18,2)',
    'decimal128(38,10)',
    'decimal256(38,10)',
  ],
} as const;

export type ParquetGroup = keyof typeof PARQUET_TYPE_GROUPS;

export type ParquetTypeOption = {
  value: string;
  label: string;
  group: string;
};

export type MappingFilter = 'all' | 'configured' | 'infer';

export const PARQUET_TYPE_OPTIONS: ParquetTypeOption[] = (
  Object.entries(PARQUET_TYPE_GROUPS) as Array<
    [ParquetGroup, readonly string[]]
  >
).flatMap(([group, values]) =>
  values.map(value => ({ value, label: value, group }))
);

export const SUPPORTED_PARQUET_TYPES = new Set(
  PARQUET_TYPE_OPTIONS.map(option => option.value)
);

export type ExpressionCapableValue<T> = T | NodeInputExpressionValue;

export type SaveParquetValues = {
  path?: unknown;
  connection_overrides?: FileStorageConnectionOverridesValue;
  filename?: string | null;
  filename_template?: ExpressionCapableValue<string | null>;
  compatibility_mode?: 'legacy' | 'new';
  compression?: ExpressionCapableValue<string | null>;
  write_index?: ExpressionCapableValue<boolean | null>;
  partition_on?: ExpressionCapableValue<string[] | null>;
  mode?: ExpressionCapableValue<string | null>;
  row_cap?: ExpressionCapableValue<number | null>;
  parquet_types?: Record<string, string> | null;
};

export const DEFAULT_PARQUET_FILENAME_TEMPLATE = '<increment>.parquet';

export type SaveParquetLayout = 'simple' | 'advanced';

export const normalizeParquetFilenameTemplate = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.toLowerCase().endsWith('.parquet')
    ? trimmed
    : `${trimmed}.parquet`;
};

export const getSaveParquetLayout = (
  values: SaveParquetValues,
  modeDefault = 'create'
): SaveParquetLayout => {
  if (isExpressionValue(values.mode)) {
    return 'advanced';
  }
  const mode =
    typeof values.mode === 'string' ? values.mode : modeDefault || 'create';
  const hasPartitioning =
    isExpressionValue(values.partition_on) ||
    (Array.isArray(values.partition_on) && values.partition_on.length > 0);

  return values.filename_template == null &&
    values.row_cap == null &&
    !hasPartitioning &&
    mode !== 'append'
    ? 'simple'
    : 'advanced';
};

const trimTrailingPathSeparators = (path: string): string =>
  path.replace(/[\\/]+$/g, '');

const removeParquetSuffix = (path: string): string =>
  trimTrailingPathSeparators(path).replace(/\.parquet$/i, '');

export const normalizeSimpleParquetPath = (path: string): string => {
  const trimmed = trimTrailingPathSeparators(path.trim());
  if (!trimmed) {
    return '';
  }
  return trimmed.toLowerCase().endsWith('.parquet')
    ? trimmed
    : `${trimmed}.parquet`;
};

export const switchSaveParquetToAdvanced = (
  values: SaveParquetValues
): SaveParquetValues => ({
  ...values,
  path:
    typeof values.path === 'string'
      ? removeParquetSuffix(values.path.trim())
      : values.path,
  filename_template:
    values.filename_template ?? DEFAULT_PARQUET_FILENAME_TEMPLATE,
});

export const switchSaveParquetToSimple = (
  values: SaveParquetValues
): SaveParquetValues => {
  if (isExpressionValue(values.mode) || values.mode === 'append') {
    return values;
  }
  return {
    ...values,
    path:
      typeof values.path === 'string'
        ? normalizeSimpleParquetPath(values.path)
        : values.path,
    filename_template: null,
    row_cap: null,
    partition_on: null,
  };
};

export const applySaveParquetMode = (
  values: SaveParquetValues,
  mode: string
): SaveParquetValues => {
  const withMode = { ...values, mode };
  return mode === 'append' ? switchSaveParquetToAdvanced(withMode) : withMode;
};

export const applySaveParquetModeValue = (
  values: SaveParquetValues,
  mode: SaveParquetValues['mode']
): SaveParquetValues => {
  if (isExpressionValue(mode)) {
    return switchSaveParquetToAdvanced({ ...values, mode });
  }
  return applySaveParquetMode(values, mode ?? 'create');
};

export const upgradeLegacySaveParquetDraft = (
  values: SaveParquetValues
): { values: SaveParquetValues; wasLegacy: boolean } => {
  const wasLegacy = values.compatibility_mode === 'legacy';
  if (values.compatibility_mode === 'new') {
    return { values, wasLegacy };
  }
  return {
    values: { ...values, compatibility_mode: 'new' },
    wasLegacy,
  };
};

export const hydrateSaveParquetDraft = (
  values: SaveParquetValues,
  modeDefault = 'create'
): { values: SaveParquetValues; wasLegacy: boolean } => {
  const upgraded = upgradeLegacySaveParquetDraft(values);
  const layout = getSaveParquetLayout(upgraded.values, modeDefault);
  if (layout !== 'advanced') {
    return upgraded;
  }

  const normalizedValues = upgraded.wasLegacy
    ? switchSaveParquetToAdvanced(upgraded.values)
    : upgraded.values;

  return {
    ...upgraded,
    values: {
      ...normalizedValues,
      filename_template:
        normalizedValues.filename_template ?? DEFAULT_PARQUET_FILENAME_TEMPLATE,
    },
  };
};

export const validateParquetFilenameSafety = (
  values: SaveParquetValues
): string | null => {
  if (isExpressionValue(values.filename_template)) {
    return null;
  }
  const template =
    typeof values.filename_template === 'string'
      ? values.filename_template.trim()
      : '';
  if (!template) {
    return null;
  }

  const collisionSafe =
    template.includes('<increment>') || template.includes('<uuid>');
  if (collisionSafe) {
    return null;
  }

  const potentiallyAppend =
    isExpressionValue(values.mode) || values.mode === 'append';
  const canSplitSourcePartition =
    values.row_cap != null ||
    isExpressionValue(values.partition_on) ||
    (Array.isArray(values.partition_on) && values.partition_on.length > 0);
  if (potentiallyAppend || canSplitSourcePartition) {
    return 'Для append, row_cap или partition_on используйте <increment> или <uuid>';
  }
  return null;
};

export const getParquetFilenameExample = (template: string): string => {
  let result = normalizeParquetFilenameTemplate(template);
  for (const [token, value] of [
    ['<partition_index>', '00003'],
    ['<increment>', '00042'],
    ['<uuid>', '550e8400-e29b-41d4-a716-446655440000'],
  ] as const) {
    result = result.split(token).join(value);
  }
  return result;
};

export const applySaveParquetDefaults = (
  values: SaveParquetValues,
  modeDefault?: string | undefined,
  compressionDefault?: string | undefined
): SaveParquetValues => {
  const patch: Partial<SaveParquetValues> = {};
  if (values.mode == null && modeDefault) {
    patch.mode = modeDefault;
  }
  if (values.compression == null && compressionDefault) {
    patch.compression = compressionDefault;
  }

  return Object.keys(patch).length ? { ...values, ...patch } : values;
};

type ValidateSaveParquetFieldsParams = {
  values: SaveParquetValues;
  compressionDefault?: string | undefined;
  compressionOptions: string[];
  modeDefault?: string | undefined;
  modeOptions: string[];
  allColumns: string[];
};

const getEmptyExpressionError = (
  value: unknown,
  message: string
): string | null => {
  if (!isExpressionValue(value)) {
    return null;
  }

  return value.value.trim() ? null : message;
};

export const validateSaveParquetExpressionFields = ({
  values,
  compressionDefault,
  compressionOptions,
  modeDefault,
  modeOptions,
  allColumns,
}: ValidateSaveParquetFieldsParams): Partial<
  Record<keyof SaveParquetValues, string>
> => {
  const errors: Partial<Record<keyof SaveParquetValues, string>> = {};

  if (isExpressionValue(values.compression)) {
    const error = getEmptyExpressionError(
      values.compression,
      'Укажите expression для compression'
    );
    if (error) errors.compression = error;
  } else {
    const compression = (values.compression ?? compressionDefault ?? '').trim();
    if (
      compression &&
      compressionOptions.length &&
      !compressionOptions.includes(compression)
    ) {
      errors.compression = 'Недопустимое значение сжатия (compression)';
    } else if (!compression && compressionOptions.length) {
      errors.compression = 'Выберите сжатие (compression)';
    }
  }

  if (isExpressionValue(values.mode)) {
    const error = getEmptyExpressionError(
      values.mode,
      'Укажите expression для mode'
    );
    if (error) errors.mode = error;
  } else {
    const mode = (values.mode ?? modeDefault ?? '').trim();
    if (mode && modeOptions.length && !modeOptions.includes(mode)) {
      errors.mode = 'Недопустимое значение режима записи (mode)';
    } else if (!mode && modeOptions.length) {
      errors.mode = 'Выберите режим записи (mode)';
    }
  }

  if (isExpressionValue(values.partition_on)) {
    const error = getEmptyExpressionError(
      values.partition_on,
      'Укажите expression для partition_on'
    );
    if (error) errors.partition_on = error;
  } else {
    const parts = values.partition_on;
    if (parts && parts.some(column => !column.trim())) {
      errors.partition_on = 'Имена столбцов должны быть непустыми';
    } else if (
      parts &&
      allColumns.length &&
      parts.some(column => !allColumns.includes(column))
    ) {
      errors.partition_on = 'Некоторые столбцы отсутствуют во входных данных';
    }
  }

  if (isExpressionValue(values.row_cap)) {
    const error = getEmptyExpressionError(
      values.row_cap,
      'Укажите expression для row_cap'
    );
    if (error) errors.row_cap = error;
  } else {
    const rowCap = values.row_cap;
    if (
      rowCap != null &&
      (!Number.isFinite(rowCap) ||
        !Number.isInteger(rowCap) ||
        Number(rowCap) < 1)
    ) {
      errors.row_cap = 'row_cap должен быть целым числом >= 1';
    }
  }

  if (isExpressionValue(values.write_index)) {
    const error = getEmptyExpressionError(
      values.write_index,
      'Укажите expression для write_index'
    );
    if (error) errors.write_index = error;
  }

  return errors;
};

export const toParquetTypeRecord = (
  value: SaveParquetValues['parquet_types']
): Record<string, string> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const record: Record<string, string> = {};
  for (const [column, type] of Object.entries(value)) {
    if (typeof column !== 'string' || typeof type !== 'string') {
      continue;
    }

    const normalizedColumn = column.trim();
    const normalizedType = type.trim();
    if (!normalizedColumn || !normalizedType) {
      continue;
    }

    record[normalizedColumn] = normalizedType;
  }

  return record;
};

export const isSameRecord = (
  a: Record<string, string>,
  b: Record<string, string>
): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
};

export const isIntLikeDtype = (dtype: unknown): boolean => {
  const normalized = String(dtype ?? '').toUpperCase();
  return normalized.includes('INT');
};

export type Tone = 'default' | 'error';
