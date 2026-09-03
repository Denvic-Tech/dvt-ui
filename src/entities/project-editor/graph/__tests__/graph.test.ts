import { createAsyncThunk } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import {
  buildConnections,
  graphActions,
  graphReducer,
  normalizeSerializedGraph,
  pruneConnections,
  selectNodeDataByID,
} from '@/entities/project-editor/graph';

vi.mock('@/app/providers/store/helpers', () => ({
  createAppAsyncThunk: (
    typePrefix: string,
    payloadCreator: (...args: any[]) => unknown,
    options?: Record<string, unknown>
  ) => createAsyncThunk(typePrefix, payloadCreator as any, options as any),
}));

describe('entities/graph', () => {
  it('builds bidirectional connections from edges', () => {
    const edges = [
      {
        id: 'e-1',
        source: 'n-source',
        target: 'n-target',
        sourceHandle: 'output-main',
        targetHandle: 'input-df',
      },
      {
        id: 'e-ignored',
        source: 'n-source',
        target: 'n-target',
        sourceHandle: null,
        targetHandle: 'input-x',
      },
    ] as any;

    const result = buildConnections(edges);

    expect(result.outputsBySourceNodeID['n-source']['main']).toEqual({
      nodeID: 'n-target',
      inputName: 'df',
    });
    expect(result.inputsByTargetNodeID['n-target']['df']).toEqual({
      nodeID: 'n-source',
      outputName: 'main',
    });
    expect(result.outputsBySourceNodeID['n-source']['x']).toBeUndefined();
  });

  it('prunes removed node links from connection maps', () => {
    const state = {
      nodeDataByID: {},
      outputsBySourceNodeID: {
        a: { out: { nodeID: 'b', inputName: 'in' } },
        c: { out: { nodeID: 'd', inputName: 'in' } },
      },
      inputsByTargetNodeID: {
        b: { in: { nodeID: 'a', outputName: 'out' } },
        d: { in: { nodeID: 'c', outputName: 'out' } },
      },
      graphLoading: false,
      graphLoaded: false,
      graphLoadingError: null,
      lastLoadedProjectID: null,
    } as any;

    pruneConnections(state, new Set(['b']));

    expect(state.outputsBySourceNodeID.a).toBeUndefined();
    expect(state.inputsByTargetNodeID.b).toBeUndefined();
    expect(state.outputsBySourceNodeID.c).toBeDefined();
  });

  it('normalizes input values when graph is set', () => {
    const nextState = graphReducer(
      undefined,
      graphActions.setGraph({
        nodes: [
          {
            id: 'node-1',
            position: { x: 0, y: 0 },
            data: {
              name: 'reader',
              displayName: 'Reader',
              inputValues: {
                plain: 10,
                variable: {
                  __dvt_type: 'expr',
                  value: 'my_var',
                  expression_kind: 'single',
                },
              },
            },
          },
          {
            id: 'node-2',
            position: { x: 100, y: 50 },
            data: {
              name: 'writer',
              displayName: 'Writer',
              inputValues: {},
            },
          },
        ] as any,
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            sourceHandle: 'output-main',
            targetHandle: 'input-df',
          },
        ] as any,
      })
    );

    expect(nextState.nodeDataByID['node-1'].inputValues['plain']).toEqual({
      __dvt_type: 'const',
      value: 10,
    });
    expect(nextState.nodeDataByID['node-1'].inputValues['variable']).toEqual({
      __dvt_type: 'expr',
      value: 'my_var',
      expression_kind: 'single',
    });
    expect(nextState.outputsBySourceNodeID['node-1']['main'].nodeID).toBe(
      'node-2'
    );
  });

  it('selects node data by id', () => {
    const state = {
      graph: {
        nodeDataByID: {
          n1: { name: 'n1', displayName: 'Node 1', inputValues: {} },
        },
      },
    } as any;

    expect(selectNodeDataByID(state, 'n1')).toEqual({
      name: 'n1',
      displayName: 'Node 1',
      inputValues: {},
    });
    expect(selectNodeDataByID(state, 'unknown')).toBeNull();
  });

  it('normalizes legacy serialized subgraph nodes into canonical graph payload', () => {
    const result = normalizeSerializedGraph({
      nodes: [
        {
          id: 'node-external',
          type: 'custom',
          position: { x: 0, y: 0 },
          data: {
            name: 'External',
            displayName: 'External',
            inputValues: {},
          },
        },
        {
          id: 'node-member',
          type: 'custom',
          subgraphId: 'subgraph-1',
          position: { x: 10, y: 10 },
          data: {
            name: 'Member',
            displayName: 'Member',
            inputValues: {},
          },
        },
        {
          id: 'subgraph-1',
          type: 'subgraph',
          position: { x: 5, y: 5 },
          data: {
            name: 'subgraph',
            displayName: 'Legacy',
            ports: [
              {
                id: 'sg-in:node-member:input-main',
                internalNodeId: 'node-member',
                internalHandleId: 'input-main',
              },
            ],
          },
        },
      ],
      edges: [
        {
          id: 'proxy:edge-1',
          source: 'node-external',
          target: 'subgraph-1',
          sourceHandle: 'output-main',
          targetHandle: 'sg-in:node-member:input-main',
          data: {
            synthetic: true,
            realEdgeId: 'edge-1',
          },
        },
      ],
    });

    expect(result.nodes.map(node => node.id)).toEqual([
      'node-external',
      'node-member',
    ]);
    expect(result.subgraphs).toEqual([
      expect.objectContaining({
        id: 'subgraph-1',
        type: 'subgraph',
        data: expect.objectContaining({
          displayName: 'Legacy',
        }),
      }),
    ]);
    expect(result.edges).toEqual([
      expect.objectContaining({
        id: 'edge-1',
        source: 'node-external',
        target: 'node-member',
        targetHandle: 'input-main',
      }),
    ]);
  });

  it('keeps proxy edge connected to subgraph when legacy file has no member nodes', () => {
    const result = normalizeSerializedGraph({
      nodes: [
        {
          id: 'node-external',
          type: 'custom',
          position: { x: 0, y: 0 },
          data: {
            name: 'External',
            displayName: 'External',
            inputValues: {},
          },
        },
        {
          id: 'subgraph-1',
          type: 'subgraph',
          position: { x: 5, y: 5 },
          data: {
            name: 'subgraph',
            displayName: 'Legacy',
            ports: [
              {
                id: 'sg-in:node-missing:input-main',
                internalNodeId: 'node-missing',
                internalHandleId: 'input-main',
              },
            ],
          },
        },
      ],
      edges: [
        {
          id: 'proxy:edge-1',
          source: 'node-external',
          target: 'subgraph-1',
          sourceHandle: 'output-main',
          targetHandle: 'sg-in:node-missing:input-main',
          data: {
            synthetic: true,
            realEdgeId: 'edge-1',
          },
        },
      ],
    });

    expect(result.edges).toEqual([
      expect.objectContaining({
        id: 'edge-1',
        source: 'node-external',
        target: 'subgraph-1',
        targetHandle: 'sg-in:node-missing:input-main',
      }),
    ]);
  });

  it('strips ui-only gradient data from serialized edges', () => {
    const result = normalizeSerializedGraph({
      nodes: [
        {
          id: 'node-1',
          type: 'custom',
          position: { x: 0, y: 0 },
          data: {
            name: 'Source',
            displayName: 'Source',
            inputValues: {},
          },
        },
        {
          id: 'node-2',
          type: 'custom',
          position: { x: 100, y: 0 },
          data: {
            name: 'Target',
            displayName: 'Target',
            inputValues: {},
          },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          sourceHandle: 'output-main',
          targetHandle: 'input-main',
          data: {
            uiGradient: {
              sourceColor: '#123456',
              targetColor: '#654321',
            },
            persisted: 'keep-me',
          },
        },
      ],
    });

    expect(result.edges).toEqual([
      expect.objectContaining({
        id: 'edge-1',
        data: {
          persisted: 'keep-me',
        },
      }),
    ]);
  });
});
