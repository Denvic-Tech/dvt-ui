import type { NodeMetadata } from '@/shared/gatewayClient';

type NodePortsMetadata = NodeMetadata | null | undefined;

/** `DATETIME` → `Datetime`: в списке типы читаются как подписи, а не константы. */
export const formatColumnType = (dtype: string): string =>
  dtype ? dtype.charAt(0) + dtype.slice(1).toLowerCase() : dtype;

/**
 * Типы колонок порта из закешированных метаданных ноды. Lineage их не
 * возвращает, поэтому без метаданных (нода ещё не запускалась) типов нет.
 */
export const getPortColumnTypes = (
  metadata: NodePortsMetadata,
  port: string | null | undefined
): ReadonlyMap<string, string> => {
  const portMetadata = port ? metadata?.[port] : null;
  if (!portMetadata || portMetadata.type !== 'DATAFRAME') {
    return new Map();
  }

  return new Map(
    portMetadata.columns.map(column => [
      column.name,
      formatColumnType(column.dtype),
    ])
  );
};
