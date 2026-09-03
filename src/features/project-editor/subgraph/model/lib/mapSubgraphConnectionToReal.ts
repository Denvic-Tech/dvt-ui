import { buildSubgraphPortLookupKey } from './buildSubgraphPorts.ts';
import type {
  ResolvedSubgraphConnection,
  SubgraphProjection,
} from '../types.ts';

interface MapSubgraphConnectionToRealParams {
  source: string | null | undefined;
  sourceHandle?: string | null;
  target: string | null | undefined;
  targetHandle?: string | null;
  projection: SubgraphProjection;
  nodeSubgraphByID: Record<string, string | null | undefined>;
}

interface ResolvedEndpoint {
  nodeId: string;
  handleId: string | null;
  subgraphId: string | null;
}

const resolveEndpoint = (
  side: 'source' | 'target',
  params: {
    nodeId: string;
    handleId?: string | null;
    projection: SubgraphProjection;
    nodeSubgraphByID: Record<string, string | null | undefined>;
  }
): ResolvedEndpoint | null => {
  const { nodeId, handleId, projection, nodeSubgraphByID } = params;

  const subgraphNode = projection.subgraphNodesByID[nodeId];
  if (!subgraphNode) {
    return {
      nodeId,
      handleId: handleId ?? null,
      subgraphId: nodeSubgraphByID[nodeId] ?? null,
    };
  }

  if (!handleId) {
    return null;
  }

  const lookupKey = buildSubgraphPortLookupKey(nodeId, handleId);
  const port = projection.portLookup[lookupKey];

  if (!port) {
    return null;
  }

  const expectedSide = side === 'source' ? 'output' : 'input';
  if (port.side !== expectedSide) {
    return null;
  }

  return {
    nodeId: port.internalNodeId,
    handleId: port.internalHandleId ?? null,
    subgraphId: nodeId,
  };
};

export const mapSubgraphConnectionToReal = ({
  source,
  sourceHandle,
  target,
  targetHandle,
  projection,
  nodeSubgraphByID,
}: MapSubgraphConnectionToRealParams): ResolvedSubgraphConnection | null => {
  if (!source || !target) {
    return null;
  }

  const resolvedSource = resolveEndpoint('source', {
    nodeId: source,
    handleId: sourceHandle ?? null,
    projection,
    nodeSubgraphByID,
  });
  const resolvedTarget = resolveEndpoint('target', {
    nodeId: target,
    handleId: targetHandle ?? null,
    projection,
    nodeSubgraphByID,
  });

  if (!resolvedSource || !resolvedTarget) {
    return null;
  }

  const sourceSubgraphId = resolvedSource.subgraphId;
  const targetSubgraphId = resolvedTarget.subgraphId;

  return {
    source: resolvedSource.nodeId,
    sourceHandle: resolvedSource.handleId,
    target: resolvedTarget.nodeId,
    targetHandle: resolvedTarget.handleId,
    subgraphId:
      sourceSubgraphId && sourceSubgraphId === targetSubgraphId
        ? sourceSubgraphId
        : null,
  };
};
