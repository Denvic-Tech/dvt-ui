import { useCallback, useEffect, useMemo } from 'react';

import { selectCurrentLanguage } from '@/app/i18n';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import type { PublishedNodeDocumentationSchema } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';

import { selectNodeDocumentationEntryByKey } from './selectors';
import {
  buildNodeDocumentationRequestKey,
  type NodeDocumentationRequestParams,
} from './slice';
import { fetchNodeDocumentation } from './thunks';

interface UseNodeDocumentationOptions {
  enabled?: boolean;
}

interface ReloadOptions {
  force?: boolean;
}

interface UseNodeDocumentationResult {
  cacheKey: string | null;
  data: PublishedNodeDocumentationSchema | null;
  documentation: PublishedNodeDocumentationSchema | null;
  error: ApiErrorPayload | null;
  isLoading: boolean;
  lastUpdatedAt: string | null;
  params: NodeDocumentationRequestParams | null;
  reload: (
    options?: ReloadOptions
  ) => Promise<PublishedNodeDocumentationSchema | null>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

export const useNodeDocumentation = (
  nodeName: string | null | undefined,
  options?: UseNodeDocumentationOptions
): UseNodeDocumentationResult => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(selectCurrentLanguage);
  const enabled = options?.enabled ?? true;

  const resolvedParams = useMemo(() => {
    if (!nodeName) {
      return null;
    }

    return {
      language: currentLanguage.value,
      nodeName,
    } satisfies NodeDocumentationRequestParams;
  }, [currentLanguage.value, nodeName]);

  const cacheKey = useMemo(
    () =>
      resolvedParams ? buildNodeDocumentationRequestKey(resolvedParams) : null,
    [resolvedParams]
  );

  const entry = useAppSelector(state =>
    cacheKey ? selectNodeDocumentationEntryByKey(state, cacheKey) : undefined
  );

  const status = resolvedParams ? (entry?.status ?? 'idle') : 'idle';
  const isLoading = Boolean(
    enabled && resolvedParams && (!entry || entry.status === 'loading')
  );

  const reload = useCallback(
    (reloadOptions?: ReloadOptions) => {
      if (!resolvedParams) {
        return Promise.resolve<PublishedNodeDocumentationSchema | null>(null);
      }

      if (!reloadOptions?.force && entry?.status === 'loading') {
        return Promise.resolve(entry.data);
      }

      return dispatch(fetchNodeDocumentation(resolvedParams))
        .unwrap()
        .then(result => result.data);
    },
    [dispatch, entry, resolvedParams]
  );

  useEffect(() => {
    if (!enabled || !resolvedParams || !cacheKey) {
      return;
    }

    if (!entry || entry.status === 'idle') {
      dispatch(fetchNodeDocumentation(resolvedParams));
    }
  }, [cacheKey, dispatch, enabled, entry, resolvedParams]);

  return {
    cacheKey,
    data: entry?.data ?? null,
    documentation: entry?.data ?? null,
    error: entry?.error ?? null,
    isLoading,
    lastUpdatedAt: entry?.lastUpdatedAt ?? null,
    params: resolvedParams,
    reload,
    status,
  };
};
