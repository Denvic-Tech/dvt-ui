import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NodeContextMenu } from '@/features/project-editor/node-context-menu';

const {
  stateRef,
  itemsRef,
  closeMenuMock,
  actionSelectMock,
  toggleChangeMock,
  dispatchMock,
  nodeDataRef,
  variablesRef,
  menuContextRef,
} = vi.hoisted(() => ({
  stateRef: {
    current: {
      open: false,
      position: null,
      nodeID: null,
      nodeDefinition: null,
      nodeData: null,
    },
  },
  itemsRef: {
    current: [] as any[],
  },
  closeMenuMock: vi.fn(),
  actionSelectMock: vi.fn(async () => undefined),
  toggleChangeMock: vi.fn(async () => undefined),
  dispatchMock: vi.fn(),
  nodeDataRef: {
    current: {
      name: 'reader',
      displayName: 'Reader',
      inputValues: {},
    },
  },
  variablesRef: {
    current: [],
  },
  menuContextRef: {
    current: null as any,
  },
}));

vi.mock('@/entities/project-editor/node-context-menu', () => ({
  useNodeContextMenuState: () => stateRef.current,
  useNodeContextMenuActions: () => ({ close: closeMenuMock }),
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => dispatchMock,
  createAppAsyncThunk: vi.fn(),
}));

vi.mock('@/app/providers/node-extensions', () => ({
  useNodeContextMenuItems: (_nodeDefinition: unknown, context: unknown) => {
    menuContextRef.current = context;
    return itemsRef.current;
  },
  useNodeVariables: () => variablesRef.current,
}));

vi.mock('@/features/node/manage-node-data', () => ({
  useNodeData: () => ({ nodeData: nodeDataRef.current }),
}));

describe('features/node-context-menu', () => {
  beforeEach(() => {
    closeMenuMock.mockReset();
    actionSelectMock.mockClear();
    toggleChangeMock.mockClear();
    stateRef.current = {
      open: false,
      position: null,
      nodeID: null,
      nodeDefinition: null,
      nodeData: null,
    };
    itemsRef.current = [];
    menuContextRef.current = null;
  });

  it('does not render when menu is closed', () => {
    render(<NodeContextMenu />);

    expect(screen.queryByText('Run')).not.toBeInTheDocument();
  });

  it('renders actions and handles click', async () => {
    stateRef.current = {
      open: true,
      position: { x: 120, y: 140 },
      nodeID: 'node-1',
      nodeDefinition: { name: 'reader' },
      nodeData: {
        name: 'reader',
        displayName: 'Reader',
        inputValues: {},
      },
    } as any;

    itemsRef.current = [
      {
        id: 'run-action',
        type: 'action',
        label: 'Run',
        onSelect: actionSelectMock,
      },
    ];

    render(<NodeContextMenu />);

    fireEvent.click(screen.getByText('Run'));

    expect(actionSelectMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(closeMenuMock).toHaveBeenCalledTimes(1);
    });
  });

  it('renders toggle items and keeps menu open by default', async () => {
    stateRef.current = {
      open: true,
      position: { x: 120, y: 140 },
      nodeID: 'node-1',
      nodeDefinition: { name: 'reader' },
      nodeData: {
        name: 'reader',
        displayName: 'Reader',
        inputValues: {},
        showVariablesIo: false,
      },
    } as any;

    itemsRef.current = [
      {
        id: 'toggle-variables-io',
        type: 'toggle',
        label: 'Show variable ports',
        checked: false,
        onToggle: toggleChangeMock,
      },
    ];

    render(<NodeContextMenu />);

    fireEvent.click(screen.getByText('Show variable ports'));

    await waitFor(() => {
      expect(toggleChangeMock).toHaveBeenCalledTimes(1);
    });
    const nextChecked = (toggleChangeMock.mock.calls as unknown[][])[0]?.[1];
    expect(nextChecked).toBe(true);
    expect(closeMenuMock).not.toHaveBeenCalled();
  });

  it('passes duplicate runtime into menu context', () => {
    const duplicateNodeMock = vi.fn(async () => undefined);

    stateRef.current = {
      open: true,
      position: { x: 120, y: 140 },
      nodeID: 'node-1',
      nodeDefinition: { name: 'reader' },
      nodeData: {
        name: 'reader',
        displayName: 'Reader',
        inputValues: {},
      },
    } as any;

    itemsRef.current = [
      {
        id: 'noop',
        type: 'action',
        label: 'Noop',
        onSelect: vi.fn(),
      },
    ];

    render(<NodeContextMenu duplicateNode={duplicateNodeMock} />);

    expect(menuContextRef.current?.duplicateNode).toBe(duplicateNodeMock);
  });
});
