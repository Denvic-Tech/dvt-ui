import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExtensionReadSchema } from '@/shared/gatewayClient';

import { ExtensionsPanel } from './ExtensionsPanel';

const { listMock, syncMock, removeMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  syncMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock('@/features/profile/extensions', () => ({
  extensionsApi: {
    list: listMock,
    sync: syncMock,
    install: vi.fn(),
    reload: vi.fn(),
    remove: removeMock,
  },
}));

const extension: ExtensionReadSchema = {
  id: 'ext-1',
  name: 'sample-extension',
  display_name: 'Sample Extension',
  description: 'Sample description',
  is_enabled: true,
  is_installed: true,
  current_version: '1.0.0',
  available_versions: ['1.0.0'],
  manifest_json: {
    name: 'sample-extension',
    version: '1.0.0',
    description: '',
    backend: {},
    requirements: [],
    state_schema: {},
    nodes: [],
  },
};

describe('ExtensionsPanel uninstall confirmation', () => {
  beforeEach(() => {
    listMock.mockReset();
    syncMock.mockReset();
    removeMock.mockReset();
    syncMock.mockResolvedValue([extension]);
    listMock.mockResolvedValue([extension]);
    removeMock.mockResolvedValue({ ...extension, is_installed: false });
  });

  it('preserves extension data by default', async () => {
    render(<ExtensionsPanel />);

    await screen.findByText('Sample Extension');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    const dialog = await screen.findByRole('dialog');
    const dropData = within(dialog).getByRole('checkbox', {
      name: 'Удалить данные расширения',
    });
    expect(dropData).not.toBeChecked();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }));

    await waitFor(() =>
      expect(removeMock).toHaveBeenCalledWith('sample-extension', false)
    );
  });

  it('drops extension data only after explicit opt-in', async () => {
    render(<ExtensionsPanel />);

    await screen.findByText('Sample Extension');
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('checkbox', {
        name: 'Удалить данные расширения',
      })
    );
    expect(
      within(dialog).getByText(/навсегда удалены из service PostgreSQL/i)
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }));

    await waitFor(() =>
      expect(removeMock).toHaveBeenCalledWith('sample-extension', true)
    );
  });
});
