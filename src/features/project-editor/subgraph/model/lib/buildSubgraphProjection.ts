import {
  buildSubgraphPortID,
  buildSubgraphPortLookupKey,
  buildSubgraphPorts,
} from '@/features/project-editor/subgraph';

import { CustomNodeType } from '@/entities/project-editor/graph';

import type {
  BuildSubgraphProjectionParams,
  GraphEdgeWithSubgraph,
  SubgraphNodeType,
  SubgraphPanelLayout,
  SubgraphPanelNodeType,
  SubgraphProjection,
} from '../types.ts';

import { buildPanelLayoutFromMembers } from './panelLayout.ts';

const buildSubgraphPanelNodeID = (subgraphID: string): string =>
  `subgraph-panel:${subgraphID}`;

const SUBGRAPH_PANEL_PADDING_X = 40;
const SUBGRAPH_PANEL_PADDING_TOP = 52;
const SUBGRAPH_PANEL_PADDING_BOTTOM = 40;
const SUBGRAPH_EXPANDED_LAYER_Z_INDEX = 4;
const DEFAULT_NODE_WIDTH = 260;
const DEFAULT_NODE_HEIGHT = 120;

const resolvePositiveSize = (
  value: number | string | null | undefined
): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 1) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 1) {
      return parsed;
    }
  }
  return null;
};

export const getSubgraphIDFromPanelNodeID = (
  panelNodeID: string
): string | null => {
  if (!panelNodeID.startsWith('subgraph-panel:')) {
    return null;
  }
  const value = panelNodeID.slice('subgraph-panel:'.length).trim();
  return value || null;
};

const resolvePanelLayout = (params: {
  subgraphID: string;
  memberNodes: CustomNodeType[];
  panelLayoutBySubgraphID?: BuildSubgraphProjectionParams['panelLayoutBySubgraphID'];
  nodeSizeByID: Record<string, { width: number; height: number }>;
}): SubgraphPanelLayout => {
  const { subgraphID, memberNodes, panelLayoutBySubgraphID, nodeSizeByID } =
    params;

  const externalLayout = panelLayoutBySubgraphID?.[subgraphID];
  if (externalLayout) {
    return externalLayout;
  }

  const sizedMembers = memberNodes.map(node => {
    const size = nodeSizeByID[node.id];
    return {
      id: node.id,
      position: node.position,
      width:
        resolvePositiveSize(size?.width) ??
        resolvePositiveSize(node.width) ??
        DEFAULT_NODE_WIDTH,
      height:
        resolvePositiveSize(size?.height) ??
        resolvePositiveSize(node.height) ??
        DEFAULT_NODE_HEIGHT,
    };
  });

  return buildPanelLayoutFromMembers(sizedMembers, {
    paddingX: SUBGRAPH_PANEL_PADDING_X,
    paddingTop: SUBGRAPH_PANEL_PADDING_TOP,
    paddingBottom: SUBGRAPH_PANEL_PADDING_BOTTOM,
    minWidth: 520,
    minHeight: 340,
  });
};

const buildSubgraphNode = (params: {
  subgraph: BuildSubgraphProjectionParams['subgraphs'][number];
  memberNodes: CustomNodeType[];
  ports: SubgraphProjection['portsBySubgraphID'][string];
}): SubgraphNodeType => {
  const { subgraph, memberNodes, ports } = params;

  return {
    id: subgraph.id,
    type: 'subgraph',
    position: subgraph.position,
    selected: Boolean(subgraph.selected),
    data: {
      name: 'subgraph',
      displayName:
        subgraph.data.displayName || subgraph.data.name || subgraph.id,
      ports,
      memberNodeIDs: memberNodes.map(node => node.id),
      ...(subgraph.data.color ? { color: subgraph.data.color } : {}),
      ...(subgraph.data.comment != null
        ? { comment: subgraph.data.comment }
        : {}),
    },
  };
};

