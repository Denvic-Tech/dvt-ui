import type {
  GraphEdgeWithSubgraph,
  NodeDefinitionsMap,
  SubgraphProjection,
} from '@/features/project-editor/subgraph';

import { getIOTypeColor } from '@/entities/node/node-io';
import { CustomNodeType } from '@/entities/project-editor/graph';

import { IO_TYPE_COLORS } from '@/shared/colors';
import type { Io } from '@/shared/gatewayClient';

export const CUSTOM_EDGE_BASE_STROKE = '#b1b1b7';
export const CUSTOM_EDGE_COLOR_BLEND_RATIO = 0.25;

export interface CustomEdgeUiGradient {
  sourceColor?: string;
  targetColor?: string;
}

type EdgeDataRecord = Record<string, unknown> & {
  uiGradient?: CustomEdgeUiGradient;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const buildHandleLookupKey = (nodeId: string, handleId: string): string =>
  `${nodeId}::${handleId}`;

const resolveIoColor = (ioType: Io | Io[] | '*'): string =>
  ioType === '*' ? IO_TYPE_COLORS['*'] : getIOTypeColor(ioType);

const clampChannel = (value: number): number =>
  Math.min(255, Math.max(0, Math.round(value)));

const parseHexColor = (color: string): [number, number, number] | null => {
  const normalized = color.trim();
  const hex = normalized.startsWith('#') ? normalized.slice(1) : normalized;

  if (hex.length === 3) {
    const [r, g, b] = hex.split('');
    return [
      Number.parseInt(`${r}${r}`, 16),
      Number.parseInt(`${g}${g}`, 16),
      Number.parseInt(`${b}${b}`, 16),
    ];
  }

  if (hex.length !== 6) {
    return null;
  }

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
};

export const blendEdgeColorWithHandle = (
  handleColor: string,
  ratio = CUSTOM_EDGE_COLOR_BLEND_RATIO,
  baseColor = CUSTOM_EDGE_BASE_STROKE
): string => {
  const baseChannels = parseHexColor(baseColor);
  const handleChannels = parseHexColor(handleColor);

  if (!baseChannels || !handleChannels) {
    return baseColor;
  }

  const [baseR, baseG, baseB] = baseChannels;
  const [handleR, handleG, handleB] = handleChannels;

  const mixed = [
    clampChannel(baseR + (handleR - baseR) * ratio),
    clampChannel(baseG + (handleG - baseG) * ratio),
    clampChannel(baseB + (handleB - baseB) * ratio),
  ];

  return `#${mixed.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
};

const getEdgeHandleColor = (
  lookup: ReadonlyMap<string, string>,
  nodeId: string | null | undefined,
  handleId: string | null | undefined
): string | undefined => {
  if (!nodeId || !handleId) {
    return undefined;
  }

  const handleColor = lookup.get(buildHandleLookupKey(nodeId, handleId));
  if (!handleColor) {
    return undefined;
  }

  return blendEdgeColorWithHandle(handleColor);
};

export const buildHandleColorLookup = (params: {
  nodes: readonly CustomNodeType[];
  nodeDefinitionsMap: NodeDefinitionsMap;
  portsBySubgraphID: SubgraphProjection['portsBySubgraphID'];
}): Map<string, string> => {
  const { nodes, nodeDefinitionsMap, portsBySubgraphID } = params;
  const lookup = new Map<string, string>();

  for (const node of nodes) {
    const definition = nodeDefinitionsMap[node.data?.name as string];
    if (!definition) {
      continue;
    }

    for (const inputDefinition of Object.values(
      definition.input_definitions ?? {}
    )) {
      lookup.set(
        buildHandleLookupKey(node.id, `input-${inputDefinition.attr_name}`),
        resolveIoColor(inputDefinition.type)
      );
    }

    for (const outputDefinition of Object.values(
      definition.output_definitions ?? {}
    )) {
      lookup.set(
        buildHandleLookupKey(node.id, `output-${outputDefinition.attr_name}`),
        resolveIoColor(outputDefinition.type)
      );
    }
  }

  for (const [subgraphId, ports] of Object.entries(portsBySubgraphID)) {
    for (const port of ports) {
      lookup.set(
        buildHandleLookupKey(subgraphId, port.id),
        resolveIoColor(port.ioType)
      );
    }
  }

  return lookup;
};

export const buildCustomEdgeUiGradient = (
  edge: Pick<
    GraphEdgeWithSubgraph,
    'source' | 'sourceHandle' | 'target' | 'targetHandle'
  >,
  handleColorLookup: ReadonlyMap<string, string>
): CustomEdgeUiGradient | undefined => {
  const sourceColor = getEdgeHandleColor(
    handleColorLookup,
    edge.source,
    edge.sourceHandle
  );
  const targetColor = getEdgeHandleColor(
    handleColorLookup,
    edge.target,
    edge.targetHandle
  );

  if (!sourceColor && !targetColor) {
    return undefined;
  }

  return {
    ...(sourceColor ? { sourceColor } : {}),
    ...(targetColor ? { targetColor } : {}),
  };
};

export const getCustomEdgeUiGradient = (
  value: unknown
): CustomEdgeUiGradient | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const uiGradient = (value as EdgeDataRecord).uiGradient;
  if (!isRecord(uiGradient)) {
    return undefined;
  }

  const sourceColor =
    typeof uiGradient['sourceColor'] === 'string'
      ? uiGradient['sourceColor']
      : undefined;
  const targetColor =
    typeof uiGradient['targetColor'] === 'string'
      ? uiGradient['targetColor']
      : undefined;

  if (!sourceColor && !targetColor) {
    return undefined;
  }

  return {
    ...(sourceColor ? { sourceColor } : {}),
    ...(targetColor ? { targetColor } : {}),
  };
};
