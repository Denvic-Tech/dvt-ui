import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { client } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';
import { toApiErrorPayload } from '@/shared/lib/errors';

import { applyDatasetDetailsToSummary } from '../model/presentation';
import type {
  DatasetDetails,
  DatasetPage,
  DatasetUsageEntry,
  GetDatasetArg,
  GetDatasetUsageArg,
  SearchDatasetsArg,
  SetDatasetDescriptionsArg,
} from '../model/types';

const DEFAULT_PAGE_SIZE = 50;

const toDataCatalogError = (
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

/**
 * Теги:
 * - `Dataset` (id) — конкретный датасет; будущие мутации (описания, rename,
 *   refresh) должны инвалидировать именно его.
 * - `DatasetList` — все страницы поиска.
 */
export const dataCatalogApi = createApi({
  reducerPath: 'dataCatalogApi',
  baseQuery: fakeBaseQuery<ApiErrorPayload>(),
  tagTypes: ['Dataset', 'DatasetList'],
  endpoints: build => ({
    searchDatasets: build.infiniteQuery<
      DatasetPage,
      SearchDatasetsArg,
      string | null
    >({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: page => page.next_cursor ?? undefined,
      },
      providesTags: result => [
        'DatasetList',
        ...(result?.pages ?? []).flatMap(page =>
          page.items.map(item => ({ type: 'Dataset' as const, id: item.id }))
        ),
      ],
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const response = await client.dataCatalog.datasets.get(
            {
              query: {
                project_id: queryArg.projectId ?? null,
                connection_id: queryArg.connectionId ?? null,
                kind: queryArg.kind ?? null,
                query: queryArg.query?.trim() || null,
                cursor: pageParam,
                limit: queryArg.limit ?? DEFAULT_PAGE_SIZE,
              },
            },
            { signal: api.signal, silent: true }
          );
          return { data: response.data };
        } catch (error) {
          return {
            error: toDataCatalogError(
              error,
              'Не удалось загрузить каталог данных.'
            ),
          };
        }
      },
    }),
    getDataset: build.query<DatasetDetails, GetDatasetArg>({
      providesTags: (_result, _error, arg) => [
        { type: 'Dataset', id: arg.datasetId },
      ],
      queryFn: async (arg, api) => {
        try {
          const response = await client.dataCatalog.datasets
            .datasetId(arg.datasetId)
            .get(
              {
                query: {
                  include_fields: arg.includeFields ?? true,
                  sync: arg.sync ?? false,
                },
              },
              { signal: api.signal, silent: true }
            );
          return { data: response.data };
        } catch (error) {
          return {
            error: toDataCatalogError(
              error,
              'Не удалось загрузить сведения о датасете.'
            ),
          };
        }
      },
      // После sync=true бэкенд может обновить freshness/описания/счётчики —
      // переносим их в уже загруженные страницы списка без лишнего refetch.
      onQueryStarted: async (_arg, { dispatch, getState, queryFulfilled }) => {
        let details: DatasetDetails;
        try {
          ({ data: details } = await queryFulfilled);
        } catch {
          return;
        }

        const cachedSearchArgs = dataCatalogApi.util.selectCachedArgsForQuery(
          getState(),
          'searchDatasets'
        );

        cachedSearchArgs.forEach(searchArg => {
          dispatch(
            dataCatalogApi.util.updateQueryData(
              'searchDatasets',
              searchArg,
              draft => {
                draft.pages.forEach(page => {
                  page.items.forEach((item, index) => {
                    if (item.id === details.id) {
                      page.items[index] = applyDatasetDetailsToSummary(
                        item,
                        details
                      );
                    }
                  });
                });
              }
            )
          );
        });
      },
    }),
    setDatasetDescriptions: build.mutation<
      DatasetDetails,
      SetDatasetDescriptionsArg
    >({
      // Описания датасета глобальны: сбрасываем его карточку и список.
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Dataset', id: arg.datasetId },
        'DatasetList',
      ],
      queryFn: async (arg, api) => {
        try {
          const response = await client.dataCatalog.datasets
            .datasetId(arg.datasetId)
            .patch(
              {
                body: {
                  ...(arg.description !== undefined
                    ? { description: arg.description }
                    : {}),
                  fields: arg.fields ?? null,
                },
              },
              { signal: api.signal, silent: true }
            );
          return { data: response.data };
        } catch (error) {
          return {
            error: toDataCatalogError(
              error,
              'Не удалось сохранить описание датасета.'
            ),
          };
        }
      },
    }),
    getDatasetUsage: build.query<DatasetUsageEntry[], GetDatasetUsageArg>({
      providesTags: (_result, _error, arg) => [
        { type: 'Dataset', id: arg.datasetId },
      ],
      queryFn: async (arg, api) => {
        try {
          const response = await client.dataCatalog.datasets
            .datasetId(arg.datasetId)
            .usage.get(
              { query: { direction: arg.direction ?? null } },
              { signal: api.signal, silent: true }
            );
          return { data: response.data.items };
        } catch (error) {
          return {
            error: toDataCatalogError(
              error,
              'Не удалось загрузить использование датасета.'
            ),
          };
        }
      },
    }),
  }),
});

export const invalidateDataset = (datasetId: string) =>
  dataCatalogApi.util.invalidateTags([{ type: 'Dataset', id: datasetId }]);

export const {
  useGetDatasetQuery,
  useGetDatasetUsageQuery,
  useSearchDatasetsInfiniteQuery,
  useSetDatasetDescriptionsMutation,
} = dataCatalogApi;
