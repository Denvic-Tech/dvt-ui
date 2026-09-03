import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type WebSocketStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface WebSocketState {
  status: WebSocketStatus;
  error: string | null;
  currentProjectId?: string;
}

const initialState: WebSocketState = {
  status: 'disconnected',
  error: null,
};

export const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    connect: (state, action: PayloadAction<{ projectId: string }>) => {
      if (state.status === 'disconnected' || state.status === 'error') {
        state.status = 'connecting';
        state.error = null;
        state.currentProjectId = action.payload.projectId;
      }
    },
    disconnect: (
      state,
      _action: PayloadAction<{ projectId?: string | undefined } | undefined>
    ) => {
      if (state.status === 'connected' || state.status === 'connecting') {
        state.status = 'disconnected';
      }
    },
    sendMessage: (_state, _action: PayloadAction<unknown>) => {
      // side-effect handled in middleware
    },
    connectionOpened: state => {
      state.status = 'connected';
      state.error = null;
    },
    connectionError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    connectionClosed: state => {
      state.status = 'disconnected';
    },
  },
});

export const websocketReducer = websocketSlice.reducer;

export const {
  connect,
  disconnect,
  sendMessage,
  connectionOpened,
  connectionError,
  connectionClosed,
} = websocketSlice.actions;
