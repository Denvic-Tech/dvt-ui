import type { TransferWarningSchema } from '@/shared/gatewayClient';

export const DEFAULT_EXPORT_FILE_NAME = 'export.dvtpkg';
export const EXPORT_WARNINGS_HEADER = 'x-dvt-export-warnings';

export type ExportWarning = Pick<
  TransferWarningSchema,
  'code' | 'message' | 'project_ref'
>;

const stripQuotes = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

/**
 * Извлекает имя файла из заголовка `Content-Disposition`.
 * Приоритет у `filename*` (RFC 5987, UTF-8), затем обычный `filename`.
 */
export const parseContentDispositionFileName = (
  header: string | null | undefined,
  fallback: string = DEFAULT_EXPORT_FILE_NAME
): string => {
  if (!header) {
    return fallback;
  }

  const extendedMatch = /filename\*\s*=\s*([^;]+)/i.exec(header);
  if (extendedMatch?.[1]) {
    const raw = stripQuotes(extendedMatch[1]);
    const separatorIndex = raw.indexOf("''");
    const encodedValue =
      separatorIndex >= 0 ? raw.slice(separatorIndex + 2) : raw;
    try {
      const decoded = decodeURIComponent(encodedValue);
      if (decoded.trim().length > 0) {
        return decoded;
      }
    } catch {
      // decodeURIComponent не справился — используем обычный filename ниже
    }
  }

  const plainMatch = /filename\s*=\s*("(?:[^"\\]|\\.)*"|[^;]+)/i.exec(header);
  if (plainMatch?.[1]) {
    const value = stripQuotes(plainMatch[1]).replace(/\\"/g, '"');
    if (value.length > 0) {
      return value;
    }
  }

  return fallback;
};

const isExportWarning = (value: unknown): value is ExportWarning => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['code'] === 'string' &&
    typeof candidate['message'] === 'string'
  );
};

/**
 * Разбирает заголовок `X-DVT-Export-Warnings` (JSON-массив предупреждений).
 * Невалидный или отсутствующий заголовок даёт пустой список.
 */
export const parseExportWarningsHeader = (
  header: string | null | undefined
): ExportWarning[] => {
  if (!header || header.trim().length === 0) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(header);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isExportWarning).map(warning => ({
      code: warning.code,
      message: warning.message,
      project_ref: warning.project_ref ?? null,
    }));
  } catch {
    return [];
  }
};

type HeaderBag =
  | Record<string, unknown>
  | { get?: (name: string) => unknown }
  | null
  | undefined;

/**
 * Читает заголовок без учёта регистра из axios-подобного объекта заголовков.
 */
export const readHeader = (headers: HeaderBag, name: string): string | null => {
  if (!headers) {
    return null;
  }

  const getter = (headers as { get?: unknown }).get;
  if (typeof getter === 'function') {
    const value = getter.call(headers, name);
    if (typeof value === 'string') {
      return value;
    }
  }

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(
    headers as Record<string, unknown>
  )) {
    if (key.toLowerCase() === lowerName) {
      if (typeof value === 'string') {
        return value;
      }
      return value == null ? null : String(value);
    }
  }

  return null;
};
