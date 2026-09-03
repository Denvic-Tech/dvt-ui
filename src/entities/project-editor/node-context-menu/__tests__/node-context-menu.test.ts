import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { dispatchMock, selectorState } = vi.hoisted(() => ({
  dispatchMock: vi.fn(),
  selectorState: {
    open: false,
    position: null,
    nodeID: null,
    nodeDefinition: null,
    nodeData: null,
  },
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (state: any) => unknown) =>
    selector({ nodeContextMenu: selectorState }),
}));

import {
  nodeContextMenuActions,
  nodeContextMenuReducer,
  selectNodeContextMenuState,
  useNodeContextMenuActions,
  useNodeContextMenuState,
} from '@/entities/project-editor/node-context-menu';

describe('entities/node-context-menu', () => {
  it('opens and closes context menu via reducer', () => {
    const openPayload = {
      position: { x: 10, y: 20 },
      nodeID: 'node-1',
      nodeDefinition: { name: 'reader' },
      nodeData: { name: 'reader', displayName: 'Reader', inputValues: {} },
    } as any;

    const opened = nodeContextMenuReducer(
      undefined,
      nodeContextMenuActions.open(openPayload)
    );
    expect(opened.open).toBe(true);
    expect(opened.nodeID).toBe('node-1');

    const closed = nodeContextMenuReducer(
      opened,
      nodeContextMenuActions.close()
    );
    expect(closed.open).toBe(false);
    expect(closed.nodeID).toBeNull();
  });

  it('returns state with selector', () => {
    const state = { nodeContextMenu: selectorState } as any;
    expect(selectNodeContextMenuState(state)).toBe(selectorState);
  });

  it('dispatches actions from hooks', () => {
    const { result: stateResult } = renderHook(() => useNodeContextMenuState());
    expect(stateResult.current).toBe(selectorState);

    const { result } = renderHook(() => useNodeContextMenuActions());
    const payload = {
      position: { x: 1, y: 2 },
      nodeID: 'node-2',
      nodeDefinition: { name: 'writer' },
      nodeData: { name: 'writer', displayName: 'Writer', inputValues: {} },
    } as any;

    act(() => {
      result.current.open(payload);
    });

    act(() => {
      result.current.close();
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      nodeContextMenuActions.open(payload)
    );
    expect(dispatchMock).toHaveBeenCalledWith(nodeContextMenuActions.close());
  });
});
