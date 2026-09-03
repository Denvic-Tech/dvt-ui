import type { DbMetadata as DBMetadata } from '@/shared/gatewayClient';
import {
  flattenDbMetadataTables,
  getDbMetadataSqlReference,
} from '@/shared/lib/db-metadata';

export const pickFirstTableFullName = (meta: DBMetadata | null): string => {
  const [firstTable] = flattenDbMetadataTables(meta);

  if (firstTable) {
    return getDbMetadataSqlReference(firstTable);
  }

  return 'my_table';
};

export const buildDefaultQuery = (meta: DBMetadata | null) => {
  const tableName = pickFirstTableFullName(meta);
  return `-- Напишите SQL-запрос. Пример:\nSELECT *\nFROM ${tableName}\nLIMIT 100`;
};
