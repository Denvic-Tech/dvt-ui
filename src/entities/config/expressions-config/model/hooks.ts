import { useCallback, useEffect, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectExpressionsConfig,
  selectExpressionsConfigError,
  selectExpressionsConfigStatus,
} from './selectors';
import { fetchExpressionsConfig } from './thunks';

export const useExpressionsConfig = () => {
  const dispatch = useAppDispatch();
  const expressionsConfig = useAppSelector(selectExpressionsConfig);
  const status = useAppSelector(selectExpressionsConfigStatus);
  const error = useAppSelector(selectExpressionsConfigError);

  const isLoading = useMemo(() => status === 'loading', [status]);

  const refresh = useCallback(async () => {
    return dispatch(fetchExpressionsConfig()).unwrap();
  }, [dispatch]);

  useEffect(() => {
    if (status === 'idle') {
      void refresh();
    }
  }, [refresh, status]);

  return {
    error,
    expressionsConfig,
    isLoading,
    refresh,
    status,
  };
};
