import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  ExecutionStatus,
  PipelineExecutionMode,
  TaskExecutionStatus,
} from '@/shared/gatewayClient';
import { wsMessageActions } from '@/shared/wsMessageActions';

export interface NodeExecutionStatusState {
  statusByID: { [nodeID: string]: ExecutionStatus };
  messageByID: { [nodeID: string]: string | null };
  taskModeByTaskID: { [taskID: string]: PipelineExecutionMode };
}

const initialState: NodeExecutionStatusState = {
  statusByID: {},
  messageByID: {},
  taskModeByTaskID: {},
};

export const nodeExecutionStatusSlice = createSlice({
  name: 'nodeExecutionStatus',
  initialState,
  reducers: {
    setNodeExecutionStatus: (
      state,
      action: PayloadAction<{ nodeID: string; status: ExecutionStatus }>
    ) => {
      const { nodeID, status } = action.payload;
      state.statusByID[nodeID] = status;
      if (status !== 'error') {
        delete state.messageByID[nodeID];
      }
    },
    resetNodeExecutionStatuses: state => {
      state.statusByID = {};
      state.messageByID = {};
      state.taskModeByTaskID = {};
    },
  },
  extraReducers: builder => {
    builder
      .addCase(wsMessageActions.NODE_EXECUTION_STATUS, (state, { payload }) => {
        const { task_id, node_id, status, message } = payload;
        const mode = state.taskModeByTaskID[task_id] ?? 'full';

        if (mode === 'metadata_only' && status !== 'error') {
          delete state.statusByID[node_id];
          delete state.messageByID[node_id];
          return;
        }

        state.statusByID[node_id] = status;
        if (status === 'error') {
          state.messageByID[node_id] = message ?? null;
          return;
        }
        delete state.messageByID[node_id];
      })
      .addCase(wsMessageActions.TASK_EXECUTION_STATUS, (state, { payload }) => {
        const { task_id, mode, status } = payload;
        if (task_id) {
          state.taskModeByTaskID[task_id] = mode;
        }

        if (status === 'STARTED') {
          state.statusByID = {};
          state.messageByID = {};
        }

        const terminalStatuses: TaskExecutionStatus[] = [
          'SUCCESS',
          'ERROR',
          'CANCELLED',
        ];
        if (task_id && terminalStatuses.includes(status)) {
          delete state.taskModeByTaskID[task_id];
        }
      });
  },
});

export const nodeExecutionStatusActions = nodeExecutionStatusSlice.actions;

export const nodeExecutionStatusReducer = nodeExecutionStatusSlice.reducer;
