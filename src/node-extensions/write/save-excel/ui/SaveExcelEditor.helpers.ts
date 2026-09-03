import type { FileStorageConnectionOverridesValue } from '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers';

export const INVALID_SHEET_CHARS = /[:\\/?*[\]]/;

export const isValidSheetName = (name: string) => {
  if (!name) {
    return false;
  }
  if (name.length > 31) {
    return false;
  }

  return !INVALID_SHEET_CHARS.test(name);
};

export const getBooleanDefault = (
  rawValue: unknown,
  fallbackValue: boolean
): boolean => (typeof rawValue === 'boolean' ? rawValue : fallbackValue);

export const getStringDefault = (
  rawValue: unknown,
  fallbackValue: string
): string =>
  typeof rawValue === 'string' && rawValue.trim() ? rawValue : fallbackValue;

export type SaveExcelValues = {
  path?: unknown;
  connection_overrides?: FileStorageConnectionOverridesValue;
  sheet_name?: string | null;
  index?: boolean | null;
  header?: boolean | null;
  single_file?: boolean | null;
  filename?: string | null;
};

export type Tone = 'default' | 'error';
