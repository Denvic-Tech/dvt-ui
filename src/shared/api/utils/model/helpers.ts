import { AsyncRequestState } from '@/shared/api/utils';
import { ApiErrorPayload, ensureApiErrorPayload } from '@/shared/lib/errors';

export const createAsyncRequestState = <TData>(): AsyncRequestState<TData> => ({
  data: null,
  status: 'idle',
  error: null,
  currentRequestId: null,
  lastCompletedAt: null,
});

export const markPending = <TData>(
  state: AsyncRequestState<TData>,
  requestId: string
) => {
  state.status = 'loading';
  state.error = null;
  state.data = null;
  state.currentRequestId = requestId;
};

export const markFulfilled = <TData>(
  state: AsyncRequestState<TData>,
  requestId: string,
  data: TData
) => {
  if (state.currentRequestId !== requestId) {
    return;
  }

  state.status = 'success';
  state.error = null;
  state.data = data;
  state.currentRequestId = null;
  state.lastCompletedAt = new Date().toISOString();
};

export const markRejected = <TData>(
  state: AsyncRequestState<TData>,
  requestId: string,
  payload: ApiErrorPayload | undefined,
  errorMessage: string | undefined,
  fallbackMessage: string
) => {
  if (state.currentRequestId !== requestId) {
    return;
  }

  state.status = 'error';
  state.error = ensureApiErrorPayload(payload, errorMessage ?? fallbackMessage);
  state.data = null;
  state.currentRequestId = null;
  state.lastCompletedAt = new Date().toISOString();
};
