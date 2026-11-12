import { type ComponentProps, useState } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DbMetadata } from '@/shared/gatewayClient';

import type {
  ExtensionState,
  WriteDataFrameToDBValues,
} from '../../lib/helpers';

import { TableSetupStep } from './index';

const mocks = vi.hoisted(() => ({
  metadata: null as unknown,
  dispatch: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  createDatabase: vi.fn().mockResolvedValue({}),
  createSchema: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => mocks.dispatch,
  useAppSelector: () => null,
}));
vi.mock('@/shared/api/utils', () => ({
  useApiUtils: () => ({
    createDatabase: mocks.createDatabase,
    createSchema: mocks.createSchema,
  }),
}));
vi.mock('@/shared/ui/confirm-dialog', () => ({
  useConfirmDialog: () => ({ confirm: mocks.confirm }),
}));
vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    getConnectedInputMetadata: (name: string) =>
      name === 'connection' ? mocks.metadata : null,
  }),
}));
vi.mock('@/shared/ui/node-input/PrimitiveNodeInput', () => ({
  default: () => <div>Редактор выражения</div>,
}));

const listResult = (items: unknown[], enabled = true) => ({
  items: enabled ? items : [],
  state: enabled ? 'ready' : 'idle',
  error: null,
  meta: null,
  hasNextPage: false,
  isFetchingNextPage: false,
  isRefreshing: false,
  loadMoreError: null,
  loadNextPage: vi.fn(),
  retry: vi.fn(),
});

vi.mock(
  '@/entities/data/db-connection/model/hooks/useDbCatalog',
  async importOriginal => {
    const original =
      await importOriginal<
        typeof import('@/entities/data/db-connection/model/hooks/useDbCatalog')
      >();
    return {
      ...original,
      useDbCatalogDatabases: (_metadata: unknown, options: any) =>
        listResult(
          [{ name: 'analytics' }, { name: 'archive' }],
          options?.enabled !== false
        ),
      useDbCatalogSchemas: (
        _metadata: unknown,
        database: string,
        options: any
      ) =>
        listResult(
          [{ name: 'public' }],
          options?.enabled !== false && database === 'analytics'
        ),
      useDbCatalogTables: (
        _metadata: unknown,
        database: string,
        schema: string | null,
        options: any
      ) =>
        listResult(
          ['orders', 'events'].map(name => ({
            name,
            kind: 'table',
            databaseName: database,
            schemaName: schema,
          })),
          options?.enabled !== false &&
            database === 'analytics' &&
            (schema === 'public' || schema === null)
        ),
      useDbCatalogTable: (
        _metadata: unknown,
        _database: string | null,
        _schema: string | null,
        table: string | null,
        options: { enabled?: boolean }
      ) => ({
        item:
          options.enabled !== false && table
            ? {
                name: table,
                columns: [
                  { name: 'id', dtype: 'INT' },
                  { name: 'created_at', dtype: 'DATETIME' },
                ],
              }
            : null,
        state: 'ready',
        error: null,
        meta: null,
        isRefreshing: false,
        retry: vi.fn(),
      }),
      useDbCatalogTablePreview: (
        _metadata: unknown,
        _database: string | null,
        _schema: string | null,
        table: string | null,
        options: { enabled?: boolean } = {}
      ) => {
        const active = options.enabled !== false && Boolean(table);
        return {
          data: active
            ? {
                columns: [
                  { name: 'id', dtype: 'INT' },
                  { name: 'created_at', dtype: 'DATETIME' },
                ],
                rows: [[1, '2024-01-01']],
                truncated: false,
                rowCount: 1,
                rowCountExact: true,
              }
            : null,
          state: active ? 'ready' : 'idle',
          error: null,
          isRefreshing: false,
          retry: vi.fn(),
        };
      },
      useRefreshDbCatalog: () => ({ refresh: vi.fn(), isLoading: false }),
    };
  }
);

const metadata = {
  dialect: 'postgresql',
  connection_id: 'test-connection',
  databases: [],
} as unknown as DbMetadata;

const nodeDefinition = { input_definitions: {} };

