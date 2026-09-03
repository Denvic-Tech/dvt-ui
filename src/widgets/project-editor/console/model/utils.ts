import type { LogEntrySchema as LogEntry } from '@/shared/gatewayClient';

export const getLevelColor = (level: LogEntry['level']): string => {
  switch (level) {
    case 'ERROR':
      return '#f44336';
    case 'WARNING':
      return '#ff9800';
    case 'INFO':
      return '#2196f3';
    case 'DEBUG':
      return '#9e9e9e';
    default:
      return '#ffffff';
  }
};
