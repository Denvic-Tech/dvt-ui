import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ImportPreviewSchema,
  ImportResultSchema,
} from '@/shared/gatewayClient';

import { ImportProjectsDialog } from './ImportProjectsDialog';

const showNotification = vi.fn();
const fetchConnections = vi.fn();
const previewImport = vi.fn();
const importBundle = vi.fn();

vi.mock('@/app/notifications', () => ({
  useAlert: () => ({ showNotification, showAlert: vi.fn() }),
}));

vi.mock('@/entities/data/db-connection', () => ({
  useConnections: () => ({
    connections: [
      { id: 'c-other', name: 'Other PG', kind: 'sql', type: 'postgres' },
      { id: 'c-ch', name: 'Clickhouse', kind: 'sql', type: 'clickhouse' },
    ],
    fetchConnections,
  }),
  getConnectionTypeLabel: (type: string) =>
    type === 'postgres' ? 'Postgres' : type,
  getConnectionTypeLogo: () => undefined,
  getConnectionTypeLogoScale: () => 1,
}));

vi.mock('../../api/projectTransferApi', () => ({
  projectTransferApi: {
    previewImport: (...args: unknown[]) => previewImport(...args),
    importBundle: (...args: unknown[]) => importBundle(...args),
  },
}));

const preview: ImportPreviewSchema = {
  manifest: {
    format_version: 1,
    dvt_version: '1.23.0',
    exported_at: '2026-10-16T09:00:00Z',
    source_instance_id: 'src',
    options: {},
    has_secrets: true,
  },
  folders: [{ ref: 'f1', name: 'Папка А', parent_ref: null }],
  projects: [
    {
      ref: 'p1',
      name: 'Alpha',
      folder_ref: 'f1',
      node_count: 4,
      edge_count: 3,
      subgraph_count: 1,
      files_total_size: 2048,
      variables: [
        {
          key: 'host',
          value: { type: 'STRING', value: 'localhost', is_list_type: false },
          conflicts_with_existing: true,
        },
      ],
      has_schedule_in_bundle: true,
      has_existing_schedule: false,
    },
  ],
  connections: [
    {
      ref: 'conn-1',
      name: 'Postgres main',
      kind: 'sql',
      type: 'postgres',
      inaccessible: false,
      has_secrets_in_bundle: true,
      candidates: [{ id: 'c-1', name: 'pg', kind: 'sql', type: 'postgres' }],
    },
  ],
  unknown_node_names: ['MysteryNode'],
  unavailable_extensions: [],
  target_has_graph: true,
  can_manage_schedules: false,
  warnings: [],
};

const result: ImportResultSchema = {
  project_ids: { p1: 'new-project-id' },
  folder_ids: {},
  connection_ids: { 'conn-1': 'new-conn' },
  skipped_connection_refs: [],
  warnings: [{ code: 'unknown_node', message: 'Нода MysteryNode пропущена' }],
};

const MERGE_TARGET = { mode: 'merge', projectId: 'project-42' } as const;

const selectFile = (name = 'bundle.dvtpkg') => {
  const input = screen.getByTestId(
    'features/project-transfer/import-file-input'
  ) as HTMLInputElement;
  const file = new File(['zip'], name, { type: 'application/zip' });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
};

const openSettings = async () => {
  const file = selectFile();
  await screen.findByTestId('features/project-transfer/import-file-card');
  return file;
};

