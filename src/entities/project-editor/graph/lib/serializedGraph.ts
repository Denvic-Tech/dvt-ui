import type { Edge } from '@xyflow/react';

import {
  CustomNodeType,
  isCustomEdgeType,
  isCustomNodeType,
} from '@/entities/project-editor/graph';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';

import type { CustomEdgeType } from '../model/types';

type LegacySubgraphPort = {
  id?: unknown;
  side?: unknown;
  internalNodeId?: unknown;
  internalHandleId?: unknown;
};

type LegacySubgraphNode = {
  id?: unknown;
  type?: unknown;
  position?: {
    x?: unknown;
    y?: unknown;
  } | null;
  selected?: unknown;
  expanded?: unknown;
  data?: {
    name?: unknown;
    displayName?: unknown;
    color?: unknown;
    comment?: unknown;
    ports?: LegacySubgraphPort[] | unknown;
  } | null;
};

type SerializedGraphInput = {
  nodes?: unknown;
  edges?: unknown;
  subgraphs?: unknown;
};

type LegacyPortLookup = Record<
  string,
  {
    internalNodeId: string;
    internalHandleId: string;
  }
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const asArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const isLegacySubgraphNode = (value: unknown): value is LegacySubgraphNode => {
  if (!isRecord(value) || value['type'] !== 'subgraph') {
    return false;
  }

  const position = value['position'];
  return (
    isRecord(position) &&
    isFiniteNumber(position['x']) &&
    isFiniteNumber(position['y']) &&
    typeof value['id'] === 'string' &&
    value['id'].length > 0
  );
};

const normalizeSubgraph = (
  value: unknown,
  fallbackExpanded = false
): SubgraphUiSchema | null => {
  if (!isRecord(value)) {
    return null;
  }

  const position = value['position'];
  const data = isRecord(value['data']) ? value['data'] : {};

  if (
    typeof value['id'] !== 'string' ||
    value['id'].length === 0 ||
    !isRecord(position) ||
    !isFiniteNumber(position['x']) ||
    !isFiniteNumber(position['y'])
  ) {
    return null;
  }

  const resolvedName =
    typeof data['name'] === 'string' && data['name'].length > 0
      ? data['name']
      : 'Subgraph';
  const resolvedDisplayName =
    typeof data['displayName'] === 'string' && data['displayName'].length > 0
      ? data['displayName']
      : resolvedName;

  return {
    id: value['id'],
    type:
      typeof value['type'] === 'string' && value['type'].length > 0
        ? value['type']
        : 'subgraph',
    position: {
      x: position['x'],
      y: position['y'],
    },
    selected:
      typeof value['selected'] === 'boolean' ? value['selected'] : false,
    expanded:
      typeof value['expanded'] === 'boolean'
        ? value['expanded']
        : fallbackExpanded,
    data: {
      name: resolvedName,
      displayName: resolvedDisplayName,
      ...(typeof data['color'] === 'string' ? { color: data['color'] } : {}),
      ...(typeof data['comment'] === 'string'
        ? { comment: data['comment'] }
        : {}),
    },
  };
};

const buildLegacyPortLookup = (
  legacySubgraphNodes: LegacySubgraphNode[]
): Record<string, LegacyPortLookup> => {
  const lookup: Record<string, LegacyPortLookup> = {};

  for (const subgraph of legacySubgraphNodes) {
    if (typeof subgraph.id !== 'string') {
      continue;
    }

    const portsLookup: LegacyPortLookup = {};
    const ports = asArray<LegacySubgraphPort>(subgraph.data?.ports);
    for (const port of ports) {
      if (
        typeof port?.id !== 'string' ||
        typeof port.internalNodeId !== 'string' ||
        typeof port.internalHandleId !== 'string'
      ) {
        continue;
      }

      portsLookup[port.id] = {
        internalNodeId: port.internalNodeId,
        internalHandleId: port.internalHandleId,
      };
    }

    lookup[subgraph.id] = portsLookup;
  }

  return lookup;
};

const sanitizeEdgeData = (
  value: unknown
): Record<string, unknown> | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const {
    ['synthetic']: _synthetic,
    ['realEdgeId']: _realEdgeId,
    ['uiGradient']: _uiGradient,
    ...rest
  } = value;
  return Object.keys(rest).length > 0 ? rest : undefined;
};

const normalizeEdgeID = (edge: Edge): string => {
  const edgeData = isRecord(edge.data) ? edge.data : {};
  if (
    typeof edgeData['realEdgeId'] === 'string' &&
    edgeData['realEdgeId'].length > 0
  ) {
    return edgeData['realEdgeId'];
  }

  return edge.id.startsWith('proxy:')
    ? edge.id.slice('proxy:'.length)
    : edge.id;
};

