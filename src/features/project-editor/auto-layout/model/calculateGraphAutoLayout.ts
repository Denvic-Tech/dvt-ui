import type { Edge, XYPosition } from '@xyflow/react';
import type { ELK, ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api';

import type { CustomNodeType } from '@/entities/project-editor/graph';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';

import type {
  AutoLayoutRect,
  AutoLayoutSize,
  GraphAutoLayoutRequest,
  GraphAutoLayoutResult,
} from './types';

type LayoutEngine = Pick<ELK, 'layout'>;

const DEFAULT_NODE_SIZE: AutoLayoutSize = {
  width: 260,
  height: 120,
};
const DEFAULT_COLLAPSED_SUBGRAPH_SIZE: AutoLayoutSize = {
  width: 360,
  height: 160,
};
const MIN_SUBGRAPH_SIZE: AutoLayoutSize = {
  width: 520,
  height: 340,
};

const ROOT_LAYOUT_OPTIONS = Object.freeze({
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.spacing.nodeNode': '72',
  'elk.layered.spacing.nodeNodeBetweenLayers': '140',
  'elk.spacing.componentComponent': '120',
  'elk.padding': '[top=40,left=40,bottom=40,right=40]',
});

const SUBGRAPH_LAYOUT_OPTIONS = Object.freeze({
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '72',
  'elk.layered.spacing.nodeNodeBetweenLayers': '140',
  'elk.spacing.componentComponent': '120',
  'elk.padding': '[top=52,left=40,bottom=40,right=40]',
  'elk.nodeSize.constraints': 'MINIMUM_SIZE',
  'elk.nodeSize.minimum': `(${MIN_SUBGRAPH_SIZE.width},${MIN_SUBGRAPH_SIZE.height})`,
});

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 1;

const normalizeSize = (
  value: AutoLayoutSize | undefined,
  fallback: AutoLayoutSize
): AutoLayoutSize => ({
  width: isPositiveNumber(value?.width) ? value.width : fallback.width,
  height: isPositiveNumber(value?.height) ? value.height : fallback.height,
});

const compareByPositionThenID = <
  T extends { id: string; position: XYPosition },
>(
  left: T,
  right: T
) =>
  left.position.x - right.position.x ||
  left.position.y - right.position.y ||
  left.id.localeCompare(right.id);

const toElkLeaf = (
  node: CustomNodeType,
  nodeSizesByID: GraphAutoLayoutRequest['nodeSizesByID']
): ElkNode => {
  const size = normalizeSize(nodeSizesByID[node.id], DEFAULT_NODE_SIZE);
  return {
    id: node.id,
    width: size.width,
    height: size.height,
  };
};

const toElkEdge = (edge: Edge, source: string, target: string) => ({
  id: edge.id,
  sources: [source],
  targets: [target],
});

const getOutputPosition = (node: ElkNode) => ({
  x: node.x ?? 0,
  y: node.y ?? 0,
});

const getOutputRect = (node: ElkNode): AutoLayoutRect => ({
  ...getOutputPosition(node),
  width: node.width ?? 0,
  height: node.height ?? 0,
});

const buildEmptyResult = (): GraphAutoLayoutResult => ({
  nodePositions: {},
  subgraphPositions: {},
  subgraphLayouts: {},
  bounds: { x: 0, y: 0, width: 0, height: 0 },
});

const collectSubgraphMembers = (
  nodes: CustomNodeType[],
  subgraphsByID: Map<string, SubgraphUiSchema>
) => {
  const membersBySubgraphID = new Map<string, CustomNodeType[]>();

  for (const node of nodes) {
    const subgraphID = node.subgraphId;
    if (!subgraphID || !subgraphsByID.has(subgraphID)) {
      continue;
    }
    const members = membersBySubgraphID.get(subgraphID) ?? [];
    members.push(node);
    membersBySubgraphID.set(subgraphID, members);
  }

  for (const members of membersBySubgraphID.values()) {
    members.sort(compareByPositionThenID);
  }

  return membersBySubgraphID;
};

const buildLayoutGraphs = ({
  nodes,
  edges,
  subgraphs,
  nodeSizesByID,
  collapsedSubgraphSizesByID = {},
}: GraphAutoLayoutRequest) => {
  const subgraphsByID = new Map(subgraphs.map(item => [item.id, item]));
  const nodesByID = new Map(nodes.map(node => [node.id, node]));
  const membersBySubgraphID = collectSubgraphMembers(nodes, subgraphsByID);
  const internalEdgesBySubgraphID = new Map<string, ElkExtendedEdge[]>();
  const rootEdges: ElkExtendedEdge[] = [];

  const resolveSubgraphID = (node: CustomNodeType | undefined) => {
    const subgraphID = node?.subgraphId;
    return subgraphID && subgraphsByID.has(subgraphID) ? subgraphID : null;
  };

  const resolveRootEndpoint = (
    node: CustomNodeType,
    subgraphID: string | null
  ) => {
    if (!subgraphID) {
      return node.id;
    }
    return subgraphsByID.get(subgraphID)?.expanded ? node.id : subgraphID;
  };

  for (const edge of [...edges].sort((a, b) => a.id.localeCompare(b.id))) {
    const sourceNode = nodesByID.get(edge.source);
    const targetNode = nodesByID.get(edge.target);
    if (!sourceNode || !targetNode) {
      continue;
    }

    const sourceSubgraphID = resolveSubgraphID(sourceNode);
    const targetSubgraphID = resolveSubgraphID(targetNode);

    if (sourceSubgraphID && sourceSubgraphID === targetSubgraphID) {
      const internalEdges =
        internalEdgesBySubgraphID.get(sourceSubgraphID) ?? [];
      internalEdges.push(toElkEdge(edge, sourceNode.id, targetNode.id));
      internalEdgesBySubgraphID.set(sourceSubgraphID, internalEdges);
      continue;
    }

    const source = resolveRootEndpoint(sourceNode, sourceSubgraphID);
    const target = resolveRootEndpoint(targetNode, targetSubgraphID);
    if (source === target) {
      continue;
    }
    rootEdges.push(toElkEdge(edge, source, target));
  }

  const topLevelNodes = nodes
    .filter(node => !resolveSubgraphID(node))
    .sort(compareByPositionThenID)
    .map(node => toElkLeaf(node, nodeSizesByID));

  const sortedSubgraphs = [...subgraphs].sort(compareByPositionThenID);
  const collapsedGraphs: { subgraphID: string; graph: ElkNode }[] = [];
  const subgraphNodes: ElkNode[] = sortedSubgraphs.map(subgraph => {
    const members = membersBySubgraphID.get(subgraph.id) ?? [];
    const internalEdges = internalEdgesBySubgraphID.get(subgraph.id) ?? [];

    if (subgraph.expanded && members.length > 0) {
      return {
        id: subgraph.id,
        width: MIN_SUBGRAPH_SIZE.width,
        height: MIN_SUBGRAPH_SIZE.height,
        layoutOptions: SUBGRAPH_LAYOUT_OPTIONS,
        children: members.map(node => toElkLeaf(node, nodeSizesByID)),
        edges: internalEdges,
      };
    }

    if (!subgraph.expanded && members.length > 0) {
      collapsedGraphs.push({
        subgraphID: subgraph.id,
        graph: {
          id: `internal:${subgraph.id}`,
          width: MIN_SUBGRAPH_SIZE.width,
          height: MIN_SUBGRAPH_SIZE.height,
          layoutOptions: SUBGRAPH_LAYOUT_OPTIONS,
          children: members.map(node => toElkLeaf(node, nodeSizesByID)),
          edges: internalEdges,
        },
      });
    }

    const size = subgraph.expanded
      ? MIN_SUBGRAPH_SIZE
      : normalizeSize(
          collapsedSubgraphSizesByID[subgraph.id],
          DEFAULT_COLLAPSED_SUBGRAPH_SIZE
        );
    return {
      id: subgraph.id,
      width: size.width,
      height: size.height,
    };
  });

  const rootGraph: ElkNode = {
    id: 'dvt-auto-layout-root',
    layoutOptions: ROOT_LAYOUT_OPTIONS,
    children: [...topLevelNodes, ...subgraphNodes],
    edges: rootEdges,
  };

  return {
    rootGraph,
    collapsedGraphs,
    subgraphsByID,
  };
};

export const createGraphAutoLayoutSignature = ({
  nodes,
  edges,
  subgraphs,
}: Pick<GraphAutoLayoutRequest, 'nodes' | 'edges' | 'subgraphs'>) => {
  const nodeSignature = [...nodes]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      node =>
        `${node.id}:${node.subgraphId ?? ''}:${node.position.x}:${node.position.y}:${node.width ?? ''}:${node.height ?? ''}`
    );
  const edgeSignature = [...edges]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      edge =>
        `${edge.id}:${edge.source}:${edge.sourceHandle ?? ''}:${edge.target}:${edge.targetHandle ?? ''}`
    );
  const subgraphSignature = [...subgraphs]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      subgraph =>
        `${subgraph.id}:${Boolean(subgraph.expanded)}:${subgraph.position.x}:${subgraph.position.y}`
    );

  return JSON.stringify([nodeSignature, edgeSignature, subgraphSignature]);
};

