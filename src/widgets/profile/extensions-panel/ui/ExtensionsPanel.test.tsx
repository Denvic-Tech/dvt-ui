import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ExtensionPackagePreviewSchema,
  ExtensionReadSchema,
} from '@/shared/gatewayClient';

import { ExtensionsPanel } from './ExtensionsPanel';

const {
  listMock,
  syncMock,
  removeMock,
  previewPackageMock,
  installPackageMock,
  installMock,
  reloadMock,
} = vi.hoisted(() => ({
  listMock: vi.fn(),
  syncMock: vi.fn(),
  removeMock: vi.fn(),
  previewPackageMock: vi.fn(),
  installPackageMock: vi.fn(),
  installMock: vi.fn(),
  reloadMock: vi.fn(),
}));

vi.mock('@/features/profile/extensions', () => ({
  extensionsApi: {
    list: listMock,
    sync: syncMock,
    install: installMock,
    installPackage: installPackageMock,
    previewPackage: previewPackageMock,
    reload: reloadMock,
    remove: removeMock,
  },
}));

const packagePreview: ExtensionPackagePreviewSchema = {
  package_id: 'package-1',
  filename: 'sample.dvtx',
  name: 'sample-extension',
  display_name: 'Sample Extension',
  version: '1.1.0',
  current_version: null,
  dvt_version: '>=1.22.1rc5',
  operation: 'install',
  compatible: true,
  offline_ready: true,
  has_wheelhouse: true,
  bundled_wheels_count: 1,
  warnings: [],
};

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
    previewPackageMock.mockReset();
    installPackageMock.mockReset();
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

  it('invalidates package preview after failed installation', async () => {
    previewPackageMock.mockResolvedValue(packagePreview);
    installPackageMock.mockRejectedValue(new Error('runtime load failed'));

    const { container } = render(<ExtensionsPanel />);

    await screen.findByText('Sample Extension');
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const file = new File(['package'], 'sample.dvtx', {
      type: 'application/zip',
    });
    fireEvent.change(input!, { target: { files: [file] } });

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Установить' }));

    await waitFor(() =>
      expect(installPackageMock).toHaveBeenCalledWith('package-1', {
        allowDowngrade: false,
        allowReinstall: false,
      })
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );

    expect(screen.getByText('runtime load failed')).toBeInTheDocument();
    expect(installPackageMock).toHaveBeenCalledTimes(1);
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

describe('ExtensionsPanel catalog', () => {
  const rc = {
    version: '2.0.0rc1',
    channel: 'rc' as const,
    download_url: 'https://example.test/package.dvtx',
    operation: 'install' as const,
  };

  const selectVersion = async (name: RegExp) => {
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name }));
  };

  beforeEach(() => {
    vi.resetAllMocks();
    syncMock.mockResolvedValue([]);
    installMock.mockResolvedValue(extension);
    reloadMock.mockResolvedValue(extension);
  });

  it('uses the recommended stable when a newer RC is also listed', async () => {
    listMock.mockResolvedValue([
      {
        ...extension,
        is_installed: false,
        current_version: null,
        recommended_version: '1.1.0',
        catalog_versions: [rc, { ...rc, version: '1.1.0', channel: 'stable' }],
      },
    ]);
    render(<ExtensionsPanel />);

    await screen.findByText('По умолчанию: 1.1.0');
    const button = screen.getByRole('button', { name: 'Установить' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(installMock).toHaveBeenCalledWith(extension.name, null, {
      allowDowngrade: false,
      allowReinstall: false,
    });
  });

  it('requires explicit selection for an RC-only catalog', async () => {
    listMock.mockResolvedValue([
      {
        ...extension,
        is_installed: false,
        current_version: null,
        catalog_versions: [rc],
      },
    ]);
    render(<ExtensionsPanel />);

    await screen.findByText('Для установки выберите RC.');
    const button = screen.getByRole('button', {
      name: 'Установить',
    });
    expect(button).toBeDisabled();
    await selectVersion(/2\.0\.0rc1 RC/);
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    expect(installMock).toHaveBeenCalledWith(extension.name, rc.version, {
      allowDowngrade: false,
      allowReinstall: false,
    });
  });

  it('keeps the download available for an incompatible release', async () => {
    listMock.mockResolvedValue([
      {
        ...extension,
        is_installed: false,
        catalog_versions: [
          { ...rc, operation: null, incompatibility: 'target' },
        ],
      },
    ]);
    render(<ExtensionsPanel />);

    await screen.findByText('Sample Extension');
    await selectVersion(/Несовместимая платформа/);
    expect(screen.getByRole('link', { name: 'Скачать .dvtx' })).toHaveAttribute(
      'href',
      rc.download_url
    );
    expect(screen.getByRole('button', { name: 'Установить' })).toBeDisabled();
  });

  it.each([
    ['downgrade', 'Понизить версию', '0.9.0'],
    ['reinstall', 'Переустановить', '1.0.0'],
  ] as const)('asks before a catalog %s', async (operation, label, version) => {
    listMock.mockResolvedValue([
      {
        ...extension,
        catalog_versions: [{ ...rc, version, channel: 'stable', operation }],
      },
    ]);
    render(<ExtensionsPanel />);

    await screen.findByText('Sample Extension');
    await selectVersion(new RegExp(version));
    const button = screen.getByRole('button', { name: label });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    const dialog = screen.getByRole('dialog', { name: label + '?' });
    expect(installMock).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Подтвердить' })
    );
    expect(installMock).toHaveBeenCalledWith(extension.name, version, {
      allowDowngrade: operation === 'downgrade',
      allowReinstall: operation === 'reinstall',
    });
  });

  it('removes unavailable uninstalled entries after a successful refresh', async () => {
    const unavailable = {
      ...extension,
      name: 'old-extension',
      display_name: 'Old Extension',
      is_installed: false,
      catalog_versions: [rc],
    };
    listMock
      .mockResolvedValueOnce([extension, unavailable])
      .mockResolvedValueOnce([
        extension,
        { ...unavailable, catalog_versions: [], available_versions: [] },
      ]);

    render(<ExtensionsPanel />);

    await screen.findByText('Sample Extension');
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Old Extension')).not.toBeInTheDocument();
  });

  it('keeps local reload available when refresh fails and retries manually', async () => {
    listMock.mockResolvedValue([
      {
        ...extension,
        recommended_version: '2.0.0',
        catalog_versions: [
          { ...rc, version: '2.0.0', channel: 'stable', operation: 'upgrade' },
        ],
      },
    ]);
    syncMock.mockRejectedValueOnce(new Error('unavailable'));
    render(<ExtensionsPanel />);

    await screen.findByText(
      'Не удалось обновить каталог. Показаны сохранённые данные.'
    );
    expect(screen.getByRole('button', { name: 'Обновить' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Перезагрузить' }));
    expect(reloadMock).toHaveBeenCalledWith(extension.name);

    fireEvent.click(screen.getByRole('button', { name: 'Обновить каталог' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Обновить' })).toBeEnabled()
    );
    expect(syncMock).toHaveBeenCalledTimes(2);
  });
});
