import { RootState } from '@/app/providers/store';

export const selectTaskExecutionStatus = (state: RootState) =>
  state.taskExecutionStatus.status;

export const selectTaskExecutionError = (state: RootState) =>
  state.taskExecutionStatus.error;

export const selectTaskExecutionTaskId = (state: RootState) =>
  state.taskExecutionStatus.taskId;
