import type {
  DatasetDetailsSchema,
  DatasetFieldSchema,
  DatasetLocatorSchema,
  DatasetPageSchema,
  DatasetSummarySchema,
  DatasetUsageEntrySchema,
  FieldDescriptionPatchSchema,
} from '@/shared/gatewayClient';

export type DatasetSummary = DatasetSummarySchema;
export type DatasetDetails = DatasetDetailsSchema;
export type DatasetField = DatasetFieldSchema;
export type DatasetLocator = DatasetLocatorSchema;
export type DatasetPage = DatasetPageSchema;
export type DatasetUsageEntry = DatasetUsageEntrySchema;

/**
 * Части адреса источника. Набор `locator.parts` зависит от `locator.kind`
 * (для `db_table`: dialect, host, port, database, schema, table), поэтому
 * все поля, кроме имени, могут отсутствовать.
 */
export interface DatasetLocatorParts {
  dialect: string | null;
  host: string | null;
  port: number | null;
  database: string | null;
  schema: string | null;
  /** Имя объекта; если адаптер не прислал `table` — `locator.location`. */
  table: string;
}

export type DatasetFreshness = DatasetSummarySchema['freshness'];
export type DatasetFieldStatus = DatasetFieldSchema['status'];
export type DatasetUsageDirection = DatasetUsageEntrySchema['direction'];

export interface SearchDatasetsArg {
  projectId?: string | null;
  connectionId?: string | null;
  /** Вид источника, например `db_table`. */
  kind?: string | null;
  query?: string | null;
  limit?: number;
}

export interface GetDatasetArg {
  datasetId: string;
  /** Синхронизировать схему датасета с источником перед ответом. */
  sync?: boolean;
  includeFields?: boolean;
}

export interface GetDatasetUsageArg {
  datasetId: string;
  direction?: DatasetUsageDirection | null;
}

/** Изменение описания поля датасета: ключ `description` обязателен, `null` очищает. */
export type DatasetFieldDescriptionPatch = FieldDescriptionPatchSchema;

export interface SetDatasetDescriptionsArg {
  datasetId: string;
  /** Описание самого датасета; без ключа не меняется, `null` очищает. */
  description?: string | null;
  fields?: DatasetFieldDescriptionPatch[];
}
