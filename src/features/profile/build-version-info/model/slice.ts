import { createSlice } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import type { VersionInfo } from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { buildVersionApi } from '../api.ts';

export interface BuildVersionState {
  versionInfo: VersionInfo | null;
  isLoading: boolean;
  error: ApiErrorPayload | null;
}

const initialState: BuildVersionState = {
  versionInfo: null,
  isLoading: false,
  error: null,
};

export const fetchBuildVersion = createAppAsyncThunk<VersionInfo>(
  'buildVersion/fetchBuildVersion',
  args => {
    return buildVersionApi.getBuildVersionInfo();
  }
);

const buildVersionSlice = createSlice({
  name: 'buildVersion',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // A refetch keeps the known version, so its consumers do not blink.
      .addCase(fetchBuildVersion.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBuildVersion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.versionInfo = action.payload;
      })
      .addCase(fetchBuildVersion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ??
            'Не удалось получить информацию о версии сборки'
        );
      });
  },
});
export const buildVersionReducer = buildVersionSlice.reducer;
export const buildVersionActions = buildVersionSlice.actions;
