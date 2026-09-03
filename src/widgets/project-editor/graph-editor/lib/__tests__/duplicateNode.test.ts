import { describe, expect, it, vi } from 'vitest';

import type {
  CustomEdgeType,
  CustomNodeType,
} from '@/entities/project-editor/graph';

import {
  buildDuplicateClipboardPayload,
  cloneIncomingEdgesForDuplicate,
  cloneNodeForDuplicate,
  findNearestFreeNodePosition,
  parseDuplicateClipboardPayload,
  resolveNodeSize,
} from '../duplicateNode';

describe('graph-editor duplicate helpers', () => {
  it('finds the nearest free position without collisions', () => {
    const nextPosition = findNearestFreeNodePosition({
      sourcePosition: { x: 100, y: 100 },
      nodeSize: { width: 260, height: 120 },
      occupiedRects: [
        { x: 100, y: 100, width: 260, height: 120 },
        { x: 384, y: 100, width: 260, height: 120 },
      ],
    });

    expect(nextPosition).toEqual({ x: 100, y: 244 });
  });

  it('clones node with a new id and keeps original data intact', () => {
    const sourceNode: CustomNodeType = {
      id: 'node_source',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: {
        name: 'reader',
        displayName: 'Reader',
        inputValues: {
          limit: 10 as any,
        },
      },
      selected: true,
      dragging: true,
    };

    const clonedNode = cloneNodeForDuplicate(sourceNode, 'node_copy', {
      x: 500,
      y: 220,
    });

    expect(clonedNode.id).toBe('node_copy');
    expect(clonedNode.position).toEqual({ x: 500, y: 220 });
    expect(clonedNode.data).toEqual(sourceNode.data);
    expect(clonedNode.data).not.toBe(sourceNode.data);
    expect(clonedNode.selected).toBe(false);
    expect(clonedNode.dragging).toBe(false);
    expect(sourceNode.id).toBe('node_source');
    expect(sourceNode.position).toEqual({ x: 100, y: 100 });
  });

  it('copies incoming edges for the duplicate target and recalculates subgraph id', () => {
    const createEdgeId = vi
      .fn<() => string>()
      .mockReturnValueOnce('edge_copy_1')
      .mockReturnValueOnce('edge_copy_2');

    const edges: CustomEdgeType[] = [
      {
        id: 'edge_1',
        source: 'node_a',
        sourceHandle: 'output-main',
        target: 'node_source',
        targetHandle: 'input-main',
        type: 'custom',
      },
      {
        id: 'edge_2',
        source: 'node_b',
        sourceHandle: 'output-second',
        target: 'node_source',
        targetHandle: 'input-second',
        type: 'custom',
        subgraphId: 'subgraph_old',
      },
    ];

    const duplicatedEdges = cloneIncomingEdgesForDuplicate(
      edges,
      'node_copy',
      createEdgeId,
      edge => (edge.source === 'node_a' ? null : 'subgraph_new')
    );

    expect(duplicatedEdges).toEqual([
      {
        ...edges[0],
        id: 'edge_copy_1',
        target: 'node_copy',
        subgraphId: null,
      },
      {
        ...edges[1],
        id: 'edge_copy_2',
        target: 'node_copy',
        subgraphId: 'subgraph_new',
      },
    ]);
    expect(duplicatedEdges[0]).not.toBe(edges[0]);
    expect(createEdgeId).toHaveBeenCalledTimes(2);
  });

  it('serializes and parses clipboard payload', () => {
    const payload = buildDuplicateClipboardPayload(
      {
        id: 'node_source',
        type: 'custom',
        position: { x: 40, y: 80 },
        data: {
          name: 'reader',
          displayName: 'Reader',
          inputValues: {},
        },
      },
      []
    );

    const parsed = parseDuplicateClipboardPayload(JSON.stringify(payload));

    expect(parsed).toEqual(payload);
    expect(parseDuplicateClipboardPayload('')).toBeNull();
    expect(parseDuplicateClipboardPayload('{"version":999}')).toBeNull();
  });

  it('resolves node size from node fields and style fallback', () => {
    expect(
      resolveNodeSize(
        {
          width: 320,
          height: 180,
        },
        { width: 260, height: 120 }
      )
    ).toEqual({ width: 320, height: 180 });

    expect(
      resolveNodeSize(
        {
          style: { width: '300', height: '150' },
        },
        { width: 260, height: 120 }
      )
    ).toEqual({ width: 300, height: 150 });
  });
});
