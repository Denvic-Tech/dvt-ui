import { CustomNodeData } from '@/entities/project-editor/graph';

import { NodeDefinition } from '@/shared/gatewayClient';

export interface NodeContextMenuPosition {
  x: number;
  y: number;
}

export interface NodeContextMenuOpenPayload {
  position: NodeContextMenuPosition;
  nodeID: string;
  nodeDefinition: NodeDefinition;
  nodeData: CustomNodeData;
}

export interface NodeContextMenuState {
  open: boolean;
  position: NodeContextMenuPosition | null;
  nodeID: string | null;
  nodeDefinition: NodeDefinition | null;
  nodeData: CustomNodeData | null;
}
