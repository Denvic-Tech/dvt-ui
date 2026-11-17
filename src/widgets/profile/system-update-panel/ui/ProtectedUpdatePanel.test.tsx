import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OperationView } from '@/shared/gatewayClient';

import { ProtectedUpdatePanel } from './ProtectedUpdatePanel';

const api = vi.hoisted(() => ({
  active: vi.fn(),
  history: vi.fn(),
  action: vi.fn(),
  releases: vi.fn(),
}));

vi.mock('@/shared/gatewayClient', async importOriginal => ({
  ...(await importOriginal<typeof import('@/shared/gatewayClient')>()),
  client: {
    update: {
      releases: { get: api.releases },
      operations: {
        active: { get: api.active },
        get: api.history,
        operationId: (id: string) => ({
          actions: {
            action: (action: string) => ({
              post: (body: unknown, config: unknown) =>
                api.action(id, action, body, config),
            }),
          },
        }),
      },
    },
  },
}));

const operation: OperationView = {
  id: '97f89dfa-1a89-4783-86a6-6d173dc4b5d4',
  kind: 'update',
  stage: 'prepared',
  version: '1.25.1-rc1',
  manifest_digest: 'sha256:' + 'a'.repeat(64),
  plan: {
    source_version: '1.25.0',
    source_revision: 'aabbcc',
    target_version: '1.25.1rc1',
    target_revision: 'ddeeff',
    migration: 'from_revision',
    rollback: 'restore_backup',
    add: [],
    recreate: ['gateway'],
    retire: [],
    profiles: [],
    pull_and_unpack_bytes: 1024 ** 3,
    data_reserve_bytes: 1024 ** 3,
    maintenance_drain_seconds: 300,
    queue_policy: 'drain_admitted_cancel_unadmitted_roots',
    schedule_policy: 'skip_cron_preserve_existing_retries',
  },
  actions: ['apply', 'cancel_preparation'],
  failure: null,
  created_at: '2026-01-01T00:00:00Z',
  finished_at: null,
};

describe('protected update', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    api.active.mockResolvedValue({ data: operation });
    api.history.mockResolvedValue({ data: [operation] });
    api.action.mockResolvedValue({
      data: { ...operation, stage: 'maintenance', actions: [] },
    });
    api.releases.mockResolvedValue({
      data: {
        source: null,
        releases: [],
        paths: {},
        first_steps: {},
      },
    });
  });

  it('renders a compatible release from the preceding catalog response during replacement', async () => {
    const stable = {
      version: '1.25.1',
      manifest_digest: 'sha256:' + 'b'.repeat(64),
    };
    // This is the SDK's runtime representation of successful JSON null.
    api.active.mockResolvedValue({ data: {} });
    api.history.mockResolvedValue({ data: [] });
    api.releases.mockResolvedValue({
      data: {
        source: { version: '1.25.0', revision: 'aabbcc' },
        releases: [stable],
        paths: { '1.25.1': ['1.25.1'] },
        recommended_stable: stable,
        trust_configured: true,
      },
    });

    render(<ProtectedUpdatePanel managerOrigin='https://localhost:19169' />);

    expect(
      await screen.findByText('Работает DVT 1.25.0, схема базы aabbcc.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Подготовить обновление' })
    ).toBeEnabled();
  });

  it('keeps the same ID in the plan, independent manager URL, and confirmed apply', async () => {
    render(<ProtectedUpdatePanel managerOrigin='https://localhost:19169' />);
    const apply = await screen.findByRole('button', {
      name: 'Применить обновление',
    });
    expect(screen.getByText('Работает 1.25.0, схема aabbcc.')).toBeTruthy();
    const link = screen.getByRole('link', {
      name: 'Открыть защищённый мастер обновлений',
    });
    expect(link.getAttribute('href')).toBe(
      `https://localhost:19169/#operation=${operation.id}`
    );
    fireEvent.click(apply);
    expect(api.action).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Подтвердить применение' })
    );
    await waitFor(() =>
      expect(api.action).toHaveBeenCalledWith(
        operation.id,
        'apply',
        { body: { confirm: true } },
        { headers: { 'X-DVT-CSRF': '1' }, silent: true }
      )
    );
    expect(await screen.findByText('Окно обслуживания')).toBeTruthy();
  });
});
