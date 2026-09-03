import type { Theme } from '@mui/material/styles';

type LogLevel =
  | 'debug'
  | 'info'
  | 'warning'
  | 'error'
  | 'critical'
  | 'success'
  | string;

export const levelColor = (level: LogLevel, theme: Theme) => {
  const normalizedLevel = (level || '').toLowerCase();
  switch (normalizedLevel) {
    case 'debug':
      return theme.palette.text.secondary;
    case 'info':
      return theme.palette.info.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'error':
      return theme.palette.error.main;
    case 'critical':
      return theme.palette.error.dark;
    case 'success':
      return theme.palette.success.main;
    default:
      return theme.palette.text.primary;
  }
};
