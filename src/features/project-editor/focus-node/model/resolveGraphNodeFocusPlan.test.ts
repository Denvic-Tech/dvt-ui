import { describe, expect, it } from 'vitest';

import type { CustomNodeType } from '@/entities/project-editor/graph';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';

import { resolveGraphNodeFocusPlan } from './resolveGraphNodeFocusPlan';

const node = {
  id: 'node-1',
  type: 'custom',
  position: { x: 10, y: 20 },
  subgraphId: 'subgraph-1',
  data: {
    name: 'LoadCSV',
    displayName: 'CSV source',
    inputValues: {},
  },
} satisfies CustomNodeType;

const makeSubgraph = (expanded: boolean) =>
  ({
    id: 'subgraph-1',
    expanded,
    data: {
      name: 'subgraph-1',
      displayName: 'Sources',
    },
    position: { x: 0, y: 0 },
  }) as SubgraphUiSchema;

describe('resolveGraphNodeFocusPlan', () => {
  it('requests expansion for a node in a collapsed subgraph', () => {
    expect(
      resolveGraphNodeFocusPlan([node], [makeSubgraph(false)], node.id)
    ).toMatchObject({
      node,
      subgraphIDToExpand: 'subgraph-1',
    });
  });

  it('does not request expansion when the subgraph is already expanded', () => {
    expect(
      resolveGraphNodeFocusPlan([node], [makeSubgraph(true)], node.id)
    ).toMatchObject({
      node,
      subgraphIDToExpand: null,
    });
  });

  it('ignores a request for a missing node', () => {
    expect(
      resolveGraphNodeFocusPlan([node], [makeSubgraph(false)], 'missing')
    ).toBeNull();
  });
});
