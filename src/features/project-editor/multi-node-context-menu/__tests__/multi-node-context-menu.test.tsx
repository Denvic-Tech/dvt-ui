import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { closeMock, dispatchMock, stateRef } = vi.hoisted(() => ({
  closeMock: vi.fn(),
  dispatchMock: vi.fn(),
  stateRef: {
    current: {
      open: true,
      position: { x: 120, y: 240 },
      nodeIDs: ['node-1', 'node-2'],
    },
  },
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => dispatchMock,
  createAppAsyncThunk: vi.fn(),
}));

vi.mock('@/features/node/reset-node-cache', () => ({
  clearNodesCache: vi.fn((payload: { nodeIDs: string[] }) => ({
    type: 'cache/clearNodesCache',
    payload,
  })),
}));

vi.mock('@/entities/project-editor/multi-node-context-menu', () => ({
  useMultiNodeContextMenuActions: () => ({ close: closeMock }),
  useMultiNodeContextMenuState: () => stateRef.current,
}));

import { MultiNodeContextMenu } from '@/features/project-editor/multi-node-context-menu';

describe('features/multi-node-context-menu/ui', () => {
  it('renders custom item factories and executes action', async () => {
    const onDeleteNodes = vi.fn(async () => undefined);
    const onCreateSubgraph = vi.fn(async () => undefined);
    const onSelect = vi.fn(async () => undefined);

    render(
      <MultiNodeContextMenu
        onDeleteNodes={onDeleteNodes}
        onCreateSubgraph={onCreateSubgraph}
        itemFactories={[
          () => ({
            id: 'custom-action',
            label: 'Custom',
            onSelect,
          }),
        ]}
      />
    );

    fireEvent.click(await screen.findByText('Custom'));

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });
});
