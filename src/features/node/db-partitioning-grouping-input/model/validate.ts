import { GENERIC_ERROR_MESSAGE, MODE_OPTIONS } from './constants';
import type { ColumnBaseType, PartitionGrouping } from './types';

type ValidationResult = {
  isValid: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const isNonEmptyArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.length > 0;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNumberInRange = (value: unknown, min: number, max: number) =>
  isNumber(value) && value > min && value < max;

const isRangeArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) &&
  value.length >= 2 &&
  value[0] !== undefined &&
  value[1] !== undefined;

const isPositiveInteger = (value: unknown): value is number =>
  isNumber(value) && Number.isInteger(value) && value > 0;

export const validatePartitionGrouping = (
  value: PartitionGrouping | null | undefined,
  columnType: ColumnBaseType
): ValidationResult => {
  if (!value) {
    return { isValid: true };
  }

  const fieldErrors: Record<string, string> = {};
  const mode = value.mode;

  if (!mode) {
    return { isValid: false, error: GENERIC_ERROR_MESSAGE };
  }

  const modeInfo = MODE_OPTIONS.find(option => option.value === mode);
  if (!modeInfo) {
    return { isValid: false, error: GENERIC_ERROR_MESSAGE };
  }

  if (
    columnType !== 'UNKNOWN' &&
    !modeInfo.compatibleTypes.includes(columnType)
  ) {
    return { isValid: false, error: GENERIC_ERROR_MESSAGE };
  }

  switch (mode) {
    case 'range':
      break;
    case 'prefix': {
      const length = value['length'];
      if (length === undefined || length === null || length === '') {
        fieldErrors['length'] = 'Length is required.';
      } else if (
        !isNumber(length) ||
        !Number.isInteger(length) ||
        length <= 0
      ) {
        fieldErrors['length'] = 'Length must be a positive integer.';
      }

      if (
        value['lower'] !== undefined &&
        value['lower'] !== null &&
        typeof value['lower'] !== 'boolean'
      ) {
        fieldErrors['lower'] = 'Lower must be a boolean.';
      }

      if (
        value['other'] !== undefined &&
        value['other'] !== null &&
        typeof value['other'] !== 'boolean'
      ) {
        fieldErrors['other'] = 'Other must be a boolean.';
      }

      break;
    }
    case 'explicit_values': {
      const values = value['values'];
      if (!isNonEmptyArray(values)) {
        fieldErrors['values'] = 'Values must be a non-empty array.';
      }
      break;
    }
    case 'quantiles': {
      const k = value['k'];
      if (k === undefined || k === null || k === '') {
        fieldErrors['k'] = 'K is required.';
      } else if (!isPositiveInteger(k) || k < 2) {
        fieldErrors['k'] = 'K must be an integer >= 2.';
      }
      break;
    }
    case 'percentiles': {
      const percentiles = value['percentiles'];
      if (!isNonEmptyArray(percentiles)) {
        fieldErrors['percentiles'] = 'Percentiles must be a non-empty array.';
      } else if (!percentiles.every(item => isNumberInRange(item, 0, 1))) {
        fieldErrors['percentiles'] =
          'Percentiles must be numbers between 0 and 1 (exclusive).';
      }
      break;
    }
    case 'hash': {
      const buckets = value['buckets'];
      const mod = value['mod'];

      if (
        buckets !== undefined &&
        buckets !== null &&
        buckets !== '' &&
        !isPositiveInteger(buckets)
      ) {
        fieldErrors['buckets'] = 'Buckets must be a positive integer.';
      }

      if (
        mod !== undefined &&
        mod !== null &&
        mod !== '' &&
        !isPositiveInteger(mod)
      ) {
        fieldErrors['mod'] = 'Mod must be a positive integer.';
      }
      break;
    }
    case 'ranges': {
      const ranges = value['ranges'];
      if (!isNonEmptyArray(ranges)) {
        fieldErrors['ranges'] = 'Ranges must be a non-empty array.';
      } else if (!ranges.every(item => isRangeArray(item))) {
        fieldErrors['ranges'] =
          'Each range must be an array with [start, end] (optional inclusive flag).';
      }
      break;
    }
    case 'granularity': {
      const granularity = value['granularity'];
      if (!granularity) {
        fieldErrors['granularity'] = 'Granularity is required.';
      } else if (typeof granularity !== 'string') {
        fieldErrors['granularity'] = 'Granularity must be a string.';
      } else if (
        !['hour', 'day', 'week', 'month', 'year'].includes(granularity)
      ) {
        fieldErrors['granularity'] =
          'Granularity must be one of: hour, day, week, month, year.';
      }
      break;
    }
    case 'step':
    case 'as_is':
      break;
    default:
      return { isValid: false, error: GENERIC_ERROR_MESSAGE };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      isValid: false,
      error: GENERIC_ERROR_MESSAGE,
      fieldErrors,
    };
  }

  return { isValid: true };
};