const resolveLegacyEndpoint = (
  nodeId: string,
  handleId: string,
  portsBySubgraphId: Record<string, LegacyPortLookup>,
  availableNodeOrSubgraphIDs: Set<string>
): { nodeId: string; handleId: string } | null => {
  const subgraphPorts = portsBySubgraphId[nodeId];
  if (!subgraphPorts) {
    return { nodeId, handleId };
  }

  const port = subgraphPorts[handleId];
  if (!port) {
    return availableNodeOrSubgraphIDs.has(nodeId) ? { nodeId, handleId } : null;
  }

  if (!availableNodeOrSubgraphIDs.has(port.internalNodeId)) {
    return availableNodeOrSubgraphIDs.has(nodeId) ? { nodeId, handleId } : null;
  }

  return {
    nodeId: port.internalNodeId,
    handleId: port.internalHandleId,
  };
};

const normalizeEdges = (
  rawEdges: unknown[],
  availableNodeIDs: Set<string>,
  availableSubgraphIDs: Set<string>,
  portsBySubgraphId: Record<string, LegacyPortLookup>
): CustomEdgeType[] => {
  const normalizedEdges: CustomEdgeType[] = [];
  const seenEdgeIDs = new Set<string>();
  const availableNodeOrSubgraphIDs = new Set([
    ...availableNodeIDs,
    ...availableSubgraphIDs,
  ]);

  for (const rawEdge of rawEdges) {
    if (!isCustomEdgeType(rawEdge)) {
      continue;
    }

    const resolvedSource = resolveLegacyEndpoint(
      rawEdge.source,
      rawEdge.sourceHandle ?? '',
      portsBySubgraphId,
      availableNodeOrSubgraphIDs
    );
    const resolvedTarget = resolveLegacyEndpoint(
      rawEdge.target,
      rawEdge.targetHandle ?? '',
      portsBySubgraphId,
      availableNodeOrSubgraphIDs
    );

    if (!resolvedSource || !resolvedTarget) {
      continue;
    }

    if (
      !availableNodeOrSubgraphIDs.has(resolvedSource.nodeId) ||
      !availableNodeOrSubgraphIDs.has(resolvedTarget.nodeId)
    ) {
      continue;
    }

    const normalizedID = normalizeEdgeID(rawEdge);
    if (!normalizedID || seenEdgeIDs.has(normalizedID)) {
      continue;
    }

    seenEdgeIDs.add(normalizedID);
    normalizedEdges.push({
      ...rawEdge,
      id: normalizedID,
      source: resolvedSource.nodeId,
      sourceHandle: resolvedSource.handleId,
      target: resolvedTarget.nodeId,
      targetHandle: resolvedTarget.handleId,
      ...(sanitizeEdgeData(rawEdge.data)
        ? { data: sanitizeEdgeData(rawEdge.data) }
        : {}),
    } as CustomEdgeType);
  }

  return normalizedEdges;
};

export const normalizeSerializedGraph = (
  input: SerializedGraphInput
): {
  nodes: CustomNodeType[];
  edges: CustomEdgeType[];
  subgraphs: SubgraphUiSchema[];
} => {
  const rawNodes = asArray(input.nodes);
  const rawEdges = asArray(input.edges);
  const rawSubgraphs = asArray(input.subgraphs);

  const legacySubgraphNodes = rawNodes.filter(isLegacySubgraphNode);
  const nodes = rawNodes
    .filter(node => !isLegacySubgraphNode(node))
    .filter(isCustomNodeType);

  const subgraphs = [
    ...rawSubgraphs
      .map(subgraph => normalizeSubgraph(subgraph, false))
      .filter((subgraph): subgraph is SubgraphUiSchema => Boolean(subgraph)),
    ...legacySubgraphNodes
      .map(subgraph => normalizeSubgraph(subgraph, false))
      .filter((subgraph): subgraph is SubgraphUiSchema => Boolean(subgraph)),
  ];

  const availableNodeIDs = new Set(nodes.map(node => node.id));
  const availableSubgraphIDs = new Set(subgraphs.map(subgraph => subgraph.id));
  const portsBySubgraphId = buildLegacyPortLookup(legacySubgraphNodes);
  const edges = normalizeEdges(
    rawEdges,
    availableNodeIDs,
    availableSubgraphIDs,
    portsBySubgraphId
  );

  return {
    nodes,
    edges,
    subgraphs,
  };
};
