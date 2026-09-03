import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { SystemStateResponse } from '@/shared/gatewayClient';
import type { ApiErrorPayload } from '@/shared/lib/errors';

import { hasSystemUpdateMarker } from './storage';

export type SystemAvailabilityPhase =
  | 'idle'
  | 'checking'
  | 'updating'
  | 'reconnecting'
  | 'ready'
  | 'degraded';

export interface SystemAvailabilityState {
  phase: SystemAvailabilityPhase;
  knownUpdate: boolean;
  snapshot: SystemStateResponse | null;
  retryAfterSec: number;
  error: ApiErrorPayload | null;
}

const hasPersistedMarker = hasSystemUpdateMarker();

const initialState: SystemAvailabilityState = {
  phase: hasPersistedMarker ? 'checking' : 'idle',
  knownUpdate: hasPersistedMarker,
  snapshot: null,
  retryAfterSec: 3,
  error: null,
};

const systemAvailabilitySlice = createSlice({
  name: 'systemAvailability',
  initialState,
  reducers: {
    systemUpdateDetected(state) {
      state.knownUpdate = true;
      state.phase = 'updating';
      state.error = null;
    },
    systemUpdateCheckRequested(state) {
      if (!state.knownUpdate) {
        return;
      }

      if (state.phase === 'idle') {
        state.phase = 'checking';
      }
    },
    systemStateReceived(state, action: PayloadAction<SystemStateResponse>) {
      const snapshot = action.payload;

      state.snapshot = snapshot;
      state.retryAfterSec = Math.max(1, snapshot.retry_after_sec);
      state.error = null;

      if (snapshot.state === 'updating') {
        state.knownUpdate = true;
        state.phase = 'updating';
      } else if (snapshot.state === 'degraded') {
        state.knownUpdate = false;
        state.phase = 'degraded';
      } else {
        state.phase = 'ready';
      }
    },
    systemStateUnavailable(state, action: PayloadAction<ApiErrorPayload>) {
      if (!state.knownUpdate) {
        return;
      }

      state.phase = 'reconnecting';
      state.error = action.payload;
    },
    resetSystemAvailability() {
      return {
        ...initialState,
        phase: 'idle' as const,
        knownUpdate: false,
        snapshot: null,
        error: null,
      };
    },
  },
});

export const systemAvailabilityActions = systemAvailabilitySlice.actions;
export const systemAvailabilityReducer = systemAvailabilitySlice.reducer;
export { initialState as systemAvailabilityInitialState };
