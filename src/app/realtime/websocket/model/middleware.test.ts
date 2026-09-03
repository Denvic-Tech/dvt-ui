import type { MiddlewareAPI, UnknownAction } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RootState } from '@/app/providers/store';

import {
  hasSystemUpdateMarker,
  systemAvailabilityActions,
  systemAvailabilityReducer,
} from '@/entities/system-availability';

import { websocketMiddleware } from './middleware';
import { connect, websocketReducer } from './slice';

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readonly url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  close = vi.fn();
  send = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
}

describe('websocket middleware during a system update', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('enters update mode on close code 1013 without reconnecting', () => {
    let state = {
      websocket: websocketReducer(undefined, { type: 'init' }),
      systemAvailability: systemAvailabilityReducer(
        undefined,
        systemAvailabilityActions.resetSystemAvailability()
      ),
    };
    const middlewareApi = {
      getState: () => state as RootState,
      dispatch: (action: UnknownAction) => invoke(action),
    } as MiddlewareAPI;
    const next = (action: unknown) => {
      const typedAction = action as UnknownAction;
      state = {
        websocket: websocketReducer(state.websocket, typedAction),
        systemAvailability: systemAvailabilityReducer(
          state.systemAvailability,
          typedAction
        ),
      };
      return action;
    };

    const invoke = websocketMiddleware(middlewareApi)(next);
    invoke(connect({ projectId: 'project-1' }));

    expect(MockWebSocket.instances).toHaveLength(1);
    MockWebSocket.instances[0]?.onclose?.({
      code: 1013,
      wasClean: false,
    } as CloseEvent);

    expect(state.systemAvailability.phase).toBe('updating');
    expect(hasSystemUpdateMarker()).toBe(true);

    vi.advanceTimersByTime(15_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