function Harness({ input = {} }: { input?: WriteDataFrameToDBValues }) {
  const [localInputData, setLocalInputData] = useState(input);
  const [sharedState, setSharedState] = useState<ExtensionState>({});
  return (
    <>
      <TableSetupStep
        {...({
          id: 'test-node',
          isOpen: true,
          localInputData,
          setLocalInputData,
          sharedState,
          setSharedState,
          nodeDefinition,
          variables: [],
        } as unknown as ComponentProps<typeof TableSetupStep>)}
      />
      <output data-testid='input'>{JSON.stringify(localInputData)}</output>
    </>
  );
}

const values = () =>
  JSON.parse(screen.getByTestId('input').textContent ?? '{}');

const treeItem = (name: string) =>
  screen.findByRole('treeitem', { name: new RegExp(name) });

const openSchema = async () => {
  fireEvent.click(await treeItem('analytics'));
  fireEvent.click(await treeItem('public'));
};

describe('TableSetupStep catalog tree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.metadata = metadata;
    mocks.confirm.mockResolvedValue(true);
  });

  it('shows the empty detail until a table is chosen', async () => {
    render(<Harness />);

    expect(await treeItem('analytics')).toBeInTheDocument();
    expect(screen.getByText('Выберите таблицу в дереве')).toBeInTheDocument();
    expect(
      screen.queryByRole('treeitem', { name: /orders/ })
    ).not.toBeInTheDocument();
  });

  it('selects an existing table and shows its preview and columns', async () => {
    render(<Harness />);
    await openSchema();
    fireEvent.click(await treeItem('orders'));

    await waitFor(() =>
      expect(values()).toMatchObject({
        database_name: 'analytics',
        schema_name: 'public',
        table_name: 'orders',
      })
    );
    // По умолчанию открыт «Предпросмотр».
    const preview = await screen.findByRole('table', {
      name: 'Предпросмотр данных таблицы',
    });
    expect(within(preview).getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Предпросмотр' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Колонки' }));
    const columns = await screen.findByRole('list', {
      name: 'Колонки таблицы',
    });
    expect(within(columns).getByText('created_at')).toBeInTheDocument();
    expect(await treeItem('events')).toBeInTheDocument();
  });

  it('starts a new-table draft inside a schema and validates its name', async () => {
    render(<Harness />);
    await openSchema();
    fireEvent.click(
      await screen.findByTestId(
        'node-extensions/write/write-df-to-db-v4/new-table-row'
      )
    );

    const nameInput = await screen.findByRole('textbox', {
      name: 'Название новой таблицы',
    });
    await waitFor(() =>
      expect(values()).toMatchObject({
        database_name: 'analytics',
        schema_name: 'public',
        table_name: null,
      })
    );

    fireEvent.change(nameInput, { target: { value: 'orders' } });
    expect(
      await screen.findByText('«orders» уже есть в analytics / public')
    ).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: 'new_orders' } });
    await waitFor(() => expect(values().table_name).toBe('new_orders'));
    expect(screen.queryByText(/уже есть в analytics/)).not.toBeInTheDocument();
  });

  it('creates a schema from the database row menu', async () => {
    render(<Harness />);
    // Раскрытая база: её схемы загружены и участвуют в проверке имени.
    fireEvent.click(await treeItem('analytics'));
    await treeItem('public');

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Действия с базой' })[0]!
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Создать схему/ })
    );

    const dialog = await screen.findByRole('dialog', { name: 'Новая схема' });
    const nameInput = within(dialog).getByRole('textbox', {
      name: 'Название',
    });
    fireEvent.change(nameInput, { target: { value: 'public' } });
    expect(
      within(dialog).getByRole('button', { name: 'Создать' })
    ).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: 'staging' } });
    fireEvent.keyDown(nameInput, { key: 'Enter' });

    await waitFor(() =>
      expect(mocks.createSchema).toHaveBeenCalledWith({
        connection_id: 'test-connection',
        database_name: 'analytics',
        schema_name: 'staging',
      })
    );
    await waitFor(() =>
      expect(values()).toMatchObject({
        database_name: 'analytics',
        schema_name: 'staging',
        table_name: null,
      })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Новая схема' })
      ).not.toBeInTheDocument()
    );
  });

  it('lists tables right under the database for ClickHouse', async () => {
    mocks.metadata = { ...metadata, dialect: 'clickhouse' };
    render(<Harness />);

    fireEvent.click(await treeItem('analytics'));
    expect(await treeItem('orders')).toBeInTheDocument();
    expect(
      screen.queryByRole('treeitem', { name: /public/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Действия с базой' })
    ).not.toBeInTheDocument();
  });
});
