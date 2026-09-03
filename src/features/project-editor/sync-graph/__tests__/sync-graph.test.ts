import { createAsyncThunk } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import { selectGraphSyncStatus } from '@/features/project-editor/sync-graph/model/selectors.ts';
import {
  flushGraphOperations,
  syncGraphReducer,
} from '@/features/project-editor/sync-graph/model/slice.ts';

import {
  graphActions,
  updateGraphNodePositions,
} from '@/entities/project-editor/graph';

vi.mock('@/app/providers/store/helpers', () => ({
  createAppAsyncThunk: (
    typePrefix: string,
    payloadCreator: (...args: any[]) => unknown,
    options?: Record<string, unknown>
  ) => createAsyncThunk(typePrefix, payloadCreator as any, options as any),
}));

describe('features/sync-graph', () => {
  it('marks important operations for immediate flush', () => {
    const state = syncGraphReducer(
      undefined,
      graphActions.createNodes({
        nodes: [
          {
            id: 'node-1',
            position: { x: 0, y: 0 },
            data: {
              name: 'reader',
              displayName: 'Reader',
              inputValues: {},
            },
          },
        ] as any,
      })
    );

    expect(state.flushMode).toBe('immediate');
    expect(state.outbox).toHaveLength(1);
    expect(state.outbox[0].important).toBe(true);
  });

  it('queues nodes, edges and subgraphs together for createEntities', () => {
    const state = syncGraphReducer(
      undefined,
      graphActions.createEntities({
        nodes: [
          {
            id: 'node-1',
            position: { x: 0, y: 0 },
            data: {
              name: 'reader',
              displayName: 'Reader',
              inputValues: {},
            },
          },
        ] as any,
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            sourceHandle: 'output-out',
            targetHandle: 'input-in',
            type: 'custom',
          },
        ] as any,
        subgraphs: [
          {
            id: 'subgraph-1',
            type: 'subgraph',
            position: { x: 0, y: 0 },
            data: {
              name: 'Subgraph',
              displayName: 'Subgraph',
            },
          },
        ] as any,
      })
    );

    expect(state.flushMode).toBe('immediate');
    expect(state.outbox).toHaveLength(3);
    expect(state.outbox.map(op => op.entity)).toEqual([
      'node',
      'edge',
      'subgraph',
    ]);
    expect(state.outbox.every(op => op.type === 'Create')).toBe(true);
  });

  it('deduplicates queued position operations per node', () => {
    let state = syncGraphReducer(undefined, { type: 'sync/test-init' });

    state = syncGraphReducer(
      state,
      updateGraphNodePositions([
        { nodeID: 'node-1', position: { x: 10, y: 20 } },
      ])
    );
    state = syncGraphReducer(
      state,
      updateGraphNodePositions([
        { nodeID: 'node-1', position: { x: 30, y: 40 } },
      ])
    );

    const positionOps = state.outbox.filter(op => op.type === 'Position');
    expect(positionOps).toHaveLength(1);
    expect((positionOps[0].payload as any).position).toEqual({ x: 30, y: 40 });
    expect(state.flushMode).toBe('debounced');
  });

  it('marks subgraph binding updates as important for immediate flush', () => {
    const state = syncGraphReducer(
      undefined,
      graphActions.updateNodeSubgraphBindings({
        items: [{ id: 'node-1', subgraphId: 'subgraph-1' }],
      })
    );

    expect(state.flushMode).toBe('immediate');
    expect(state.outbox).toHaveLength(1);
    expect(state.outbox[0].type).toBe('SubgraphBinding');
    expect(state.outbox[0].important).toBe(true);
    expect((state.outbox[0].payload as any).subgraphId).toBe('subgraph-1');
    expect((state.outbox[0].payload as any).data).toBeUndefined();
  });

  it('queues showVariablesIo updates as node patch operations', () => {
    const state = syncGraphReducer(
      undefined,
      graphActions.updateShowVariablesIo({
        nodeID: 'node-1',
        showVariablesIo: true,
      })
    );

    expect(state.flushMode).toBe('debounced');
    expect(state.outbox).toHaveLength(1);
    expect(state.outbox[0].type).toBe('ShowVariablesIo');
    expect(state.outbox[0].payload as any).toEqual({
      id: 'node-1',
      data: { showVariablesIo: true },
    });
  });

  it('increases backoff and keeps debounced mode after failed flush', () => {
    let state = syncGraphReducer(
      undefined,
      graphActions.updateComment({
        nodeID: 'node-1',
        comment: 'new comment',
      })
    );

    state = syncGraphReducer(
      state,
      flushGraphOperations.rejected(
        new Error('network error'),
        'request-1',
        undefined,
        {
          code: 'GRAPH_SYNC.UNKNOWN',
          message: 'sync failed',
        } as any
      )
    );

    expect(state.backoffMs).toBe(2000);
    expect(state.flushMode).toBe('debounced');
    expect(state.inFlight).toBe(false);
  });

  it('derives graph sync status from syncGraph state', () => {
    const syncedState = {
      syncGraph: syncGraphReducer(undefined, { type: 'sync/test-init' }),
    };
    expect(selectGraphSyncStatus(syncedState as any)).toBe('synced');

    const pendingState = {
      syncGraph: syncGraphReducer(
        undefined,
        graphActions.updateComment({
          nodeID: 'node-1',
          comment: 'draft',
        })
      ),
    };
    expect(selectGraphSyncStatus(pendingState as any)).toBe('pending');

    const syncingState = {
      syncGraph: syncGraphReducer(
        pendingState.syncGraph,
        flushGraphOperations.pending('request-1')
      ),
    };
    expect(selectGraphSyncStatus(syncingState as any)).toBe('syncing');

    const errorState = {
      syncGraph: syncGraphReducer(
        pendingState.syncGraph,
        flushGraphOperations.rejected(
          new Error('network error'),
          'request-2',
          undefined,
          {
            code: 'GRAPH_SYNC.UNKNOWN',
            message: 'sync failed',
          } as any
        )
      ),
    };
    expect(selectGraphSyncStatus(errorState as any)).toBe('error');
  });
});
