import type { LogEntrySchema } from '@/shared/gatewayClient';

export interface DisplayLogEntry extends LogEntrySchema {
  combinedMessage: string;
  formattedTime: string;
  formattedTimestamp: string;
  locationLabel: string;
  normalizedLevel: string;
}

export const LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR'] as const;

export type LogLevelFilter = 'all' | (typeof LOG_LEVELS)[number];

export const formatLogEntry = (log: LogEntrySchema): string => {
  const timestamp = new Date(log.created_at).toISOString();
  const level = log.level?.toUpperCase() ?? 'UNKNOWN';
  const service = log.service_name ?? 'unknown-service';
  const logger = log.logger_name ?? '';
  const locationParts: string[] = [];

  if (log.module) locationParts.push(log.module);
  if (log.function) locationParts.push(log.function);

  const location = locationParts.join('.');
  const line = typeof log.line === 'number' ? `:${log.line}` : '';
  const locationString =
    location || line ? `${location}${line}`.trim() : undefined;

  let formatted = `[${timestamp}] [${level}] ${service}`;

  if (logger) {
    formatted += ` ${logger}`;
  }

  if (locationString) {
    formatted += ` ${locationString}`;
  }

  formatted += ` - ${log.message}`;

  if (log.exception_traceback) {
    formatted += `\n${log.exception_traceback}`;
  }

  return formatted;
};

export const serializeLogs = (logs: LogEntrySchema[]): string =>
  logs.map(formatLogEntry).join('\n\n');

const fallbackCopyText = (text: string): boolean => {
  if (typeof document === 'undefined') return false;

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let success = false;

  try {
    success = document.execCommand('copy');
  } catch (error) {
    console.error('[LogViewer] Fallback copy failed', error);
  } finally {
    document.body.removeChild(textArea);
  }

  return success;
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error('[LogViewer] Clipboard copy failed', error);
  }

  return fallbackCopyText(text);
};

export const downloadTextFile = (text: string, filename: string) => {
  if (typeof document === 'undefined') return;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const normalizeLevel = (level?: string | null) =>
  (level ?? 'UNKNOWN').toUpperCase();

export const formatLogTime = (value?: string | null) => {
  if (!value) return '--:--:--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '--:--:--';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatLogTimestamp = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString();
};

export const buildLocationLabel = (log: LogEntrySchema) => {
  const locationParts: string[] = [];

  if (log.module) locationParts.push(log.module);
  if (log.function) locationParts.push(log.function);

  const location = locationParts.join('.');
  const line = typeof log.line === 'number' ? `:${log.line}` : '';

  return location || line ? `${location}${line}` : '—';
};

export const buildDisplayLog = (log: LogEntrySchema): DisplayLogEntry => ({
  ...log,
  combinedMessage: log.exception_traceback
    ? `${log.message}\n${log.exception_traceback}`
    : log.message,
  formattedTime: formatLogTime(log.created_at),
  formattedTimestamp: formatLogTimestamp(log.created_at),
  locationLabel: buildLocationLabel(log),
  normalizedLevel: normalizeLevel(log.level),
});

export const filterLogsBySearchTerm = (
  logs: LogEntrySchema[],
  searchTerm: string | null
) => {
  const normalizedSearchTerm = searchTerm?.trim().toLowerCase() ?? null;

  if (!normalizedSearchTerm) {
    return logs;
  }

  return logs.filter(log => {
    const serviceName = log.service_name?.toLowerCase() ?? '';
    const loggerName = log.logger_name?.toLowerCase() ?? '';
    const moduleName = log.module?.toLowerCase() ?? '';
    const functionName = log.function?.toLowerCase() ?? '';
    const levelName = log.level?.toLowerCase() ?? '';
    const traceback = log.exception_traceback?.toLowerCase() ?? '';

    return (
      log.message.toLowerCase().includes(normalizedSearchTerm) ||
      serviceName.includes(normalizedSearchTerm) ||
      loggerName.includes(normalizedSearchTerm) ||
      moduleName.includes(normalizedSearchTerm) ||
      functionName.includes(normalizedSearchTerm) ||
      levelName.includes(normalizedSearchTerm) ||
      traceback.includes(normalizedSearchTerm)
    );
  });
};
