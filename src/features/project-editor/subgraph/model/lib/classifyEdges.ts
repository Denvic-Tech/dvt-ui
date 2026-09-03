import type { GraphEdgeWithSubgraph } from '../types.ts';

export interface ClassifiedEdges {
  internal: GraphEdgeWithSubgraph[];
  inbound: GraphEdgeWithSubgraph[];
  outbound: GraphEdgeWithSubgraph[];
  external: GraphEdgeWithSubgraph[];
}

export const classifyEdgesByMembership = (
  memberNodeIDs: string[],
  edges: GraphEdgeWithSubgraph[]
): ClassifiedEdges => {
  const members = new Set(memberNodeIDs);
  const classified: ClassifiedEdges = {
    internal: [],
    inbound: [],
    outbound: [],
    external: [],
  };

  for (const edge of edges) {
    const sourceInside = members.has(edge.source);
    const targetInside = members.has(edge.target);

    if (sourceInside && targetInside) {
      classified.internal.push(edge);
      continue;
    }

    if (!sourceInside && targetInside) {
      classified.inbound.push(edge);
      continue;
    }

    if (sourceInside && !targetInside) {
      classified.outbound.push(edge);
      continue;
    }

    classified.external.push(edge);
  }

  return classified;
};
