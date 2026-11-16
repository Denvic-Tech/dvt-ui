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

const renderPanel = () =>
  render(
    <SystemUpdatePanel
      currentUser={{
        email: 'superadmin@example.com',
        organization_id: 'org-1',
        role: 'superadmin',
      }}
    />
  );

describe('SystemUpdatePanel', () => {
  beforeEach(() => {
    confirmMock.mockReset();
    startMock.mockReset();
    confirmMock.mockResolvedValue(true);
    startMock.mockResolvedValue(undefined);
  });

  it('starts with the latest tag and the current version', () => {
    renderPanel();

    expect(screen.getByLabelText('Tag образов')).toHaveValue('latest');
    expect(screen.getByText('1.19.0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Обновить' })).toBeEnabled();
  });

  it('confirms before starting the update to latest', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));

    await waitFor(() => expect(confirmMock).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(startMock).toHaveBeenCalledWith({
        ownerKey: 'superadmin@example.com',
        version: 'latest',
      })
    );
  });

  it('starts the update to a typed tag', async () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('Tag образов'), {
      target: { value: ' 1.20.0 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));

    await waitFor(() =>
      expect(startMock).toHaveBeenCalledWith({
        ownerKey: 'superadmin@example.com',
        version: '1.20.0',
      })
    );
  });

  it('disables the button while the tag is empty', () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('Tag образов'), {
      target: { value: '   ' },
    });

    expect(screen.getByRole('button', { name: 'Обновить' })).toBeDisabled();
  });
});