describe('ImportProjectsDialog', () => {
  beforeEach(() => {
    showNotification.mockReset();
    previewImport.mockReset();
    importBundle.mockReset();
    previewImport.mockResolvedValue(preview);
    importBundle.mockResolvedValue(result);
  });

  it('reads the file and renders the settings step', async () => {
    render(
      <ImportProjectsDialog open target={MERGE_TARGET} onClose={vi.fn()} />
    );

    expect(
      screen.getByTestId('features/project-transfer/import-dropzone')
    ).toHaveTextContent('Импорт в проект');

    const file = await openSettings();

    expect(previewImport).toHaveBeenCalledWith(file, {
      mode: 'merge',
      folder_id: null,
      project_id: 'project-42',
      merge_strategy: 'append',
    });

    expect(
      screen.getByTestId('features/project-transfer/import-file-card')
    ).toHaveTextContent('bundle.dvtpkg');
    expect(
      screen.getByTestId('features/project-transfer/import-warnings')
    ).toHaveTextContent('MysteryNode');
    expect(screen.getByText('В проекте уже есть граф')).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Добавить рядом' })
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByTestId('features/project-transfer/import-connections-note')
    ).toHaveTextContent('Будут созданы в проекте');
    expect(screen.getByText('Postgres main')).toBeInTheDocument();
    expect(
      screen.getByTestId('features/project-transfer/import-passphrase')
    ).toBeInTheDocument();
    expect(screen.getByText('Доступно администраторам')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Расписание' })).toBeDisabled();
    expect(fetchConnections).toHaveBeenCalled();
  });

  it('imports with the chosen strategy, closes and reports the result', async () => {
    const onImported = vi.fn();
    const onBeforeImport = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ImportProjectsDialog
        open
        target={MERGE_TARGET}
        onClose={onClose}
        onBeforeImport={onBeforeImport}
        onImported={onImported}
      />
    );

    const file = await openSettings();

    fireEvent.click(screen.getByRole('radio', { name: 'Заменить' }));
    expect(screen.getByText('Текущие ноды будут удалены')).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('features/project-transfer/import-submit')
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    expect(onBeforeImport).toHaveBeenCalledTimes(1);
    expect(importBundle).toHaveBeenCalledWith(file, {
      mode: 'merge',
      folder_id: null,
      project_id: 'project-42',
      merge_strategy: 'replace',
      passphrase: null,
      connections: { 'conn-1': { action: 'create' } },
      variables: {},
      schedule: { import_schedule: false, enable: false, conflict: 'keep' },
    });
    expect(onImported).toHaveBeenCalledWith(result, preview);

    expect(
      screen.queryByTestId('features/project-transfer/import-result')
    ).toBeNull();
    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        title: 'Граф импортирован',
        autoCloseDuration: null,
      })
    );
    const { description } = showNotification.mock.calls[0]![0] as {
      description: string;
    };
    expect(description).toContain('4 ноды заменили текущий граф.');
    expect(description).toContain(
      'Новые подключения созданы без паролей и токенов'
    );
    expect(description).toContain('Нода MysteryNode пропущена.');
  });

  it('shows preview errors under the drop zone', async () => {
    const { ApiError } = await import('@/shared/lib/errors');
    previewImport.mockRejectedValueOnce(
      new ApiError({
        code: 'PROJECT_TRANSFER_007',
        message: 'Invalid bundle',
        description: 'Архив повреждён',
        status: 400,
      })
    );

    render(
      <ImportProjectsDialog
        open
        target={{ mode: 'create', folderId: null }}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByTestId('features/project-transfer/import-dropzone')
    ).toHaveTextContent('Импорт проектов');

    selectFile();

    expect(
      await screen.findByTestId('features/project-transfer/import-file-error')
    ).toHaveTextContent('Архив повреждён');
    expect(
      screen.getByTestId('features/project-transfer/import-dropzone')
    ).toBeInTheDocument();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('keeps the drop highlight while dragging over child elements', () => {
    render(
      <ImportProjectsDialog open target={MERGE_TARGET} onClose={vi.fn()} />
    );

    const zone = screen.getByTestId(
      'features/project-transfer/import-dropzone'
    );
    fireEvent.dragEnter(zone);
    expect(zone).toHaveTextContent('Отпустите, чтобы импортировать');

    // Переход курсора с зоны на дочерний элемент: enter на ребёнке, leave на зоне
    const child = screen.getByText('Отпустите, чтобы импортировать');
    fireEvent.dragEnter(child);
    fireEvent.dragLeave(zone);
    expect(zone).toHaveTextContent('Отпустите, чтобы импортировать');

    fireEvent.dragLeave(child);
    expect(zone).toHaveTextContent('Импорт в проект');
  });

  it('rejects files that are not .dvtpkg without calling the API', () => {
    render(
      <ImportProjectsDialog open target={MERGE_TARGET} onClose={vi.fn()} />
    );

    selectFile('report.zip');

    expect(
      screen.getByTestId('features/project-transfer/import-file-error')
    ).toHaveTextContent('«report.zip» — не файл экспорта DVT');
    expect(previewImport).not.toHaveBeenCalled();
  });

  it('marks the passphrase as invalid when the backend rejects it', async () => {
    const { ApiError } = await import('@/shared/lib/errors');
    importBundle.mockRejectedValueOnce(
      new ApiError({
        code: 'PROJECT_TRANSFER_005',
        message: 'Invalid passphrase',
        status: 400,
      })
    );

    render(
      <ImportProjectsDialog open target={MERGE_TARGET} onClose={vi.fn()} />
    );
    await openSettings();

    const passphrase = screen.getByTestId(
      'features/project-transfer/import-passphrase'
    );
    fireEvent.change(passphrase, { target: { value: 'wrong-pass' } });
    expect(
      screen.getByText('Пароли и токены будут перенесены в подключения')
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('features/project-transfer/import-submit')
    );

    expect(await screen.findByText('Неверный пароль')).toBeInTheDocument();
    expect(importBundle).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ passphrase: 'wrong-pass' })
    );
    expect(showNotification).not.toHaveBeenCalled();

    fireEvent.change(passphrase, { target: { value: 'right-pass' } });
    expect(screen.queryByText('Неверный пароль')).toBeNull();
  });

  it('maps a connection to an existing one of the same type', async () => {
    render(
      <ImportProjectsDialog open target={MERGE_TARGET} onClose={vi.fn()} />
    );
    await openSettings();

    fireEvent.click(
      screen.getByTestId(
        'features/project-transfer/import-connections-configure'
      )
    );
    await screen.findByTestId(
      'features/project-transfer/import-connections-dialog'
    );

    fireEvent.click(
      screen.getByRole('radio', { name: 'Сопоставить с существующим' })
    );
    const apply = screen.getByTestId(
      'features/project-transfer/import-connections-apply'
    );
    expect(apply).toBeDisabled();

    fireEvent.click(
      screen.getByTestId('features/project-transfer/import-connection-picker')
    );
    expect(screen.getByRole('option', { name: /pg/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Clickhouse/ })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Other PG/ }));

    expect(apply).toBeEnabled();
    expect(apply).toHaveTextContent('Применить');
    fireEvent.click(apply);

    await waitFor(() => {
      expect(
        screen.queryByTestId(
          'features/project-transfer/import-connections-dialog'
        )
      ).toBeNull();
    });
    expect(
      screen.getByTestId('features/project-transfer/import-connections-note')
    ).toHaveTextContent('1 сопоставлено');
    expect(
      screen.getByTestId('features/project-transfer/import-connections')
    ).toHaveTextContent('Other PG');

    fireEvent.click(
      screen.getByTestId('features/project-transfer/import-submit')
    );
    await waitFor(() => {
      expect(importBundle).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({
          connections: {
            'conn-1': { action: 'use_existing', connection_id: 'c-other' },
          },
        })
      );
    });
  });

  it('skips every connection from the bulk menu', async () => {
    render(
      <ImportProjectsDialog open target={MERGE_TARGET} onClose={vi.fn()} />
    );
    await openSettings();

    fireEvent.click(
      screen.getByTestId(
        'features/project-transfer/import-connections-configure'
      )
    );
    fireEvent.click(await screen.findByRole('button', { name: /Для всех/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Пропустить все' }));
    fireEvent.click(
      screen.getByTestId('features/project-transfer/import-connections-apply')
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('features/project-transfer/import-connections-note')
      ).toHaveTextContent('1 пропущено');
    });
  });
});
