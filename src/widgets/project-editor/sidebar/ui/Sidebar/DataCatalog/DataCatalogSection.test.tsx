import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dataCatalogApi } from '@/entities/data/data-catalog';

import { DataCatalogSection } from './DataCatalogSection';

const { getDatasetMock, searchDatasetsMock, getUsageMock } = vi.hoisted(() => ({
  getDatasetMock: vi.fn(),
  searchDatasetsMock: vi.fn(),
  getUsageMock: vi.fn(),
}));

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    dataCatalog: {
      datasets: {
        get: searchDatasetsMock,
        datasetId: (datasetId: string) => ({
          get: (...args: unknown[]) => getDatasetMock(datasetId, ...args),
          usage: { get: getUsageMock },
        }),
      },
    },
  },
}));

vi.mock('@/entities/data/db-connection', () => ({
  ConnectionLogo: () => <div data-testid='connection-logo' />,
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
  description: null,
  effective_description: 'Заказы клиентов',
  freshness: 'unverified' as const,
  field_count: 2,
  reader_count: 1,
  writer_count: 0,
  updated_at: '2026-10-01T10:00:00Z',
};

const details = {
  ...summary,
  freshness: 'fresh' as const,
  schema_synced_at: '2026-10-08T09:30:00Z',
  connection_ids: ['conn-1'],
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

const renderSection = (projectId: string | null = 'project-1') => {
  const store = configureStore({
    reducer: { [dataCatalogApi.reducerPath]: dataCatalogApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(dataCatalogApi.middleware),
  });

  return render(
    <Provider store={store}>
      <DataCatalogSection projectId={projectId} />
    </Provider>
  );
};

describe('DataCatalogSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchDatasetsMock.mockResolvedValue({
      data: { items: [summary], next_cursor: null },
    });
    getDatasetMock.mockResolvedValue({ data: details });
    getUsageMock.mockResolvedValue({ data: { items: [] } });
  });

  it('loads datasets filtered by the current project', async () => {
    renderSection();

    expect(await screen.findByText('orders')).toBeTruthy();
    expect(screen.getByText('Заказы клиентов')).toBeTruthy();
    expect(searchDatasetsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          project_id: 'project-1',
          cursor: null,
        }),
      }),
      expect.anything()
    );
  });

  it('does not request datasets without a project', () => {
    renderSection(null);

    expect(screen.getByText('Проект не выбран')).toBeTruthy();
    expect(searchDatasetsMock).not.toHaveBeenCalled();
  });

  it('opens dataset details with sync=true and patches the list card', async () => {
    renderSection();

    fireEvent.click(
      await screen.findByTestId('entities/data-catalog/dataset-card')
    );

    expect(
      await screen.findByTestId(
        'widgets/project-editor/sidebar/dataset-details-modal'
      )
    ).toBeTruthy();
    await waitFor(() =>
      expect(getDatasetMock).toHaveBeenCalledWith(
        'ds-1',
        { query: { include_fields: true, sync: true } },
        expect.anything()
      )
    );

    // freshness из sync-ответа переносится в карточку списка.
    await waitFor(() =>
      expect(screen.getAllByText('Актуален').length).toBeGreaterThan(0)
    );
    expect(screen.queryByText('Не проверен')).toBeNull();
  });
  it('switches between dataset details tabs', async () => {
    renderSection();

    fireEvent.click(
      await screen.findByTestId('entities/data-catalog/dataset-card')
    );

    fireEvent.click(await screen.findByRole('tab', { name: /Поля/ }));
    expect(await screen.findByText('Идентификатор заказа')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Использование' }));
    expect(
      await screen.findByText('Датасет пока не используется ни в одной ноде.')
    ).toBeTruthy();
    expect(getUsageMock).toHaveBeenCalled();
  });
});
