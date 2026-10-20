import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { client } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';
import { toApiErrorPayload } from '@/shared/lib/errors';

import type {
  FieldExplanation,
  GetFieldExplanationArg,
  GetNodeFieldsArg,
  NodeFields,
} from '../model/types';

const DEFAULT_EXPLAIN_DEPTH = 20;

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
  tagTypes: ['NodeFields', 'FieldExplanation'],
  keepUnusedDataFor: 30,
  endpoints: build => ({
    getNodeFields: build.query<NodeFields, GetNodeFieldsArg>({
      providesTags: (_result, _error, arg) => [
        { type: 'NodeFields', id: `${arg.projectId}:${arg.nodeId}` },
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
  }),
});

export const { useGetNodeFieldsQuery, useGetFieldExplanationQuery } =
  lineageApi;
