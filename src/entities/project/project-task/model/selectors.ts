import { RootState } from '@/app/providers/store';

export const selectLastProjectTaskID = (state: RootState) =>
  state.projectTask.lastTaskID;
export const selectProjectTaskPending = (state: RootState) =>
  state.projectTask.pending;
export const selectProjectTaskError = (state: RootState) =>
  state.projectTask.error;
export const selectProjectTaskCancelPending = (state: RootState) =>
  state.projectTask.cancelPending;
export const selectProjectTaskCancelError = (state: RootState) =>
  state.projectTask.cancelError;
export const selectProjectTaskInfo = (state: RootState) =>
  state.projectTask.taskInfo;
export const selectProjectTaskInfoPending = (state: RootState) =>
  state.projectTask.taskInfoPending;
export const selectProjectTaskInfoError = (state: RootState) =>
  state.projectTask.taskInfoError;
