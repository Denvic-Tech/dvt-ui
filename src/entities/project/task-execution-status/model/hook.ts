import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';
import {
  selectTaskExecutionError,
  selectTaskExecutionStatus,
  selectTaskExecutionTaskId,
  taskExecutionStatusActions,
} from '@/entities/project/task-execution-status';

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
