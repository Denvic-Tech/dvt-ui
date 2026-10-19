import { isApiError } from '@/shared/lib/errors';

/**
 * Человекочитаемое описание ошибки API (`RegisteredException.description`)
 * с запасными вариантами для нестандартных ответов.
 */
export const getApiErrorDescription = (
  error: unknown,
  fallback: string
): string => {
  if (isApiError(error)) {
    const { description, detail, message } = error.payload;
    if (description && description.trim().length > 0) {
      return description;
    }
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
    if (message && message.trim().length > 0) {
      return message;
    }
    return fallback;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

export const formatBytes = (size: number): string => {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 Б';
  }

  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted =
    unitIndex === 0 ? String(Math.round(value)) : value.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
};
