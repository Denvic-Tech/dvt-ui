import type { RootState } from '@/app/providers/store';

export type GraphSyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export const selectSyncGraphState = (state: RootState) => state.syncGraph;

export const selectSyncGraphOutboxSize = (state: RootState) =>
  selectSyncGraphState(state).outbox.length;

export const selectHasPendingGraphChanges = (state: RootState) =>
  selectSyncGraphOutboxSize(state) > 0;

export const selectIsGraphSyncing = (state: RootState) =>
  selectSyncGraphState(state).inFlight;

export const selectHasGraphSyncError = (state: RootState) =>
  selectSyncGraphState(state).lastError !== null &&
  selectHasPendingGraphChanges(state);

export const selectGraphSyncStatus = (state: RootState): GraphSyncStatus => {
  if (selectHasGraphSyncError(state)) {
    return 'error';
  }

  if (selectIsGraphSyncing(state)) {
    return 'syncing';
  }

  if (selectHasPendingGraphChanges(state)) {
    return 'pending';
  }

  return 'synced';
};
