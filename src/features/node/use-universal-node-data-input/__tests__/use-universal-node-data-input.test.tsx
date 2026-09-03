import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  isPrimitiveTypeMock,
  getConnectedInputMetadataMock,
  connectedMetadataByInputNameRef,
  columnNameInputPropsMock,
} = vi.hoisted(() => ({
  isPrimitiveTypeMock: vi.fn((type: unknown) => type === 'STRING'),
  getConnectedInputMetadataMock: vi.fn(() => ({ columns: [{ name: 'id' }] })),
  connectedMetadataByInputNameRef: {
    current: {
      df: { type: 'DATAFRAME', columns: [{ name: 'id' }] },
    } as Record<string, any> | null,
  },
  columnNameInputPropsMock: vi.fn(),
}));

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    getConnectedInputMetadata: getConnectedInputMetadataMock,
    connectedMetadataByInputName: connectedMetadataByInputNameRef.current,
  }),
}));

vi.mock('@/entities/node/node-io', () => ({
  isPrimitiveIOType: isPrimitiveTypeMock,
}));

vi.mock('@/features/node/use-universal-node-data-input/ui/inputs/ColumnNameNodeInput.tsx', () => ({
  default: (props: any) => {
    columnNameInputPropsMock(props);
    return <div data-testid='column-name-input'>ColumnName</div>;
  },
}));

vi.mock('@/features/node/use-universal-node-data-input/ui/inputs/ListNodeInput.tsx', () => ({
  default: () => <div data-testid='list-input'>List</div>,
}));

vi.mock('@/features/node/use-universal-node-data-input/ui/inputs/LiteralNodeInput.tsx', () => ({
  default: () => <div data-testid='literal-input'>Literal</div>,
}));

vi.mock('@/shared/ui/node-input/PrimitiveNodeInput', () => ({
  default: () => <div data-testid='primitive-input'>Primitive</div>,
}));

import { NodeDataInput } from '@/features/node/use-universal-node-data-input';

describe('features/use-universal-node-data-input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getConnectedInputMetadataMock.mockReturnValue({
      type: 'DATAFRAME',
      columns: [{ name: 'id' }],
    } as any);
    connectedMetadataByInputNameRef.current = {
      df: { type: 'DATAFRAME', columns: [{ name: 'id' }] },
    };
  });

  it('renders column-name input for COLUMN_NAME type', () => {
    render(
      <NodeDataInput
        nodeID='node-1'
        inputDefinition={
          {
            type: 'COLUMN_NAME',
            name: 'column',
            metadata_source_field: 'df',
          } as any
        }
        currentValue='id'
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByTestId('column-name-input')).toBeInTheDocument();
  });

  it('falls back to connected dataframe metadata when metadata_source_field is missing or mismatched', () => {
    getConnectedInputMetadataMock.mockReturnValue(null as any);
    connectedMetadataByInputNameRef.current = {
      input_df: {
        type: 'DATAFRAME',
        columns: [{ name: 'amount' }],
      },
    };

    render(
      <NodeDataInput
        nodeID='node-1'
        inputDefinition={
          {
            type: 'COLUMN_NAME',
            name: 'column_name',
            attr_name: 'column_name',
          } as any
        }
        currentValue='amount'
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByTestId('column-name-input')).toBeInTheDocument();
    expect(columnNameInputPropsMock).toHaveBeenCalled();

    const lastCallArgs =
      columnNameInputPropsMock.mock.calls[
        columnNameInputPropsMock.mock.calls.length - 1
      ]?.[0];
    expect(lastCallArgs.columns).toEqual([{ name: 'amount' }]);
    expect(lastCallArgs.hasMetadata).toBe(true);
  });

  it('renders primitive input for primitive IO type', () => {
    render(
      <NodeDataInput
        nodeID='node-1'
        inputDefinition={
          {
            type: 'STRING',
            name: 'title',
          } as any
        }
        currentValue='abc'
        onValueChange={() => undefined}
      />
    );

    expect(screen.getByTestId('primitive-input')).toBeInTheDocument();
  });
});
