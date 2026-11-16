import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import {
  selectTaskExecutionError,
  selectTaskExecutionStatus,
  selectTaskExecutionTaskId,
} from './selectors';
import { taskExecutionStatusActions } from './slice';

export const useTaskExecutionStatus = () => {
  const dispatch = useAppDispatch();

  const status = useAppSelector(selectTaskExecutionStatus);
  const error = useAppSelector(selectTaskExecutionError);
  const taskId = useAppSelector(selectTaskExecutionTaskId);

  const setIdle = useCallback(() => {
    dispatch(taskExecutionStatusActions.setIdle());
  }, [dispatch]);

  return {
    status,
    error,
    taskId,

    setIdle,
  };
};
