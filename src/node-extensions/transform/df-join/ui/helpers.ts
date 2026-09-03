import type { Column } from '@/shared/gatewayClient';

export const normalizeSearchText = (value: string) => value.trim().toLowerCase();

export const matchesSearch = (value: string, query: string) =>
  !query || value.toLowerCase().includes(query);

export const getDataType = (column: Column | null | undefined) =>
  (column?.dtype ?? 'unknown').toUpperCase();

export const getTypeIcon = (dtype: string | null | undefined) => {
  const normalized = dtype?.toUpperCase() ?? '';

  if (
    normalized.includes('STRING') ||
    normalized.includes('STR') ||
    normalized.includes('CHAR') ||
    normalized.includes('TEXT') ||
    normalized.includes('OBJECT')
  ) {
    return 'Aa';
  }

  if (normalized.includes('INT')) {
    return '123';
  }

  if (
    normalized.includes('FLOAT') ||
    normalized.includes('DOUBLE') ||
    normalized.includes('DECIMAL') ||
    normalized.includes('NUMERIC')
  ) {
    return '.00';
  }

  if (normalized.includes('BOOL')) {
    return '01';
  }

  if (normalized.includes('DATE') || normalized.includes('TIME')) {
    return 'DT';
  }

  return '::';
};
