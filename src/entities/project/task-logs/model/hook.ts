import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { selectTaskLogsState } from './selectors';
import {
  loadMoreTaskLogs,
  openTaskLogs,
  type OpenTaskLogsArgs,
  resetTaskLogs,
} from './slice';

export const useTaskLogs = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectTaskLogsState);

  const open = useCallback(
    (args: OpenTaskLogsArgs) => dispatch(openTaskLogs(args)).unwrap(),
    [dispatch]
  );

  const loadMore = useCallback(
    () => dispatch(loadMoreTaskLogs()).unwrap(),
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetTaskLogs());
  }, [dispatch]);

  return {
    ...state,
    openTaskLogs: open,
    loadMoreTaskLogs: loadMore,
    resetTaskLogs: reset,
  };
};
