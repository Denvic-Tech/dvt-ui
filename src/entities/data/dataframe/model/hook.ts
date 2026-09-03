import { useCallback, useEffect, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';

import type { DataFrameData } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';

import type { DownloadDataFrameCsvOptions } from '../api.ts';

import {
  downloadDataFrameCsv,
  type DownloadDataFrameCsvResult,
} from './download.ts';
import { selectDataFrameEntryByKey } from './selectors.ts';
import {
  buildDataFrameRequestKey,
  type DataFrameRequestParams,
  DEFAULT_DATAFRAME_LIMIT,
  DEFAULT_DATAFRAME_OFFSET,
  DEFAULT_DATAFRAME_OUTPUT_NAME,
  fetchDataFrameData,
  resolveDataFrameRequestParams,
} from './slice.ts';

type DataFrameHookStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ReloadOptions {
  force?: boolean;
}

interface UseDataFrameDataResult {
  loading: boolean;
  isLoading: boolean;
  status: DataFrameHookStatus;
  dataFrameData: DataFrameData | null;
  data: DataFrameData | null;
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;
  cacheKey: string | null;
  params: DataFrameRequestParams | null;
  reload: (options?: ReloadOptions) => Promise<DataFrameData | null>;
}

export const useDataFrameData = (
  projectId: string | undefined | null,
  nodeID: string | undefined | null,
  outputName = DEFAULT_DATAFRAME_OUTPUT_NAME,
  offset = DEFAULT_DATAFRAME_OFFSET,
  limit = DEFAULT_DATAFRAME_LIMIT
): UseDataFrameDataResult => {
  const dispatch = useAppDispatch();

  const resolvedParams = useMemo(() => {
    if (!projectId || !nodeID) {
      return null;
    }

    return resolveDataFrameRequestParams({
      projectID: projectId,
      nodeID,
      outputName,
      offset,
      limit,
    });
  }, [projectId, nodeID, outputName, offset, limit]);

  const cacheKey = useMemo(
    () => (resolvedParams ? buildDataFrameRequestKey(resolvedParams) : null),
    [resolvedParams]
  );

  const entry = useAppSelector(state =>
    cacheKey ? selectDataFrameEntryByKey(state, cacheKey) : undefined
  );

  const status: DataFrameHookStatus = resolvedParams
    ? (entry?.status ?? 'idle')
    : 'idle';
  const isLoading = Boolean(
    resolvedParams && (!entry || entry.status === 'loading')
  );

  const reload = useCallback(
    (options?: ReloadOptions) => {
      if (!resolvedParams) {
        return Promise.resolve<DataFrameData | null>(null);
      }

      if (!options?.force && entry?.status === 'loading') {
        return Promise.resolve(entry?.data ?? null);
      }

      return dispatch(fetchDataFrameData(resolvedParams))
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
      dispatch(fetchDataFrameData(resolvedParams));
    }
  }, [dispatch, resolvedParams, cacheKey, entry]);

  return {
    loading: isLoading,
    isLoading,
    status,
    dataFrameData: entry?.data ?? null,
    data: entry?.data ?? null,
    error: entry?.error ?? null,
    lastUpdatedAt: entry?.lastUpdatedAt ?? null,
    cacheKey,
    params: resolvedParams,
    reload,
  } as const;
};

export const useDataFrameCsvDownload = () => {
  const dispatch = useAppDispatch();

  return useCallback(
    (
      options: DownloadDataFrameCsvOptions
    ): Promise<DownloadDataFrameCsvResult> =>
      dispatch(downloadDataFrameCsv(options)).unwrap(),
    [dispatch]
  );
};
