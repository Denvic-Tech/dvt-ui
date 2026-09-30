import { type ComponentProps, useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DbMetadata } from '@/shared/gatewayClient';

import type {
  ExtensionState,
  WriteDataFrameToDBValues,
} from '../../lib/helpers';

import { TableSetupStep } from './index';

const mocks = vi.hoisted(() => ({
  metadata: null as unknown,
  catalog: vi.fn(),
  dispatch: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
}));
vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => mocks.dispatch,
}));
vi.mock('@/shared/api/utils', () => ({
  useApiUtils: () => ({ createDatabase: vi.fn(), createSchema: vi.fn() }),
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
vi.mock('@/features/node/db-target-selector', () => ({
  useDbTargetCatalogController: (...args: unknown[]) => mocks.catalog(...args),
}));
vi.mock('@/shared/ui/node-input/PrimitiveNodeInput', () => ({
  default: () => <div>Редактор выражения</div>,
}));

const metadata = {
  dialect: 'postgresql',
  connection_id: 'test-connection',
  databases: [
    {
      name: 'analytics',
      schemas: [
        {
          name: 'public',
          tables: [
            { name: 'orders', type: 'BASE TABLE', columns: [] },
            { name: 'events', type: 'BASE TABLE', columns: [] },
          ],
        },
      ],
    },
    { name: 'archive', schemas: [{ name: 'raw', tables: [] }] },
  ],
} as unknown as DbMetadata;
const initial = {
  database_name: 'analytics',
  schema_name: 'public',
  table_name: 'orders',
  write_mode: 'append',
} as WriteDataFrameToDBValues;
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

describe('TableSetupStep Miller columns', () => {
  beforeEach(() => {
    mocks.metadata = metadata;
    mocks.catalog.mockReturnValue({ mode: 'embedded' });
  });

  it('keeps downstream columns empty before selecting a database', () => {
    render(<Harness />);
    expect(screen.getAllByRole('region')).toHaveLength(3);
    expect(
      within(screen.getByRole('region', { name: 'Схема' })).getByText(
        'Выберите базу данных'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'orders' })
    ).not.toBeInTheDocument();
    expect(mocks.catalog).toHaveBeenLastCalledWith(
      metadata,
      expect.objectContaining({ schemasEnabled: false, tablesEnabled: false })
    );
  });

  it('navigates database, schema and table without hiding lists after selection', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /analytics/ }));
    expect(screen.getByRole('button', { name: /public/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'orders' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /public/ }));
    fireEvent.click(screen.getByRole('button', { name: 'orders' }));
    expect(values()).toMatchObject({
      database_name: 'analytics',
      schema_name: 'public',
      table_name: 'orders',
    });
    expect(screen.getByRole('button', { name: 'events' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'orders' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('resets dependent fields on a new database but preserves them on repeated selection', () => {
    render(<Harness input={initial} />);
    fireEvent.click(screen.getByRole('button', { name: 'analytics' }));
    expect(values().write_mode).toBe('append');
    fireEvent.click(screen.getByRole('button', { name: /archive/ }));
    expect(values()).toMatchObject({
      database_name: 'archive',
      schema_name: null,
      table_name: null,
      write_mode: null,
    });
    expect(
      screen.queryByRole('button', { name: 'orders' })
    ).not.toBeInTheDocument();
  });

  it('omits the schema column for ClickHouse', () => {
    mocks.metadata = { ...metadata, dialect: 'clickhouse' };
    render(<Harness input={{ database_name: 'analytics' }} />);
    expect(screen.getAllByRole('region')).toHaveLength(2);
    expect(
      screen.queryByRole('region', { name: 'Схема' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Создать таблицу' })
    ).toBeEnabled();
  });

  it('can create a schema in an empty database before naming a table', () => {
    render(<Harness input={{ database_name: 'archive' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Создать схему' }));
    expect(
      screen.getByRole('textbox', { name: 'Создать схему' })
    ).toBeInTheDocument();
  });

  it('selects a new table name and can return to an existing table', () => {
    render(<Harness input={initial} />);
    fireEvent.click(screen.getByRole('button', { name: 'Создать таблицу' }));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Название новой таблицы' }),
      { target: { value: 'new_orders' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(values().table_name).toBe('new_orders');
    fireEvent.click(screen.getByRole('button', { name: 'events' }));
    expect(values().table_name).toBe('events');
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });
});
