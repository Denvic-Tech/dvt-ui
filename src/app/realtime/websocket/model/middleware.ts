import type {
  Middleware,
  ThunkDispatch,
  UnknownAction,
} from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';

import {
  markSystemUpdateInProgress,
  selectIsSystemAvailabilityBlocking,
  systemAvailabilityActions,
} from '@/entities/system-availability';

import { Event, zEvent } from '@/shared/gatewayClient';
import { wsMessageActions } from '@/shared/wsMessageActions';

import config from '@/config';

import { normalizeIncomingWebSocketMessage } from './lib/normalizeIncomingWebSocketMessage';
import {
  connect,
  connectionClosed,
  connectionError,
  connectionOpened,
  disconnect,
  sendMessage,
} from './slice';

type AppThunkDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

export const websocketMiddleware: Middleware<
  {},
  RootState,
  AppThunkDispatch
> = store => {
  let websocket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let activeUrl: string | null = null;
  const reconnectInterval = 5000;

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const pauseForSystemUpdate = () => {
    if (websocket) {
      websocket.onclose = null;
      websocket.onerror = null;
      websocket.close();
      websocket = null;
      activeUrl = null;
    }

    clearReconnectTimer();
    store.dispatch(connectionClosed());
  };

  const setupWebSocket = (url: string) => {
    if (
      websocket &&
      activeUrl === url &&
      (websocket.readyState === WebSocket.CONNECTING ||
        websocket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    if (websocket) {
      websocket.onclose = null;
      websocket.onerror = null;
      websocket.close();
    }

    websocket = new WebSocket(url);
    activeUrl = url;

    websocket.onopen = () => {
      store.dispatch(connectionOpened());
      clearReconnectTimer();
    };

    websocket.onmessage = event => {
      try {
        const rawData = JSON.parse(event.data);
        const normalizedData = normalizeIncomingWebSocketMessage(rawData);
        const parsed = zEvent.safeParse(normalizedData);

        if (parsed.success) {
          const message = parsed.data as Event;
          store.dispatch(wsMessageActions[message.type](message as never));
        } else {
          console.warn(
            'WebSocket: invalid message format',
            rawData,
            parsed.error
          );
        }
      } catch (error) {
        console.error('WebSocket: failed to parse message', event.data, error);
      }
    };

    websocket.onerror = event => {
      console.error('WebSocket error:', event);
      store.dispatch(connectionError('WebSocket connection error'));
    };

    websocket.onclose = event => {
      const stateBeforeClose = store.getState().websocket;
      websocket = null;
      activeUrl = null;
      store.dispatch(connectionClosed());

      if (event.code === 1013) {
        markSystemUpdateInProgress();
        store.dispatch(systemAvailabilityActions.systemUpdateDetected());
        clearReconnectTimer();
        return;
      }

      if (
        !event.wasClean &&
        stateBeforeClose.currentProjectId &&
        stateBeforeClose.status !== 'disconnected' &&
        !selectIsSystemAvailabilityBlocking(store.getState())
      ) {
        if (!reconnectTimer) {
          reconnectTimer = setInterval(() => {
            if (selectIsSystemAvailabilityBlocking(store.getState())) {
              clearReconnectTimer();
              return;
            }

            const projectId = store.getState().websocket.currentProjectId;
            if (projectId) {
              store.dispatch(connect({ projectId }));
            }
          }, reconnectInterval);
        }
      }
    };
  };

  return next => action => {
    const prevWebSocketState = store.getState().websocket;
    next(action);

    if (systemAvailabilityActions.systemUpdateDetected.match(action)) {
      pauseForSystemUpdate();
    } else if (connect.match(action)) {
      const nextWebSocketState = store.getState().websocket;
      const { projectId } = action.payload;

      if (selectIsSystemAvailabilityBlocking(store.getState())) {
        store.dispatch(connectionClosed());
        return;
      }

      const shouldOpenSocket =
        nextWebSocketState.status === 'connecting' &&
        (prevWebSocketState.status !== nextWebSocketState.status ||
          prevWebSocketState.currentProjectId !==
            nextWebSocketState.currentProjectId);

      if (projectId && shouldOpenSocket) {
        const url = `${config.webSocketUrl}?project_id=${projectId}`;
        setupWebSocket(url);
      } else {
        if (!projectId) {
          console.error('WebSocket connect action received without projectId');
        }
      }
    } else if (disconnect.match(action)) {
      const { projectId } = action.payload || {};
      if (websocket) {
        console.log(
          `Disconnecting WebSocket for project ${projectId ?? 'unknown'}...`
        );
        websocket.onclose = null;
        websocket.onerror = null;
        websocket.close();
        websocket = null;
        activeUrl = null;
      }
      clearReconnectTimer();
    } else if (sendMessage.match(action)) {
      const message = action.payload;
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        const dataToSend =
          typeof message === 'string' ? message : JSON.stringify(message);
        websocket.send(dataToSend);
      } else {
        console.warn('WebSocket is not open. Cannot send message:', message);
      }
    }
  };
};

export default websocketMiddleware;
