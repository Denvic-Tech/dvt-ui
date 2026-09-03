import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  cancelProjectTask as cancelProjectTaskThunk,
  createProjectTask as createProjectTaskThunk,
  getProjectTaskInfo as getProjectTaskInfoThunk,
  selectLastProjectTaskID,
  selectProjectTaskCancelError,
  selectProjectTaskCancelPending,
  selectProjectTaskError,
  selectProjectTaskInfo,
  selectProjectTaskInfoError,
  selectProjectTaskInfoPending,
  selectProjectTaskPending,
} from '@/entities/project/project-task';

import { PipelineExecutionMode } from '@/shared/gatewayClient';

export const useProjectTask = () => {
  const dispatch = useAppDispatch();

  const lastProjectTaskID = useAppSelector(selectLastProjectTaskID);
  const projectTaskPending = useAppSelector(selectProjectTaskPending);
  const projectTaskError = useAppSelector(selectProjectTaskError);
  const projectTaskCancelPending = useAppSelector(
    selectProjectTaskCancelPending
  );
  const projectTaskCancelError = useAppSelector(selectProjectTaskCancelError);
  const projectTaskInfo = useAppSelector(selectProjectTaskInfo);
  const projectTaskInfoPending = useAppSelector(selectProjectTaskInfoPending);
  const projectTaskInfoError = useAppSelector(selectProjectTaskInfoError);

  const createProjectTask = useCallback(
    async (
      projectID: string,
      mode: PipelineExecutionMode = 'full',
      forceExec: boolean = false,
      targetNodes: string[] | null = null
    ) => {
      return dispatch(
        createProjectTaskThunk({
          projectID,
          mode,
          forceExec,
          targetNodes,
        })
      ).unwrap();
    },
    [dispatch]
  );

  const cancelProjectTask = useCallback(
    async (projectID: string, taskID: string) => {
      return dispatch(cancelProjectTaskThunk({ projectID, taskID })).unwrap();
    },
    [dispatch]
  );

  const getProjectTaskInfo = useCallback(
    async (projectID: string, taskID: string) => {
      return dispatch(getProjectTaskInfoThunk({ projectID, taskID })).unwrap();
    },
    [dispatch]
  );

  return {
    createProjectTask,
    cancelProjectTask,
    getProjectTaskInfo,
    lastProjectTaskID,
    projectTaskPending,
    projectTaskError,
    projectTaskCancelPending,
    projectTaskCancelError,
    projectTaskInfo,
    projectTaskInfoPending,
    projectTaskInfoError,
  };
};
