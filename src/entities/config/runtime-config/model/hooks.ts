import { useCallback, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectIsAIAnalysisEnabled,
  selectRuntimeConfig,
  selectRuntimeConfigError,
  selectRuntimeConfigStatus,
} from './selectors';
import { fetchRuntimeConfig } from './thunks';

export const useRuntimeConfig = () => {
  const dispatch = useAppDispatch();
  const runtimeConfig = useAppSelector(selectRuntimeConfig);
  const status = useAppSelector(selectRuntimeConfigStatus);
  const error = useAppSelector(selectRuntimeConfigError);
  const isAIAnalysisEnabled = useAppSelector(selectIsAIAnalysisEnabled);

  const isLoading = useMemo(() => status === 'loading', [status]);

  const refresh = useCallback(async () => {
    return dispatch(fetchRuntimeConfig()).unwrap();
  }, [dispatch]);

  return {
    error,
    isAIAnalysisEnabled,
    isLoading,
    refresh,
    runtimeConfig,
    status,
  };
};