const buildSubgraphPanelNode = (params: {
  subgraph: BuildSubgraphProjectionParams['subgraphs'][number];
  memberNodes: CustomNodeType[];
  layout: SubgraphPanelLayout;
  editMode: boolean;
  extractMode: boolean;
}): SubgraphPanelNodeType => {
  const { subgraph, memberNodes, layout, editMode, extractMode } = params;

  return {
    id: buildSubgraphPanelNodeID(subgraph.id),
    type: 'subgraphPanel',
    position: {
      x: layout.x,
      y: layout.y,
    },
    selected: Boolean(subgraph.selected),
    width: layout.width,
    height: layout.height,
    draggable: !editMode,
    selectable: true,
    zIndex: SUBGRAPH_EXPANDED_LAYER_Z_INDEX,
    dragHandle: '.subgraph-panel-drag-surface',
    ...(extractMode ? { className: 'subgraph-panel-extract-ready' } : {}),
    data: {
      name: 'subgraphPanel',
      subgraphId: subgraph.id,
      displayName:
        subgraph.data.displayName || subgraph.data.name || subgraph.id,
      memberNodeIDs: memberNodes.map(node => node.id),
      editMode,
      extractMode,
      ...(subgraph.data.color ? { color: subgraph.data.color } : {}),
      ...(subgraph.data.comment != null
        ? { comment: subgraph.data.comment }
        : {}),
    },
    style: {
      width: layout.width,
      height: layout.height,
      zIndex: SUBGRAPH_EXPANDED_LAYER_Z_INDEX,
      transition: editMode
        ? 'transform 170ms cubic-bezier(0.22, 1, 0.36, 1), width 170ms cubic-bezier(0.22, 1, 0.36, 1), height 170ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'width 170ms cubic-bezier(0.22, 1, 0.36, 1), height 170ms cubic-bezier(0.22, 1, 0.36, 1)',
    },
  };
};

const buildProxyEdge = (params: {
  edge: GraphEdgeWithSubgraph;
  sourceSubgraphID: string | null;
  targetSubgraphID: string | null;
}): GraphEdgeWithSubgraph => {
  const { edge, sourceSubgraphID, targetSubgraphID } = params;

  const sourceHandle =
    sourceSubgraphID && edge.sourceHandle
      ? buildSubgraphPortID('output', edge.source, edge.sourceHandle)
      : (edge.sourceHandle ?? null);
  const targetHandle =
    targetSubgraphID && edge.targetHandle
      ? buildSubgraphPortID('input', edge.target, edge.targetHandle)
      : (edge.targetHandle ?? null);

  return {
    ...edge,
    id: `proxy:${edge.id}`,
    source: sourceSubgraphID || edge.source,
    sourceHandle,
    target: targetSubgraphID || edge.target,
    targetHandle,
    data: {
      ...(edge.data as Record<string, unknown> | undefined),
      synthetic: true,
      realEdgeId: edge.id,
    },
  };
};

