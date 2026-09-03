import { IOConnectionRequiredSubgraphTypeSchema } from '@/entities/node/node-io';
import { CustomNodeType } from '@/entities/project-editor/graph';

import { Io } from '@/shared/gatewayClient';

import type {
  GraphEdgeWithSubgraph,
  NodeDefinitionsMap,
  SubgraphPort,
} from '../types.ts';

import { classifyEdgesByMembership } from './classifyEdges.ts';

const CONNECTION_REQUIRED_SUBGRAPH_IO_TYPES = new Set<Io>(
  IOConnectionRequiredSubgraphTypeSchema.options as readonly Io[]
);
const HIDDEN_SUBGRAPH_IO_TYPES = new Set<Io>(['VARIABLE', 'SIGNAL']);

const stripHandlePrefix = (handleId: string, side: 'input' | 'output') => {
  if (side === 'input') {
    return handleId.replace(/^input-/, '');
  }
  return handleId.replace(/^output-/, '');
};

const getNodeDisplayName = (node: CustomNodeType) =>
  String(node.data?.displayName ?? node.data?.name ?? node.id);

const getHandleDisplayName = (handleId: string, side: 'input' | 'output') =>
  stripHandlePrefix(handleId, side);

const getPortLabel = (
  node: CustomNodeType,
  handleId: string,
  side: 'input' | 'output'
) => {
  const nodeLabel = getNodeDisplayName(node);
  const handleLabel = getHandleDisplayName(handleId, side);
  return `${nodeLabel}: ${handleLabel}`;
};

const getIoType = (
  node: CustomNodeType,
  handleId: string,
  side: 'input' | 'output',
  nodeDefinitionsMap: NodeDefinitionsMap
): Io | Io[] | '*' => {
  const definition = nodeDefinitionsMap[node.data?.name as string];
  if (!definition) {
    return '*';
  }

  const itemName = stripHandlePrefix(handleId, side);

  if (side === 'input') {
    const inputDefinition =
      definition.input_definitions?.[itemName] ??
      Object.values(definition.input_definitions ?? {}).find(
        item => item.attr_name === itemName
      );
    return inputDefinition?.type ?? '*';
  }

  const outputDefinition =
    definition.output_definitions?.[itemName] ??
    Object.values(definition.output_definitions ?? {}).find(
      item => item.attr_name === itemName
    );
  return outputDefinition?.type ?? '*';
};

const isConnectionRequiredIoType = (ioType: Io | Io[] | '*'): boolean => {
  if (ioType === '*') {
    return false;
  }

  if (Array.isArray(ioType)) {
    for (const type of ioType) {
      if (CONNECTION_REQUIRED_SUBGRAPH_IO_TYPES.has(type)) {
        return true;
      }
    }
    return false;
  }

  return CONNECTION_REQUIRED_SUBGRAPH_IO_TYPES.has(ioType);
};

const shouldHideSubgraphPortByIoType = (ioType: Io | Io[] | '*'): boolean => {
  // TODO: вернуть VARIABLE/SIGNAL порты в subgraph после backend-интеграции этих соединений.
  if (ioType === '*') {
    return false;
  }

  if (Array.isArray(ioType)) {
    return ioType.some(type => HIDDEN_SUBGRAPH_IO_TYPES.has(type));
  }

  return HIDDEN_SUBGRAPH_IO_TYPES.has(ioType);
};

export const buildSubgraphPortID = (
  side: 'input' | 'output',
  internalNodeId: string,
  internalHandleId: string
) => {
  const prefix = side === 'input' ? 'sg-in' : 'sg-out';
  return `${prefix}:${internalNodeId}:${internalHandleId}`;
};

export const buildSubgraphPortLookupKey = (
  subgraphID: string,
  portID: string
): string => `${subgraphID}:${portID}`;

const buildPortMapKey = (
  side: 'input' | 'output',
  internalNodeId: string,
  internalHandleId: string
): string => `${side}:${internalNodeId}:${internalHandleId}`;

const addPort = (
  portMap: Map<string, SubgraphPort>,
  params: {
    side: 'input' | 'output';
    node: CustomNodeType;
    internalHandleId: string;
    connected: boolean;
    ioType: Io | Io[] | '*';
  }
) => {
  const mapKey = buildPortMapKey(
    params.side,
    params.node.id,
    params.internalHandleId
  );

  const existing = portMap.get(mapKey);
  if (existing) {
    if (params.connected && !existing.connected) {
      portMap.set(mapKey, { ...existing, connected: true });
    }
    return;
  }

  if (shouldHideSubgraphPortByIoType(params.ioType)) {
    return;
  }

  portMap.set(mapKey, {
    id: buildSubgraphPortID(
      params.side,
      params.node.id,
      params.internalHandleId
    ),
    side: params.side,
    label: getPortLabel(params.node, params.internalHandleId, params.side),
    nodeDisplayName: getNodeDisplayName(params.node),
    handleDisplayName: getHandleDisplayName(
      params.internalHandleId,
      params.side
    ),
    ioType: params.ioType,
    internalNodeId: params.node.id,
    internalHandleId: params.internalHandleId,
    connected: params.connected,
  });
};

