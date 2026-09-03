import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ExpressionsConfig } from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { fetchExpressionsConfig } from './thunks';

export interface ExpressionsConfigSliceState {
  config: ExpressionsConfig | null;
  error: ApiErrorPayload | null;
  lastLoadedAt: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ExpressionsConfigSliceState = {
  config: null,
  error: null,
  lastLoadedAt: null,
  status: 'idle',
};

export const expressionsConfigSlice = createSlice({
  name: 'expressionsConfig',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchExpressionsConfig.pending, state => {
        state.error = null;
        state.status = 'loading';
      })
      .addCase(
        fetchExpressionsConfig.fulfilled,
        (state, action: PayloadAction<ExpressionsConfig>) => {
          state.config = action.payload;
          state.error = null;
          state.lastLoadedAt = new Date().toISOString();
          state.status = 'succeeded';
        }
      )
      .addCase(fetchExpressionsConfig.rejected, (state, action) => {
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить expressions config'
        );
        state.status = 'failed';
      });
  },
});

export const expressionsConfigReducer = expressionsConfigSlice.reducer;
