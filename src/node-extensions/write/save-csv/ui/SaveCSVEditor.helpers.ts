import type { FileStorageConnectionOverridesValue } from '@/features/node/file-storage-target-path/ui/fileStorageConnectionFields.helpers';

export type SaveCSVValues = {
  path?: unknown;
  connection_overrides?: FileStorageConnectionOverridesValue;
  delimiter?: string | null;
  encoding?: string | null;
  index?: boolean | null;
  header?: boolean | null;
  single_file?: boolean | null;
  filename?: string | null;
  usecols?: string[] | null;
};

export type Tone = 'default' | 'error';

export const getBooleanDefault = (
  rawValue: unknown,
  fallbackValue: boolean
): boolean => (typeof rawValue === 'boolean' ? rawValue : fallbackValue);

export const getStringDefault = (
  rawValue: unknown,
  fallbackValue: string | null
): string | null => {
  if (typeof rawValue === 'string') {
    return rawValue;
  }

  return fallbackValue;
};
