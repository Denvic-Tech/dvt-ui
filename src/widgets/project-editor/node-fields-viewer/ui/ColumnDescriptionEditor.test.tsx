import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lineageApi, type NodeField } from '@/entities/data/lineage';

import { ColumnDescriptionEditor } from './ColumnDescriptionEditor';

const { patchColumnsMock } = vi.hoisted(() => ({
  patchColumnsMock: vi.fn(),
}));

vi.mock('@/shared/gatewayClient', () => ({
  client: {
    projects: {
      projectId: () => ({
        lineage: {
          nodes: {
            nodeId: () => ({ columns: { patch: patchColumnsMock } }),
          },
        },
      }),
    },
  },
}));

vi.mock('../lib/useLineageRefLabel', () => ({
  useLineageRefLabel: () => null,
}));

vi.mock('@/app/providers/store', () => ({
  useAppSelector: () => ({ name: 'DataFrameFilter', displayName: 'Фильтр' }),
}));

vi.mock('@/entities/project-editor/graph', () => ({
  selectNodeDataMap: () => ({}),
}));

const DIALOG_ID = 'entities/lineage/column-description-dialog';

const baseField: NodeField = {
  name: 'amount',
  ref: { key: 'node:n-1:out:amount', kind: 'node' },
  origin: { key: 'ds:orders:amount', kind: 'ds' },
  op: 'pass',
  description: 'Сумма из источника',
  description_provenance: 'inherited',
};

const renderEditor = (field: NodeField = baseField) => {
  const store = configureStore({
    reducer: { [lineageApi.reducerPath]: lineageApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(lineageApi.middleware),
  });

  return render(
    <Provider store={store}>
      <ColumnDescriptionEditor
        projectId='p-1'
        nodeId='n-1'
        port='out'
        field={field}
        columnType='Int64'
      />
    </Provider>
  );
};

describe('ColumnDescriptionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patchColumnsMock.mockResolvedValue({
      data: {
        project_id: 'p-1',
        node_id: 'n-1',
        node_name: 'Filter',
        port: 'out',
        role: 'output',
        status: 'resolved',
        fields: [],
      },
    });
  });

  it('saves a new description with Ctrl+Enter', async () => {
    renderEditor();

    expect(screen.getByText('Сумма из источника')).toBeTruthy();
    fireEvent.click(
      screen.getByTestId('widgets/node-fields-viewer/edit-description')
    );

    const textarea = screen.getByLabelText('Описание колонки amount');
    expect(screen.getByText('Int64')).toBeTruthy();
    expect(
      screen.getByText(
        'Запишется в ноду «Фильтр» и будет наследоваться ниже по цепочке.'
      )
    ).toBeTruthy();
    // Унаследованное описание не подставляется в поле — только подсказкой.
    expect((textarea as HTMLTextAreaElement).value).toBe('');
    fireEvent.change(textarea, { target: { value: '  Сумма заказа  ' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() =>
      expect(patchColumnsMock).toHaveBeenCalledWith(
        {
          body: {
            port: 'out',
            fields: [{ column: 'amount', description: 'Сумма заказа' }],
          },
        },
        expect.anything()
      )
    );
    await waitFor(() => expect(screen.queryByTestId(DIALOG_ID)).toBeNull());
  });

  it('resets a declared description to null', async () => {
    renderEditor({
      ...baseField,
      description: 'Своё описание',
      description_provenance: 'declared',
    });

    fireEvent.click(
      screen.getByTestId('widgets/node-fields-viewer/edit-description')
    );
    expect(
      (screen.getByLabelText('Описание колонки amount') as HTMLTextAreaElement)
        .value
    ).toBe('Своё описание');

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() =>
      expect(patchColumnsMock).toHaveBeenCalledWith(
        {
          body: {
            port: 'out',
            fields: [{ column: 'amount', description: null }],
          },
        },
        expect.anything()
      )
    );
  });

  it('cancels editing with Escape without saving', async () => {
    renderEditor();

    fireEvent.click(
      screen.getByTestId('widgets/node-fields-viewer/edit-description')
    );
    fireEvent.keyDown(screen.getByLabelText('Описание колонки amount'), {
      key: 'Escape',
    });

    await waitFor(() => expect(screen.queryByTestId(DIALOG_ID)).toBeNull());
    expect(patchColumnsMock).not.toHaveBeenCalled();
  });
});
