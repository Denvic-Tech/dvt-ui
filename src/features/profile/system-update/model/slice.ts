import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import {
  markSystemUpdateInProgress,
  systemAvailabilityActions,
} from '@/entities/system-availability';

import type { UpdateStatusSchema } from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { systemUpdateApi } from '../api';

import {
  SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
  SYSTEM_UPDATE_RECONNECT_TIMEOUT_MS,
  type SystemUpdateMarker,
  type SystemUpdateState,
} from './types';

interface StartSystemUpdateArgs {
  ownerKey: string;
  version: string;
}

interface PollUnavailablePayload {
  at: number;
  error: ApiErrorPayload;
}

const initialState: SystemUpdateState = {
  hydrated: false,
  phase: 'idle',
  marker: null,
  snapshot: null,
  logs: [],
  logOffset: 0,
  reconnectTimedOut: false,
  error: null,
};

export const startSystemUpdate = createAppAsyncThunk<
  SystemUpdateMarker,
  StartSystemUpdateArgs
>('systemUpdate/start', async ({ ownerKey, version }, thunkApi) => {
  const normalizedVersion = version.trim();
  const response = await systemUpdateApi.run(normalizedVersion);

  markSystemUpdateInProgress();
  thunkApi.dispatch(systemAvailabilityActions.systemUpdateDetected());

  return {
    schemaVersion: SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
    jobId: response.job_id ?? null,
    ownerKey,
    targetVersion: normalizedVersion,
    launchedAt: Date.now(),
    paused: false,
    outageStartedAt: null,
  };
});

const systemUpdateSlice = createSlice({
  name: 'systemUpdate',
  initialState,
  reducers: {
    hydrateSystemUpdate(
      state,
      action: PayloadAction<SystemUpdateMarker | null>
    ) {
      state.hydrated = true;
      state.marker = action.payload;
      state.phase = action.payload?.paused
        ? 'paused'
        : action.payload
          ? 'running'
          : 'idle';
      state.snapshot = null;
      state.logs = [];
      state.logOffset = 0;
      state.reconnectTimedOut = false;
      state.error = null;
    },
    systemUpdateStatusReceived(
      state,
      action: PayloadAction<UpdateStatusSchema>
    ) {
      const snapshot = action.payload;

      state.snapshot = snapshot;
      state.logs.push(...snapshot.log);
      state.logOffset = snapshot.log_total;
      state.reconnectTimedOut = false;
      state.error = null;

      if (state.marker) {
        state.marker.jobId ??= snapshot.id;
        state.marker.paused = false;
        state.marker.outageStartedAt = null;
      }

      if (snapshot.state === 'succeeded') {
        state.phase = 'succeeded';
      } else if (snapshot.state === 'failed') {
        state.phase = 'failed';
      } else {
        state.phase = 'running';
      }
    },
    systemUpdatePollUnavailable(
      state,
      action: PayloadAction<PollUnavailablePayload>
    ) {
      if (!state.marker) {
        return;
      }

      const outageStartedAt = state.marker.outageStartedAt ?? action.payload.at;

      state.marker.outageStartedAt = outageStartedAt;
      state.marker.paused = false;
      state.phase = 'reconnecting';
      state.error = action.payload.error;
      state.reconnectTimedOut =
        action.payload.at - outageStartedAt >=
        SYSTEM_UPDATE_RECONNECT_TIMEOUT_MS;
    },
    systemUpdateStatusError(state, action: PayloadAction<ApiErrorPayload>) {
      state.phase = 'status_error';
      state.error = action.payload;
      state.reconnectTimedOut = false;
    },
    systemUpdateAuthenticationRequired(state) {
      if (!state.marker) {
        return;
      }

      state.phase = 'awaiting_auth';
      state.error = null;
    },
    systemUpdateAuthenticationRestored(state) {
      if (!state.marker || state.phase !== 'awaiting_auth') {
        return;
      }

      state.phase = state.marker.outageStartedAt ? 'reconnecting' : 'running';
      state.error = null;
      state.reconnectTimedOut = Boolean(
        state.marker.outageStartedAt &&
        Date.now() - state.marker.outageStartedAt >=
          SYSTEM_UPDATE_RECONNECT_TIMEOUT_MS
      );
    },
    pauseSystemUpdateMonitoring(state) {
      if (!state.marker) {
        return;
      }

      state.marker.paused = true;
      state.phase = 'paused';
    },
    resumeSystemUpdateMonitoring(state) {
      if (!state.marker) {
        return;
      }

      state.marker.paused = false;
      state.phase = state.marker.outageStartedAt ? 'reconnecting' : 'running';
      state.error = null;
      state.reconnectTimedOut = Boolean(
        state.marker.outageStartedAt &&
        Date.now() - state.marker.outageStartedAt >=
          SYSTEM_UPDATE_RECONNECT_TIMEOUT_MS
      );
    },
    clearSystemUpdateMonitoring(state) {
      return {
        ...initialState,
        hydrated: state.hydrated,
      };
    },
    clearSystemUpdateStartError(state) {
      if (state.phase === 'idle') {
        state.error = null;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(startSystemUpdate.pending, state => {
        state.phase = 'starting';
        state.error = null;
      })
      .addCase(startSystemUpdate.fulfilled, (state, action) => {
        state.phase = 'running';
        state.marker = action.payload;
        state.snapshot = null;
        state.logs = [];
        state.logOffset = 0;
        state.reconnectTimedOut = false;
        state.error = null;
      })
      .addCase(startSystemUpdate.rejected, (state, action) => {
        state.phase = 'idle';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось запустить обновление DVT.'
        );
      });
  },
});

export const systemUpdateReducer = systemUpdateSlice.reducer;
export const systemUpdateActions = systemUpdateSlice.actions;
export { initialState as systemUpdateInitialState };
