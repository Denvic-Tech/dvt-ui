import type { Column } from '@/shared/gatewayClient';

export type ColumnBaseType =
  | 'DATETIME'
  | 'STRING'
  | 'FLOAT'
  | 'INT'
  | 'BOOLEAN'
  | 'default';

export const getColumnBaseType = (
  dtype: string | null | undefined
): ColumnBaseType => {
  if (!dtype) {
    return 'default';
  }

  const type = dtype.toUpperCase();
  if (type.includes('DATE') || type.includes('TIME')) return 'DATETIME';
  if (
    type.includes('STRING') ||
    type.includes('VARCHAR') ||
    type.includes('TEXT') ||
    type.includes('CHAR')
  )
    return 'STRING';
  if (
    type.includes('FLOAT') ||
    type.includes('DOUBLE') ||
    type.includes('DECIMAL') ||
    type.includes('NUMERIC')
  )
    return 'FLOAT';
  if (
    type.includes('INT') ||
    type.includes('BIGINT') ||
    type.includes('SMALLINT')
  )
    return 'INT';
  if (type.includes('BOOL')) return 'BOOLEAN';
  return 'default';
};

export const filterColumnsByQuery = (
  columns: Column[],
  query: string
): Column[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return columns;
  }

  return columns.filter(column =>
    column.name.toLowerCase().includes(normalizedQuery)
  );
};

export const createColumnNameSet = (columns: Column[]): Set<string> =>
  new Set(
    columns
      .map(column => column.name.trim())
      .filter(columnName => columnName !== '')
  );
