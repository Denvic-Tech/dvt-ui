import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Column } from '@/shared/gatewayClient';

import { DataFrameSelectVariablesEditor } from './DataFrameSelectVariablesEditor';
import type { DataFrameSelectVariablesValues } from './editorTypes';

const { getConnectedInputMetadataMock } = vi.hoisted(() => ({
  getConnectedInputMetadataMock: vi.fn(),
}));

vi.mock('@/entities/data/dataframe', async () => {
  const actual = await vi.importActual<
    typeof import('@/entities/data/dataframe')
  >('@/entities/data/dataframe');

  return {
    ...actual,
    ColumnDropdownSelect: ({
      columns,
      value,
      onChange,
      placeholder,
      disabled,
    }: {
      columns: Column[];
      value: string;
      onChange: (value: string) => void;
      placeholder?: string;
      disabled?: boolean;
    }) => (
      <select
        aria-label={placeholder ?? 'column-dropdown'}
        disabled={disabled}
        value={value}
        onChange={event => onChange(event.target.value)}
      >
        <option value=''>{placeholder ?? ''}</option>
        {columns.map(column => (
          <option key={column.name} value={column.name}>
            {column.name}
          </option>
        ))}
      </select>
    ),
  };
});

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    getConnectedInputMetadata: getConnectedInputMetadataMock,
  }),
}));

const columns: Column[] = [
  { name: 'id', dtype: 'INT64', index: true } as unknown as Column,
  { name: 'amount', dtype: 'FLOAT', index: false } as unknown as Column,
];

const renderEditor = (
  initialLocalInputData: DataFrameSelectVariablesValues = {}
) => {
  const Wrapper = () => {
    const [localInputData, setLocalInputData] =
      useState<DataFrameSelectVariablesValues>(initialLocalInputData);

    return (
      <>
        <DataFrameSelectVariablesEditor
          projectID='project-1'
          id='node-1'
          data={{} as any}
          nodeDefinition={{} as any}
          isOpen
          localInputData={localInputData}
          setLocalInputData={setLocalInputData}
          variables={[
            {
              name: 'existing_metric',
              scope: 'user',
              type: 'FLOAT',
              value: 1,
            } as any,
          ]}
        />
        <pre data-testid='local-input-data'>
          {JSON.stringify(localInputData)}
        </pre>
      </>
    );
  };

  return render(<Wrapper />);
};

const getSerializedInputData = (): DataFrameSelectVariablesValues =>
  JSON.parse(screen.getByTestId('local-input-data').textContent ?? '{}');

const selectColumnForRow = async (rowIndex: number, columnName: string) => {
  fireEvent.change(screen.getAllByLabelText('Колонка DataFrame')[rowIndex], {
    target: { value: columnName },
  });
};

describe('DataFrameSelectVariablesEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnectedInputMetadataMock.mockReturnValue({
      columns,
    });
  });

  it('keeps draft rows after selecting a column in a later row', async () => {
    renderEditor();

    const addButton = screen.getByRole('button', {
      name: /Добавить переменную/i,
    });

    fireEvent.click(addButton);
    fireEvent.click(addButton);

    fireEvent.change(screen.getAllByPlaceholderText('Имя переменной')[2], {
      target: { value: 'third_metric' },
    });

    await selectColumnForRow(2, 'amount');

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Имя переменной')).toHaveLength(3);
    });

    expect(screen.getAllByPlaceholderText('Имя переменной')[2]).toHaveValue(
      'third_metric'
    );
    expect(
      getSerializedInputData().selected_variables?.['third_metric']
    ).toMatchObject({
      source_column_name: 'amount',
      agg_func: 'count',
    });
  });

  it('auto-fills variable name and default aggregation after selecting a numeric column', async () => {
    renderEditor();

    await selectColumnForRow(0, 'amount');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Имя переменной')).toHaveValue(
        'amount'
      );
    });

    expect(getSerializedInputData().selected_variables).toMatchObject({
      amount: {
        source_column_name: 'amount',
        agg_func: 'count',
      },
    });
  });
});
