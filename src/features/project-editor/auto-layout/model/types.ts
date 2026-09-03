import type { Edge, XYPosition } from '@xyflow/react';

import type { CustomNodeType } from '@/entities/project-editor/graph';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';

export interface AutoLayoutSize {
  width: number;
  height: number;
}

export interface AutoLayoutRect extends AutoLayoutSize, XYPosition {}

export interface GraphAutoLayoutRequest {
  nodes: CustomNodeType[];
  edges: Edge[];
  subgraphs: SubgraphUiSchema[];
  nodeSizesByID: Record<string, AutoLayoutSize>;
  collapsedSubgraphSizesByID?: Record<string, AutoLayoutSize>;
}

export interface GraphAutoLayoutResult {
  nodePositions: Record<string, XYPosition>;
  subgraphPositions: Record<string, XYPosition>;
  subgraphLayouts: Record<string, AutoLayoutRect>;
  bounds: AutoLayoutRect;
}
