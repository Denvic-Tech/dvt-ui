import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CustomNode } from '@/widgets/project-editor/custom-node';

const {
  flowStateRef,
  headerDescriptionExtensionsRef,
  modalExtensionsRef,
  modalStepperExtensionsRef,
  nodeDataRef,
  nodeDefinitionRef,
  connectedInputsRef,
  connectedOutputsRef,
  updateDisplayNameRef,
  nodeExecutionStatusRef,
  nodeExecutionErrorMessageRef,
} = vi.hoisted(() => ({
  flowStateRef: {
    current: {
      transform: [0, 0, 0.4],
      connection: {
        inProgress: false,
        fromHandle: null,
        to: null,
        toHandle: null,
        toNode: null,
        isValid: false,
      },
      domNode: null,
    },
  },
  headerDescriptionExtensionsRef: {
    current: [] as Array<any>,
  },
  modalExtensionsRef: {
    current: [] as Array<any>,
  },
  modalStepperExtensionsRef: {
    current: [] as Array<any>,
  },
  nodeDataRef: {
    current: {
      name: 'test-node',
      displayName: 'Test node',
      inputValues: {},
      showVariablesIo: false,
      showSignalIo: false,
    },
  },
  nodeDefinitionRef: {
    current: {
      name: 'test-node',
      display_name: 'Test node',
      description: 'Static description',
      input_definitions: {
        input_a: {
          attr_name: 'input_a',
          type: 'DATAFRAME',
          force_handle_visible: true,
          is_hidden: false,
        },
        input_variables: {
          attr_name: 'input_variables',
          type: 'VARIABLE',
          is_hidden: false,
        },
      },
      output_definitions: {
        output_a: {
          attr_name: 'output_a',
          type: 'DATAFRAME',
        },
      },
    },
  },
  connectedInputsRef: {
    current: {
      input_variables: ['source-node'],
    } as Record<string, string[]>,
  },
  connectedOutputsRef: {
    current: {
      output_a: ['target-node'],
    },
  },
  updateDisplayNameRef: {
    current: vi.fn(),
  },
  nodeExecutionStatusRef: {
    current: 'idle',
  },
  nodeExecutionErrorMessageRef: {
    current: '',
  },
}));

vi.mock('@xyflow/react', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const MockHandle = React.forwardRef<HTMLDivElement, { id: string }>(
    ({ id }, ref) =>
      React.createElement('div', { ref, 'data-testid': `handle-${id}` })
  );
  MockHandle.displayName = 'MockHandle';

  return {
    Handle: MockHandle,
    Position: {
      Left: 'left',
      Right: 'right',
    },
    useStore: (selector: (state: unknown) => unknown) =>
      selector(flowStateRef.current),
    useUpdateNodeInternals: () => vi.fn(),
  };
});

vi.mock('@/features/project-editor/graph-node-search', () => ({
  useGraphNodeSearchNodeState: () => ({
    searchMatch: false,
    searchActive: false,
    matchesDisplayName: false,
    matchesNodeID: false,
  }),
}));

vi.mock('@/app/providers/node-extensions', () => ({
  useNodeContentExtensions: () => [],
  useNodeHeaderDescriptionExtensions: () =>
    headerDescriptionExtensionsRef.current,
  useNodeInputDefinitionExtensions: () => new Map(),
  useNodeModalExtensions: () => modalExtensionsRef.current,
  useNodeModalStepperExtensions: () => modalStepperExtensionsRef.current,
  useNodeVariableGroups: () => ({
    inputVariables: [],
    projectVariables: [],
    variables: [],
  }),
}));

vi.mock('@/entities/node/node-execution-status', () => ({
  useNodeExecutionErrorMessage: () => nodeExecutionErrorMessageRef.current,
  useNodeExecutionStatus: () => nodeExecutionStatusRef.current,
}));

vi.mock('@/features/node/get-node-definition', () => ({
  useNodeDefinition: () => nodeDefinitionRef.current,
}));

vi.mock('@/features/node/manage-node-data', () => ({
  useNodeData: () => ({
    nodeData: nodeDataRef.current,
    updateDisplayName: updateDisplayNameRef.current,
    updateInputValue: vi.fn(),
  }),
}));

vi.mock('@/features/node/get-node-connections', () => ({
  useNodeConnections: () => ({
    connectedInputs: connectedInputsRef.current,
    connectedOutputs: connectedOutputsRef.current,
  }),
}));

vi.mock('@/features/node/get-node-metadata', () => ({
  useConnectedNodeMetadata: () => ({
    connectedNodeMetadataByInput: {},
    connectedNodeMetadataActualityByInput: {},
  }),
}));

vi.mock('@/entities/project-editor/node-context-menu', () => ({
  useNodeContextMenuActions: () => ({
    open: vi.fn(),
  }),
}));

vi.mock('@/features/node/use-universal-node-data-input', () => {
  const MockNodeDataInput = () => null;
  MockNodeDataInput.displayName = 'MockNodeDataInput';

  return {
    NodeDataInput: MockNodeDataInput,
  };
});

vi.mock('@/widgets/project-editor/custom-node/ui/toolbar.tsx', () => {
  const MockCustomNodeToolbar = ({
    settingsEnabled,
  }: {
    settingsEnabled: boolean;
  }) => <div data-testid='settings-enabled'>{String(settingsEnabled)}</div>;
  MockCustomNodeToolbar.displayName = 'MockCustomNodeToolbar';

  return {
    CustomNodeToolbar: MockCustomNodeToolbar,
  };
});

