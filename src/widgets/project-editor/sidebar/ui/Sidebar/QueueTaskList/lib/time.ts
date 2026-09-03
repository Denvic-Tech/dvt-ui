const parseIsoDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDuration = (seconds: number | null): string => {
  if (seconds == null || seconds < 0) {
    return '—';
  }

  if (seconds < 60) {
    return `${seconds}с`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}м ${remainingSeconds}с`
      : `${minutes}м`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}ч ${remainingMinutes}м` : `${hours}ч`;
};

export const formatTime = (value: string | null | undefined): string => {
  const date = parseIsoDate(value);

  if (!date) {
    return '';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

export const diffSec = (
  from: string | null | undefined,
  to: string | null | undefined
): number | null => {
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);

  if (!fromDate || !toDate) {
    return null;
  }

  return Math.floor((toDate.getTime() - fromDate.getTime()) / 1000);
};
