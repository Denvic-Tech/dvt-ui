import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UpdateStatusSchema } from '@/shared/gatewayClient';

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

const snapshot: UpdateStatusSchema = {
  id: 'job-1',
  kind: 'update',
  state: 'running',
  error: null,
  version: 'latest',
  started_at: '2026-11-05T10:00:00Z',
  finished_at: null,
  steps: [
    { id: 'preflight', title: 'Проверка окружения', status: 'ok' },
    { id: 'pull', title: 'Загрузка образов', status: 'running' },
    { id: 'restart', title: 'Перезапуск сервисов', status: 'pending' },
  ],
  log: [],
  log_total: 0,
};

const renderDialog = (
  state: SystemUpdateState,
  handlers: Partial<{
    onClear: () => void;
    onPause: () => void;
    onReload: () => void;
  }> = {}
) =>
  render(
    <SystemUpdateProgressDialog
      state={state}
      currentVersion='1.24.0'
      onClear={handlers.onClear ?? vi.fn()}
      onPause={handlers.onPause ?? vi.fn()}
      onReload={handlers.onReload ?? vi.fn()}
    />
  );

describe('SystemUpdateProgressDialog', () => {
  it('shows the step counter and no buttons while running', () => {
    renderDialog({
      ...baseState,
      phase: 'running',
      reconnectTimedOut: false,
      snapshot,
      logs: ['[pull] dvt/gateway: downloading 4 layers'],
    });

    expect(screen.getByText('Обновление DVT')).toBeInTheDocument();
    expect(screen.getByText('1.24.0 → latest')).toBeInTheDocument();
    expect(screen.getByText('1 из 3')).toBeInTheDocument();
    expect(
      screen.getByText('Не закрывайте приложение до завершения обновления.')
    ).toBeInTheDocument();
    expect(screen.getByRole('log')).toHaveTextContent(
      '$ dvt-installer update --tag latest'
    );
    expect(
      screen.queryByRole('button', { name: 'Закрыть' })
    ).not.toBeInTheDocument();
  });

  it('shows the timeout warning and only then exposes pause action', () => {
    const onPause = vi.fn();

    renderDialog(baseState, { onPause });

    expect(
      screen.getByText(SYSTEM_UPDATE_GATEWAY_TIMEOUT_MESSAGE)
    ).toBeInTheDocument();
    screen
      .getByRole('button', {
        name: 'Вернуться и продолжить позже',
      })
      .click();
    expect(onPause).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole('button', { name: 'Закрыть' })
    ).not.toBeInTheDocument();
  });

  it('shows the error and closes the dialog after a failed update', () => {
    const onClear = vi.fn();

    renderDialog(
      {
        ...baseState,
        phase: 'failed',
        reconnectTimedOut: false,
        snapshot: {
          ...snapshot,
          state: 'failed',
          error: 'manifest unknown',
        },
      },
      { onClear }
    );

    expect(screen.getByText('Обновление не завершено')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('manifest unknown');
    expect(screen.queryByText('1 из 3')).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Закрыть' }).click();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('reloads the app when closed after a successful update', () => {
    const onReload = vi.fn();

    renderDialog(
      { ...baseState, phase: 'succeeded', reconnectTimedOut: false },
      { onReload }
    );

    expect(screen.getByText('DVT обновлён')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Закрыть' }).click();
    expect(onReload).toHaveBeenCalledOnce();
  });
});
