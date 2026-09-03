import { createSlice } from '@reduxjs/toolkit';
import type { LogEntrySchema } from '@/shared/gatewayClient';
import { wsMessageActions } from '@/shared/wsMessageActions.ts';

const MAX_LOGS_COUNT = 1000;

export interface LogsState {
  logs: LogEntrySchema[];
}

const initialState: LogsState = {
  logs: [],
};

export const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    clearLogs: state => {
      state.logs = [];
    },
  },
  extraReducers: builder => {
    builder.addCase(wsMessageActions.LOG_EVENT, (state, { payload }) => {
      let logs: LogEntrySchema[] = [...state.logs, payload.entry];
      if (logs.length > MAX_LOGS_COUNT) {
        logs = logs.slice(logs.length - MAX_LOGS_COUNT, logs.length);
      }
      state.logs = logs;
    });
  },
});

export const logsActions = logsSlice.actions;
export const logsReducer = logsSlice.reducer;
