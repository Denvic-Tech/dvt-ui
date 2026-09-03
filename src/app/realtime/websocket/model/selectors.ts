import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';

import type { WebSocketState } from './slice';

export const selectWebSocketState = (state: RootState): WebSocketState =>
  state.websocket;

export const selectWebSocketStatus = createSelector(
  [selectWebSocketState],
  state => state.status
);

export const selectWebSocketError = createSelector(
  [selectWebSocketState],
  state => state.error
);
