import type { Edge, Node } from '@xyflow/react';

import { CustomNodeType } from '@/entities/project-editor/graph';

import type {
  Io,
  NodeDefinition,
  SubgraphUiSchema,
} from '@/shared/gatewayClient';

export type NodeDefinitionsMap = Record<string, NodeDefinition>;

export type GraphEdgeWithSubgraph = Edge & {
  subgraphId?: string | null;
};

export type PortSide = 'input' | 'output';

export interface SubgraphPort {
  id: string;
  side: PortSide;
  label: string;
  nodeDisplayName: string;
  handleDisplayName: string;
  ioType: Io | Io[] | '*';
  internalNodeId: string;
  internalHandleId: string;
  connected: boolean;
}

export interface SubgraphNodeData {
  [key: string]: unknown;
  name: 'subgraph';
  displayName: string;
  comment?: string;
  color?: string;
  ports: SubgraphPort[];
  memberNodeIDs: string[];
}

export type SubgraphNodeType = Node<SubgraphNodeData, 'subgraph'>;

export type SubgraphPanelDropSide = 'left' | 'right' | 'top' | 'bottom';

export interface SubgraphPanelNodeData {
  [key: string]: unknown;
  name: 'subgraphPanel';
  subgraphId: string;
  displayName: string;
  comment?: string;
  color?: string;
  memberNodeIDs: string[];
  editMode: boolean;
  extractMode?: boolean;
  dropHoverActive?: boolean;
  dropHoverSide?: SubgraphPanelDropSide;
}

export type SubgraphPanelNodeType = Node<
  SubgraphPanelNodeData,
  'subgraphPanel'
>;

export type GraphEditorNode =
  | CustomNodeType
  | SubgraphNodeType
  | SubgraphPanelNodeType;

export interface SubgraphPanelLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SubgraphPanelLayoutMap = Record<string, SubgraphPanelLayout>;

export interface SubgraphProjection {
  visibleNodes: GraphEditorNode[];
  visibleEdges: GraphEdgeWithSubgraph[];
  subgraphNodesByID: Record<string, SubgraphNodeType>;
  panelNodesBySubgraphID: Record<string, SubgraphPanelNodeType>;
  portsBySubgraphID: Record<string, SubgraphPort[]>;
  memberNodeIDsBySubgraphID: Record<string, string[]>;
  portLookup: Record<string, SubgraphPort>;
  proxyToRealEdgeID: Record<string, string>;
  hiddenNodeIDs: Set<string>;
  hiddenEdgeIDs: Set<string>;
}

export interface BuildSubgraphProjectionParams {
  nodes: CustomNodeType[];
  edges: GraphEdgeWithSubgraph[];
  subgraphs: SubgraphUiSchema[];
  nodeDefinitionsMap: NodeDefinitionsMap;
  panelLayoutBySubgraphID?: SubgraphPanelLayoutMap;
  panelEditModeBySubgraphID?: Record<string, boolean>;
  extractMode?: boolean;
}

export interface ResolvedSubgraphConnection {
  source: string;
  sourceHandle: string | null;
  target: string;
  targetHandle: string | null;
  subgraphId: string | null;
}
