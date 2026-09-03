import { createSlice } from '@reduxjs/toolkit';
import {
  ensureApiErrorPayload,
  type ApiErrorPayload,
} from '@/shared/lib/errors';
import type { VersionInfo } from '@/shared/gatewayClient';
import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';
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
      .addCase(fetchBuildVersion.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.versionInfo = null;
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
