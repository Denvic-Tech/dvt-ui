import { createSlice } from '@reduxjs/toolkit';
import {
  ensureApiErrorPayload,
  type ApiErrorPayload,
} from '@/shared/lib/errors';
import type { ServicesStatus } from '@/shared/gatewayClient';
import { createAppAsyncThunk } from '@/app/providers/store/helpers';
import { servicesStatusApi } from '../api';

export interface ServicesStatusState {
  servicesStatus: ServicesStatus | null;
  isLoading: boolean;
  error: ApiErrorPayload | null;
}

const initialState: ServicesStatusState = {
  servicesStatus: null,
  isLoading: false,
  error: null,
};

export const fetchServicesStatus = createAppAsyncThunk<ServicesStatus>(
  'services-stats/fetchServicesStatus',
  args => {
    return servicesStatusApi.getServicesStatus();
  }
);

const servicesStatusSlice = createSlice({
  name: 'services-stats',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchServicesStatus.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServicesStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.servicesStatus = action.payload;
      })
      .addCase(fetchServicesStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ??
            'Не удалось получить информацию о внутренних сервисах'
        );
      });
  },
});
export const servicesStatusReducer = servicesStatusSlice.reducer;
export const servicesStatusActions = servicesStatusSlice.actions;
