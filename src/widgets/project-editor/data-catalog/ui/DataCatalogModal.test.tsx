import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider, useDispatch } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dataCatalogApi } from '@/entities/data/data-catalog';
import { lineageApi } from '@/entities/data/lineage';

import { DataCatalogModal, type DataCatalogSection } from './DataCatalogModal';

const { getColumnsMock, getDatasetMock, searchDatasetsMock, selectedNodeRef } =
  vi.hoisted(() => ({
    getColumnsMock: vi.fn(),
    getDatasetMock: vi.fn(),
    searchDatasetsMock: vi.fn(),
    selectedNodeRef: { current: null as string | null },
  }));

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    projects: {
      projectId: () => ({ lineage: { columns: { get: getColumnsMock } } }),
    },
    dataCatalog: {
      datasets: {
        get: searchDatasetsMock,
        datasetId: (datasetId: string) => ({
          get: (...args: unknown[]) => getDatasetMock(datasetId, ...args),
        }),
      },
    },
  },
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => useDispatch(),
  useAppSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

vi.mock('@/features/project-editor/select-node', () => ({
  selectSelectedNodeID: () => selectedNodeRef.current,
}));

vi.mock('../model/useCatalogNodes', () => ({
  useCatalogNodes: () => [
    {
      id: 'node-filter',
      title: 'Фильтр заказов',
      templateName: 'Filter',
      iconKey: null,
      categoryColor: '#3b82f6',
      searchText: 'фильтр заказов filter node-filter',
    },
    {
      id: 'node-sink',
      title: 'Запись в DWH',
      templateName: 'Write table',
      iconKey: null,
      categoryColor: '#10b981',
      searchText: 'запись в dwh write table node-sink',
    },
  ],
}));

vi.mock('@/widgets/project-editor/node-fields-viewer', () => ({
  NodeFieldsPanel: ({
    nodeID,
    embedded,
  }: {
    nodeID: string;
    embedded?: boolean;
  }) => (
    <div data-testid='node-fields-panel' data-embedded={String(embedded)}>
      {nodeID}
    </div>
  ),
}));

vi.mock('@/entities/data/db-connection', () => ({
  ConnectionLogo: () => <span data-testid='connection-logo' />,
}));

vi.mock('@/entities/project-editor/node-library', () => ({
  NodeLibraryIcon: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock('@/shared/ui/node-icon/NodeIcon', () => ({
  NodeIcon: () => <span />,
}));

const locator = {
  kind: 'db_table',
  location: 'db.local:5432/analytics.public.orders',
  parts: {
    dialect: 'postgresql',
    host: 'db.local',
    port: 5432,
    database: 'analytics',
    schema: 'public',
    table: 'orders',
  },
};

const summary = {
  id: 'ds-1',
  organization_id: 'org-1',
  physical_key: 'postgresql://db.local:5432/analytics.public.orders',
  locator,
  freshness: 'unverified' as const,
  field_count: 1,
  reader_count: 1,
  writer_count: 0,
  updated_at: '2026-10-01T10:00:00Z',
};

const details = {
  ...summary,
  freshness: 'fresh' as const,
  connection_ids: [],
  created_at: '2026-09-01T10:00:00Z',
  fields: [
    {
      id: 'f-1',
      name: 'order_id',
      dtype: 'bigint',
      nullable: false,
      ordinal: 1,
      primary_key: true,
      effective_description: 'Идентификатор заказа',
      status: 'ok' as const,
      first_seen_at: '2026-09-01T10:00:00Z',
      last_seen_at: '2026-10-08T09:30:00Z',
    },
  ],
};

const renderModal = (initialSection: DataCatalogSection = 'columns') => {
  const store = configureStore({
    reducer: {
      [dataCatalogApi.reducerPath]: dataCatalogApi.reducer,
      [lineageApi.reducerPath]: lineageApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(
        dataCatalogApi.middleware,
        lineageApi.middleware
      ),
  });
  const onClose = vi.fn();

  render(
    <Provider store={store}>
      <DataCatalogModal
        open
        projectId='project-1'
        initialSection={initialSection}
        onClose={onClose}
      />
    </Provider>
  );

  return { onClose };
};

describe('DataCatalogModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectedNodeRef.current = null;
    searchDatasetsMock.mockResolvedValue({
      data: { items: [summary], next_cursor: null },
    });
    getDatasetMock.mockResolvedValue({ data: details });
    getColumnsMock.mockResolvedValue({
      data: {
        project_id: 'project-1',
        lineage_available: true,
        rows: [],
        groups: [],
      },
    });
  });

  it('opens columns by default, hides datasets and shows tab counts', async () => {
    renderModal();

    expect(screen.queryByTestId('widgets/data-catalog/section-datasets')).toBe(
      null
    );
    expect(searchDatasetsMock).not.toHaveBeenCalled();
    expect(
      screen
        .getByTestId('widgets/data-catalog/section-columns')
        .getAttribute('aria-selected')
    ).toBe('true');
    expect(
      screen.getByTestId('widgets/data-catalog/section-nodes').textContent
    ).toBe('Ноды2');
    await waitFor(() =>
      expect(
        screen.getByTestId('widgets/data-catalog/section-columns').textContent
      ).toBe('Колонки0')
    );
  });

  it('keeps the hidden datasets section reachable via initialSection', async () => {
    renderModal('datasets');

    const row = await screen.findByTestId('widgets/data-catalog/dataset-row');
    expect(searchDatasetsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ project_id: 'project-1' }),
      }),
      expect.anything()
    );
    expect(screen.getByText('Выберите датасет')).toBeTruthy();

    fireEvent.click(row);

    expect(await screen.findByText('Идентификатор заказа')).toBeTruthy();
    expect(getDatasetMock).toHaveBeenCalledWith(
      'ds-1',
      { query: { include_fields: true, sync: true } },
      expect.anything()
    );
  });

  it('switches to nodes and opens columns of the selected node', async () => {
    renderModal();

    fireEvent.click(screen.getByTestId('widgets/data-catalog/section-nodes'));

    expect(screen.getAllByTestId('widgets/data-catalog/node-row')).toHaveLength(
      2
    );
    expect(screen.getByText('Выберите ноду')).toBeTruthy();

    fireEvent.click(screen.getByText('Запись в DWH'));

    const panel = await screen.findByTestId('node-fields-panel');
    expect(panel.textContent).toBe('node-sink');
    expect(panel.getAttribute('data-embedded')).toBe('true');
  });

  it('filters nodes by search and preselects the node selected on canvas', async () => {
    selectedNodeRef.current = 'node-filter';
    renderModal();

    fireEvent.click(screen.getByTestId('widgets/data-catalog/section-nodes'));
    expect((await screen.findByTestId('node-fields-panel')).textContent).toBe(
      'node-filter'
    );

    fireEvent.change(screen.getByLabelText('Поиск нод'), {
      target: { value: 'dwh' },
    });
    await waitFor(() =>
      expect(
        screen.getAllByTestId('widgets/data-catalog/node-row')
      ).toHaveLength(1)
    );
  });
});
