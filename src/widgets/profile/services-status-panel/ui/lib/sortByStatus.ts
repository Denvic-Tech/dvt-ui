import type { ServiceStatusRowStatus } from '../types.ts';

export function sortByStatus<
  T extends {
    status: ServiceStatusRowStatus;
    offlineSince?: number | null | undefined;
  },
>(list: T[]): T[] {
  const online = list
    .map((item, index) => ({ item, index }))
    .filter(entry => entry.item.status === 'online')
    .sort((left, right) => left.index - right.index)
    .map(entry => entry.item);

  const offline = list
    .filter(item => item.status === 'offline')
    .sort(
      (left, right) => (right.offlineSince ?? 0) - (left.offlineSince ?? 0)
    );

  return [...online, ...offline];
}
