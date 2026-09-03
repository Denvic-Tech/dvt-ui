import type { ExtensionRepackS3ParquetCapabilities } from '@/app/extensions/types';

import { normalizeRelativeStoragePath } from '@/shared/lib/file-storage-target-path';
import { isExpressionValue } from '@/shared/lib/node-input-values';

export type RepackS3ParquetValues = {
  source_pattern?: unknown;
  target_path?: unknown;
  connection_overrides?: unknown;
  min_file_size_bytes?: number | null;
  max_output_size_bytes?: number | null;
};


export const SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export type SizeUnit = (typeof SIZE_UNITS)[number];

const SIZE_FACTORS: Record<SizeUnit, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
};

const DEFAULT_SIZE_UNIT: SizeUnit = 'MB';
const DISPLAY_DECIMALS = 3;

const trimTrailingZeros = (value: string) =>
  value.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');

export const getSourcePatternPickerSelectedPath = (
  value: unknown
): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeRelativeStoragePath(value);
  if (!normalized) {
    return null;
  }

  const wildcardIndex = Array.from(normalized).findIndex(char => '*?['.includes(char));
  if (wildcardIndex === -1) {
    return normalized;
  }

  const beforeWildcard = normalized.slice(0, wildcardIndex);
  const lastSlashIndex = beforeWildcard.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return null;
  }

  return beforeWildcard.slice(0, lastSlashIndex) || null;
};

export const buildParquetPatternFromFolder = (path: string) => {
  const normalizedPath = normalizeRelativeStoragePath(path);
  return normalizedPath ? `${normalizedPath}/*.parquet` : '*.parquet';
};

export const convertSizeToBytes = (
  rawValue: string,
  unit: SizeUnit
): number | null => {
  const normalized = rawValue.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed * SIZE_FACTORS[unit]);
};

const formatDisplayNumber = (value: number) => {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return trimTrailingZeros(value.toFixed(DISPLAY_DECIMALS));
};

export const getSizeInputStateFromBytes = (
  bytes: number | null | undefined
): {
  value: string;
  unit: SizeUnit;
} => {
  if (!Number.isFinite(bytes) || bytes == null || bytes <= 0) {
    return {
      value: '',
      unit: DEFAULT_SIZE_UNIT,
    };
  }

  const absoluteBytes = Math.abs(bytes);
  const preferredUnit =
    [...SIZE_UNITS]
      .reverse()
      .find(unit => absoluteBytes >= SIZE_FACTORS[unit]) ?? 'B';

  return {
    value: formatDisplayNumber(bytes / SIZE_FACTORS[preferredUnit]),
    unit: preferredUnit,
  };
};

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  Number.isInteger(value) &&
  value > 0;


const getRequiredPathError = (value: unknown, label: string) => {
  if (isExpressionValue(value)) {
    return value.value.trim() ? null : `Укажите expression для ${label}`;
  }

  if (typeof value === 'string' && value.trim()) {
    return null;
  }

  return `Укажите ${label}`;
};

export const validateRepackS3ParquetValues = (
  values: RepackS3ParquetValues
): Partial<Record<keyof RepackS3ParquetValues, string>> => {
  const next: Partial<Record<keyof RepackS3ParquetValues, string>> = {};

  const sourcePatternError = getRequiredPathError(
    values.source_pattern,
    'source pattern'
  );
  if (sourcePatternError) {
    next.source_pattern = sourcePatternError;
  }

  const targetPathError = getRequiredPathError(values.target_path, 'target path');
  if (targetPathError) {
    next.target_path = targetPathError;
  } else if (
    typeof values.target_path === 'string' &&
    /[\\/]$/u.test(values.target_path.trim())
  ) {
    next.target_path =
      'Укажите target path до parquet-файла, а не только папку';
  }

  if (!isPositiveInteger(values.min_file_size_bytes)) {
    next.min_file_size_bytes =
      'min_file_size_bytes должен быть больше нуля';
  }

  if (!isPositiveInteger(values.max_output_size_bytes)) {
    next.max_output_size_bytes =
      'max_output_size_bytes должен быть больше нуля';
  }

  if (
    isPositiveInteger(values.min_file_size_bytes) &&
    isPositiveInteger(values.max_output_size_bytes) &&
    values.min_file_size_bytes > values.max_output_size_bytes
  ) {
    const relationError =
      'min_file_size_bytes должен быть меньше или равен max_output_size_bytes';
    next.min_file_size_bytes = relationError;
    next.max_output_size_bytes = relationError;
  }

  return next;
};

export const repackS3ParquetHostCapabilities: ExtensionRepackS3ParquetCapabilities =
  {
    constants: {
      sizeUnits: SIZE_UNITS,
    },
    helpers: {
      buildParquetPatternFromFolder,
      convertSizeToBytes,
      getSizeInputStateFromBytes,
      getSourcePatternPickerSelectedPath,
      validateValues: validateRepackS3ParquetValues,
    },
  };
