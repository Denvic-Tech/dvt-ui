import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfirmDialogProvider } from '@/app/providers/confirm-dialog';

import type {
  ExtensionCatalogVersionSchema,
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
  showAlertMock,
} = vi.hoisted(() => ({
  listMock: vi.fn(),
  syncMock: vi.fn(),
  removeMock: vi.fn(),
  previewPackageMock: vi.fn(),
  installPackageMock: vi.fn(),
  installMock: vi.fn(),
  reloadMock: vi.fn(),
  showAlertMock: vi.fn(),
}));

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showAlert: showAlertMock, showNotification: vi.fn() }),
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

const renderPanel = () =>
  render(
    <ConfirmDialogProvider>
      <ExtensionsPanel />
    </ConfirmDialogProvider>
  );

// The «⋮» menu of the extension card.
const openMenu = async () => {
  fireEvent.click(
    await screen.findByRole('button', { name: 'Действия с расширением' })
  );
};

// A submenu of the open «⋮» menu; «Выбрать версию» opens once the catalog
// is refreshed.
const openSubmenu = async (label: 'Выбрать версию' | 'Скачать .dvtx') => {
  const item = await screen.findByRole('menuitem', { name: label });
  await waitFor(() => expect(item).not.toHaveClass('Mui-disabled'));
  fireEvent.click(item);
  return screen.findByRole('menu', { name: label });
};

const openDeleteDialog = async () => {
  await openMenu();
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Удалить' }));
};

describe('ExtensionsPanel uninstall confirmation', () => {
  beforeEach(() => {
    listMock.mockReset();
    syncMock.mockReset();
    removeMock.mockReset();
    previewPackageMock.mockReset();
    installPackageMock.mockReset();
    showAlertMock.mockReset();
    syncMock.mockResolvedValue([extension]);
    listMock.mockResolvedValue([extension]);
    removeMock.mockResolvedValue({ ...extension, is_installed: false });
  });

  it('preserves extension data by default', async () => {
    renderPanel();

    await openDeleteDialog();

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

    const { container } = renderPanel();

    await screen.findByRole('button', { name: 'Действия с расширением' });
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

    expect(showAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        description: 'runtime load failed',
      })
    );
    expect(installPackageMock).toHaveBeenCalledTimes(1);
  });

  it('drops extension data only after explicit opt-in', async () => {
    renderPanel();

    await openDeleteDialog();

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('checkbox', {
        name: 'Удалить данные расширения',
      })
    );
    expect(
      within(dialog).getByText(/без возможности восстановления/i)
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Удалить' }));

    await waitFor(() =>
      expect(removeMock).toHaveBeenCalledWith('sample-extension', true)
    );
  });
});

describe('ExtensionsPanel catalog', () => {
  const rc: ExtensionCatalogVersionSchema = {
    version: '2.0.0rc1',
    channel: 'rc',
    download_url: 'https://example.test/package.dvtx',
    operation: 'install',
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
    renderPanel();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Установить' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Установить' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        'Расширение «Sample Extension» v1.1.0 будет установлено.'
      )
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Установить' }));

    await waitFor(() =>
      expect(installMock).toHaveBeenCalledWith(extension.name, null, {
        allowDowngrade: false,
        allowReinstall: false,
      })
    );
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
    renderPanel();

    await screen.findByText(
      'Стабильной версии нет: выберите RC в меню «Выбрать версию».'
    );
    expect(screen.getByRole('button', { name: 'Установить' })).toBeDisabled();

    await openMenu();
    const versions = await openSubmenu('Выбрать версию');
    fireEvent.click(
      within(versions).getByRole('menuitem', { name: 'v2.0.0rc1 · RC' })
    );

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Установить' }));

    await waitFor(() =>
      expect(installMock).toHaveBeenCalledWith(extension.name, rc.version, {
        allowDowngrade: false,
        allowReinstall: false,
      })
    );
  });

  it('explains platform and DVT mismatches without blocking the download', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    listMock.mockResolvedValue([
      {
        ...extension,
        is_installed: false,
        catalog_versions: [
          {
            ...rc,
            operation: null,
            incompatibility: 'target',
            incompatibility_details: [
              { field: 'os', current: 'windows', required: 'linux' },
              { field: 'python', current: '3.12', required: '3.13' },
            ],
          },
          {
            ...rc,
            version: '1.1.0',
            channel: 'stable',
            operation: null,
            incompatibility: 'dvt_version',
            incompatibility_details: [
              { field: 'dvt_version', current: '1.22.0', required: '>=1.24.0' },
            ],
          },
        ],
      },
    ]);
    renderPanel();

    await openMenu();
    const versions = await openSubmenu('Выбрать версию');
    expect(
      within(versions).getByRole('menuitem', {
        name: /v1\.1\.0\s*DVT 1\.22\.0, требуется >=1\.24\.0/,
      })
    ).toHaveClass('Mui-disabled');
    expect(
      within(versions).getByRole('menuitem', {
        name: /v2\.0\.0rc1 · RC\s*ОС: windows, требуется linux · Python: 3\.12, требуется 3\.13/,
      })
    ).toHaveClass('Mui-disabled');

    const downloads = await openSubmenu('Скачать .dvtx');
    fireEvent.click(
      within(downloads).getByRole('menuitem', { name: 'v2.0.0rc1 · RC' })
    );
    expect(openSpy).toHaveBeenCalledWith(rc.download_url, '_blank', 'noopener');

    expect(
      await screen.findByRole('button', { name: 'Установить' })
    ).toBeDisabled();
    openSpy.mockRestore();
  });

  it.each([
    ['downgrade', 'Понизить версию?', 'Понизить версию', '0.9.0'],
    ['reinstall', 'Переустановить расширение?', 'Переустановить', '1.0.0'],
  ] as const)(
    'asks before a catalog %s',
    async (operation, title, label, version) => {
      listMock.mockResolvedValue([
        {
          ...extension,
          catalog_versions: [
            { ...rc, version, channel: 'stable', operation },
          ],
        },
      ]);
      renderPanel();

      await openMenu();
      const versions = await openSubmenu('Выбрать версию');
      fireEvent.click(
        within(versions).getByRole('menuitem', {
          name: new RegExp(`^v${version.replace(/\./g, '\\.')}`),
        })
      );

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(title)).toBeInTheDocument();
      expect(installMock).not.toHaveBeenCalled();
      fireEvent.click(within(dialog).getByRole('button', { name: label }));

      await waitFor(() =>
        expect(installMock).toHaveBeenCalledWith(extension.name, version, {
          allowDowngrade: operation === 'downgrade',
          allowReinstall: operation === 'reinstall',
        })
      );
    }
  );

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

    renderPanel();

    const availableTab = await screen.findByRole('tab', { name: /Доступно/ });
    await waitFor(() => expect(availableTab).toBeEnabled());
    fireEvent.click(availableTab);
    expect(
      await screen.findByText('Все расширения установлены')
    ).toBeInTheDocument();
    expect(screen.queryByText('Old Extension')).not.toBeInTheDocument();
    expect(listMock).toHaveBeenCalledTimes(2);
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
    renderPanel();

    await screen.findByText(
      'Не удалось обновить каталог. Показаны сохранённые данные.'
    );
    expect(
      screen.getByRole('button', { name: 'Обновить до v2.0.0' })
    ).toBeDisabled();

    await openMenu();
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Перезагрузить' })
    );
    expect(reloadMock).toHaveBeenCalledWith(extension.name);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Обновить каталог' })
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Обновить до v2.0.0' })
      ).toBeEnabled()
    );
    expect(syncMock).toHaveBeenCalledTimes(2);
  });
});