export const calculateGraphAutoLayout = async (
  request: GraphAutoLayoutRequest,
  engine: LayoutEngine
): Promise<GraphAutoLayoutResult> => {
  const { rootGraph, collapsedGraphs, subgraphsByID } =
    buildLayoutGraphs(request);

  if (!rootGraph.children?.length) {
    return buildEmptyResult();
  }

  const [layoutedRoot, ...layoutedCollapsedGraphs] = await Promise.all([
    engine.layout(rootGraph),
    ...collapsedGraphs.map(({ graph }) => engine.layout(graph)),
  ]);
  const collapsedLayoutBySubgraphID = new Map(
    collapsedGraphs.map((item, index) => [
      item.subgraphID,
      layoutedCollapsedGraphs[index],
    ])
  );

  const result: GraphAutoLayoutResult = {
    nodePositions: {},
    subgraphPositions: {},
    subgraphLayouts: {},
    bounds: {
      x: layoutedRoot.x ?? 0,
      y: layoutedRoot.y ?? 0,
      width: layoutedRoot.width ?? 0,
      height: layoutedRoot.height ?? 0,
    },
  };

  for (const child of layoutedRoot.children ?? []) {
    const subgraph = subgraphsByID.get(child.id);
    if (!subgraph) {
      result.nodePositions[child.id] = getOutputPosition(child);
      continue;
    }

    const subgraphPosition = getOutputPosition(child);
    result.subgraphPositions[subgraph.id] = subgraphPosition;

    if (subgraph.expanded && child.children?.length) {
      result.subgraphLayouts[subgraph.id] = getOutputRect(child);
      for (const member of child.children) {
        result.nodePositions[member.id] = {
          x: subgraphPosition.x + (member.x ?? 0),
          y: subgraphPosition.y + (member.y ?? 0),
        };
      }
      continue;
    }

    const collapsedLayout = collapsedLayoutBySubgraphID.get(subgraph.id);
    const panelWidth = Math.max(
      collapsedLayout?.width ?? MIN_SUBGRAPH_SIZE.width,
      MIN_SUBGRAPH_SIZE.width
    );
    const panelHeight = Math.max(
      collapsedLayout?.height ?? MIN_SUBGRAPH_SIZE.height,
      MIN_SUBGRAPH_SIZE.height
    );
    result.subgraphLayouts[subgraph.id] = {
      ...subgraphPosition,
      width: panelWidth,
      height: panelHeight,
    };

    for (const member of collapsedLayout?.children ?? []) {
      result.nodePositions[member.id] = {
        x: subgraphPosition.x + (member.x ?? 0),
        y: subgraphPosition.y + (member.y ?? 0),
      };
    }
  }

  return result;
};
