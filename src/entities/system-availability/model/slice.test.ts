import { describe, expect, it } from 'vitest';

import { systemAvailabilityActions, systemAvailabilityReducer } from './slice';

describe('system availability slice', () => {
  it('tracks updating, reconnecting, ready and degraded states', () => {
    const idle = systemAvailabilityReducer(
      undefined,
      systemAvailabilityActions.resetSystemAvailability()
    );
    const updating = systemAvailabilityReducer(
      idle,
      systemAvailabilityActions.systemUpdateDetected()
    );

    expect(updating.phase).toBe('updating');
    expect(updating.knownUpdate).toBe(true);

    const reconnecting = systemAvailabilityReducer(
      updating,
      systemAvailabilityActions.systemStateUnavailable({
        code: 'NETWORK',
        message: 'offline',
      })
    );
    expect(reconnecting.phase).toBe('reconnecting');
    expect(
      systemAvailabilityReducer(
        reconnecting,
        systemAvailabilityActions.systemUpdateCheckRequested()
      ).phase
    ).toBe('reconnecting');

    const ready = systemAvailabilityReducer(
      reconnecting,
      systemAvailabilityActions.systemStateReceived({
        state: 'ready',
        retry_after_sec: 3,
        checked_at: '2026-07-22T10:00:00Z',
      })
    );
    expect(ready.phase).toBe('ready');
    expect(ready.knownUpdate).toBe(true);

    const degraded = systemAvailabilityReducer(
      reconnecting,
      systemAvailabilityActions.systemStateReceived({
        state: 'degraded',
        retry_after_sec: 3,
        checked_at: '2026-07-22T10:00:00Z',
      })
    );
    expect(degraded.phase).toBe('degraded');
    expect(degraded.knownUpdate).toBe(false);
  });

  it('uses a minimum one-second retry interval', () => {
    const state = systemAvailabilityReducer(
      undefined,
      systemAvailabilityActions.systemStateReceived({
        state: 'updating',
        retry_after_sec: 0,
        checked_at: '2026-07-22T10:00:00Z',
      })
    );

    expect(state.retryAfterSec).toBe(1);
  });
});
