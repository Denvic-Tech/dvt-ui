import { createSlice } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import { projectTaskApi } from '@/entities/project/project-task';

import {
  PipelineExecutionMode,
  TaskInfo,
  TaskResponse,
} from '@/shared/gatewayClient';
import { ApiErrorPayload, ensureApiErrorPayload } from '@/shared/lib/errors';

export interface ProjectTaskState {
  lastTaskID: string | null;
  pending: boolean;
  error: ApiErrorPayload | null;
  cancelPending: boolean;
  cancelError: ApiErrorPayload | null;
  taskInfo: TaskInfo | null;
  taskInfoPending: boolean;
  taskInfoError: ApiErrorPayload | null;
}

const initialState: ProjectTaskState = {
  lastTaskID: null,
  pending: false,
  error: null,
  cancelPending: false,
  cancelError: null,
  taskInfo: null,
  taskInfoPending: false,
  taskInfoError: null,
};

export const createProjectTask = createAppAsyncThunk<
  TaskResponse,
  {
    projectID: string;
    mode: PipelineExecutionMode;
    forceExec: boolean;
    targetNodes: string[] | null;
  }
>(
  'projectTask/createTask',
  ({ projectID, mode, forceExec, targetNodes = null }) => {
    return projectTaskApi.createTask(projectID, mode, forceExec, targetNodes);
  }
);

export const runToNode = createAppAsyncThunk<TaskResponse, string>(
  'projectTask/runToNode',
  (nodeID, { getState }) => {
    // Достаем ID проекта прямо из стейта
    const state = getState();
    const projectID = state.projects.selectedProject?.id;

    if (!projectID) throw new Error('Project ID is missing');

    // Возвращаем вызов API точно так же, как в createProjectTask
    return projectTaskApi.createTask(projectID, 'full', false, [nodeID]);
  }
);

export const cancelProjectTask = createAppAsyncThunk<
  TaskResponse,
  { projectID: string; taskID: string }
>('projectTask/cancelTask', ({ projectID, taskID }) => {
  return projectTaskApi.cancelTask(projectID, taskID);
});

export const getProjectTaskInfo = createAppAsyncThunk<
  TaskInfo,
  { projectID: string; taskID: string }
>('projectTask/getTaskInfo', ({ projectID, taskID }) => {
  return projectTaskApi.getTaskInfo(projectID, taskID);
});

const projectTaskSlice = createSlice({
  name: 'projectTask',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(createProjectTask.pending, state => {
        state.pending = true;
        state.error = null;
      })
      .addCase(createProjectTask.fulfilled, (state, action) => {
        state.lastTaskID = action.payload.task_id;
        state.pending = false;
        state.error = null;
      })
      .addCase(createProjectTask.rejected, (state, action) => {
        state.pending = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось отправить задачу'
        );
      })
      .addCase(cancelProjectTask.pending, state => {
        state.cancelPending = true;
        state.cancelError = null;
      })
      .addCase(cancelProjectTask.fulfilled, state => {
        state.cancelPending = false;
        state.cancelError = null;
      })
      .addCase(runToNode.pending, state => {
        state.pending = true;
        state.error = null;
      })
      .addCase(runToNode.fulfilled, (state, action) => {
        state.lastTaskID = action.payload.task_id;
        state.pending = false;
        state.error = null;
      })
      .addCase(runToNode.rejected, (state, action) => {
        state.pending = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось запустить до ноды'
        );
      })
      .addCase(cancelProjectTask.rejected, (state, action) => {
        state.cancelPending = false;
        state.cancelError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось отменить задачу'
        );
      })
      .addCase(getProjectTaskInfo.pending, state => {
        state.taskInfoPending = true;
        state.taskInfoError = null;
      })
      .addCase(getProjectTaskInfo.fulfilled, (state, action) => {
        state.taskInfo = action.payload;
        state.taskInfoPending = false;
        state.taskInfoError = null;
      })
      .addCase(getProjectTaskInfo.rejected, (state, action) => {
        state.taskInfoPending = false;
        state.taskInfoError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось получить информацию о задаче'
        );
      });
  },
});

export const projectTaskReducer = projectTaskSlice.reducer;
