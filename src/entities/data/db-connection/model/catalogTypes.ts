import type { ApiErrorPayload } from '@/shared/lib/errors';

export type DbCatalogMode = 'embedded' | 'lazy';

export type DbCatalogCapabilities = {
  supportsDatabases: boolean;
  supportsSchemas: boolean;
  supportsTables: boolean;
  supportsViews: boolean;
  supportsSearch: boolean;
  maxPageSize: number;
};

export type DbCatalogMeta = {
  catalogVersion: string;
  loadedAt: string;
  expiresAt: string;
  cacheStatus: 'hit' | 'miss' | 'bypass';
};

export type DbCatalogDatabase = {
  name: string;
  isCurrent: boolean;
};

export type DbCatalogSchema = {
  name: string;
  databaseName: string | null;
};

export type DbCatalogTableKind = 'table' | 'view';

export type DbCatalogTableRef = {
  name: string;
  kind: DbCatalogTableKind;
  databaseName: string | null;
  schemaName: string | null;
};

export type DbCatalogColumn = {
  name: string;
  ordinal: number;
  dtype: string;
  nullable: boolean | null;
  indexed: boolean;
  primaryKey: boolean;
  indexes: string[];
};

export type DbCatalogTableDetail = DbCatalogTableRef & {
  columns: DbCatalogColumn[];
};

export type DbCatalogPage<T> = {
  items: T[];
  nextCursor: string | null;
  meta: DbCatalogMeta;
};

export type DbCatalogDetailResponse = {
  item: DbCatalogTableDetail;
  meta: DbCatalogMeta;
};

export type DbCatalogTablePreviewColumn = {
  name: string;
  dtype: string;
};

export type DbCatalogTablePreviewValue = string | number | boolean | null;

export type DbCatalogTablePreview = {
  columns: DbCatalogTablePreviewColumn[];
  rows: DbCatalogTablePreviewValue[][];
  truncated: boolean;
};

export type DbCatalogState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'unsupported'
  | 'notFound'
  | 'badGateway'
  | 'gatewayTimeout'
  | 'error';

export type DbCatalogListResult<T> = {
  items: readonly T[];
  state: DbCatalogState;
  error: ApiErrorPayload | null;
  meta: DbCatalogMeta | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isRefreshing: boolean;
  loadMoreError: ApiErrorPayload | null;
  loadNextPage: () => Promise<void>;
  retry: () => Promise<void>;
};

export type DbCatalogDetailResult<T> = {
  item: T | null;
  state: DbCatalogState;
  error: ApiErrorPayload | null;
  meta: DbCatalogMeta | null;
  isRefreshing: boolean;
  retry: () => Promise<void>;
};

export type DbCatalogTablePreviewResult = {
  data: DbCatalogTablePreview | null;
  state: DbCatalogState;
  error: ApiErrorPayload | null;
  isRefreshing: boolean;
  retry: () => Promise<void>;
};

export type DbCatalogConnectionArg = {
  connectionId: string;
  connectionRevision: string | null;
};

export type DbCatalogListArg = DbCatalogConnectionArg & {
  search: string | null;
  limit: number;
};

export type DbCatalogSchemasArg = DbCatalogListArg & {
  databaseName: string | null;
};

export type DbCatalogTablesArg = DbCatalogSchemasArg & {
  schemaName: string | null;
  kinds: DbCatalogTableKind[];
};

export type DbCatalogTableArg = DbCatalogConnectionArg & {
  databaseName: string | null;
  schemaName: string | null;
  tableName: string;
};
