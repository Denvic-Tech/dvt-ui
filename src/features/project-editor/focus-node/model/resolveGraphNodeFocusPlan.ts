import type { CustomNodeType } from '@/entities/project-editor/graph';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';

export interface GraphNodeFocusPlan {
  node: CustomNodeType;
  subgraphIDToExpand: string | null;
}

export const resolveGraphNodeFocusPlan = (
  nodes: readonly CustomNodeType[],
  subgraphs: readonly SubgraphUiSchema[],
  nodeID: string
): GraphNodeFocusPlan | null => {
  const node = nodes.find(item => item.id === nodeID);
  if (!node) {
    return null;
  }

  const subgraph = node.subgraphId
    ? subgraphs.find(item => item.id === node.subgraphId)
    : null;

  return {
    node,
    subgraphIDToExpand: subgraph && !subgraph.expanded ? subgraph.id : null,
  };
};
