import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { client } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';

import {
  normalizeDatabasePage,
  normalizeSchemaPage,
  normalizeTableDetail,
  normalizeTablePage,
  normalizeTablePreview,
  toDbCatalogError,
} from '../model/catalogNormalizers';
import type {
  DbCatalogDatabase,
  DbCatalogDetailResponse,
  DbCatalogListArg,
  DbCatalogPage,
  DbCatalogSchema,
  DbCatalogSchemasArg,
  DbCatalogTableArg,
  DbCatalogTablePreview,
  DbCatalogTableRef,
  DbCatalogTablesArg,
} from '../model/catalogTypes';

const tagForConnection = (connectionId: string) => [
  { type: 'DbConnectionCatalog' as const, id: connectionId },
];

const CATALOG_CACHE_RETENTION_SECONDS = 24 * 60 * 60;

export const dbCatalogApi = createApi({
  reducerPath: 'dbCatalogApi',
  baseQuery: fakeBaseQuery<ApiErrorPayload>(),
  tagTypes: ['DbConnectionCatalog'],
  endpoints: build => ({
    listDatabases: build.infiniteQuery<
      DbCatalogPage<DbCatalogDatabase>,
      DbCatalogListArg,
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: page => page.nextCursor ?? undefined,
        refetchCachedPages: false,
      },
      keepUnusedDataFor: CATALOG_CACHE_RETENTION_SECONDS,
      providesTags: (_result, _error, arg) =>
        tagForConnection(arg.connectionId),
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const response = await client.dbConnections
            .connectionId(queryArg.connectionId)
            .catalog.databases.get(
              {
                query: {
                  search: queryArg.search,
                  cursor: pageParam,
                  limit: queryArg.limit,
                },
              },
              { signal: api.signal, silent: true }
            );
          return { data: normalizeDatabasePage(response.data) };
        } catch (error) {
          return {
            error: toDbCatalogError(
              error,
              'Не удалось загрузить список баз данных.'
            ),
          };
        }
      },
    }),
    listSchemas: build.infiniteQuery<
      DbCatalogPage<DbCatalogSchema>,
      DbCatalogSchemasArg,
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: page => page.nextCursor ?? undefined,
        refetchCachedPages: false,
      },
      keepUnusedDataFor: CATALOG_CACHE_RETENTION_SECONDS,
      providesTags: (_result, _error, arg) =>
        tagForConnection(arg.connectionId),
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const response = await client.dbConnections
            .connectionId(queryArg.connectionId)
            .catalog.schemas.get(
              {
                query: {
                  ...(queryArg.databaseName
                    ? { database_name: queryArg.databaseName }
                    : {}),
                  search: queryArg.search,
                  cursor: pageParam,
                  limit: queryArg.limit,
                },
              },
              { signal: api.signal, silent: true }
            );
          return { data: normalizeSchemaPage(response.data) };
        } catch (error) {
          return {
            error: toDbCatalogError(error, 'Не удалось загрузить список схем.'),
          };
        }
      },
    }),
    listTables: build.infiniteQuery<
      DbCatalogPage<DbCatalogTableRef>,
      DbCatalogTablesArg,
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: page => page.nextCursor ?? undefined,
        refetchCachedPages: false,
      },
      keepUnusedDataFor: CATALOG_CACHE_RETENTION_SECONDS,
      providesTags: (_result, _error, arg) =>
        tagForConnection(arg.connectionId),
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const response = await client.dbConnections
            .connectionId(queryArg.connectionId)
            .catalog.tables.get(
              {
                query: {
                  ...(queryArg.databaseName
                    ? { database_name: queryArg.databaseName }
                    : {}),
                  ...(queryArg.schemaName
                    ? { schema_name: queryArg.schemaName }
                    : {}),
                  search: queryArg.search,
                  cursor: pageParam,
                  limit: queryArg.limit,
                  kinds: queryArg.kinds,
                },
              },
              { signal: api.signal, silent: true }
            );
          return { data: normalizeTablePage(response.data) };
        } catch (error) {
          return {
            error: toDbCatalogError(
              error,
              'Не удалось загрузить список таблиц.'
            ),
          };
        }
      },
    }),
    getTable: build.query<DbCatalogDetailResponse, DbCatalogTableArg>({
      keepUnusedDataFor: CATALOG_CACHE_RETENTION_SECONDS,
      providesTags: (_result, _error, arg) =>
        tagForConnection(arg.connectionId),
      queryFn: async (arg, api) => {
        try {
          const response = await client.dbConnections
            .connectionId(arg.connectionId)
            .catalog.table.get(
              {
                query: {
                  ...(arg.databaseName
                    ? { database_name: arg.databaseName }
                    : {}),
                  ...(arg.schemaName ? { schema_name: arg.schemaName } : {}),
                  table_name: arg.tableName,
                },
              },
              { signal: api.signal, silent: true }
            );
          return { data: normalizeTableDetail(response.data) };
        } catch (error) {
          return {
            error: toDbCatalogError(
              error,
              'Не удалось загрузить сведения о таблице.'
            ),
          };
        }
      },
    }),
    getTablePreview: build.query<DbCatalogTablePreview, DbCatalogTableArg>({
      keepUnusedDataFor: 30,
      providesTags: (_result, _error, arg) =>
        tagForConnection(arg.connectionId),
      queryFn: async (arg, api) => {
        try {
          const response = await client.dbConnections
            .connectionId(arg.connectionId)
            .catalog.table.preview.get(
              {
                query: {
                  ...(arg.databaseName
                    ? { database_name: arg.databaseName }
                    : {}),
                  ...(arg.schemaName ? { schema_name: arg.schemaName } : {}),
                  table_name: arg.tableName,
                },
              },
              { signal: api.signal, silent: true }
            );
          return { data: normalizeTablePreview(response.data) };
        } catch (error) {
          return {
            error: toDbCatalogError(
              error,
              'Не удалось загрузить предпросмотр таблицы.'
            ),
          };
        }
      },
    }),
    refreshCatalog: build.mutation<string, { connectionId: string }>({
      invalidatesTags: (result, _error, arg) =>
        result ? tagForConnection(arg.connectionId) : [],
      queryFn: async ({ connectionId }, api) => {
        try {
          const response = await client.dbConnections
            .connectionId(connectionId)
            .catalog.refresh.post(undefined, {
              signal: api.signal,
              silent: true,
            });
          return { data: response.data.catalog_version };
        } catch (error) {
          return {
            error: toDbCatalogError(error, 'Не удалось обновить каталог.'),
          };
        }
      },
    }),
  }),
});

export const invalidateDbCatalog = (connectionId: string) =>
  dbCatalogApi.util.invalidateTags(tagForConnection(connectionId));

export const {
  useGetTableQuery,
  useGetTablePreviewQuery,
  useListDatabasesInfiniteQuery,
  useListSchemasInfiniteQuery,
  useListTablesInfiniteQuery,
  useRefreshCatalogMutation,
} = dbCatalogApi;
