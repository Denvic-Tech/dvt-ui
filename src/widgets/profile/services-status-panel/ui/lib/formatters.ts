const EMPTY = '—';

const BYTE_UNITS = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'] as const;

const isMissing = (value?: number | null): value is null | undefined =>
  value === undefined || value === null || Number.isNaN(value);

// Values below 10 keep one decimal: «1,7 ТБ», «30 ГБ».
const formatScaled = (value: number) =>
  (value >= 10
    ? Math.round(value)
    : Math.round(value * 10) / 10
  ).toLocaleString('ru-RU', { maximumFractionDigits: 1 });

const getByteUnitIndex = (value: number) => {
  let unitIndex = 0;
  let current = value;

  while (current >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }

  return unitIndex;
};

export const formatBytes = (value?: number | null): string => {
  if (isMissing(value)) {
    return EMPTY;
  }

  const unitIndex = getByteUnitIndex(value);
  return `${formatScaled(value / 1024 ** unitIndex)} ${BYTE_UNITS[unitIndex]}`;
};

// Both values in the unit of the total: «30 / 64 ГБ».
export const formatBytesPair = (
  used?: number | null,
  total?: number | null
): string => {
  if (isMissing(used) || isMissing(total)) {
    return EMPTY;
  }

  const unitIndex = getByteUnitIndex(total);
  const divider = 1024 ** unitIndex;
  return `${formatScaled(used / divider)} / ${formatScaled(total / divider)} ${BYTE_UNITS[unitIndex]}`;
};

export const formatPercent = (value?: number | null): string =>
  isMissing(value) ? EMPTY : `${Math.round(value)}%`;

export const formatCount = (value?: number | null): string =>
  isMissing(value) ? EMPTY : value.toLocaleString('ru-RU');

const pluralize = (
  value: number,
  [one, few, many]: readonly [string, string, string]
) => {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }

  return many;
};

export const formatCores = (value?: number | null): string =>
  isMissing(value)
    ? EMPTY
    : `${value} ${pluralize(value, ['ядро', 'ядра', 'ядер'])}`;

const splitDuration = (seconds: number) => {
  const value = Math.max(Math.floor(seconds), 0);

  return {
    days: Math.floor(value / 86400),
    hours: Math.floor((value % 86400) / 3600),
    minutes: Math.floor((value % 3600) / 60),
    seconds: value % 60,
  };
};

// The largest unit only: «21 мин», «3 ч», «9 д».
export const formatDurationShort = (seconds?: number | null): string => {
  if (isMissing(seconds)) {
    return EMPTY;
  }

  const parts = splitDuration(seconds);

  if (parts.days > 0) {
    return `${parts.days} д`;
  }

  if (parts.hours > 0) {
    return `${parts.hours} ч`;
  }

  if (parts.minutes > 0) {
    return `${parts.minutes} мин`;
  }

  return `${parts.seconds} с`;
};

// Two largest units: «9 д 1 ч», «21 мин 8 с».
export const formatDurationFull = (seconds?: number | null): string => {
  if (isMissing(seconds)) {
    return EMPTY;
  }

  const parts = splitDuration(seconds);

  if (parts.days > 0) {
    return `${parts.days} д ${parts.hours} ч`;
  }

  if (parts.hours > 0) {
    return `${parts.hours} ч ${parts.minutes} мин`;
  }

  if (parts.minutes > 0) {
    return `${parts.minutes} мин ${parts.seconds} с`;
  }

  return `${parts.seconds} с`;
};

export const getElapsedSeconds = (from: number, now: number) =>
  Math.max(0, Math.floor((now - from) / 1000));
