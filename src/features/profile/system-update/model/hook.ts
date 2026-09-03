import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import { selectSystemUpdateState } from './selectors';
import { startSystemUpdate, systemUpdateActions } from './slice';

export const useSystemUpdate = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectSystemUpdateState);

  const start = useCallback(
    (params: { ownerKey: string; version: string }) =>
      dispatch(startSystemUpdate(params)).unwrap(),
    [dispatch]
  );

  const pause = useCallback(() => {
    dispatch(systemUpdateActions.pauseSystemUpdateMonitoring());
  }, [dispatch]);

  const resume = useCallback(() => {
    dispatch(systemUpdateActions.resumeSystemUpdateMonitoring());
  }, [dispatch]);

  const clear = useCallback(() => {
    dispatch(systemUpdateActions.clearSystemUpdateMonitoring());
  }, [dispatch]);

  const clearStartError = useCallback(() => {
    dispatch(systemUpdateActions.clearSystemUpdateStartError());
  }, [dispatch]);

  return {
    ...state,
    start,
    pause,
    resume,
    clear,
    clearStartError,
  };
};
