import { describe, expect, it } from 'vitest';

import type { ProjectColumnRow } from '@/entities/data/lineage';

import { buildColumnTree, getRowChainIndex } from './columnTree';

const ref = (node: string, column = 'id') => ({
  key: `node:${node}:output:${column}`,
  kind: 'node' as const,
  node_id: node,
  port: 'output',
  column,
});

const occ = (node: string, depth: number, column = 'id') => ({
  ref: ref(node, column),
  node_id: node,
  node_name: node.toUpperCase(),
  port: 'output',
  role: 'output' as const,
  column,
  op: 'pass' as const,
  depth,
});

const row = (
  id: string,
  nodes: [string, number][],
  extra: Partial<ProjectColumnRow> = {}
): ProjectColumnRow => ({
  id,
  name: 'id',
  origin: { key: 'ds:1:id', kind: 'ds' },
  start: ref(nodes[0][0]),
  kind: 'dataset_field',
  occurrences: nodes.map(([node, depth]) => occ(node, depth)),
  ...extra,
});

describe('buildColumnTree', () => {
  it('groups segments by origin with the chain start first', () => {
    const renamed = row('r2', [['c', 3]], { is_rename: true, name: 'key' });
    const host = row('r1', [
      ['b', 2],
      ['a', 1],
    ]);
    const other = row('x', [['z', 0]], {
      origin: { key: 'node:z:output:x', kind: 'node' },
    });

    const tree = buildColumnTree([renamed, other, host]);

    expect(tree.groups.map(group => group.key)).toEqual([
      'ds:1:id',
      'node:z:output:x',
    ]);
    expect(tree.ordered.map(item => item.id)).toEqual(['r1', 'r2', 'x']);
    const group = tree.groupOf.get('r2')!;
    expect(group.host).toBe(host);
    expect(group.chain.map(item => item.node_id)).toEqual(['a', 'b', 'c']);
    expect(getRowChainIndex(group, renamed)).toBe(2);
    expect(tree.rowOfOccurrence.get(ref('c').key)).toBe(renamed);
  });
});
