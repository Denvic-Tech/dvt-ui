import type {
  ColumnDtypeEntry,
  ColumnDtypeOption,
} from '@/features/node/column-dtype-overrides';

export const LOAD_EXCEL_DTYPE_OPTIONS: ColumnDtypeOption[] = [
  { value: 'string', label: 'string' },
  { value: 'Float64', label: 'Float64' },
  { value: 'Int64', label: 'Int64' },
  { value: 'boolean', label: 'boolean' },
];

export const DEFAULT_LOAD_EXCEL_DTYPE =
  LOAD_EXCEL_DTYPE_OPTIONS[0]?.value ?? 'string';

export const THOUSANDS_DISABLED_VALUE = '__disabled__';

export const THOUSANDS_SEPARATOR_OPTIONS: ColumnDtypeOption[] = [
  { value: THOUSANDS_DISABLED_VALUE, label: 'Не использовать' },
  { value: ' ', label: 'Пробел' },
  { value: '\u00a0', label: 'Неразрывный пробел (NBSP)' },
  { value: '\u202f', label: 'Узкий неразрывный пробел' },
  { value: '.', label: 'Точка ( . )' },
  { value: ',', label: 'Запятая ( , )' },
  { value: "'", label: "Апостроф ( ' )" },
];

export const DECIMAL_SEPARATOR_OPTIONS: ColumnDtypeOption[] = [
  { value: '.', label: 'Точка ( . )' },
  { value: ',', label: 'Запятая ( , )' },
];

export const loadExcelDtypesToEntries = (
  dtypes: Record<string, string> | null | undefined
): ColumnDtypeEntry[] =>
  Object.entries(dtypes ?? {}).map(([columnName, dtype]) => ({
    columnName,
    dtype,
  }));

export const buildLoadExcelDtypes = (
  entries: ColumnDtypeEntry[]
): Record<string, string> | null => {
  const result: Record<string, string> = {};

  entries.forEach(({ columnName, dtype }) => {
    if (!columnName.trim() || !dtype) {
      return;
    }

    result[columnName] = dtype;
  });

  return Object.keys(result).length ? result : null;
};

export const findDuplicateDtypeEntryIndexes = (
  entries: ColumnDtypeEntry[]
): number[] => {
  const indexesByColumnName = new Map<string, number[]>();

  entries.forEach(({ columnName }, index) => {
    if (!columnName.trim()) {
      return;
    }

    const indexes = indexesByColumnName.get(columnName) ?? [];
    indexes.push(index);
    indexesByColumnName.set(columnName, indexes);
  });

  return Array.from(indexesByColumnName.values())
    .filter(indexes => indexes.length > 1)
    .flat();
};

export const isLoadExcelDtype = (value: string): boolean =>
  LOAD_EXCEL_DTYPE_OPTIONS.some(option => option.value === value);

export const getThousandsSelectValue = (
  value: string | null | undefined
): string => value ?? THOUSANDS_DISABLED_VALUE;

export const getThousandsPayloadValue = (value: string): string | null =>
  value === THOUSANDS_DISABLED_VALUE ? null : value;

export const getNumericSeparatorError = (
  thousands: string | null | undefined,
  decimal: string | null | undefined
): string | null => {
  if (typeof decimal !== 'string' || decimal.length !== 1) {
    return 'Десятичный разделитель должен быть ровно одним символом';
  }

  if (thousands != null && thousands.length !== 1) {
    return 'Разделитель тысяч должен быть ровно одним символом';
  }

  if (thousands != null && thousands === decimal) {
    return 'Разделители тысяч и дробной части должны отличаться';
  }

  return null;
};
