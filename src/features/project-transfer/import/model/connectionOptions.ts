import type {
  ConnectionPreviewSchema,
  ExistingConnectionSchema,
} from '@/shared/gatewayClient';

export type ExistingConnectionOption = Pick<
  ExistingConnectionSchema,
  'id' | 'name' | 'type'
>;

/**
 * Подключения проекта, с которыми можно сопоставить подключение из архива:
 * кандидаты из preview плюс доступные подключения того же типа, без
 * дублей. Подключения с тем же именем идут первыми.
 */
export const getConnectionOptions = (
  connection: ConnectionPreviewSchema,
  available: readonly ExistingConnectionOption[]
): ExistingConnectionOption[] => {
  const byId = new Map<string, ExistingConnectionOption>();
  for (const candidate of connection.candidates ?? []) {
    byId.set(candidate.id, candidate);
  }
  for (const existing of available) {
    if (existing.type === connection.type && !byId.has(existing.id)) {
      byId.set(existing.id, existing);
    }
  }

  const options = Array.from(byId.values());
  return options.sort(
    (a, b) =>
      Number(b.name === connection.name) - Number(a.name === connection.name)
  );
};
