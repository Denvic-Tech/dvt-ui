const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfDay = (time: number): number => {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const formatClock = (time: number): string =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(time);

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
