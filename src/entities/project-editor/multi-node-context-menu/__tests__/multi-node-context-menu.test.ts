import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { dispatchMock, selectorState } = vi.hoisted(() => ({
  dispatchMock: vi.fn(),
  selectorState: {
    open: false,
    position: null,
    nodeIDs: [],
  },
}));

vi.mock('@/app/providers/store', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (state: any) => unknown) =>
    selector({ multiNodeContextMenu: selectorState }),
}));

import {
  multiNodeContextMenuActions,
  multiNodeContextMenuReducer,
  selectMultiNodeContextMenuState,
  useMultiNodeContextMenuActions,
  useMultiNodeContextMenuState,
} from '@/entities/project-editor/multi-node-context-menu';

describe('entities/multi-node-context-menu', () => {
  it('opens and closes menu state', () => {
    const opened = multiNodeContextMenuReducer(
      undefined,
      multiNodeContextMenuActions.open({
        position: { x: 100, y: 200 },
        nodeIDs: ['node-1', 'node-2', 'node-1'],
      })
    );

    expect(opened.open).toBe(true);
    expect(opened.position).toEqual({ x: 100, y: 200 });
    expect(opened.nodeIDs).toEqual(['node-1', 'node-2']);

    const closed = multiNodeContextMenuReducer(
      opened,
      multiNodeContextMenuActions.close()
    );

    expect(closed.open).toBe(false);
    expect(closed.position).toBeNull();
    expect(closed.nodeIDs).toEqual([]);
  });

  it('returns state with selector', () => {
    const state = { multiNodeContextMenu: selectorState } as any;
    expect(selectMultiNodeContextMenuState(state)).toBe(selectorState);
  });

  it('dispatches open and close from hooks', () => {
    const { result: stateResult } = renderHook(() =>
      useMultiNodeContextMenuState()
    );
    expect(stateResult.current).toBe(selectorState);

    const { result } = renderHook(() => useMultiNodeContextMenuActions());

    const payload = {
      position: { x: 10, y: 20 },
      nodeIDs: ['n-1', 'n-2'],
    };

    act(() => {
      result.current.open(payload);
    });

    act(() => {
      result.current.close();
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      multiNodeContextMenuActions.open(payload)
    );
    expect(dispatchMock).toHaveBeenCalledWith(
      multiNodeContextMenuActions.close()
    );
  });
});
