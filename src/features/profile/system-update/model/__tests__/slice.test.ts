import { describe, expect, it } from 'vitest';

import type { UpdateStatusSchema } from '@/shared/gatewayClient';

import {
  startSystemUpdate,
  systemUpdateActions,
  systemUpdateReducer,
} from '../slice';
import {
  SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
  SYSTEM_UPDATE_RECONNECT_TIMEOUT_MS,
  type SystemUpdateMarker,
} from '../types';
import { validateSystemUpdateSnapshot } from '../validation';

const marker: SystemUpdateMarker = {
  schemaVersion: SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
  jobId: 'job-1',
  ownerKey: 'superadmin@example.com',
  targetVersion: 'latest',
  launchedAt: 100,
  paused: false,
  outageStartedAt: null,
};

const makeSnapshot = (
  overrides: Partial<UpdateStatusSchema> = {}
): UpdateStatusSchema => ({
  id: 'job-1',
  kind: 'update',
  state: 'running',
  version: 'latest',
  started_at: '2026-07-21T10:00:00Z',
  finished_at: null,
  steps: [
    {
      id: 'check_docker',
      title: 'Проверка Docker',
      status: 'running',
      detail: '',
    },
  ],
  log: ['line 1'],
  log_total: 1,
  ...overrides,
});

describe('system update slice', () => {
  it('hydrates, pauses and resumes the initiator marker', () => {
    const hydrated = systemUpdateReducer(
      undefined,
      systemUpdateActions.hydrateSystemUpdate(marker)
    );

    expect(hydrated.hydrated).toBe(true);
    expect(hydrated.phase).toBe('running');

    const paused = systemUpdateReducer(
      hydrated,
      systemUpdateActions.pauseSystemUpdateMonitoring()
    );
    expect(paused.phase).toBe('paused');
    expect(paused.marker?.paused).toBe(true);

    const resumed = systemUpdateReducer(
      paused,
      systemUpdateActions.resumeSystemUpdateMonitoring()
    );
    expect(resumed.phase).toBe('running');
    expect(resumed.marker?.paused).toBe(false);
  });

  it('stores a marker after the start request succeeds', () => {
    const state = systemUpdateReducer(
      undefined,
      startSystemUpdate.fulfilled(marker, 'request-1', {
        ownerKey: marker.ownerKey,
        version: marker.targetVersion,
      })
    );

    expect(state.phase).toBe('running');
    expect(state.marker).toEqual(marker);
  });

  it('accumulates incremental logs and handles terminal states', () => {
    const hydrated = systemUpdateReducer(
      undefined,
      systemUpdateActions.hydrateSystemUpdate(marker)
    );
    const first = systemUpdateReducer(
      hydrated,
      systemUpdateActions.systemUpdateStatusReceived(makeSnapshot())
    );
    const succeeded = systemUpdateReducer(
      first,
      systemUpdateActions.systemUpdateStatusReceived(
        makeSnapshot({
          state: 'succeeded',
          log: ['line 2'],
          log_total: 2,
        })
      )
    );

    expect(succeeded.logs).toEqual(['line 1', 'line 2']);
    expect(succeeded.logOffset).toBe(2);
    expect(succeeded.phase).toBe('succeeded');
  });

  it('enters reconnecting and unlocks exit after ten minutes', () => {
    const hydrated = systemUpdateReducer(
      undefined,
      systemUpdateActions.hydrateSystemUpdate(marker)
    );
    const firstFailureAt = 1000;
    const reconnecting = systemUpdateReducer(
      hydrated,
      systemUpdateActions.systemUpdatePollUnavailable({
        at: firstFailureAt,
        error: { code: 'NETWORK', message: 'offline' },
      })
    );

    expect(reconnecting.phase).toBe('reconnecting');
    expect(reconnecting.reconnectTimedOut).toBe(false);

    const timedOut = systemUpdateReducer(
      reconnecting,
      systemUpdateActions.systemUpdatePollUnavailable({
        at: firstFailureAt + SYSTEM_UPDATE_RECONNECT_TIMEOUT_MS,
        error: { code: 'NETWORK', message: 'offline' },
      })
    );

    expect(timedOut.reconnectTimedOut).toBe(true);

    const recovered = systemUpdateReducer(
      timedOut,
      systemUpdateActions.systemUpdateStatusReceived(makeSnapshot())
    );
    expect(recovered.phase).toBe('running');
    expect(recovered.reconnectTimedOut).toBe(false);
    expect(recovered.marker?.outageStartedAt).toBeNull();
  });

  it('keeps monitoring data while waiting for renewed authentication', () => {
    const withStatus = systemUpdateReducer(
      systemUpdateReducer(
        undefined,
        systemUpdateActions.hydrateSystemUpdate(marker)
      ),
      systemUpdateActions.systemUpdateStatusReceived(makeSnapshot())
    );
    const awaitingAuth = systemUpdateReducer(
      withStatus,
      systemUpdateActions.systemUpdateAuthenticationRequired()
    );

    expect(awaitingAuth.phase).toBe('awaiting_auth');
    expect(awaitingAuth.marker).toEqual(withStatus.marker);
    expect(awaitingAuth.snapshot).toEqual(withStatus.snapshot);
    expect(awaitingAuth.logs).toEqual(['line 1']);
    expect(awaitingAuth.logOffset).toBe(1);

    const restored = systemUpdateReducer(
      awaitingAuth,
      systemUpdateActions.systemUpdateAuthenticationRestored()
    );

    expect(restored.phase).toBe('running');
    expect(restored.marker?.paused).toBe(false);
    expect(restored.logOffset).toBe(1);
  });

  it('does not attach to another installation-manager job', () => {
    expect(
      validateSystemUpdateSnapshot(marker, makeSnapshot({ id: 'job-2' }))
    ).toContain('не совпадает');
    expect(
      validateSystemUpdateSnapshot(marker, makeSnapshot({ kind: 'install' }))
    ).toContain('другой операции');
    expect(
      validateSystemUpdateSnapshot(marker, makeSnapshot({ state: 'unknown' }))
    ).toContain('неизвестное состояние');
    expect(validateSystemUpdateSnapshot(marker, makeSnapshot())).toBeNull();
  });
});
