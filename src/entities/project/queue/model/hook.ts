import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';

import { selectQueueState } from '@/entities/project/queue';

import type { QueueAction, TaskExecutionStatus } from '@/shared/gatewayClient';

import {
  fetchQueueState,
  performQueueAction,
  type PerformQueueActionArgs,
  resetQueueActionState,
} from './slice.ts';

export const useQueue = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectQueueState);

  const loadQueue = useCallback(
    (projectId: string | null, statusFilter: TaskExecutionStatus[] | null) => {
      return dispatch(
        fetchQueueState({
          projectId,
          statusFilter,
        })
      ).unwrap();
    },
    [dispatch]
  );

  const executeAction = useCallback(
    (taskId: PerformQueueActionArgs['taskId'], action: QueueAction) => {
      return dispatch(performQueueAction({ taskId, action })).unwrap();
    },
    [dispatch]
  );

  const resetAction = useCallback(() => {
    dispatch(resetQueueActionState());
  }, [dispatch]);

  return {
    ...state,
    loadQueue,
    executeAction,
    resetAction,
  };
};
