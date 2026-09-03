import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Column, DataFrameMetadata } from '@/shared/gatewayClient';

import { DataFramePivotEditor } from './DataFramePivotEditor';

const getConnectedInputMetadataMock = vi.fn();

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    getConnectedInputMetadata: getConnectedInputMetadataMock,
  }),
}));

const columns: Column[] = [
  { name: 'region', dtype: 'STRING', index: false } as Column,
  { name: 'pivot_key', dtype: 'STRING', index: false } as Column,
  { name: 'sales', dtype: 'FLOAT', index: false } as Column,
];

const metadata: DataFrameMetadata = {
  columns,
  index_names: ['partition_key'],
} as DataFrameMetadata;

const defaultNodeDefinition = {
  input_definitions: {
    aggfunc: {
      schema: {
        additionalProperties: {
          enum: ['first'],
        },
      },
    },
  },
};

type PivotEditorState = {
  index?: string;
  column?: string;
  aggfunc?: Record<string, string> | null;
};

const openAutocomplete = (index: number) => {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
};

const renderEditor = ({
  initialLocalInputData = {},
  nodeDefinition = defaultNodeDefinition,
  metadataValue = metadata,
}: {
  initialLocalInputData?: PivotEditorState;
  nodeDefinition?: Record<string, unknown>;
  metadataValue?: DataFrameMetadata;
} = {}) => {
  getConnectedInputMetadataMock.mockReturnValue(metadataValue);

  const Wrapper = () => {
    const [localInputData, setLocalInputData] = useState<PivotEditorState>(
      initialLocalInputData
    );

    return (
      <DataFramePivotEditor
        projectID='project-1'
        id='node-1'
        data={{} as any}
        nodeDefinition={nodeDefinition as any}
        isOpen
        localInputData={localInputData}
        setLocalInputData={setLocalInputData}
        variables={[]}
      />
    );
  };

  return render(<Wrapper />);
};

describe('DataFramePivotEditor', () => {
  it('shows dtype for dataframe columns and keeps synthetic index names without type badge', async () => {
    renderEditor();

    openAutocomplete(0);

    const regionOption = await screen.findByText('region');
    const regionRow = regionOption.closest('li');
    expect(regionRow).toHaveTextContent('STRING');

    const partitionKeyOption = screen.getByText('partition_key');
    const partitionKeyRow = partitionKeyOption.closest('li');
    expect(partitionKeyRow).toHaveTextContent('Index');
    expect(partitionKeyRow).not.toHaveTextContent(
      /STRING|FLOAT|INT|DATE|TIME/i
    );
  });

  it('removes the selected index from the pivot column options', async () => {
    renderEditor();

    openAutocomplete(0);
    fireEvent.click(await screen.findByRole('option', { name: /region/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('combobox')[0]).toHaveValue('region');
    });

    openAutocomplete(1);

    await waitFor(() => {
      expect(
        screen.queryByRole('option', { name: /region/i })
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('option', { name: /partition_key/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /pivot_key/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /sales/i })).toBeInTheDocument();
  });

  it('shows backend-supported aggregation functions even when schema only exposes first', async () => {
    renderEditor({
      initialLocalInputData: {
        index: 'region',
        column: 'pivot_key',
        aggfunc: {
          sales: 'first',
        },
      },
    });

    const comboboxes = screen.getAllByRole('combobox');
    const aggFuncSelect = comboboxes[comboboxes.length - 1];
    if (!aggFuncSelect) {
      throw new Error('Aggregation select not found');
    }

    fireEvent.mouseDown(aggFuncSelect);

    expect(
      await screen.findByRole('option', { name: /^mean$/i })
    ).toBeVisible();
    expect(screen.getByRole('option', { name: /^sum$/i })).toBeVisible();
    expect(screen.getByRole('option', { name: /^count$/i })).toBeVisible();
    expect(screen.getByRole('option', { name: /^last$/i })).toBeVisible();
    expect(
      screen.getByRole('option', { name: /first \(по умолчанию\)/i })
    ).toBeVisible();
  });
});