describe('widgets/project-editor/custom-node/CustomNode', () => {
  it('opens handle context menus from compact inputs and outputs', () => {
    headerDescriptionExtensionsRef.current = [];
    updateDisplayNameRef.current.mockClear();
    nodeExecutionStatusRef.current = 'idle';
    nodeExecutionErrorMessageRef.current = '';

    const onInputContextMenu = vi.fn();
    const onOutputContextMenu = vi.fn();
    const props = {
      id: 'node-1',
      selected: false,
      data: nodeDataRef.current,
      onInputContextMenu,
      onOutputContextMenu,
    } as any;

    render(<CustomNode {...props} />);

    fireEvent.contextMenu(screen.getByTestId('handle-input-input_a'));
    fireEvent.contextMenu(screen.getByTestId('handle-input-input_variables'));
    fireEvent.contextMenu(screen.getByTestId('handle-output-output_a'));

    expect(onInputContextMenu).toHaveBeenCalledWith(
      expect.anything(),
      'node-1',
      'input-input_a',
      'DATAFRAME'
    );
    expect(onInputContextMenu).toHaveBeenCalledWith(
      expect.anything(),
      'node-1',
      'input-input_variables',
      'VARIABLE'
    );
    expect(onOutputContextMenu).toHaveBeenCalledWith(
      expect.anything(),
      'node-1',
      'output-output_a',
      'DATAFRAME'
    );
  });

  it('saves edited display name on enter', () => {
    headerDescriptionExtensionsRef.current = [];
    updateDisplayNameRef.current.mockClear();
    nodeExecutionStatusRef.current = 'idle';
    nodeExecutionErrorMessageRef.current = '';
    flowStateRef.current.transform = [0, 0, 1];

    const props = {
      id: 'node-1',
      selected: false,
      data: nodeDataRef.current,
      onInputContextMenu: vi.fn(),
      onOutputContextMenu: vi.fn(),
    } as any;

    render(<CustomNode {...props} />);

    fireEvent.doubleClick(screen.getByText('Test node'));

    const input = screen.getByDisplayValue('Test node');
    fireEvent.change(input, { target: { value: 'Renamed node' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(updateDisplayNameRef.current).toHaveBeenCalledWith('Renamed node');

    flowStateRef.current.transform = [0, 0, 0.4];
  });

  it('renders node execution error tooltip inside the node wrapper', () => {
    headerDescriptionExtensionsRef.current = [];
    nodeExecutionStatusRef.current = 'error';
    nodeExecutionErrorMessageRef.current = '400: 401 Client Error';

    const props = {
      id: 'node-1',
      selected: false,
      data: nodeDataRef.current,
      onInputContextMenu: vi.fn(),
      onOutputContextMenu: vi.fn(),
    } as any;

    const { container } = render(<CustomNode {...props} />);

    const inlineTooltip = container.querySelector(
      '[data-testid="node-error-tooltip"]'
    );

    expect(inlineTooltip).not.toBeNull();
    expect(inlineTooltip).toHaveTextContent('400: 401 Client Error');
    expect(inlineTooltip).toHaveStyle({
      '--dvt-node-error-tooltip-scale': '2.5',
    });

    nodeExecutionStatusRef.current = 'idle';
    nodeExecutionErrorMessageRef.current = '';
  });

  it('renders dynamic header description from extensions before static fallback', () => {
    flowStateRef.current.transform = [0, 0, 1];
    headerDescriptionExtensionsRef.current = [
      {
        id: 'dynamic-description',
        name: 'Dynamic description',
        type: 'modal',
        condition: () => true,
        component: () => null,
        getHeaderDescription: () => 'Dynamic description',
      },
    ];

    const props = {
      id: 'node-1',
      selected: false,
      data: nodeDataRef.current,
      onInputContextMenu: vi.fn(),
      onOutputContextMenu: vi.fn(),
    } as any;

    render(<CustomNode {...props} />);

    expect(screen.getByText('Dynamic description')).toBeInTheDocument();
    expect(screen.queryByText('Static description')).not.toBeInTheDocument();

    headerDescriptionExtensionsRef.current = [];
    flowStateRef.current.transform = [0, 0, 0.4];
  });

  it('hides static description when extension explicitly returns null', () => {
    flowStateRef.current.transform = [0, 0, 1];
    headerDescriptionExtensionsRef.current = [
      {
        id: 'hidden-description',
        name: 'Hidden description',
        type: 'modal',
        condition: () => true,
        component: () => null,
        getHeaderDescription: () => null,
      },
    ];

    const props = {
      id: 'node-1',
      selected: false,
      data: nodeDataRef.current,
      onInputContextMenu: vi.fn(),
      onOutputContextMenu: vi.fn(),
    } as any;

    render(<CustomNode {...props} />);

    expect(screen.queryByText('Static description')).not.toBeInTheDocument();

    headerDescriptionExtensionsRef.current = [];
    flowStateRef.current.transform = [0, 0, 0.4];
  });

  it('allows an opted-in modal to open before connected metadata is ready', () => {
    flowStateRef.current.transform = [0, 0, 1];
    connectedInputsRef.current = { input_a: ['source-node'] };
    modalExtensionsRef.current = [
      {
        allowOpenWithoutConnectedMetadata: true,
      },
    ];

    const props = {
      id: 'node-1',
      selected: false,
      data: nodeDataRef.current,
      onInputContextMenu: vi.fn(),
      onOutputContextMenu: vi.fn(),
    } as any;

    render(<CustomNode {...props} />);

    expect(screen.getByTestId('settings-enabled')).toHaveTextContent('true');

    modalExtensionsRef.current = [];
    connectedInputsRef.current = { input_variables: ['source-node'] };
    flowStateRef.current.transform = [0, 0, 0.4];
  });
});
