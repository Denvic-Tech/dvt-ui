import type { KeyValueRow } from './types';

export const createRowId = () =>
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const buildRowsFromObject = (
  value: unknown,
  omitKeys: string[] = []
): KeyValueRow[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !omitKeys.includes(key))
    .map(([key, val]) => ({
      id: createRowId(),
      key: String(key),
      value: val === undefined || val === null ? '' : String(val),
    }));
};

export const buildObjectFromRows = (rows: KeyValueRow[]) => {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim();
    if (!key) return acc;
    acc[key] = row.value ?? '';
    return acc;
  }, {});
};

export const ensureTrailingEmptyRow = (rows: KeyValueRow[]) => {
  const hasEmpty = rows.some(row => !row.key && !row.value);
  return hasEmpty ? rows : [...rows, { id: createRowId(), key: '', value: '' }];
};
