const capitalizeFirstLetter = (value: string): string =>
  value ? value[0].toUpperCase() + value.slice(1) : value;

export const getGreeting = (date: Date): string => {
  const hours = date.getHours();
  if (hours < 12) {
    return 'Доброе утро';
  }

  if (hours < 18) {
    return 'Добрый день';
  }

  return 'Добрый вечер';
};

export const formatRelativeTime = (
  value: string | null | undefined
): string => {
  if (!value) {
    return 'Недавно';
  }

  const targetTime = new Date(value).getTime();
  if (!Number.isFinite(targetTime)) {
    return 'Недавно';
  }

  const diffMs = targetTime - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' });
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), 'minute');
  }

  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), 'hour');
  }

  return rtf.format(Math.round(diffMs / day), 'day');
};

export const formatLongDate = (date: Date): string =>
  capitalizeFirstLetter(
    new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
    }).format(date)
  );

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (time: number): number => {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const pluralRu = (
  value: number,
  one: string,
  few: string,
  many: string
): string => {
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

export const formatClock = (time: number): string =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(time);

/** Compact "opened" label for project rows: «12 мин назад», «вчера, 18:40». */
export const formatOpenedAt = (
  value: string | null | undefined,
  now: number = Date.now()
): string => {
  const time = value ? new Date(value).getTime() : Number.NaN;

  if (!Number.isFinite(time)) {
    return '—';
  }

  const diff = Math.max(0, now - time);
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) {
    return 'только что';
  }

  if (minutes < 60) {
    return `${minutes} мин назад`;
  }

  const days = Math.round((startOfDay(now) - startOfDay(time)) / DAY_MS);

  if (days <= 0) {
    return `${Math.floor(minutes / 60)} ч назад`;
  }

  if (days === 1) {
    return `вчера, ${formatClock(time)}`;
  }

  if (days < 7) {
    return `${days} ${pluralRu(days, 'день', 'дня', 'дней')} назад`;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    ...(new Date(time).getFullYear() !== new Date(now).getFullYear()
      ? { year: 'numeric' as const }
      : {}),
  })
    .format(time)
    .replace('.', '');
};

/** Day label for run lists: «сегодня», «вчера», «3 дн. назад». */
export const formatRunDay = (
  time: number,
  now: number = Date.now()
): string => {
  const days = Math.round((startOfDay(now) - startOfDay(time)) / DAY_MS);

  if (days <= 0) {
    return 'сегодня';
  }

  if (days === 1) {
    return 'вчера';
  }

  return `${days} дн. назад`;
};

/** Compact label for a future moment: «через 6 мин», «завтра, 03:00». */
export const formatUntil = (
  value: string | null | undefined,
  now: number = Date.now()
): string => {
  const time = value ? new Date(value).getTime() : Number.NaN;

  if (!Number.isFinite(time)) {
    return '—';
  }

  const minutes = Math.round((time - now) / 60_000);

  if (minutes <= 0) {
    return 'сейчас';
  }

  if (minutes < 60) {
    return `через ${minutes} мин`;
  }

  const days = Math.round((startOfDay(time) - startOfDay(now)) / DAY_MS);

  if (days <= 0) {
    return `через ${Math.floor(minutes / 60)} ч`;
  }

  if (days === 1) {
    return `завтра, ${formatClock(time)}`;
  }

  return `через ${days} ${pluralRu(days, 'день', 'дня', 'дней')}`;
};
