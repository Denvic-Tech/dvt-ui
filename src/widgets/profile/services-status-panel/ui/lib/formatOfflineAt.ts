import { normalizeTimestamp } from './normalizeTimestamp.ts';

export function formatOfflineAt(
  value: number | string | null | undefined
): string {
  const timestamp = normalizeTimestamp(value);
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${dd}.${mm} ${hh}:${min}`;
}
