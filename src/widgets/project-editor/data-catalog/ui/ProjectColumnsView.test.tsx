import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider, useDispatch } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dataCatalogApi } from '@/entities/data/data-catalog';
import {
  lineageApi,
  type ProjectColumnRow,
  type ProjectColumns,
} from '@/entities/data/lineage';

import { ProjectColumnsView } from './ProjectColumnsView';

const { getColumnsMock, patchColumnsMock, patchDatasetMock } = vi.hoisted(
  () => ({
    getColumnsMock: vi.fn(),
    patchColumnsMock: vi.fn(),
    patchDatasetMock: vi.fn(),
  })
);

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    projects: {
      projectId: () => ({
        lineage: {
          columns: { get: getColumnsMock },
          nodes: {
            nodeId: (nodeId: string) => ({
              columns: {
                patch: (...args: unknown[]) =>
                  patchColumnsMock(nodeId, ...args),
              },
            }),
          },
        },
      }),
    },
    dataCatalog: {
      datasets: {
        datasetId: (datasetId: string) => ({
          patch: (...args: unknown[]) => patchDatasetMock(datasetId, ...args),
        }),
      },
    },
  },
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => useDispatch(),
  useAppSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

vi.mock('../model/useCatalogNodes', () => ({ useCatalogNodes: () => [] }));

vi.mock('@/shared/ui/node-icon/NodeIcon', () => ({
  NodeIcon: () => <span />,
}));

const nodeRef = (nodeId: string, port: string, column: string) => ({
  key: `node:${nodeId}:${port}:${column}`,
  kind: 'node' as const,
  node_id: nodeId,
  port,
  column,
});

const occurrence = (
  nodeId: string,
  nodeName: string,
  column: string,
  depth: number,
  op: 'source' | 'pass' | 'rename' | 'compute' = 'pass',
  port = 'output'
) => ({
  ref: nodeRef(nodeId, port, column),
  node_id: nodeId,
  node_name: nodeName,
  port,
  role: 'output' as const,
  column,
  op,
  depth,
  description_provenance: 'inherited' as const,
});

const amountRow: ProjectColumnRow = {
  id: 'node:n-read:output:amount',
  name: 'amount',
  origin: {
    key: 'ds:ds-1:f-amount',
    kind: 'ds',
    dataset_id: 'ds-1',
    field_id: 'f-amount',
  },
  start: nodeRef('n-read', 'output', 'amount'),
  kind: 'dataset_field',
  dataset_id: 'ds-1',
  dataset_location: 'main.sales.orders @ db:5432',
  field_name: 'amount',
  description: 'Сумма заказа',
  description_provenance: 'declared',
  description_source: { key: 'ds:ds-1:f-amount', kind: 'ds' },
  targets: [
    {
      scope: 'project',
      node_id: 'n-read',
      port: 'output',
      column: 'amount',
    },
    {
      scope: 'global',
      dataset_id: 'ds-1',
      field_id: 'f-amount',
      field_name: 'amount',
    },
  ],
  node_count: 2,
  occurrences: [
    occurrence('n-read', 'ReadTableFromDBV3', 'amount', 1, 'source'),
    occurrence('n-filter', 'DataFrameFilter', 'amount', 2),
  ],
};

const ebitdaRow: ProjectColumnRow = {
  id: 'node:n-expr:output:ebitda',
  name: 'ebitda',
  origin: nodeRef('n-expr', 'output', 'ebitda'),
  start: nodeRef('n-expr', 'output', 'ebitda'),
  kind: 'node_column',
  origin_node_name: 'DataFrameAddColumnByExpression',
  description: null,
  description_provenance: 'derived',
  targets: [
    {
      scope: 'project',
      node_id: 'n-expr',
      port: 'output',
      column: 'ebitda',
    },
  ],
  depends_on: ['node:n-read:output:amount'],
  node_count: 1,
  occurrences: [
    occurrence(
      'n-expr',
      'DataFrameAddColumnByExpression',
      'ebitda',
      0,
      'compute'
    ),
  ],
};

const response: ProjectColumns = {
  project_id: 'p-1',
  lineage_available: true,
  truncated: false,
  rows: [amountRow, ebitdaRow],
  groups: [],
  unresolved_ports: [
    {
      node_id: 'n-pivot',
      node_name: 'DataFramePivot',
      port: 'output',
      role: 'output',
      status: 'unresolved',
      reason: 'lineage_input_dynamic',
    },
  ],
  orphaned_annotations: [
    {
      node_id: 'n-rename',
      port: 'output',
      column: 'amount_old',
      description: 'Сумма до скидки',
      updated_at: '2026-10-20T10:00:00Z',
    },
  ],
};

