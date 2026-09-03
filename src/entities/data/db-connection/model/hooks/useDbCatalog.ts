import { useCallback, useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import type { DbMetadata, DbTable } from '@/shared/gatewayClient';
import {
  findDbMetadataTable,
  getDbMetadataDatabaseOptions,
  getDbMetadataFilteredTables,
  getDbMetadataSchemaOptions,
} from '@/shared/lib/db-metadata';
import type { ApiErrorPayload } from '@/shared/lib/errors';

import {
  useGetTablePreviewQuery,
  useGetTableQuery,
  useListDatabasesInfiniteQuery,
  useListSchemasInfiniteQuery,
  useListTablesInfiniteQuery,
  useRefreshCatalogMutation,
} from '../../api/dbCatalogApi';
import {
  classifyDbCatalogError,
  getDbCatalogConnectionId,
  normalizeDbCatalogCapabilities,
  normalizeDbCatalogKinds,
  normalizeDbCatalogParentNames,
  normalizeDbCatalogSearch,
  resolveDbCatalogMode,
} from '../catalogNormalizers';
import type {
  DbCatalogCapabilities,
  DbCatalogDatabase,
  DbCatalogDetailResult,
  DbCatalogListResult,
  DbCatalogMeta,
  DbCatalogSchema,
  DbCatalogState,
  DbCatalogTableDetail,
  DbCatalogTableKind,
  DbCatalogTablePreviewResult,
  DbCatalogTableRef,
} from '../catalogTypes';

type CatalogOptions = {
  enabled?: boolean | undefined;
  search?: string | null | undefined;
};

const NOOP_ASYNC = async () => undefined;

const getEmbeddedCapabilities = (
  metadata: DbMetadata | null | undefined
): DbCatalogCapabilities => {
  const dialect = metadata?.dialect?.toLowerCase() ?? '';
  return {
    supportsDatabases: [
      'postgresql',
      'mssql',
      'sqlserver',
      'clickhouse',
    ].includes(dialect),
    supportsSchemas: [
      'postgresql',
      'mysql',
      'mariadb',
      'mssql',
      'sqlserver',
      'oracle',
    ].includes(dialect),
    supportsTables: true,
    supportsViews: true,
    supportsSearch: true,
    maxPageSize: 200,
  };
};

export const getDbCatalogCapabilities = (
  metadata: DbMetadata | null | undefined
): DbCatalogCapabilities =>
  resolveDbCatalogMode(metadata) === 'lazy'
    ? normalizeDbCatalogCapabilities(metadata)
    : getEmbeddedCapabilities(metadata);

const asError = (error: unknown): ApiErrorPayload | null =>
  (error as ApiErrorPayload | undefined) ?? null;

const getListState = (
  active: boolean,
  supported: boolean,
  loading: boolean,
  length: number,
  error: ApiErrorPayload | null
): DbCatalogState => {
  if (!active) return 'idle';
  if (!supported) return 'unsupported';
  if (loading) return 'loading';
  if (error) return classifyDbCatalogError(error);
  return length === 0 ? 'empty' : 'ready';
};

const filterBySearch = <T>(
  items: readonly T[],
  search: string | null,
  getName: (item: T) => string
): T[] => {
  if (!search) return [...items];
  const needle = search.toLocaleLowerCase();
  return items.filter(item =>
    getName(item).toLocaleLowerCase().includes(needle)
  );
};

const flattenPages = <T extends object>(
  pages: readonly { items: T[]; meta: DbCatalogMeta }[] | undefined,
  getKey: (item: T) => string
): T[] => {
  const result: T[] = [];
  const seen = new Set<string>();
  for (const page of pages ?? []) {
    for (const item of page.items) {
      const key = getKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
  }
  return result;
};

const lastPageMeta = (
  pages: readonly { meta: DbCatalogMeta }[] | undefined
): DbCatalogMeta | null =>
  pages && pages.length > 0 ? pages[pages.length - 1]!.meta : null;

const embeddedTableRef = (table: DbTable): DbCatalogTableRef => ({
  name: table.name,
  kind: table.type === 'VIEW' ? 'view' : 'table',
  databaseName: table.database_name ?? null,
  schemaName: table.schema_name ?? null,
});

const embeddedTableDetail = (table: DbTable): DbCatalogTableDetail => ({
  ...embeddedTableRef(table),
  columns: table.columns.map((column, ordinal) => ({
    name: column.name,
    ordinal,
    dtype: String(column.dtype),
    nullable: column.nullable ?? null,
    indexed: column.index ?? false,
    primaryKey: column.primary_key ?? false,
    indexes: column.indexes ?? [],
  })),
});

export const useDbCatalogDatabases = (
  metadata: DbMetadata | null | undefined,
  options: CatalogOptions = {}
): DbCatalogListResult<DbCatalogDatabase> => {
  const mode = resolveDbCatalogMode(metadata);
  const capabilities = getDbCatalogCapabilities(metadata);
  const enabled = options.enabled !== false;
  const search = normalizeDbCatalogSearch(options.search);
  const connectionId = getDbCatalogConnectionId(metadata);
  const query = useListDatabasesInfiniteQuery(
    mode === 'lazy' && enabled && capabilities.supportsDatabases && connectionId
      ? {
          connectionId,
          connectionRevision: metadata?.connection_revision ?? null,
          search,
          limit: capabilities.maxPageSize,
        }
      : skipToken
  );
  const embedded = useMemo(
    () =>
      filterBySearch(
        getDbMetadataDatabaseOptions(metadata).map(option => ({
          name: option.value,
          isCurrent: option.value === metadata?.database_name,
        })),
        normalizeDbCatalogSearch(options.search),
        item => item.name
      ),
    [metadata, options.search]
  );
  const lazy = useMemo(
    () =>
      filterBySearch(
        flattenPages(query.currentData?.pages, item => item.name),
        search,
        item => item.name
      ),
    [query.currentData?.pages, search]
  );
  const items = mode === 'lazy' ? lazy : embedded;
  const loadMoreError =
    query.isError && query.direction === 'forward'
      ? asError(query.error)
      : null;
  const error = loadMoreError ? null : asError(query.error);
  const active = enabled && (mode === 'embedded' || Boolean(connectionId));

  return {
    items,
    state: getListState(
      active,
      capabilities.supportsDatabases,
      query.isLoading,
      items.length,
      error
    ),
    error,
    meta: lastPageMeta(query.currentData?.pages),
    hasNextPage: mode === 'lazy' && Boolean(query.hasNextPage),
    isFetchingNextPage: mode === 'lazy' && query.isFetchingNextPage,
    isRefreshing:
      mode === 'lazy' &&
      query.isFetching &&
      !query.isLoading &&
      !query.isFetchingNextPage,
    loadMoreError,
    loadNextPage:
      mode === 'lazy' && query.hasNextPage
        ? async () => void (await query.fetchNextPage())
        : NOOP_ASYNC,
    retry:
      mode === 'lazy' && active
        ? loadMoreError
          ? async () => void (await query.fetchNextPage())
          : async () => void (await query.refetch())
        : NOOP_ASYNC,
  };
};

export const useDbCatalogSchemas = (
  metadata: DbMetadata | null | undefined,
  databaseName: string | null | undefined,
  options: CatalogOptions = {}
): DbCatalogListResult<DbCatalogSchema> => {
  const mode = resolveDbCatalogMode(metadata);
  const capabilities = getDbCatalogCapabilities(metadata);
  const { databaseName: effectiveDatabaseName } = normalizeDbCatalogParentNames(
    capabilities,
    databaseName,
    null
  );
  const parentsReady =
    !capabilities.supportsDatabases || Boolean(effectiveDatabaseName);
  const enabled = options.enabled !== false && parentsReady;
  const search = normalizeDbCatalogSearch(options.search);
  const connectionId = getDbCatalogConnectionId(metadata);
  const query = useListSchemasInfiniteQuery(
    mode === 'lazy' && enabled && capabilities.supportsSchemas && connectionId
      ? {
          connectionId,
          connectionRevision: metadata?.connection_revision ?? null,
          databaseName: effectiveDatabaseName,
          search: null,
          limit: capabilities.maxPageSize,
        }
      : skipToken
  );
  const embedded = useMemo(
    () =>
      filterBySearch(
        getDbMetadataSchemaOptions(metadata, effectiveDatabaseName).map(
          option => ({
            name: option.value,
            databaseName: effectiveDatabaseName,
          })
        ),
        normalizeDbCatalogSearch(options.search),
        item => item.name
      ),
    [effectiveDatabaseName, metadata, options.search]
  );
  const lazy = useMemo(
    () =>
      filterBySearch(
        flattenPages(
          query.currentData?.pages,
          item => `${item.databaseName ?? ''}::${item.name}`
        ),
        search,
        item => item.name
      ),
    [query.currentData?.pages, search]
  );
  const items = mode === 'lazy' ? lazy : embedded;
  const loadMoreError =
    query.isError && query.direction === 'forward'
      ? asError(query.error)
      : null;
  const error = loadMoreError ? null : asError(query.error);
  const active = enabled && (mode === 'embedded' || Boolean(connectionId));

  return {
    items,
    state: getListState(
      active,
      capabilities.supportsSchemas,
      query.isLoading,
      items.length,
      error
    ),
    error,
    meta: lastPageMeta(query.currentData?.pages),
    hasNextPage: mode === 'lazy' && Boolean(query.hasNextPage),
    isFetchingNextPage: mode === 'lazy' && query.isFetchingNextPage,
    isRefreshing:
      mode === 'lazy' &&
      query.isFetching &&
      !query.isLoading &&
      !query.isFetchingNextPage,
    loadMoreError,
    loadNextPage:
      mode === 'lazy' && query.hasNextPage
        ? async () => void (await query.fetchNextPage())
        : NOOP_ASYNC,
    retry:
      mode === 'lazy' && active
        ? loadMoreError
          ? async () => void (await query.fetchNextPage())
          : async () => void (await query.refetch())
        : NOOP_ASYNC,
  };
};

export const useDbCatalogTables = (
  metadata: DbMetadata | null | undefined,
  databaseName: string | null | undefined,
  schemaName: string | null | undefined,
  options: CatalogOptions & { kinds?: readonly DbCatalogTableKind[] } = {}
): DbCatalogListResult<DbCatalogTableRef> => {
  const mode = resolveDbCatalogMode(metadata);
  const capabilities = getDbCatalogCapabilities(metadata);
  const {
    databaseName: effectiveDatabaseName,
    schemaName: effectiveSchemaName,
  } = normalizeDbCatalogParentNames(capabilities, databaseName, schemaName);
  const parentsReady =
    (!capabilities.supportsDatabases || Boolean(effectiveDatabaseName)) &&
    (!capabilities.supportsSchemas || Boolean(effectiveSchemaName));
  const enabled = options.enabled !== false && parentsReady;
  const search = normalizeDbCatalogSearch(options.search);
  const connectionId = getDbCatalogConnectionId(metadata);
  const kinds = useMemo(
    () =>
      normalizeDbCatalogKinds(
        options.kinds ??
          (capabilities.supportsViews ? ['table', 'view'] : ['table'])
      ),
    [capabilities.supportsViews, options.kinds]
  );
  const query = useListTablesInfiniteQuery(
    mode === 'lazy' && enabled && capabilities.supportsTables && connectionId
      ? {
          connectionId,
          connectionRevision: metadata?.connection_revision ?? null,
          databaseName: effectiveDatabaseName,
          schemaName: effectiveSchemaName,
          search,
          limit: capabilities.maxPageSize,
          kinds,
        }
      : skipToken
  );
  const embedded = useMemo(() => {
    const allowed = new Set(kinds);
    return filterBySearch(
      getDbMetadataFilteredTables(metadata, {
        databaseName: effectiveDatabaseName,
        schemaName: effectiveSchemaName,
      })
        .map(embeddedTableRef)
        .filter(item => allowed.has(item.kind)),
      normalizeDbCatalogSearch(options.search),
      item => item.name
    );
  }, [
    effectiveDatabaseName,
    effectiveSchemaName,
    kinds,
    metadata,
    options.search,
  ]);
  const lazy = useMemo(
    () =>
      filterBySearch(
        flattenPages(
          query.currentData?.pages,
          item =>
            `${item.databaseName ?? ''}::${item.schemaName ?? ''}::${item.name}::${item.kind}`
        ),
        search,
        item => item.name
      ),
    [query.currentData?.pages, search]
  );
  const items = mode === 'lazy' ? lazy : embedded;
  const loadMoreError =
    query.isError && query.direction === 'forward'
      ? asError(query.error)
      : null;
  const error = loadMoreError ? null : asError(query.error);
  const active = enabled && (mode === 'embedded' || Boolean(connectionId));

  return {
    items,
    state: getListState(
      active,
      capabilities.supportsTables,
      query.isLoading,
      items.length,
      error
    ),
    error,
    meta: lastPageMeta(query.currentData?.pages),
    hasNextPage: mode === 'lazy' && Boolean(query.hasNextPage),
    isFetchingNextPage: mode === 'lazy' && query.isFetchingNextPage,
    isRefreshing:
      mode === 'lazy' &&
      query.isFetching &&
      !query.isLoading &&
      !query.isFetchingNextPage,
    loadMoreError,
    loadNextPage:
      mode === 'lazy' && query.hasNextPage
        ? async () => void (await query.fetchNextPage())
        : NOOP_ASYNC,
    retry:
      mode === 'lazy' && active
        ? loadMoreError
          ? async () => void (await query.fetchNextPage())
          : async () => void (await query.refetch())
        : NOOP_ASYNC,
  };
};

export const useDbCatalogTable = (
  metadata: DbMetadata | null | undefined,
  databaseName: string | null | undefined,
  schemaName: string | null | undefined,
  tableName: string | null | undefined,
  options: Pick<CatalogOptions, 'enabled'> = {}
): DbCatalogDetailResult<DbCatalogTableDetail> => {
  const mode = resolveDbCatalogMode(metadata);
  const capabilities = getDbCatalogCapabilities(metadata);
  const {
    databaseName: effectiveDatabaseName,
    schemaName: effectiveSchemaName,
  } = normalizeDbCatalogParentNames(capabilities, databaseName, schemaName);
  const parentsReady =
    (!capabilities.supportsDatabases || Boolean(effectiveDatabaseName)) &&
    (!capabilities.supportsSchemas || Boolean(effectiveSchemaName));
  const enabled =
    options.enabled !== false && parentsReady && Boolean(tableName?.trim());
  const connectionId = getDbCatalogConnectionId(metadata);
  const query = useGetTableQuery(
    mode === 'lazy' && enabled && capabilities.supportsTables && connectionId
      ? {
          connectionId,
          connectionRevision: metadata?.connection_revision ?? null,
          databaseName: effectiveDatabaseName,
          schemaName: effectiveSchemaName,
          tableName: tableName?.trim() ?? '',
        }
      : skipToken
  );
  const embedded = useMemo(() => {
    const table = findDbMetadataTable(metadata, {
      databaseName: effectiveDatabaseName,
      schemaName: effectiveSchemaName,
      tableName,
    });
    return table ? embeddedTableDetail(table) : null;
  }, [effectiveDatabaseName, effectiveSchemaName, metadata, tableName]);
  const item = mode === 'lazy' ? (query.currentData?.item ?? null) : embedded;
  const error = asError(query.error);
  const active = enabled && (mode === 'embedded' || Boolean(connectionId));

  return {
    item,
    state: !active
      ? 'idle'
      : !capabilities.supportsTables
        ? 'unsupported'
        : query.isLoading
          ? 'loading'
          : error
            ? classifyDbCatalogError(error)
            : item
              ? 'ready'
              : 'empty',
    error,
    meta: query.currentData?.meta ?? null,
    isRefreshing: mode === 'lazy' && query.isFetching && !query.isLoading,
    retry:
      mode === 'lazy' && active
        ? async () => void (await query.refetch())
        : NOOP_ASYNC,
  };
};

export const useDbCatalogTablePreview = (
  metadata: DbMetadata | null | undefined,
  databaseName: string | null | undefined,
  schemaName: string | null | undefined,
  tableName: string | null | undefined,
  options: Pick<CatalogOptions, 'enabled'> = {}
): DbCatalogTablePreviewResult => {
  const capabilities = getDbCatalogCapabilities(metadata);
  const {
    databaseName: effectiveDatabaseName,
    schemaName: effectiveSchemaName,
  } = normalizeDbCatalogParentNames(capabilities, databaseName, schemaName);
  const parentsReady =
    (!capabilities.supportsDatabases || Boolean(effectiveDatabaseName)) &&
    (!capabilities.supportsSchemas || Boolean(effectiveSchemaName));
  const enabled =
    options.enabled !== false && parentsReady && Boolean(tableName?.trim());
  const connectionId = getDbCatalogConnectionId(metadata);
  const active = enabled && Boolean(connectionId);
  const queryActive = active && capabilities.supportsTables;
  const query = useGetTablePreviewQuery(
    queryActive && connectionId
      ? {
          connectionId,
          connectionRevision: metadata?.connection_revision ?? null,
          databaseName: effectiveDatabaseName,
          schemaName: effectiveSchemaName,
          tableName: tableName?.trim() ?? '',
        }
      : skipToken,
    { refetchOnMountOrArgChange: true }
  );
  const data = query.currentData ?? null;
  const error = asError(query.error);

  return {
    data,
    state: !active
      ? 'idle'
      : !capabilities.supportsTables
        ? 'unsupported'
        : query.isLoading
          ? 'loading'
          : error
            ? classifyDbCatalogError(error)
            : data
              ? data.rows.length > 0
                ? 'ready'
                : 'empty'
              : 'empty',
    error,
    isRefreshing: query.isFetching && !query.isLoading,
    retry: queryActive ? async () => void (await query.refetch()) : NOOP_ASYNC,
  };
};

export const useRefreshDbCatalog = (
  metadata: DbMetadata | null | undefined
) => {
  const connectionId = getDbCatalogConnectionId(metadata);
  const [refreshCatalog, state] = useRefreshCatalogMutation();
  const refresh = useCallback(async () => {
    if (!connectionId) {
      return false;
    }
    try {
      await refreshCatalog({ connectionId }).unwrap();
      return true;
    } catch {
      return false;
    }
  }, [connectionId, refreshCatalog]);
  return { refresh, ...state };
};

export const useDbTargetCatalog = (
  metadata: DbMetadata | null | undefined,
  target: {
    databaseName?: string | null;
    schemaName?: string | null;
    tableName?: string | null;
    databaseSearch?: string | null;
    schemaSearch?: string | null;
    tableSearch?: string | null;
    enabled?: boolean;
  } = {}
) => ({
  mode: resolveDbCatalogMode(metadata),
  capabilities: getDbCatalogCapabilities(metadata),
  databases: useDbCatalogDatabases(metadata, {
    enabled: target.enabled,
    search: target.databaseSearch,
  }),
  schemas: useDbCatalogSchemas(metadata, target.databaseName, {
    enabled: target.enabled,
    search: target.schemaSearch,
  }),
  tables: useDbCatalogTables(metadata, target.databaseName, target.schemaName, {
    enabled: target.enabled,
    search: target.tableSearch,
  }),
  table: useDbCatalogTable(
    metadata,
    target.databaseName,
    target.schemaName,
    target.tableName,
    { enabled: target.enabled }
  ),
});
