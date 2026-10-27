import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { client } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';
import { toApiErrorPayload } from '@/shared/lib/errors';

import type {
  FieldExplanation,
  GetFieldExplanationArg,
  GetNodeFieldsArg,
  GetProjectColumnsArg,
  NodeFields,
  ProjectColumns,
  SetNodeColumnDescriptionsArg,
} from '../model/types';

const DEFAULT_EXPLAIN_DEPTH = 20;

const nodeFieldsTagId = (projectId: string, nodeId: string) =>
  `${projectId}:${nodeId}`;

const toLineageError = (
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
 * Lineage колонок строится по текущему графу проекта, поэтому ответ быстро
 * устаревает: держим его в кэше недолго, а модалка дополнительно
 * перезапрашивает данные при каждом открытии.
 */
export const lineageApi = createApi({
  reducerPath: 'lineageApi',
  baseQuery: fakeBaseQuery<ApiErrorPayload>(),
  tagTypes: ['NodeFields', 'FieldExplanation', 'ProjectColumns'],
  keepUnusedDataFor: 30,
  endpoints: build => ({
    getNodeFields: build.query<NodeFields, GetNodeFieldsArg>({
      providesTags: (_result, _error, arg) => [
        { type: 'NodeFields', id: nodeFieldsTagId(arg.projectId, arg.nodeId) },
      ],
      queryFn: async (arg, api) => {
        try {
          const response = await client.projects
            .projectId(arg.projectId)
            .lineage.nodes.nodeId(arg.nodeId)
            .fields.get(
              { query: { port: arg.port ?? null } },
              { signal: api.signal, silent: true }
            );
          return { data: response.data };
        } catch (error) {
          return {
            error: toLineageError(
              error,
              'Не удалось загрузить состав колонок ноды.'
            ),
          };
        }
      },
    }),
    getProjectColumns: build.query<ProjectColumns, GetProjectColumnsArg>({
      providesTags: (_result, _error, arg) => [
        { type: 'ProjectColumns', id: arg.projectId },
      ],
      queryFn: async (arg, api) => {
        try {
          const response = await client.projects
            .projectId(arg.projectId)
            .lineage.columns.get(undefined, {
              signal: api.signal,
              silent: true,
            });
          return { data: response.data };
        } catch (error) {
          return {
            error: toLineageError(
              error,
              'Не удалось загрузить колонки проекта.'
            ),
          };
        }
      },
    }),
    getFieldExplanation: build.query<FieldExplanation, GetFieldExplanationArg>({
      providesTags: (_result, _error, arg) => [
        {
          type: 'FieldExplanation',
          id: `${arg.projectId}:${arg.nodeId}:${arg.port ?? ''}:${arg.column}`,
        },
      ],
      queryFn: async (arg, api) => {
        try {
          const response = await client.projects
            .projectId(arg.projectId)
            .lineage.explain.get(
              {
                query: {
                  node_id: arg.nodeId,
                  column: arg.column,
                  port: arg.port ?? null,
                  direction: arg.direction ?? 'upstream',
                  max_depth: arg.maxDepth ?? DEFAULT_EXPLAIN_DEPTH,
                },
              },
              { signal: api.signal, silent: true }
            );
          return { data: response.data as FieldExplanation };
        } catch (error) {
          return {
            error: toLineageError(
              error,
              'Не удалось загрузить происхождение колонки.'
            ),
          };
        }
      },
    }),
    setNodeColumnDescriptions: build.mutation<
      NodeFields,
      SetNodeColumnDescriptionsArg
    >({
      queryFn: async (arg, api) => {
        try {
          const response = await client.projects
            .projectId(arg.projectId)
            .lineage.nodes.nodeId(arg.nodeId)
            .columns.patch(
              { body: { port: arg.port ?? null, fields: arg.fields } },
              { signal: api.signal, silent: true }
            );
          return { data: response.data };
        } catch (error) {
          return {
            error: toLineageError(
              error,
              'Не удалось сохранить описание колонки.'
            ),
          };
        }
      },
      // Ответ — актуальный состав колонок порта: кладём его в кэш этой ноды
      // без перезапроса. Описания наследуются вниз по графу, поэтому колонки
      // остальных нод проекта и общий список колонок помечаем устаревшими.
      onQueryStarted: async (arg, { dispatch, getState, queryFulfilled }) => {
        let fields: NodeFields;
        try {
          ({ data: fields } = await queryFulfilled);
        } catch {
          return;
        }

        const state = getState();
        const staleTags: {
          type: 'NodeFields' | 'ProjectColumns';
          id: string;
        }[] = [{ type: 'ProjectColumns', id: arg.projectId }];

        lineageApi.util
          .selectCachedArgsForQuery(state, 'getNodeFields')
          .forEach(cachedArg => {
            if (cachedArg.projectId !== arg.projectId) {
              return;
            }

            if (cachedArg.nodeId !== arg.nodeId) {
              staleTags.push({
                type: 'NodeFields',
                id: nodeFieldsTagId(cachedArg.projectId, cachedArg.nodeId),
              });
              return;
            }

            const cachedPort =
              cachedArg.port ??
              lineageApi.endpoints.getNodeFields.select(cachedArg)(state).data
                ?.port;
            if (cachedPort === fields.port) {
              dispatch(
                lineageApi.util.updateQueryData(
                  'getNodeFields',
                  cachedArg,
                  () => fields
                )
              );
            }
          });

        dispatch(lineageApi.util.invalidateTags(staleTags));
      },
    }),
  }),
});

/** Общий список колонок проекта устарел (например, после PATCH описаний датасета). */
export const invalidateProjectColumns = (projectId: string) =>
  lineageApi.util.invalidateTags([{ type: 'ProjectColumns', id: projectId }]);

export const {
  useGetNodeFieldsQuery,
  useGetProjectColumnsQuery,
  useGetFieldExplanationQuery,
  useSetNodeColumnDescriptionsMutation,
} = lineageApi;
