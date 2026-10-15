import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import type {
  FailingProjectsWidgetSchema,
  RunsLast24hWidgetSchema,
  ScheduledRunsWidgetSchema,
  ServicesWidgetSchema,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';
import { toApiErrorPayload } from '@/shared/lib/errors';

export type HomeWidgetLimitArg = {
  /** Backend accepts 1–20, default 5. */
  limit?: number;
};

const toWidgetError = (
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

// Generated request validators reject the empty request envelope of
// parameterless GETs, so they are bypassed (same as the scheduler list).
const passThroughValidator = async <T>(data: T) => data;

/**
 * Data sources for the home dashboard widgets. Every widget polls its own
 * endpoint; errors are handled inside the widget card, never as global alerts.
 */
export const homeWidgetsApi = createApi({
  reducerPath: 'homeWidgetsApi',
  baseQuery: fakeBaseQuery<ApiErrorPayload>(),
  endpoints: build => ({
    getRuns24h: build.query<RunsLast24hWidgetSchema, void>({
      queryFn: async (_arg, api) => {
        try {
          const response = await client.widgets.runs24h.get(
            {},
            {
              requestValidator: passThroughValidator,
              signal: api.signal,
              silent: true,
            }
          );
          return { data: response.data };
        } catch (error) {
          return {
            error: toWidgetError(error, 'Не удалось загрузить запуски.'),
          };
        }
      },
    }),
    getScheduledRuns: build.query<
      ScheduledRunsWidgetSchema,
      HomeWidgetLimitArg
    >({
      queryFn: async ({ limit }, api) => {
        try {
          const response = await client.widgets.scheduledRuns.get(
            { query: limit != null ? { limit } : {} },
            { signal: api.signal, silent: true }
          );
          return { data: response.data };
        } catch (error) {
          return {
            error: toWidgetError(error, 'Не удалось загрузить расписания.'),
          };
        }
      },
    }),
    getServices: build.query<ServicesWidgetSchema, void>({
      queryFn: async (_arg, api) => {
        try {
          const response = await client.widgets.services.get(
            {},
            {
              requestValidator: passThroughValidator,
              signal: api.signal,
              silent: true,
            }
          );
          return { data: response.data };
        } catch (error) {
          return {
            error: toWidgetError(error, 'Не удалось загрузить сервисы.'),
          };
        }
      },
    }),
    getFailingProjects: build.query<
      FailingProjectsWidgetSchema,
      HomeWidgetLimitArg
    >({
      queryFn: async ({ limit }, api) => {
        try {
          const response = await client.widgets.failingProjects.get(
            { query: limit != null ? { limit } : {} },
            { signal: api.signal, silent: true }
          );
          return { data: response.data };
        } catch (error) {
          return {
            error: toWidgetError(
              error,
              'Не удалось загрузить проблемные проекты.'
            ),
          };
        }
      },
    }),
  }),
});

export const {
  useGetFailingProjectsQuery,
  useGetRuns24hQuery,
  useGetScheduledRunsQuery,
  useGetServicesQuery,
} = homeWidgetsApi;
