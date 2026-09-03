import { describe, expect, it, vi } from 'vitest';

const { clearNodesCacheMock } = vi.hoisted(() => ({
  clearNodesCacheMock: vi.fn((payload: { nodeIDs: string[] }) => ({
    type: 'cache/clearNodesCache',
    payload,
  })),
}));

vi.mock('@/features/node/reset-node-cache', () => ({
  clearNodesCache: clearNodesCacheMock,
}));

import { buildMultiNodeMenuItems } from '@/features/project-editor/multi-node-context-menu/model/items.tsx';

describe('features/multi-node-context-menu/model/items', () => {
  it('builds default menu items', () => {
    const context = {
      nodeIDs: ['node-1', 'node-2'],
      dispatch: vi.fn(),
      closeMenu: vi.fn(),
      onDeleteNodes: vi.fn(async () => undefined),
      onCreateSubgraph: vi.fn(async () => undefined),
    } as any;

    const items = buildMultiNodeMenuItems(context);

    expect(items.map(item => item.id)).toEqual([
      'create-subgraph',
      'delete-selected-nodes',
      'clear-selected-nodes-cache',
    ]);
  });

  it('runs delete action with selected ids', async () => {
    const onDeleteNodes = vi.fn(async () => undefined);
    const context = {
      nodeIDs: ['node-a', 'node-b'],
      dispatch: vi.fn(),
      closeMenu: vi.fn(),
      onDeleteNodes,
      onCreateSubgraph: vi.fn(async () => undefined),
    } as any;

    const deleteItem = buildMultiNodeMenuItems(context).find(
      item => item.id === 'delete-selected-nodes'
    );
    expect(deleteItem).toBeDefined();
    if (!deleteItem) {
      return;
    }

    await deleteItem.onSelect(context);

    expect(onDeleteNodes).toHaveBeenCalledWith(['node-a', 'node-b']);
  });

  it('runs clear cache action via thunk dispatch', async () => {
    const unwrap = vi.fn(async () => undefined);
    const dispatch = vi.fn(() => ({ unwrap }));
    const context = {
      nodeIDs: ['node-a', 'node-b'],
      dispatch,
      closeMenu: vi.fn(),
      onDeleteNodes: vi.fn(async () => undefined),
      onCreateSubgraph: vi.fn(async () => undefined),
    } as any;

    const clearCacheItem = buildMultiNodeMenuItems(context).find(
      item => item.id === 'clear-selected-nodes-cache'
    );
    expect(clearCacheItem).toBeDefined();
    if (!clearCacheItem) {
      return;
    }

    await clearCacheItem.onSelect(context);

    expect(clearNodesCacheMock).toHaveBeenCalledWith({
      nodeIDs: ['node-a', 'node-b'],
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'cache/clearNodesCache',
      payload: { nodeIDs: ['node-a', 'node-b'] },
    });
    expect(unwrap).toHaveBeenCalledTimes(1);
  });
});