/** amount уточнена в ноде фильтра: цепочка делится на два отрезка. */
const withRefinement: ProjectColumns = {
  ...response,
  rows: [
    {
      ...amountRow,
      node_count: 1,
      occurrences: [
        occurrence('n-read', 'ReadTableFromDBV3', 'amount', 1, 'source'),
      ],
    },
    {
      ...amountRow,
      id: 'node:n-filter:output:amount',
      start: nodeRef('n-filter', 'output', 'amount'),
      description: 'Сумма после фильтра',
      description_source: nodeRef('n-filter', 'output', 'amount'),
      is_refinement: true,
      targets: [
        {
          scope: 'project',
          node_id: 'n-filter',
          port: 'output',
          column: 'amount',
        },
      ],
      node_count: 1,
      occurrences: [occurrence('n-filter', 'DataFrameFilter', 'amount', 2)],
    },
    ebitdaRow,
  ],
};

const renderView = () => {
  const store = configureStore({
    reducer: {
      [lineageApi.reducerPath]: lineageApi.reducer,
      [dataCatalogApi.reducerPath]: dataCatalogApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(
        lineageApi.middleware,
        dataCatalogApi.middleware
      ),
  });
  const onOpenNode = vi.fn();

  render(
    <Provider store={store}>
      <ProjectColumnsView projectId='p-1' onOpenNode={onOpenNode} />
    </Provider>
  );

  return { onOpenNode };
};

const toggleRow = (text: string) => {
  const row = screen.getByText(text).closest('[role="button"]');
  if (!row) {
    throw new Error(`Row with "${text}" not found`);
  }
  fireEvent.click(row);
};

const DIALOG_ID = 'entities/lineage/column-description-dialog';

const waitForEditorClosed = () =>
  waitFor(() => expect(screen.queryByTestId(DIALOG_ID)).toBe(null));

describe('ProjectColumnsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getColumnsMock.mockResolvedValue({ data: response });
    patchColumnsMock.mockResolvedValue({ data: { fields: [] } });
    patchDatasetMock.mockResolvedValue({ data: { id: 'ds-1' } });
  });

  it('renders one row per column with source, filters and gaps', async () => {
    renderView();

    const rows = await screen.findAllByTestId(
      'widgets/data-catalog/column-row'
    );
    expect(rows).toHaveLength(2);
    expect(screen.getByText('Сумма заказа')).toBeTruthy();
    // Схема бледным префиксом, имя таблицы отдельно.
    expect(screen.getByText('main.sales.')).toBeTruthy();
    expect(screen.getByText('orders')).toBeTruthy();
    expect(screen.queryByText('db:5432')).toBe(null);
    expect(
      screen.getByTitle('Поле таблицы main.sales.orders.amount · db:5432')
    ).toBeTruthy();
    expect(screen.getByText('Расчёт')).toBeTruthy();
    expect(screen.getByText('из amount')).toBeTruthy();
    expect(screen.getByText('DataFramePivot')).toBeTruthy();
    expect(screen.getByText('amount_old')).toBeTruthy();

    fireEvent.click(
      screen.getByTestId('widgets/data-catalog/columns-filter-empty')
    );
    expect(
      screen.getAllByTestId('widgets/data-catalog/column-row')
    ).toHaveLength(1);
    expect(screen.getByText('Добавить описание')).toBeTruthy();

    fireEvent.click(
      screen.getByTestId('widgets/data-catalog/columns-filter-all')
    );
    fireEvent.change(screen.getByLabelText('Поиск колонок'), {
      target: { value: 'ebitda' },
    });
    expect(
      screen.getAllByTestId('widgets/data-catalog/column-row')
    ).toHaveLength(1);
  });

  it('collapses refinements under the column and opens the chain', async () => {
    getColumnsMock.mockResolvedValue({ data: withRefinement });
    renderView();

    await screen.findAllByTestId('widgets/data-catalog/column-row');
    expect(
      screen.getAllByTestId('widgets/data-catalog/column-row')
    ).toHaveLength(2);
    expect(screen.getByText('1 изменение')).toBeTruthy();

    toggleRow('Сумма заказа');
    expect(
      screen.getAllByTestId('widgets/data-catalog/column-row')
    ).toHaveLength(3);
    expect(screen.getByText('уточнение с ноды 2')).toBeTruthy();
    const chain = screen.getByTestId('widgets/data-catalog/column-nodes');
    expect(chain.textContent).toContain('ReadTableFromDBV3');
    expect(chain.textContent).toContain('Сумма после фильтра');

    fireEvent.click(screen.getByTitle('Изменить уточнение'));
    expect(screen.getByText('Уточнение описания')).toBeTruthy();
    expect(screen.getByText('«Сумма заказа»')).toBeTruthy();
    fireEvent.click(screen.getByText('Убрать уточнение'));

    await waitFor(() => expect(patchColumnsMock).toHaveBeenCalledTimes(1));
    expect(patchColumnsMock.mock.calls[0]).toEqual([
      'n-filter',
      {
        body: {
          port: 'output',
          fields: [{ column: 'amount', description: null }],
        },
      },
      expect.anything(),
    ]);
  });

  it('opens the description dialog only from the description button', async () => {
    renderView();
    await screen.findAllByTestId('widgets/data-catalog/column-row');

    const button = screen.getByLabelText('Изменить описание колонки amount');
    fireEvent.click(button.parentElement!);
    expect(screen.queryByTestId(DIALOG_ID)).toBe(null);
    expect(
      screen.getByTestId('widgets/data-catalog/column-nodes')
    ).toBeTruthy();

    fireEvent.click(button);
    expect(screen.getByTestId(DIALOG_ID)).toBeTruthy();
  });

  it('writes descriptions only to the project node, without a scope switch', async () => {
    renderView();
    await screen.findAllByTestId('widgets/data-catalog/column-row');

    fireEvent.click(screen.getByLabelText('Изменить описание колонки amount'));
    expect(screen.queryByTestId('widgets/data-catalog/scope-global')).toBe(
      null
    );
    const textarea = screen.getByLabelText(
      'Описание колонки amount'
    ) as HTMLTextAreaElement;
    // Описание поля таблицы не правится отсюда — только подсказка в поле.
    expect(textarea.value).toBe('');
    expect(textarea.placeholder).toBe('Сейчас: Сумма заказа');
    expect(
      screen.getByText(
        'Запишется в ноду «ReadTableFromDBV3» и будет наследоваться ниже по цепочке.'
      )
    ).toBeTruthy();
    fireEvent.change(textarea, { target: { value: 'Только здесь' } });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => expect(patchColumnsMock).toHaveBeenCalledTimes(1));
    expect(patchColumnsMock).toHaveBeenCalledWith(
      'n-read',
      {
        body: {
          port: 'output',
          fields: [{ column: 'amount', description: 'Только здесь' }],
        },
      },
      expect.anything()
    );
    expect(patchDatasetMock).not.toHaveBeenCalled();
  });

  it('refines mid-chain, deletes orphans and opens a chain node', async () => {
    const { onOpenNode } = renderView();
    await screen.findAllByTestId('widgets/data-catalog/column-row');

    toggleRow('Сумма заказа');
    const refineButtons = screen.getAllByTestId(
      'widgets/data-catalog/refine-here'
    );
    expect(refineButtons).toHaveLength(1);
    fireEvent.click(refineButtons[0]);

    expect(
      screen.getByText(
        'Запишется в ноду «DataFrameFilter» и будет наследоваться ниже по цепочке.'
      )
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Описание колонки amount'), {
      target: { value: 'После фильтра' },
    });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(patchColumnsMock).toHaveBeenCalledTimes(1));
    expect(patchColumnsMock.mock.calls[0][0]).toBe('n-filter');
    await waitForEditorClosed();

    fireEvent.click(screen.getByText('Удалить'));
    await waitFor(() => expect(patchColumnsMock).toHaveBeenCalledTimes(2));
    expect(patchColumnsMock.mock.calls[1]).toEqual([
      'n-rename',
      {
        body: {
          port: 'output',
          fields: [{ column: 'amount_old', description: null }],
        },
      },
      expect.anything(),
    ]);

    fireEvent.click(screen.getByLabelText('Открыть ноду ReadTableFromDBV3'));
    expect(onOpenNode).toHaveBeenCalledWith('n-read');
  });
});
