import { MODE_OPTIONS } from './constants';
import type {
  ColumnBaseType,
  PartitionGrouping,
  PartitionGroupingMode,
} from './types';

export type PartitionGroupingFieldKind =
  | 'integer'
  | 'number'
  | 'text'
  | 'json'
  | 'boolean'
  | 'select';

export type PartitionGroupingFieldOption = {
  value: string;
  label: string;
};

export type PartitionGroupingField = {
  key: string;
  label: string;
  kind: PartitionGroupingFieldKind;
  placeholder?: string;
  required?: boolean;
  /** Значение, которое движок применяет, пока параметр не задан явно. */
  defaultValue?: boolean | string;
  options?: PartitionGroupingFieldOption[];
};

const GRANULARITY_OPTIONS: PartitionGroupingFieldOption[] = [
  { value: 'hour', label: 'Час' },
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'year', label: 'Год' },
];

/**
 * Параметры каждого режима группировки: тип поля, подпись и значения
 * по умолчанию. Общий источник для всех редакторов группировки.
 */
export const PARTITION_GROUPING_FIELDS: Record<
  PartitionGroupingMode,
  PartitionGroupingField[]
> = {
  range: [],
  hash: [
    {
      key: 'buckets',
      label: 'Количество бакетов',
      kind: 'integer',
      placeholder: '32',
    },
    {
      key: 'mod',
      label: 'Mod — вместо бакетов',
      kind: 'integer',
      placeholder: '64',
    },
  ],
  prefix: [
    {
      key: 'length',
      label: 'Длина префикса',
      kind: 'integer',
      placeholder: '2',
      required: true,
    },
    {
      key: 'lower',
      label: 'Без учёта регистра',
      kind: 'boolean',
      defaultValue: true,
    },
    {
      key: 'max_groups',
      label: 'Максимум групп',
      kind: 'integer',
      placeholder: '200',
    },
    {
      key: 'other',
      label: 'Группа для остальных',
      kind: 'boolean',
      defaultValue: false,
    },
  ],
  explicit_values: [
    {
      key: 'values',
      label: 'Значения',
      kind: 'json',
      placeholder: '["RU", "US"]',
      required: true,
    },
    {
      key: 'other',
      label: 'Группа для остальных',
      kind: 'boolean',
      defaultValue: false,
    },
  ],
  quantiles: [
    {
      key: 'k',
      label: 'Количество квантилей',
      kind: 'integer',
      placeholder: '4',
      required: true,
    },
  ],
  percentiles: [
    {
      key: 'percentiles',
      label: 'Перцентили',
      kind: 'json',
      placeholder: '[0.1, 0.5, 0.9]',
      required: true,
    },
  ],
  ranges: [
    {
      key: 'ranges',
      label: 'Диапазоны',
      kind: 'json',
      placeholder: '[[0, 10], [10, 100]]',
      required: true,
    },
  ],
  step: [
    {
      key: 'start',
      label: 'Начало',
      kind: 'text',
      placeholder: '0 или 2024-01-01',
    },
    { key: 'step', label: 'Шаг', kind: 'number', placeholder: '1' },
    {
      key: 'bins',
      label: 'Количество интервалов',
      kind: 'integer',
      placeholder: '10',
    },
  ],
  granularity: [
    {
      key: 'granularity',
      label: 'Гранулярность',
      kind: 'select',
      required: true,
      defaultValue: 'day',
      options: GRANULARITY_OPTIONS,
    },
  ],
  as_is: [],
};

export const getAvailablePartitionGroupingModes = (
  columnType: ColumnBaseType
) =>
  columnType === 'UNKNOWN'
    ? MODE_OPTIONS
    : MODE_OPTIONS.filter(option =>
        option.compatibleTypes.includes(columnType)
      );

/** Начальное значение группировки: только обязательные параметры режима. */
export const getInitialPartitionGrouping = (
  mode: PartitionGroupingMode
): PartitionGrouping => {
  switch (mode) {
    case 'prefix':
      return { mode, length: 2 };
    case 'explicit_values':
      return { mode, values: [] };
    case 'quantiles':
      return { mode, k: 4 };
    case 'percentiles':
      return { mode, percentiles: [0.1, 0.5, 0.9] };
    case 'ranges':
      return { mode, ranges: [] };
    case 'granularity':
      return { mode, granularity: 'day' };
    default:
      return { mode };
  }
};

const INTEGER_KEYS = new Set([
  'length',
  'max_groups',
  'buckets',
  'mod',
  'k',
  'bins',
]);
const BOOLEAN_KEYS = new Set(['lower', 'other']);
const JSON_KEYS = new Set(['quantiles', 'percentiles', 'values', 'ranges']);

const omitKey = (value: PartitionGrouping, key: string): PartitionGrouping => {
  const next = { ...value };
  delete next[key];
  return next;
};

/**
 * Применяет введённую строку к параметру группировки. Пустая строка
 * удаляет необязательный параметр, некорректное число — тоже.
 */
export const applyPartitionGroupingParameter = (
  value: PartitionGrouping,
  key: string,
  rawValue: string
): PartitionGrouping => {
  if (rawValue === '') {
    return omitKey(value, key);
  }

  if (INTEGER_KEYS.has(key)) {
    const parsed = parseInt(rawValue, 10);
    return Number.isNaN(parsed)
      ? omitKey(value, key)
      : { ...value, [key]: parsed };
  }

  if (BOOLEAN_KEYS.has(key)) {
    return { ...value, [key]: rawValue === 'true' };
  }

  if (key === 'start' || key === 'step') {
    if (key === 'start' && Number.isNaN(parseFloat(rawValue))) {
      return { ...value, [key]: rawValue };
    }
    const parsed = parseFloat(rawValue);
    return Number.isNaN(parsed)
      ? omitKey(value, key)
      : { ...value, [key]: parsed };
  }

  if (JSON_KEYS.has(key)) {
    try {
      return { ...value, [key]: JSON.parse(rawValue) };
    } catch {
      return { ...value, [key]: rawValue };
    }
  }

  return { ...value, [key]: rawValue };
};

/** Строковое представление параметра для поля ввода. */
export const formatPartitionGroupingParameter = (
  field: PartitionGroupingField,
  fieldValue: unknown
): string => {
  if (fieldValue === undefined || fieldValue === null) {
    return '';
  }
  if (typeof fieldValue === 'string') {
    return fieldValue;
  }
  if (field.kind === 'json') {
    return JSON.stringify(fieldValue);
  }
  return String(fieldValue);
};
