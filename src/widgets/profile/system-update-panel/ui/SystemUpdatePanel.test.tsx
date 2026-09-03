import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemUpdatePanel } from './SystemUpdatePanel';

const { confirmMock, startMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
  startMock: vi.fn(),
}));

vi.mock('@/shared/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({ confirm: confirmMock }),
}));

vi.mock('@/features/profile/build-version-info', () => ({
  useBuildVersion: () => ({
    versionInfo: { version: '1.19.0' },
    isLoading: false,
    loadBuildVersion: vi.fn(),
  }),
}));

vi.mock('@/features/profile/system-update', () => ({
  getSystemUpdateOwnerKey: () => 'superadmin@example.com',
  useSystemUpdate: () => ({
    phase: 'idle',
    marker: null,
    error: null,
    start: startMock,
    resume: vi.fn(),
    clear: vi.fn(),
    clearStartError: vi.fn(),
  }),
}));

describe('SystemUpdatePanel', () => {
  beforeEach(() => {
    confirmMock.mockReset();
    startMock.mockReset();
    confirmMock.mockResolvedValue(true);
    startMock.mockResolvedValue(undefined);
  });

  it('starts with the manual tag state from the reference', () => {
    render(
      <SystemUpdatePanel
        currentUser={{
          email: 'superadmin@example.com',
          organization_id: 'org-1',
          role: 'superadmin',
        }}
      />
    );

    expect(
      screen.getByRole('radio', { name: 'Указать версию вручную' })
    ).toBeChecked();
    expect(screen.getByLabelText('Целевая версия DVT')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Обновить DVT' })).toBeDisabled();
  });

  it('selects latest and confirms before starting the update', async () => {
    render(
      <SystemUpdatePanel
        currentUser={{
          email: 'superadmin@example.com',
          organization_id: 'org-1',
          role: 'superadmin',
        }}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Последняя версия' }));

    fireEvent.click(screen.getByRole('button', { name: 'Обновить DVT' }));

    await waitFor(() => expect(confirmMock).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(startMock).toHaveBeenCalledWith({
        ownerKey: 'superadmin@example.com',
        version: 'latest',
      })
    );
  });
});