export const buildSubgraphProjection = ({
  nodes,
  edges,
  subgraphs,
  nodeDefinitionsMap,
  panelLayoutBySubgraphID,
  panelEditModeBySubgraphID,
  extractMode,
}: BuildSubgraphProjectionParams): SubgraphProjection => {
  const nodesByID = new Map(nodes.map(node => [node.id, node]));

  const membersBySubgraphID: Record<string, CustomNodeType[]> = {};
  for (const node of nodes) {
    const subgraphID = node.subgraphId;
    if (!subgraphID) {
      continue;
    }
    if (!membersBySubgraphID[subgraphID]) {
      membersBySubgraphID[subgraphID] = [];
    }
    membersBySubgraphID[subgraphID].push(node);
  }

  const hiddenNodeIDs = new Set<string>();
  const hiddenEdgeIDs = new Set<string>();
  const proxyToRealEdgeID: Record<string, string> = {};

  const subgraphNodesByID: Record<string, SubgraphNodeType> = {};
  const panelNodesBySubgraphID: Record<string, SubgraphPanelNodeType> = {};
  const portsBySubgraphID: Record<
    string,
    SubgraphProjection['portsBySubgraphID'][string]
  > = {};
  const memberNodeIDsBySubgraphID: Record<string, string[]> = {};
  const portLookup: Record<string, SubgraphProjection['portLookup'][string]> =
    {};

  const collapsedSubgraphIDs = new Set<string>();

  const nodeSizeByID: Record<string, { width: number; height: number }> = {};
  for (const node of nodes) {
    const style = node.style as
      | { width?: number | string; height?: number | string }
      | undefined;
    nodeSizeByID[node.id] = {
      width:
        resolvePositiveSize(node.width) ??
        resolvePositiveSize(style?.width) ??
        DEFAULT_NODE_WIDTH,
      height:
        resolvePositiveSize(node.height) ??
        resolvePositiveSize(style?.height) ??
        DEFAULT_NODE_HEIGHT,
    };
  }

  for (const subgraph of subgraphs) {
    const memberNodes = membersBySubgraphID[subgraph.id] ?? [];
    memberNodeIDsBySubgraphID[subgraph.id] = memberNodes.map(node => node.id);

    const ports = buildSubgraphPorts({
      subgraphID: subgraph.id,
      memberNodes,
      edges,
      nodeDefinitionsMap,
    });

    portsBySubgraphID[subgraph.id] = ports;
    for (const port of ports) {
      portLookup[buildSubgraphPortLookupKey(subgraph.id, port.id)] = port;
    }

    const expanded = Boolean(subgraph.expanded);
    if (!expanded) {
      collapsedSubgraphIDs.add(subgraph.id);
      for (const member of memberNodes) {
        hiddenNodeIDs.add(member.id);
      }

      subgraphNodesByID[subgraph.id] = buildSubgraphNode({
        subgraph,
        memberNodes,
        ports,
      });
      continue;
    }

    const layout = resolvePanelLayout({
      subgraphID: subgraph.id,
      memberNodes,
      panelLayoutBySubgraphID,
      nodeSizeByID,
    });

    panelNodesBySubgraphID[subgraph.id] = buildSubgraphPanelNode({
      subgraph,
      memberNodes,
      layout,
      editMode: Boolean(panelEditModeBySubgraphID?.[subgraph.id]),
      extractMode: Boolean(extractMode),
    });
  }

  const visibleEdges: GraphEdgeWithSubgraph[] = [];

  for (const edge of edges) {
    const sourceSubgraphID = nodesByID.get(edge.source)?.subgraphId ?? null;
    const targetSubgraphID = nodesByID.get(edge.target)?.subgraphId ?? null;

    const sourceCollapsed = Boolean(
      sourceSubgraphID && collapsedSubgraphIDs.has(sourceSubgraphID)
    );
    const targetCollapsed = Boolean(
      targetSubgraphID && collapsedSubgraphIDs.has(targetSubgraphID)
    );

    if (
      sourceCollapsed &&
      targetCollapsed &&
      sourceSubgraphID === targetSubgraphID
    ) {
      hiddenEdgeIDs.add(edge.id);
      continue;
    }

    if (!sourceCollapsed && !targetCollapsed) {
      visibleEdges.push(edge);
      continue;
    }

    const proxyEdge = buildProxyEdge({
      edge,
      sourceSubgraphID: sourceCollapsed ? sourceSubgraphID : null,
      targetSubgraphID: targetCollapsed ? targetSubgraphID : null,
    });

    visibleEdges.push(proxyEdge);
    hiddenEdgeIDs.add(edge.id);
    proxyToRealEdgeID[proxyEdge.id] = edge.id;
  }

  const visibleNodes: SubgraphProjection['visibleNodes'] = [];

  for (const panelNode of Object.values(panelNodesBySubgraphID)) {
    visibleNodes.push(panelNode);
  }

  for (const node of nodes) {
    if (!hiddenNodeIDs.has(node.id)) {
      visibleNodes.push(node);
    }
  }

  for (const subgraphNode of Object.values(subgraphNodesByID)) {
    visibleNodes.push(subgraphNode);
  }

  return {
    visibleNodes,
    visibleEdges,
    subgraphNodesByID,
    panelNodesBySubgraphID,
    portsBySubgraphID,
    memberNodeIDsBySubgraphID,
    portLookup,
    proxyToRealEdgeID,
    hiddenNodeIDs,
    hiddenEdgeIDs,
  };
};
