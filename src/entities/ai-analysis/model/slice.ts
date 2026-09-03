import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import { selectIsAIAnalysisEnabled } from '@/entities/config/runtime-config';

import { type ApiErrorPayload, createUnknownError } from '@/shared/lib/errors';

import {
  aiAnalysisApi,
  type AIAnalysisHistoryParams,
  type AIAnalysisHistoryResponse,
  type AIAnalysisRequest,
  type AIAnalysisStatus,
  type CreateAIAnalysisPayload,
} from '../api/aiAnalysisApi';

import { dispatchAIAnalysisCompleted } from './events';

const isActiveStatus = (status: AIAnalysisStatus) =>
  status === 'queued' || status === 'running';

const AI_ANALYSIS_HISTORY_LIMIT = 20;

const mergeHistoryItems = (
  incoming: AIAnalysisRequest[],
  previous: AIAnalysisRequest[]
) =>
  incoming.map(item => {
    const prev = previous.find(p => p.request_id === item.request_id);

    return {
      ...item,
      result: item.result ?? prev?.result ?? null,
      task_id: item.task_id ?? prev?.task_id ?? null,
    };
  });

export interface AIAnalysisState {
  itemsByProject: Record<string, AIAnalysisRequest[]>;
  historyTotalByProject: Record<string, number>;
  isLoadingByProject: Record<string, boolean>;
  errorByProject: Record<string, ApiErrorPayload | null>;
  resultModalRequestId: string | null;
  bannerDismissedForTaskIds: string[];
}

const initialState: AIAnalysisState = {
  itemsByProject: {},
  historyTotalByProject: {},
  isLoadingByProject: {},
  errorByProject: {},
  resultModalRequestId: null,
  bannerDismissedForTaskIds: [],
};

export const loadAIAnalysisHistory = createAppAsyncThunk<
  AIAnalysisHistoryResponse,
  { projectId: string; params?: AIAnalysisHistoryParams }
>('aiAnalysis/loadHistory', ({ projectId, params }) =>
  aiAnalysisApi.getHistory(projectId, {
    limit: AI_ANALYSIS_HISTORY_LIMIT,
    ...params,
  })
);

export const startAIAnalysis = createAppAsyncThunk<
  AIAnalysisRequest,
  { projectId: string } & CreateAIAnalysisPayload
>('aiAnalysis/start', async ({ projectId, ...payload }, thunkApi) => {
  if (!selectIsAIAnalysisEnabled(thunkApi.getState())) {
    return thunkApi.rejectWithValue(
      createUnknownError('AI-анализ логов отключен в runtime config')
    );
  }

  const items = thunkApi.getState().aiAnalysis.itemsByProject[projectId] ?? [];
  const hasActive = items.some(item => isActiveStatus(item.status));

  if (hasActive) {
    return thunkApi.rejectWithValue(
      createUnknownError('Уже есть активный AI-анализ для проекта')
    );
  }

  return aiAnalysisApi.create(projectId, payload);
});

export const fetchAIAnalysisById = createAppAsyncThunk<
  AIAnalysisRequest,
  { projectId: string; requestId: string }
>('aiAnalysis/fetchById', ({ projectId, requestId }) =>
  aiAnalysisApi.getById(projectId, requestId)
);

export const pollAIAnalysisOnce = createAppAsyncThunk<
  {
    projectId: string;
    history: AIAnalysisHistoryResponse;
    completed: AIAnalysisRequest[];
  },
  { projectId: string }
>('aiAnalysis/pollOnce', async ({ projectId }, thunkApi) => {
  const previous =
    thunkApi.getState().aiAnalysis.itemsByProject[projectId] ?? [];
  const history = await aiAnalysisApi.getHistory(projectId, {
    limit: AI_ANALYSIS_HISTORY_LIMIT,
  });
  const completed: AIAnalysisRequest[] = [];

  for (const current of history.items) {
    const prev = previous.find(item => item.request_id === current.request_id);

    if (
      prev &&
      isActiveStatus(prev.status) &&
      !isActiveStatus(current.status)
    ) {
      const detailed =
        current.status === 'success'
          ? await aiAnalysisApi.getById(projectId, current.request_id)
          : current;

      completed.push({
        ...detailed,
        task_id: detailed.task_id ?? current.task_id ?? prev.task_id ?? null,
      });
    }
  }

  completed.forEach(dispatchAIAnalysisCompleted);

  return { projectId, history, completed };
});

