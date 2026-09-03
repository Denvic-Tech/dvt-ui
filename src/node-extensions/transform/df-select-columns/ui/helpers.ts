import type { Column, DataType } from '@/shared/gatewayClient';

export type DisplayColumn = {
  name: string;
  type: DataType | 'UNKNOWN';
};

export const typeIcons: Record<string, string> = {
  STRING: 'Aa',
  INT: '123',
  FLOAT: '.00',
  BOOLEAN: '0/1',
  DATE: 'D',
  DATETIME: 'DT',
  TIMESTAMP: 'TS',
  TIMEDELTA: '+/-',
  CATEGORY: 'Cat',
  DICTIONARY: '{}',
  OBJECT: '{}',
  UNKNOWN: '?',
};

export const getTypeIcon = (type: DisplayColumn['type']): string =>
  typeIcons[type] ?? typeIcons['UNKNOWN'];

export const toSelectedColumns = (
  selectedColumnNames: string[],
  columns: Column[]
): DisplayColumn[] => {
  const columnsMap = new Map(columns.map(column => [column.name, column]));

  return selectedColumnNames.map(name => {
    const column = columnsMap.get(name);

    return {
      name,
      type: column?.dtype ?? 'UNKNOWN',
    };
  });
};

export const toAvailableColumns = (
  selectedColumnNames: string[],
  columns: Column[]
): DisplayColumn[] =>
  columns
    .filter(column => !selectedColumnNames.includes(column.name))
    .map(column => ({
      name: column.name,
      type: column.dtype,
    }));
