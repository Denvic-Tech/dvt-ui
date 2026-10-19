import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExportProjectsDialog } from './ExportProjectsDialog';

const showNotification = vi.fn();
const exportBundle = vi.fn();
const downloadBlob = vi.fn();
let currentRole = 'user';

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showNotification, showAlert: vi.fn() }),
}));

vi.mock('@/entities/user', () => ({
  useCurrentUser: () => ({
    user: { id: 'u1', role: currentRole },
    loading: false,
    reload: vi.fn(),
  }),
  isAdminAreaRole: (role: string) => role === 'admin' || role === 'superadmin',
}));

vi.mock('../../api/projectTransferApi', () => ({
  projectTransferApi: {
    exportBundle: (...args: unknown[]) => exportBundle(...args),
  },
}));

vi.mock('../../lib/downloadBlob', () => ({
  downloadBlob: (...args: unknown[]) => downloadBlob(...args),
}));

describe('ExportProjectsDialog', () => {
  beforeEach(() => {
    currentRole = 'user';
    exportBundle.mockReset();
    downloadBlob.mockReset();
    showNotification.mockReset();
    exportBundle.mockResolvedValue({
      blob: new Blob(['zip']),
      fileName: 'alpha.dvtpkg',
      warnings: [],
    });
  });

  it('requires an 8+ character passphrase while connections are included', async () => {
    const onClose = vi.fn();
    render(
      <ExportProjectsDialog
        open
        target={{ projectIds: ['p1'], folderIds: [] }}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Экспорт проекта')).toBeInTheDocument();
    expect(screen.queryByLabelText('Расписание')).toBeNull();

    const submit = screen.getByTestId(
      'features/project-transfer/export-submit'
    );
    fireEvent.click(screen.getByLabelText('Подключения'));
    expect(submit).toBeDisabled();

    const passphrase = screen.getByTestId(
      'features/project-transfer/export-passphrase'
    );
    fireEvent.change(passphrase, { target: { value: 'short' } });
    expect(screen.getByText('Минимум 8 символов')).toBeInTheDocument();
    expect(submit).toBeDisabled();

    fireEvent.change(passphrase, { target: { value: 'long-enough' } });
    expect(submit).toBeEnabled();

    fireEvent.click(submit);

    await waitFor(() => {
      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        'alpha.dvtpkg'
      );
    });

    expect(exportBundle).toHaveBeenCalledWith({
      project_ids: ['p1'],
      folder_ids: [],
      include_variables: false,
      include_connections: true,
      include_secrets: true,
      passphrase: 'long-enough',
      include_files: false,
      include_schedule: false,
      disable_schedule_after_export: false,
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Архив экспортирован',
        description:
          'Рекомендуется передавать пароль отдельно от файла экспорта.',
      })
    );
  });

  it('has every option off by default and needs no passphrase', async () => {
    const onClose = vi.fn();
    render(
      <ExportProjectsDialog
        open
        target={{ projectIds: [], folderIds: ['f1'] }}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Экспорт папки')).toBeInTheDocument();

    for (const label of [
      'Переменные проекта',
      'Подключения',
      'Локальные файлы',
    ]) {
      expect(screen.getByLabelText(label)).not.toBeChecked();
    }
    expect(
      screen.queryByTestId('features/project-transfer/export-passphrase')
    ).toBeNull();

    fireEvent.click(
      screen.getByTestId('features/project-transfer/export-submit')
    );

    await waitFor(() => {
      expect(exportBundle).toHaveBeenCalledWith({
        project_ids: [],
        folder_ids: ['f1'],
        include_variables: false,
        include_connections: false,
        include_secrets: false,
        passphrase: null,
        include_files: false,
        include_schedule: false,
        disable_schedule_after_export: false,
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', description: 'alpha.dvtpkg' })
    );
  });

  it('saves through the system dialog when it is available', async () => {
    const order: string[] = [];
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const showSaveFilePicker = vi.fn().mockImplementation(async () => {
      order.push('picker');
      return { createWritable: async () => ({ write, close }) };
    });
    exportBundle.mockImplementation(async () => {
      order.push('export');
      return {
        blob: new Blob(['zip']),
        fileName: 'alpha.dvtpkg',
        warnings: [],
      };
    });
    vi.stubGlobal('showSaveFilePicker', showSaveFilePicker);
    const onClose = vi.fn();

    try {
      render(
        <ExportProjectsDialog
          open
          target={{ projectIds: ['p1'], folderIds: [], name: 'write: v4' }}
          onClose={onClose}
        />
      );

      fireEvent.click(
        screen.getByTestId('features/project-transfer/export-submit')
      );

      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(order).toEqual(['picker', 'export']);
      expect(showSaveFilePicker).toHaveBeenCalledWith(
        expect.objectContaining({ suggestedName: 'write v4.dvtpkg' })
      );
      expect(write).toHaveBeenCalledWith(expect.any(Blob));
      expect(close).toHaveBeenCalled();
      expect(downloadBlob).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps the dialog open when the save dialog is cancelled', async () => {
    const showSaveFilePicker = vi
      .fn()
      .mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    vi.stubGlobal('showSaveFilePicker', showSaveFilePicker);
    const onClose = vi.fn();

    try {
      render(
        <ExportProjectsDialog
          open
          target={{ projectIds: ['p1'], folderIds: [] }}
          onClose={onClose}
        />
      );

      fireEvent.click(
        screen.getByTestId('features/project-transfer/export-submit')
      );

      await waitFor(() => expect(showSaveFilePicker).toHaveBeenCalled());
      expect(exportBundle).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(
        screen.getByTestId('features/project-transfer/export-submit')
      ).toBeEnabled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('generates a passphrase', () => {
    render(
      <ExportProjectsDialog
        open
        target={{ projectIds: ['p1'], folderIds: [] }}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Подключения'));
    fireEvent.click(
      screen.getByTestId('features/project-transfer/export-passphrase-generate')
    );

    const passphrase = screen.getByTestId(
      'features/project-transfer/export-passphrase'
    ) as HTMLInputElement;
    expect(passphrase.value).toMatch(/^[A-Za-z0-9]{4}(-[A-Za-z0-9]{4}){3}$/);
    expect(passphrase.type).toBe('password');
    expect(
      screen.getByTestId('features/project-transfer/export-submit')
    ).toBeEnabled();
  });

  it('shows the target name or counts under the title', () => {
    const { rerender } = render(
      <ExportProjectsDialog
        open
        target={{ projectIds: [], folderIds: ['f1'], name: 'analytics-etl' }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Экспорт папки')).toBeInTheDocument();
    expect(
      screen.getByTestId('features/project-transfer/export-subtitle')
    ).toHaveTextContent('analytics-etl');

    rerender(
      <ExportProjectsDialog
        open
        target={{ projectIds: ['p1', 'p2', 'p3'], folderIds: ['f1'] }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Экспорт проектов')).toBeInTheDocument();
    expect(
      screen.getByTestId('features/project-transfer/export-subtitle')
    ).toHaveTextContent('3 проекта, 1 папка');
  });

  it('keeps the header while closing after the target is reset', () => {
    const { rerender } = render(
      <ExportProjectsDialog
        open
        target={{ projectIds: [], folderIds: ['f1'], name: 'analytics-etl' }}
        onClose={vi.fn()}
      />
    );

    rerender(
      <ExportProjectsDialog open={false} target={null} onClose={vi.fn()} />
    );

    expect(screen.getByText('Экспорт папки')).toBeInTheDocument();
    expect(
      screen.getByTestId('features/project-transfer/export-subtitle')
    ).toHaveTextContent('analytics-etl');
  });

  it('keeps a shown passphrase visible after regenerating', () => {
    render(
      <ExportProjectsDialog
        open
        target={{ projectIds: ['p1'], folderIds: [] }}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Подключения'));
    fireEvent.click(screen.getByLabelText('Показать пароль'));
    fireEvent.click(
      screen.getByTestId('features/project-transfer/export-passphrase-generate')
    );

    const passphrase = screen.getByTestId(
      'features/project-transfer/export-passphrase'
    ) as HTMLInputElement;
    expect(passphrase.value).not.toBe('');
    expect(passphrase.type).toBe('text');
  });

  it('lets admins export the schedule and reports warnings', async () => {
    currentRole = 'admin';
    exportBundle.mockResolvedValueOnce({
      blob: new Blob(['zip']),
      fileName: 'alpha.dvtpkg',
      warnings: [
        { code: 'schedule_forbidden', message: 'Нет прав', project_ref: null },
      ],
    });

    render(
      <ExportProjectsDialog
        open
        target={{ projectIds: ['p1'], folderIds: [] }}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.queryByLabelText('Включить расписание после импорта')
    ).toBeNull();
    fireEvent.click(screen.getByLabelText('Расписание'));
    expect(
      screen.getByLabelText('Включить расписание после импорта')
    ).not.toBeChecked();

    fireEvent.click(
      screen.getByTestId('features/project-transfer/export-submit')
    );

    await waitFor(() => {
      expect(exportBundle).toHaveBeenCalledWith(
        expect.objectContaining({
          include_schedule: true,
          disable_schedule_after_export: true,
        })
      );
    });
    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'warning', description: 'Нет прав' })
      );
    });
  });

  it('sends the inverted flag when "enable schedule after import" is on', async () => {
    currentRole = 'admin';

    render(
      <ExportProjectsDialog
        open
        target={{ projectIds: ['p1'], folderIds: [] }}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Расписание'));
    fireEvent.click(screen.getByLabelText('Включить расписание после импорта'));
    fireEvent.click(
      screen.getByTestId('features/project-transfer/export-submit')
    );

    await waitFor(() => {
      expect(exportBundle).toHaveBeenCalledWith(
        expect.objectContaining({
          include_schedule: true,
          disable_schedule_after_export: false,
        })
      );
    });
  });
});