interface BuildSubgraphPortsParams {
  subgraphID: string;
  memberNodes: CustomNodeType[];
  edges: GraphEdgeWithSubgraph[];
  nodeDefinitionsMap: NodeDefinitionsMap;
}

export const buildSubgraphPorts = ({
  memberNodes,
  edges,
  nodeDefinitionsMap,
}: BuildSubgraphPortsParams): SubgraphPort[] => {
  if (memberNodes.length === 0) {
    return [];
  }

  const membersByID = new Map(memberNodes.map(node => [node.id, node]));
  const memberNodeIDs = memberNodes.map(node => node.id);
  const classified = classifyEdgesByMembership(memberNodeIDs, edges);

  const portMap = new Map<string, SubgraphPort>();
  const connectedInputKeys = new Set<string>();
  const connectedOutputKeys = new Set<string>();
  const externalInputKeys = new Set<string>();
  const externalOutputKeys = new Set<string>();

  for (const edge of edges) {
    if (membersByID.has(edge.target) && edge.targetHandle) {
      connectedInputKeys.add(
        buildPortMapKey('input', edge.target, edge.targetHandle)
      );
    }

    if (membersByID.has(edge.source) && edge.sourceHandle) {
      connectedOutputKeys.add(
        buildPortMapKey('output', edge.source, edge.sourceHandle)
      );
    }
  }

  for (const edge of classified.inbound) {
    if (edge.targetHandle) {
      externalInputKeys.add(
        buildPortMapKey('input', edge.target, edge.targetHandle)
      );
    }
  }

  for (const edge of classified.outbound) {
    if (edge.sourceHandle) {
      externalOutputKeys.add(
        buildPortMapKey('output', edge.source, edge.sourceHandle)
      );
    }
  }

  for (const edge of classified.inbound) {
    if (!edge.targetHandle) {
      continue;
    }

    const node = membersByID.get(edge.target);
    if (!node) {
      continue;
    }

    const handleKey = buildPortMapKey('input', node.id, edge.targetHandle);
    externalInputKeys.add(handleKey);

    const ioType = getIoType(
      node,
      edge.targetHandle,
      'input',
      nodeDefinitionsMap
    );
    if (!isConnectionRequiredIoType(ioType)) {
      continue;
    }

    addPort(portMap, {
      side: 'input',
      node,
      internalHandleId: edge.targetHandle,
      connected: true,
      ioType,
    });
  }

  for (const edge of classified.outbound) {
    if (!edge.sourceHandle) {
      continue;
    }

    const node = membersByID.get(edge.source);
    if (!node) {
      continue;
    }

    externalOutputKeys.add(
      buildPortMapKey('output', node.id, edge.sourceHandle)
    );

    addPort(portMap, {
      side: 'output',
      node,
      internalHandleId: edge.sourceHandle,
      connected: true,
      ioType: getIoType(node, edge.sourceHandle, 'output', nodeDefinitionsMap),
    });
  }

  for (const node of memberNodes) {
    const definition = nodeDefinitionsMap[node.data?.name as string];
    if (!definition) {
      continue;
    }

    for (const inputDefinition of Object.values(
      definition.input_definitions ?? {}
    )) {
      if (!isConnectionRequiredIoType(inputDefinition.type)) {
        continue;
      }

      const handleId = `input-${inputDefinition.attr_name}`;
      const handleKey = buildPortMapKey('input', node.id, handleId);
      const connected = connectedInputKeys.has(handleKey);
      const hasExternalConnection = externalInputKeys.has(handleKey);

      if (connected && !hasExternalConnection) {
        continue;
      }

      addPort(portMap, {
        side: 'input',
        node,
        internalHandleId: handleId,
        connected,
        ioType: inputDefinition.type,
      });
    }

    for (const outputDefinition of Object.values(
      definition.output_definitions ?? {}
    )) {
      const handleId = `output-${outputDefinition.attr_name}`;
      const handleKey = buildPortMapKey('output', node.id, handleId);
      const connected = connectedOutputKeys.has(handleKey);
      const hasExternalConnection = externalOutputKeys.has(handleKey);

      if (connected && !hasExternalConnection) {
        continue;
      }

      addPort(portMap, {
        side: 'output',
        node,
        internalHandleId: handleId,
        connected,
        ioType: outputDefinition.type,
      });
    }
  }

  const ports = Array.from(portMap.values());

  ports.sort((a, b) => {
    if (a.side !== b.side) {
      return a.side === 'input' ? -1 : 1;
    }
    if (a.connected !== b.connected) {
      return a.connected ? -1 : 1;
    }
    return a.label.localeCompare(b.label);
  });

  return ports;
};
