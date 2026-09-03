import { useCallback, useEffect, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';

import type { JsonData } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';

import { selectJsonDataEntryByKey } from './selectors.ts';
import {
  buildJsonDataRequestKey,
  DEFAULT_JSON_LIMIT,
  DEFAULT_JSON_OFFSET,
  DEFAULT_JSON_OUTPUT_NAME,
  fetchJsonData,
  type JsonDataRequestParams,
  resolveJsonDataRequestParams,
} from './slice.ts';

type JsonHookStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ReloadOptions {
  force?: boolean;
}

interface UseJsonDataResult {
  loading: boolean;
  isLoading: boolean;
  status: JsonHookStatus;
  jsonData: JsonData | null;
  data: JsonData | null;
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;
  cacheKey: string | null;
  params: JsonDataRequestParams | null;
  reload: (options?: ReloadOptions) => Promise<JsonData | null>;
}

export const useJsonData = (
  projectId: string | undefined | null,
  nodeID: string | undefined | null,
  outputName = DEFAULT_JSON_OUTPUT_NAME,
  offset = DEFAULT_JSON_OFFSET,
  limit = DEFAULT_JSON_LIMIT
): UseJsonDataResult => {
  const dispatch = useAppDispatch();

  const resolvedParams = useMemo(() => {
    if (!projectId || !nodeID) {
      return null;
    }

    return resolveJsonDataRequestParams({
      projectID: projectId,
      nodeID,
      outputName,
      offset,
      limit,
    });
  }, [projectId, nodeID, outputName, offset, limit]);

  const cacheKey = useMemo(
    () => (resolvedParams ? buildJsonDataRequestKey(resolvedParams) : null),
    [resolvedParams]
  );

  const entry = useAppSelector(state =>
    cacheKey ? selectJsonDataEntryByKey(state, cacheKey) : undefined
  );

  const status: JsonHookStatus = resolvedParams
    ? (entry?.status ?? 'idle')
    : 'idle';
  const isLoading = Boolean(
    resolvedParams && (!entry || entry.status === 'loading')
  );

  const reload = useCallback(
    (options?: ReloadOptions) => {
      if (!resolvedParams) {
        return Promise.resolve<JsonData | null>(null);
      }

      if (!options?.force && entry?.status === 'loading') {
        return Promise.resolve(entry?.data ?? null);
      }

      return dispatch(fetchJsonData(resolvedParams))
        .unwrap()
        .then(result => result.data);
    },
    [dispatch, resolvedParams, entry]
  );

  useEffect(() => {
    if (!resolvedParams || !cacheKey) {
      return;
    }

    if (!entry || entry.status === 'idle') {
      dispatch(fetchJsonData(resolvedParams));
    }
  }, [dispatch, resolvedParams, cacheKey, entry]);

  return {
    loading: isLoading,
    isLoading,
    status,
    jsonData: entry?.data ?? null,
    data: entry?.data ?? null,
    error: entry?.error ?? null,
    lastUpdatedAt: entry?.lastUpdatedAt ?? null,
    cacheKey,
    params: resolvedParams,
    reload,
  } as const;
};
