import type {
  CatalogDatabasePageSchema,
  CatalogMetaSchema,
  CatalogSchemaPageSchema,
  CatalogTableDetailsResponseSchema,
  CatalogTablePageSchema,
  CatalogTablePreviewResponseSchema,
  DbMetadata,
} from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';
import { toApiErrorPayload } from '@/shared/lib/errors';

import type {
  DbCatalogCapabilities,
  DbCatalogDatabase,
  DbCatalogDetailResponse,
  DbCatalogMeta,
  DbCatalogMode,
  DbCatalogPage,
  DbCatalogSchema,
  DbCatalogState,
  DbCatalogTableDetail,
  DbCatalogTableKind,
  DbCatalogTablePreview,
  DbCatalogTableRef,
} from './catalogTypes';

const MAX_CATALOG_PAGE_SIZE = 200;

export const resolveDbCatalogMode = (
  metadata: DbMetadata | null | undefined
): DbCatalogMode => (metadata?.catalog_mode === 'lazy' ? 'lazy' : 'embedded');

export const normalizeDbCatalogCapabilities = (
  metadata: DbMetadata | null | undefined
): DbCatalogCapabilities => {
  const capabilities = metadata?.catalog_capabilities;
  const rawPageSize = capabilities?.max_page_size;
  const maxPageSize =
    typeof rawPageSize === 'number' && Number.isFinite(rawPageSize)
      ? Math.max(1, Math.min(MAX_CATALOG_PAGE_SIZE, Math.trunc(rawPageSize)))
      : MAX_CATALOG_PAGE_SIZE;

  return {
    supportsDatabases: capabilities?.supports_databases ?? false,
    supportsSchemas: capabilities?.supports_schemas ?? false,
    supportsTables: capabilities?.supports_tables ?? false,
    supportsViews: capabilities?.supports_views ?? false,
    supportsSearch: capabilities?.supports_search ?? false,
    maxPageSize,
  };
};

export const getDbCatalogConnectionId = (
  metadata: DbMetadata | null | undefined
): string | null => {
  const connectionId = metadata?.connection_id?.trim();
  return connectionId ? connectionId : null;
};

export const requireDbConnectionId = (
  metadata: DbMetadata | null | undefined
): string => {
  const connectionId = getDbCatalogConnectionId(metadata);
  if (!connectionId) {
    throw new Error(
      'В metadata DB Connection отсутствует connection_id. Обновите metadata подключения.'
    );
  }
  return connectionId;
};

export const normalizeDbCatalogSearch = (
  value: string | null | undefined
): string | null => {
  const normalized = value?.trim().slice(0, 128) ?? '';
  return normalized || null;
};

export const normalizeDbCatalogParentNames = (
  capabilities: Pick<
    DbCatalogCapabilities,
    'supportsDatabases' | 'supportsSchemas'
  >,
  databaseName: string | null | undefined,
  schemaName: string | null | undefined
) => ({
  databaseName: capabilities.supportsDatabases
    ? databaseName?.trim() || null
    : null,
  schemaName: capabilities.supportsSchemas ? schemaName?.trim() || null : null,
});

export const normalizeDbCatalogKinds = (
  kinds: readonly DbCatalogTableKind[]
): DbCatalogTableKind[] => {
  const set = new Set(kinds);
  return (['table', 'view'] as const).filter(kind => set.has(kind));
};

const normalizeMeta = (meta: CatalogMetaSchema): DbCatalogMeta => ({
  catalogVersion: meta.catalog_version,
  loadedAt: meta.loaded_at,
  expiresAt: meta.expires_at,
  cacheStatus: meta.cache_status,
});

export const normalizeDatabasePage = (
  page: CatalogDatabasePageSchema
): DbCatalogPage<DbCatalogDatabase> => ({
  items: page.items.map(item => ({
    name: item.name,
    isCurrent: item.is_current ?? false,
  })),
  nextCursor: page.next_cursor ?? null,
  meta: normalizeMeta(page.meta),
});

export const normalizeSchemaPage = (
  page: CatalogSchemaPageSchema
): DbCatalogPage<DbCatalogSchema> => ({
  items: page.items.map(item => ({
    name: item.name,
    databaseName: item.database_name ?? null,
  })),
  nextCursor: page.next_cursor ?? null,
  meta: normalizeMeta(page.meta),
});

const normalizeTableRef = (table: {
  name: string;
  kind: DbCatalogTableKind;
  database_name?: string | null;
  schema_name?: string | null;
}): DbCatalogTableRef => ({
  name: table.name,
  kind: table.kind,
  databaseName: table.database_name ?? null,
  schemaName: table.schema_name ?? null,
});

export const normalizeTablePage = (
  page: CatalogTablePageSchema
): DbCatalogPage<DbCatalogTableRef> => ({
  items: page.items.map(normalizeTableRef),
  nextCursor: page.next_cursor ?? null,
  meta: normalizeMeta(page.meta),
});

export const normalizeTableDetail = (
  response: CatalogTableDetailsResponseSchema
): DbCatalogDetailResponse => {
  const item: DbCatalogTableDetail = {
    ...normalizeTableRef(response.item),
    columns: response.item.columns
      .map(column => ({
        name: column.name,
        ordinal: column.ordinal,
        dtype: column.dtype,
        nullable: column.nullable ?? null,
        indexed: column.indexed ?? false,
        primaryKey: column.primary_key ?? false,
        indexes: column.indexes ?? [],
      }))
      .sort((left, right) => left.ordinal - right.ordinal),
  };

  return { item, meta: normalizeMeta(response.meta) };
};

export const normalizeTablePreview = (
  response: CatalogTablePreviewResponseSchema
): DbCatalogTablePreview => ({
  columns: response.columns.map(column => ({
    name: column.name,
    dtype: column.dtype,
  })),
  rows: response.rows,
  truncated: response.truncated ?? false,
});

export const toDbCatalogError = (
  error: unknown,
  fallbackMessage: string
): ApiErrorPayload => {
  const payload = toApiErrorPayload(error, fallbackMessage);
  return {
    ...payload,
    meta: {
      ...(payload.meta ?? {}),
      handledLocally: true,
    },
  };
};

export const classifyDbCatalogError = (
  error: ApiErrorPayload | null | undefined
): DbCatalogState => {
  if (error?.status === 404) return 'notFound';
  if (error?.status === 502) return 'badGateway';
  if (error?.status === 504) return 'gatewayTimeout';
  return 'error';
};
