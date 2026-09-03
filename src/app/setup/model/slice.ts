import { createSlice } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';
import type { SetupStatus } from '@/shared/gatewayClient';
import {
  ensureApiErrorPayload,
  type ApiErrorPayload,
} from '@/shared/lib/errors';

import { setupApi, type SubmitSetupStepArgs } from '../api';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface SetupSliceState {
  status: SetupStatus | null;
  loadStatus: RequestStatus;
  loadError: ApiErrorPayload | null;
  submitStatusByCode: Record<string, RequestStatus>;
  submitErrorByCode: Record<string, ApiErrorPayload | null>;
}

const initialState: SetupSliceState = {
  status: null,
  loadStatus: 'idle',
  loadError: null,
  submitStatusByCode: {},
  submitErrorByCode: {},
};

export const fetchSetupStatus = createAppAsyncThunk<SetupStatus>(
  'setup/fetchStatus',
  () => setupApi.getStatus()
);

export const submitSetupStep = createAppAsyncThunk<
  SetupStatus,
  SubmitSetupStepArgs
>('setup/submitStep', payload => setupApi.submitStep(payload));

const setupSlice = createSlice({
  name: 'setup',
  initialState,
  reducers: {
    resetSetupState: () => initialState,
    resetSetupMutationState: state => {
      state.submitStatusByCode = {};
      state.submitErrorByCode = {};
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchSetupStatus.pending, state => {
        state.loadStatus = 'loading';
        state.loadError = null;
      })
      .addCase(fetchSetupStatus.fulfilled, (state, action) => {
        state.loadStatus = 'succeeded';
        state.loadError = null;
        state.status = action.payload;
      })
      .addCase(fetchSetupStatus.rejected, (state, action) => {
        state.loadStatus = 'failed';
        state.loadError = ensureApiErrorPayload(
          action.payload,
          action.error.message ??
            'Не удалось загрузить статус первичной настройки.'
        );
      })
      .addCase(submitSetupStep.pending, (state, action) => {
        const { code } = action.meta.arg;

        state.submitStatusByCode[code] = 'loading';
        state.submitErrorByCode[code] = null;
      })
      .addCase(submitSetupStep.fulfilled, (state, action) => {
        const { code } = action.meta.arg;

        state.submitStatusByCode[code] = 'succeeded';
        state.submitErrorByCode[code] = null;
        state.status = action.payload;
      })
      .addCase(submitSetupStep.rejected, (state, action) => {
        const { code } = action.meta.arg;

        state.submitStatusByCode[code] = 'failed';
        state.submitErrorByCode[code] = ensureApiErrorPayload(
          action.payload,
          action.error.message ??
            `Не удалось отправить данные setup-шага "${code}".`
        );
      });
  },
});

export const setupReducer = setupSlice.reducer;

export const { resetSetupState, resetSetupMutationState } = setupSlice.actions;
