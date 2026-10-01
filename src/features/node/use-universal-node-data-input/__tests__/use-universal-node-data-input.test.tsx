import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NodeDataInput } from '@/features/node/use-universal-node-data-input';

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

vi.mock(
  '@/features/node/use-universal-node-data-input/ui/inputs/ColumnNameNodeInput.tsx',
  () => ({
    default: (props: any) => {
      columnNameInputPropsMock(props);
      return <div data-testid='column-name-input'>ColumnName</div>;
    },
  })
);

vi.mock(
  '@/features/node/use-universal-node-data-input/ui/inputs/ListNodeInput.tsx',
  () => ({
    default: () => <div data-testid='list-input'>List</div>,
  })
);

vi.mock(
  '@/features/node/use-universal-node-data-input/ui/inputs/LiteralNodeInput.tsx',
  () => ({
    default: () => <div data-testid='literal-input'>Literal</div>,
  })
);

vi.mock('@/shared/ui/node-input/PrimitiveNodeInput', () => ({
  default: () => <div data-testid='primitive-input'>Primitive</div>,
}));

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

  it('shows saved Kafka JSON binding and can switch it to a constant', () => {
    const onValueChange = vi.fn();
    render(
      <NodeDataInput
        nodeID='commit'
        inputDefinition={
          { type: 'JSON', attr_name: 'offsets', allow_expressions: true } as any
        }
        currentValue={{
          __dvt_type: 'expr',
          expression_kind: 'single',
          value: 'kafka_offsets',
        }}
        onValueChange={onValueChange}
      />
    );
    expect(
      screen.getByRole('button', { name: /^kafka_offsets$/ })
    ).toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Константа$/ }));
    expect(onValueChange).toHaveBeenCalledWith('{}');
  });

  it('keeps the JSON editor in node settings and hides it on the canvas', () => {
    const onValueChange = vi.fn();
    const props = {
      nodeID: 'read-kafka',
      inputDefinition: {
        type: 'JSON',
        attr_name: 'start_offsets',
        allow_expressions: true,
      } as any,
      currentValue: {
        __dvt_type: 'expr',
        expression_kind: 'single',
        value: 'kafka_offsets',
      },
      onValueChange,
    };
    const { container, rerender } = render(
      <NodeDataInput {...props} renderMode='canvas' />
    );

    expect(container).toBeEmptyDOMElement();
    expect(onValueChange).not.toHaveBeenCalled();

    rerender(<NodeDataInput {...props} renderMode='editor' />);

    expect(
      screen.getByRole('button', { name: /^kafka_offsets$/ })
    ).toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
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