const upsertItem = (
  items: AIAnalysisRequest[],
  item: AIAnalysisRequest
): AIAnalysisRequest[] => {
  const index = items.findIndex(i => i.request_id === item.request_id);

  if (index === -1) {
    return [item, ...items];
  }

  return items.map(existing =>
    existing.request_id === item.request_id
      ? {
          ...existing,
          ...item,
          result: item.result ?? existing.result,
          task_id: item.task_id ?? existing.task_id,
        }
      : existing
  );
};

const aiAnalysisSlice = createSlice({
  name: 'aiAnalysis',
  initialState,
  reducers: {
    openAIAnalysisResultModal: (state, action: PayloadAction<string>) => {
      state.resultModalRequestId = action.payload;
    },
    closeAIAnalysisResultModal: state => {
      state.resultModalRequestId = null;
    },
    dismissAIAnalysisBannerForTask: (state, action: PayloadAction<string>) => {
      if (!state.bannerDismissedForTaskIds.includes(action.payload)) {
        state.bannerDismissedForTaskIds.push(action.payload);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAIAnalysisHistory.pending, (state, action) => {
        state.isLoadingByProject[action.meta.arg.projectId] = true;
        state.errorByProject[action.meta.arg.projectId] = null;
      })
      .addCase(loadAIAnalysisHistory.fulfilled, (state, action) => {
        const { projectId } = action.meta.arg;
        const previous = state.itemsByProject[projectId] ?? [];

        state.itemsByProject[projectId] = mergeHistoryItems(
          action.payload.items,
          previous
        );
        state.historyTotalByProject[projectId] = action.payload.total;
        state.isLoadingByProject[projectId] = false;
        state.errorByProject[projectId] = null;
      })
      .addCase(loadAIAnalysisHistory.rejected, (state, action) => {
        const { projectId } = action.meta.arg;

        state.isLoadingByProject[projectId] = false;
        state.errorByProject[projectId] =
          action.payload ??
          createUnknownError(
            action.error.message ?? 'Не удалось загрузить историю AI-анализов'
          );
      })
      .addCase(startAIAnalysis.fulfilled, (state, action) => {
        const projectId = action.payload.project_id;

        state.itemsByProject[projectId] = upsertItem(
          state.itemsByProject[projectId] ?? [],
          action.payload
        );
        state.errorByProject[projectId] = null;
      })
      .addCase(startAIAnalysis.rejected, (state, action) => {
        const { projectId } = action.meta.arg;

        state.errorByProject[projectId] =
          action.payload ??
          createUnknownError(
            action.error.message ?? 'Не удалось запустить AI-анализ'
          );
      })
      .addCase(fetchAIAnalysisById.fulfilled, (state, action) => {
        const projectId = action.payload.project_id;

        state.itemsByProject[projectId] = upsertItem(
          state.itemsByProject[projectId] ?? [],
          action.payload
        );
      })
      .addCase(pollAIAnalysisOnce.fulfilled, (state, action) => {
        const { projectId, history, completed } = action.payload;
        const previous = state.itemsByProject[projectId] ?? [];

        state.itemsByProject[projectId] = mergeHistoryItems(
          history.items,
          previous
        );
        state.historyTotalByProject[projectId] = history.total;

        completed.forEach(item => {
          state.itemsByProject[projectId] = upsertItem(
            state.itemsByProject[projectId] ?? [],
            item
          );
        });
      });
  },
});

export const aiAnalysisReducer = aiAnalysisSlice.reducer;

export const {
  openAIAnalysisResultModal,
  closeAIAnalysisResultModal,
  dismissAIAnalysisBannerForTask,
} = aiAnalysisSlice.actions;
