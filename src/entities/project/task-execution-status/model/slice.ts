import { createSlice } from '@reduxjs/toolkit';

import { TaskError, TaskExecutionStatus } from '@/shared/gatewayClient';
import { wsMessageActions } from '@/shared/wsMessageActions';

export interface TaskExecutionStatusState {
  status: TaskExecutionStatus | 'IDLE';
  error: TaskError | null | undefined;
  taskId: string | null;
}

const initialState: TaskExecutionStatusState = {
  status: 'IDLE',
  error: null,
  taskId: null,
};

const taskExecutionStatusSlice = createSlice({
  name: 'nodeExecutionStatus',
  initialState,
  reducers: {
    setIdle: state => {
      state.status = 'IDLE';
      state.error = null;
      state.taskId = null;
    },
  },
  extraReducers: builder => {
    builder.addCase(
      wsMessageActions.TASK_EXECUTION_STATUS,
      (state, { payload }) => {
        if (payload.mode !== 'full') return;
        state.status = payload.status;
        state.error = payload.error;
        state.taskId = payload.task_id ?? null;
      }
    );
  },
});

export const taskExecutionStatusReducer = taskExecutionStatusSlice.reducer;
export const taskExecutionStatusActions = taskExecutionStatusSlice.actions;
