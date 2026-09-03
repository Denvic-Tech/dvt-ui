import type { Draft } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import type {
  QueueAction,
  QueueActionResponse,
  QueueStateResponse,
  QueueTask,
  TaskExecutionStatus,
} from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  createUnknownError,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { queueApi } from '../api.ts';

export interface QueueSliceState {
  pending: QueueTask[];
  isLoading: boolean;
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;

  selectedProjectId: string | null;
  selectedStatuses: TaskExecutionStatus[] | null; // <--- новое поле

  actionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  actionError: ApiErrorPayload | null;
  actionMessage: string | null;
}

const initialState: QueueSliceState = {
  pending: [],
  isLoading: false,
  error: null,
  lastUpdatedAt: null,

  selectedProjectId: null,
  selectedStatuses: null,

  actionStatus: 'idle',
  actionError: null,
  actionMessage: null,
};

export interface FetchQueueStateArgs {
  projectId: string | null;
  statusFilter: TaskExecutionStatus[] | null;
}

export interface PerformQueueActionArgs {
  taskId: string;
  action: QueueAction;
}

export const fetchQueueState = createAppAsyncThunk<
  QueueStateResponse,
  FetchQueueStateArgs
>('queue/fetchQueueState', args => {
  return queueApi.getQueueState(args.projectId, args.statusFilter);
});

export const performQueueAction = createAppAsyncThunk<
  QueueActionResponse,
  PerformQueueActionArgs
>('queue/performQueueAction', ({ taskId, action }) => {
  return queueApi.performAction(taskId, action);
});

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    resetQueueActionState: (state: Draft<QueueSliceState>) => {
      state.actionStatus = 'idle';
      state.actionError = null;
      state.actionMessage = null;
    },

    clearQueue: (state: Draft<QueueSliceState>) => {
      state.pending = [];
      state.error = null;
      state.lastUpdatedAt = null;

      state.selectedProjectId = null;
      state.selectedStatuses = null;

      state.actionStatus = 'idle';
      state.actionError = null;
      state.actionMessage = null;
    },

    setSelectedStatuses: (
      state: Draft<QueueSliceState>,
      action: { payload: TaskExecutionStatus[] | null }
    ) => {
      state.selectedStatuses = action.payload;
    },
  },

  extraReducers: builder => {
    builder
      .addCase(fetchQueueState.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;

        state.selectedProjectId = action.meta.arg?.projectId ?? null;
        state.selectedStatuses = action.meta.arg?.statusFilter ?? null;
      })

      .addCase(fetchQueueState.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pending = action.payload.tasks ?? [];
        state.lastUpdatedAt = new Date().toISOString();
        state.error = null;
      })

      .addCase(fetchQueueState.rejected, (state, action) => {
        state.isLoading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось получить состояние очереди'
        );
      })

      .addCase(performQueueAction.pending, state => {
        state.actionStatus = 'loading';
        state.actionError = null;
        state.actionMessage = null;
      })

      .addCase(performQueueAction.fulfilled, (state, action) => {
        state.actionMessage = action.payload.message ?? null;
        state.actionStatus = action.payload.success ? 'succeeded' : 'failed';

        state.actionError = action.payload.success
          ? null
          : createUnknownError(action.payload.message);

        if (action.payload.success && action.payload.task_id) {
          state.pending = state.pending.filter(
            (t: QueueTask) => t.task_id !== action.payload.task_id
          );
        }
      })

      .addCase(performQueueAction.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.actionError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось выполнить действие над очередью'
        );
        state.actionMessage = null;
      });
  },
});

export const queueReducer = queueSlice.reducer;

export const { resetQueueActionState, clearQueue, setSelectedStatuses } =
  queueSlice.actions;
