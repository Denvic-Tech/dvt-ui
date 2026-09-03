import ELK from 'elkjs/lib/elk.bundled';
import { describe, expect, it } from 'vitest';

import type { CustomNodeType } from '@/entities/project-editor/graph';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';

import {
  calculateGraphAutoLayout,
  createGraphAutoLayoutSignature,
} from '../calculateGraphAutoLayout';

const makeNode = (
  id: string,
  x: number,
  y: number,
  subgraphId?: string | null
): CustomNodeType => ({
  id,
  type: 'custom',
  position: { x, y },
  ...(subgraphId !== undefined ? { subgraphId } : {}),
  data: {
    name: id,
    displayName: id,
    inputValues: {},
  },
});

const makeSubgraph = (id: string, expanded: boolean): SubgraphUiSchema => ({
  id,
  type: 'subgraph',
  position: { x: 0, y: 0 },
  expanded,
  data: {
    name: id,
    displayName: id,
  },
});

const nodeSizesByID = {
  source: { width: 240, height: 100 },
  left: { width: 280, height: 140 },
  right: { width: 220, height: 120 },
  insideA: { width: 260, height: 120 },
  insideB: { width: 300, height: 160 },
  target: { width: 260, height: 120 },
  a: { width: 260, height: 120 },
  b: { width: 260, height: 120 },
};

describe('calculateGraphAutoLayout', () => {
  it('lays out a branching graph from left to right without overlaps', async () => {
    const nodes = [
      makeNode('source', 900, 500),
      makeNode('left', 20, 20),
      makeNode('right', 40, 40),
    ];
    const result = await calculateGraphAutoLayout(
      {
        nodes,
        edges: [
          { id: 'source-left', source: 'source', target: 'left' },
          { id: 'source-right', source: 'source', target: 'right' },
        ],
        subgraphs: [],
        nodeSizesByID,
      },
      new ELK()
    );

    const source = result.nodePositions['source'];
    const left = result.nodePositions['left'];
    const right = result.nodePositions['right'];

    expect(source.x).toBeLessThan(left.x);
    expect(source.x).toBeLessThan(right.x);
    expect(Math.abs(left.y - right.y)).toBeGreaterThanOrEqual(120);
    expect(result.bounds.width).toBeGreaterThan(0);
    expect(result.bounds.height).toBeGreaterThan(0);
  });

  it('lays out expanded subgraph members and cross-boundary edges together', async () => {
    const nodes = [
      makeNode('insideA', 600, 400, 'group'),
      makeNode('insideB', 20, 20, 'group'),
      makeNode('target', 40, 40),
    ];
    const result = await calculateGraphAutoLayout(
      {
        nodes,
        edges: [
          { id: 'inside', source: 'insideA', target: 'insideB' },
          { id: 'outside', source: 'insideB', target: 'target' },
        ],
        subgraphs: [makeSubgraph('group', true)],
        nodeSizesByID,
      },
      new ELK()
    );

    const panel = result.subgraphLayouts['group'];
    expect(panel.width).toBeGreaterThanOrEqual(520);
    expect(panel.height).toBeGreaterThanOrEqual(340);
    expect(result.nodePositions['insideB'].x).toBeGreaterThan(
      result.nodePositions['insideA'].x
    );
    expect(result.nodePositions['insideA'].x).toBeGreaterThanOrEqual(
      panel.x + 40
    );
    expect(result.nodePositions['insideA'].y).toBeGreaterThanOrEqual(
      panel.y + 52
    );
    expect(result.nodePositions['target'].x).toBeGreaterThan(panel.x);
  });

  it('treats a collapsed subgraph as one outer node but cleans its hidden members', async () => {
    const nodes = [
      makeNode('insideA', 500, 500, 'group'),
      makeNode('insideB', 10, 10, 'group'),
      makeNode('target', 0, 0),
    ];
    const result = await calculateGraphAutoLayout(
      {
        nodes,
        edges: [
          { id: 'inside', source: 'insideA', target: 'insideB' },
          { id: 'outside', source: 'insideB', target: 'target' },
        ],
        subgraphs: [makeSubgraph('group', false)],
        nodeSizesByID,
        collapsedSubgraphSizesByID: {
          group: { width: 340, height: 150 },
        },
      },
      new ELK()
    );

    expect(result.subgraphPositions['group'].x).toBeLessThan(
      result.nodePositions['target'].x
    );
    expect(result.nodePositions['insideB'].x).toBeGreaterThan(
      result.nodePositions['insideA'].x
    );
    expect(result.subgraphLayouts['group'].width).toBeGreaterThanOrEqual(520);
    expect(result.subgraphLayouts['group'].height).toBeGreaterThanOrEqual(340);
  });

  it('handles cycles, self-loops and ignores dangling edges', async () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 0, 0)];
    const result = await calculateGraphAutoLayout(
      {
        nodes,
        edges: [
          { id: 'a-b', source: 'a', target: 'b' },
          { id: 'b-a', source: 'b', target: 'a' },
          { id: 'self', source: 'a', target: 'a' },
          { id: 'dangling', source: 'missing', target: 'a' },
        ],
        subgraphs: [],
        nodeSizesByID,
      },
      new ELK()
    );

    expect(Object.keys(result.nodePositions).sort()).toEqual(['a', 'b']);
    expect(Number.isFinite(result.nodePositions['a'].x)).toBe(true);
    expect(Number.isFinite(result.nodePositions['b'].y)).toBe(true);
  });

  it('detects graph changes relevant to an in-flight layout', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 10, 10)];
    const base = {
      nodes,
      edges: [{ id: 'a-b', source: 'a', target: 'b' }],
      subgraphs: [] as SubgraphUiSchema[],
    };

    expect(createGraphAutoLayoutSignature(base)).toBe(
      createGraphAutoLayoutSignature({
        ...base,
        nodes: nodes.map(node => ({ ...node, selected: true })),
      })
    );
    expect(createGraphAutoLayoutSignature(base)).not.toBe(
      createGraphAutoLayoutSignature({
        ...base,
        nodes: [nodes[0], { ...nodes[1], position: { x: 20, y: 10 } }],
      })
    );
  });
});
