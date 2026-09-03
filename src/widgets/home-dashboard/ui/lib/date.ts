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
