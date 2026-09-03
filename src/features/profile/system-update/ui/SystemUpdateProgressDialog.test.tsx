import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
  type SystemUpdateState,
} from '../model/types';

import {
  SYSTEM_UPDATE_GATEWAY_TIMEOUT_MESSAGE,
  SystemUpdateProgressDialog,
} from './SystemUpdateProgressDialog';

const baseState: SystemUpdateState = {
  hydrated: true,
  phase: 'reconnecting',
  marker: {
    schemaVersion: SYSTEM_UPDATE_MARKER_SCHEMA_VERSION,
    jobId: 'job-1',
    ownerKey: 'superadmin@example.com',
    targetVersion: 'latest',
    launchedAt: 100,
    paused: false,
    outageStartedAt: 1000,
  },
  snapshot: null,
  logs: [],
  logOffset: 0,
  reconnectTimedOut: true,
  error: { code: 'NETWORK', message: 'offline' },
};

describe('SystemUpdateProgressDialog', () => {
  it('shows the timeout warning and only then exposes pause action', () => {
    const onPause = vi.fn();

    render(
      <SystemUpdateProgressDialog
        state={baseState}
        onClear={vi.fn()}
        onPause={onPause}
        onReload={vi.fn()}
      />
    );

    expect(
      screen.getByText(SYSTEM_UPDATE_GATEWAY_TIMEOUT_MESSAGE)
    ).toBeInTheDocument();
    screen
      .getByRole('button', {
        name: 'Вернуться и продолжить позже',
      })
      .click();
    expect(onPause).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText(/закрыть/i)).not.toBeInTheDocument();
  });

  it('offers a full reload after a successful update', () => {
    const onReload = vi.fn();

    render(
      <SystemUpdateProgressDialog
        state={{ ...baseState, phase: 'succeeded', reconnectTimedOut: false }}
        onClear={vi.fn()}
        onPause={vi.fn()}
        onReload={onReload}
      />
    );

    screen.getByRole('button', { name: 'Перезагрузить приложение' }).click();
    expect(onReload).toHaveBeenCalledOnce();
  });
});
