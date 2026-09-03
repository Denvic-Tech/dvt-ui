import { normalizeTimestamp } from './normalizeTimestamp.ts';

export function formatOfflineSince(
  value: number | string | null | undefined
): string {
  const timestamp = normalizeTimestamp(value);
  if (!timestamp) {
    return '';
  }

  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days >= 1) {
    return `${days}д ${hours}ч`;
  }

  if (hours >= 1) {
    return `${hours}ч ${minutes}м`;
  }

  return `${minutes}м`;
}
