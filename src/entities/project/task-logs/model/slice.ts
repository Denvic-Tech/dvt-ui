import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';
import type { RootState } from '@/app/providers/store/rootReducer';

import type { LogEntrySchema } from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { taskLogsApi } from '../api/taskLogsApi';

const DEFAULT_PAGE_LIMIT = 200;

interface FetchTaskLogsPageArgs {
  projectId: string;
  taskId: string;
  limit: number;
  offset: number;
  append: boolean;
  requestKey: string;
}

export interface OpenTaskLogsArgs {
  projectId: string;
  taskId: string;
  limit?: number;
}

export interface TaskLogsState {
  projectId: string | null;
  taskId: string | null;
  items: LogEntrySchema[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  loadMoreStatus: 'idle' | 'loading' | 'failed';
  error: ApiErrorPayload | null;
  activeRequestKey: string | null;
}

const initialState: TaskLogsState = {
  projectId: null,
  taskId: null,
  items: [],
  total: 0,
  limit: DEFAULT_PAGE_LIMIT,
  offset: 0,
  hasMore: false,
  status: 'idle',
  loadMoreStatus: 'idle',
  error: null,
  activeRequestKey: null,
};

const buildRequestKey = (projectId: string, taskId: string) =>
  `${projectId}:${taskId}`;

const buildLogIdentity = (log: LogEntrySchema) =>
  [
    log.created_at,
    log.level,
    log.message,
    log.service_name,
    log.logger_name,
    log.module,
    log.function,
    log.line,
  ].join('|');

const mergeUniqueLogs = (
  currentLogs: LogEntrySchema[],
  nextLogs: LogEntrySchema[]
) => {
  const identities = new Set(currentLogs.map(buildLogIdentity));
  const mergedLogs = [...currentLogs];

  for (const log of nextLogs) {
    const identity = buildLogIdentity(log);

    if (identities.has(identity)) {
      continue;
    }

    identities.add(identity);
    mergedLogs.push(log);
  }

  return mergedLogs;
};

const fetchTaskLogsPage = createAppAsyncThunk<
  {
    items: LogEntrySchema[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    append: boolean;
    requestKey: string;
    projectId: string;
    taskId: string;
  },
  FetchTaskLogsPageArgs
>('taskLogs/fetchPage', async args => {
  const response = await taskLogsApi.getTaskLogs({
    projectId: args.projectId,
    taskId: args.taskId,
    limit: args.limit,
    offset: args.offset,
  });

  return {
    items: response.items ?? [],
    total: response.total,
    limit: response.limit,
    offset: response.offset,
    hasMore: response.has_more,
    append: args.append,
    requestKey: args.requestKey,
    projectId: args.projectId,
    taskId: args.taskId,
  };
});

export const openTaskLogs = createAppAsyncThunk<void, OpenTaskLogsArgs>(
  'taskLogs/open',
  async ({ projectId, taskId, limit = DEFAULT_PAGE_LIMIT }, thunkApi) => {
    await thunkApi
      .dispatch(
        fetchTaskLogsPage({
          projectId,
          taskId,
          limit,
          offset: 0,
          append: false,
          requestKey: buildRequestKey(projectId, taskId),
        })
      )
      .unwrap();
  }
);

export const loadMoreTaskLogs = createAppAsyncThunk<void, void>(
  'taskLogs/loadMore',
  async (_arg, thunkApi) => {
    const state = thunkApi.getState() as RootState;
    const taskLogsState = state.taskLogs;

    if (!taskLogsState.projectId || !taskLogsState.taskId) {
      return;
    }

    await thunkApi
      .dispatch(
        fetchTaskLogsPage({
          projectId: taskLogsState.projectId,
          taskId: taskLogsState.taskId,
          limit: taskLogsState.limit || DEFAULT_PAGE_LIMIT,
          offset: taskLogsState.offset + taskLogsState.items.length,
          append: true,
          requestKey: buildRequestKey(
            taskLogsState.projectId,
            taskLogsState.taskId
          ),
        })
      )
      .unwrap();
  },
  {
    condition: (_arg, { getState }) => {
      const state = getState() as RootState;
      const taskLogsState = state.taskLogs;

      return Boolean(
        taskLogsState.projectId &&
        taskLogsState.taskId &&
        taskLogsState.hasMore &&
        taskLogsState.loadMoreStatus !== 'loading' &&
        taskLogsState.status !== 'loading'
      );
    },
  }
);

const taskLogsSlice = createSlice({
  name: 'taskLogs',
  initialState,
  reducers: {
    resetTaskLogs: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTaskLogsPage.pending, (state, action) => {
        const { append, projectId, taskId, requestKey, limit } =
          action.meta.arg;

        state.projectId = projectId;
        state.taskId = taskId;
        state.activeRequestKey = requestKey;
        state.limit = limit;

        if (append) {
          state.loadMoreStatus = 'loading';
          state.error = null;
          return;
        }

        state.status = 'loading';
        state.loadMoreStatus = 'idle';
        state.error = null;
        state.items = [];
        state.total = 0;
        state.offset = 0;
        state.hasMore = false;
      })
      .addCase(fetchTaskLogsPage.fulfilled, (state, action) => {
        const { append, hasMore, items, limit, offset, requestKey, total } =
          action.payload;

        if (requestKey !== state.activeRequestKey) {
          return;
        }

        state.limit = limit;
        state.offset = offset;
        state.total = total;
        state.hasMore = hasMore;
        state.error = null;

        if (append) {
          state.loadMoreStatus = 'idle';
          state.items = mergeUniqueLogs(state.items, items);
          return;
        }

        state.status = 'succeeded';
        state.loadMoreStatus = 'idle';
        state.items = items;
      })
      .addCase(fetchTaskLogsPage.rejected, (state, action) => {
        const { append, requestKey } = action.meta.arg;

        if (requestKey !== state.activeRequestKey) {
          return;
        }

        const error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить логи задачи'
        );

        state.error = error;

        if (append) {
          state.loadMoreStatus = 'failed';
          return;
        }

        state.status = 'failed';
        state.loadMoreStatus = 'idle';
        state.items = [];
      })
      .addCase(openTaskLogs.fulfilled, state => {
        state.status = 'succeeded';
      })
      .addCase(loadMoreTaskLogs.fulfilled, state => {
        state.loadMoreStatus = 'idle';
      });
  },
});

export const { resetTaskLogs } = taskLogsSlice.actions;
export const taskLogsReducer = taskLogsSlice.reducer;
