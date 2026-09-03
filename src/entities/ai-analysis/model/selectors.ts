import type { RootState } from '@/app/providers/store';

import type { AIAnalysisRequest } from '../api/aiAnalysisApi';

const isActive = (item: AIAnalysisRequest) =>
  item.status === 'queued' || item.status === 'running';

const getAnalysisTimestamp = (item: AIAnalysisRequest) => {
  const value = item.finished_at ?? item.updated_at ?? item.created_at;
  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const selectAIAnalysisItems = (state: RootState, projectId?: string) =>
  projectId ? (state.aiAnalysis.itemsByProject[projectId] ?? []) : [];

export const selectActiveAIAnalysis = (state: RootState, projectId?: string) =>
  selectAIAnalysisItems(state, projectId).find(isActive);

export const selectHasActiveAIAnalysis = (
  state: RootState,
  projectId?: string
) => selectAIAnalysisItems(state, projectId).some(isActive);

export const selectLatestErrorAIAnalysis = (
  state: RootState,
  projectId?: string
) =>
  selectAIAnalysisItems(state, projectId)
    .filter(
      (item): item is AIAnalysisRequest & { task_id: string } =>
        item.status === 'error' && Boolean(item.task_id)
    )
    .reduce<AIAnalysisRequest | undefined>((latest, item) => {
      if (!latest) {
        return item;
      }

      return getAnalysisTimestamp(item) > getAnalysisTimestamp(latest)
        ? item
        : latest;
    }, undefined);

export const selectAIAnalysisById = (
  state: RootState,
  requestId: string | null
) =>
  requestId
    ? Object.values(state.aiAnalysis.itemsByProject)
        .flat()
        .find(item => item.request_id === requestId)
    : undefined;

export const selectAIAnalysisResultModalRequestId = (state: RootState) =>
  state.aiAnalysis.resultModalRequestId;
