import { act, renderHook } from '@testing-library/react';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dispatchMock } = vi.hoisted(() => ({
  dispatchMock: vi.fn(),
}));

vi.mock('@/app/providers/store', () => ({
  createAppAsyncThunk: (
    typePrefix: string,
    payloadCreator: (...args: any[]) => unknown,
    options?: Record<string, unknown>
  ) => createAsyncThunk(typePrefix, payloadCreator as any, options as any),
  useAppDispatch: () => dispatchMock,
  useAppSelector: vi.fn(),
}));

import {
  useGraphChanges,
  useGraphCreates,
  useGraphDeletes,
} from '@/features/project-editor/manage-graph';

describe('features/manage-graph', () => {
  beforeEach(() => {
    dispatchMock.mockReset();
  });

  it('splits node changes into position updates and other changes', async () => {
    const onGraphNodesChanges = vi.fn();
    const onGraphEdgesChanges = vi.fn();

    const { result } = renderHook(() =>
      useGraphChanges({
        onGraphNodesChanges,
        onGraphEdgesChanges,
      })
    );

    await act(async () => {
      await result.current.onGraphNodesChanges([
        {
          type: 'position',
          id: 'n-1',
          dragging: false,
          position: { x: 20, y: 30 },
        },
        {
          type: 'remove',
          id: 'n-2',
        },
      ] as any);
    });

    expect(onGraphNodesChanges).toHaveBeenCalledTimes(1);

    const dispatchedTypes = dispatchMock.mock.calls.map(call => call[0].type);
    expect(dispatchedTypes).toContain('graph/changeGraphNodes');
    expect(dispatchedTypes).toContain('graph/updateGraphNodePositions');
  });

  it('creates and deletes graph entities with local state updates', async () => {
    let graphNodes = [{ id: 'n-1' }] as any[];
    let graphEdges = [{ id: 'e-1' }] as any[];
    let subgraphs = [{ id: 's-1' }] as any[];

    const setGraphNodes = vi.fn((value: any) => {
      graphNodes = typeof value === 'function' ? value(graphNodes) : value;
    });
    const setGraphEdges = vi.fn((value: any) => {
      graphEdges = typeof value === 'function' ? value(graphEdges) : value;
    });
    const setSubgraphs = vi.fn((value: any) => {
      subgraphs = typeof value === 'function' ? value(subgraphs) : value;
    });

    const { result: createResult } = renderHook(() =>
      useGraphCreates({
        setGraphNodes,
        setGraphEdges,
        setSubgraphs,
      } as any)
    );

    await act(async () => {
      await createResult.current.createGraphEntities(
        [{ id: 'n-2' }] as any,
        [{ id: 'e-2' }] as any,
        [{ id: 's-2' }] as any
      );
    });

    expect(graphNodes.map(node => node.id)).toEqual(['n-1', 'n-2']);
    expect(graphEdges.map(edge => edge.id)).toEqual(['e-1', 'e-2']);
    expect(subgraphs.map((subgraph: { id: string }) => subgraph.id)).toEqual([
      's-1',
      's-2',
    ]);

    const { result: deleteResult } = renderHook(() =>
      useGraphDeletes({
        setGraphNodes,
        setGraphEdges,
      } as any)
    );

    await act(async () => {
      await deleteResult.current.deleteGraphEntities(
        [{ id: 'n-1' }] as any,
        [{ id: 'e-1' }] as any
      );
    });

    expect(graphNodes.map(node => node.id)).toEqual(['n-2']);
    expect(graphEdges.map(edge => edge.id)).toEqual(['e-2']);

    const dispatchedTypes = dispatchMock.mock.calls.map(call => call[0].type);
    expect(dispatchedTypes).toContain('graphSlice/createEntities');
    expect(dispatchedTypes).toContain('graphSlice/deleteNodes');
    expect(dispatchedTypes).toContain('graphSlice/deleteEdges');
  });
});
