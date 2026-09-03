import { RootState } from '@/app/providers/store';

import { QueueSliceState } from '@/entities/project/queue';

import { QueueTask } from '@/shared/gatewayClient';
import { ApiErrorPayload } from '@/shared/lib/errors';

export const selectQueueState = (state: RootState): QueueSliceState =>
  state.queue;
export const selectQueuePending = (state: RootState): QueueTask[] =>
  state.queue.pending;
export const selectQueueIsLoading = (state: RootState): boolean =>
  state.queue.isLoading;
export const selectQueueActionStatus = (
  state: RootState
): QueueSliceState['actionStatus'] => state.queue.actionStatus;
export const selectQueueActionError = (
  state: RootState
): QueueSliceState['actionError'] => state.queue.actionError;
export const selectQueueActionMessage = (state: RootState): string | null =>
  state.queue.actionMessage;
export const selectQueueError = (state: RootState): ApiErrorPayload | null =>
  state.queue.error;
