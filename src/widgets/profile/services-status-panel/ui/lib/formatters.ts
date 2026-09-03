export const MONO_FONT_FAMILY = '"JetBrains Mono", "Fira Code", monospace';

export const formatBytes = (value?: number | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }

  if (value === 0) {
    return '0 Б';
  }

  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  let current = value;
  let unitIndex = 0;

  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }

  const rounded = current >= 10 ? current.toFixed(0) : current.toFixed(1);
  return `${parseFloat(rounded)} ${units[unitIndex]}`;
};

export const formatDuration = (seconds?: number | null): string => {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return '—';
  }

  const value = Math.max(seconds, 0);
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = Math.floor(value % 60);

  if (days > 0) {
    return `${days}д ${hours}ч`;
  }

  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }

  return `${minutes}м ${secs}с`;
};

export const formatPercent = (value?: number | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }

  return `${value.toFixed(1)}%`;
};

export const formatCpuCores = (
  physical?: number | null,
  logical?: number | null
): string => {
  if (
    physical === undefined ||
    physical === null ||
    logical === undefined ||
    logical === null
  ) {
    return '—';
  }

  return physical === logical
    ? `${physical} ядер`
    : `${physical}/${logical} ядер`;
};

export const formatCount = (value?: number | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }

  return value.toLocaleString('ru-RU');
};
