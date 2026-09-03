import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RuntimeConfig } from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { fetchRuntimeConfig } from './thunks';

export interface RuntimeConfigSliceState {
  config: RuntimeConfig | null;
  error: ApiErrorPayload | null;
  lastLoadedAt: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: RuntimeConfigSliceState = {
  config: null,
  error: null,
  lastLoadedAt: null,
  status: 'idle',
};

export const runtimeConfigSlice = createSlice({
  name: 'runtimeConfig',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchRuntimeConfig.pending, state => {
        state.error = null;
        state.status = 'loading';
      })
      .addCase(
        fetchRuntimeConfig.fulfilled,
        (state, action: PayloadAction<RuntimeConfig>) => {
          state.config = action.payload;
          state.error = null;
          state.lastLoadedAt = new Date().toISOString();
          state.status = 'succeeded';
        }
      )
      .addCase(fetchRuntimeConfig.rejected, (state, action) => {
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить runtime config'
        );
        state.status = 'failed';
      });
  },
});

export const runtimeConfigReducer = runtimeConfigSlice.reducer;
