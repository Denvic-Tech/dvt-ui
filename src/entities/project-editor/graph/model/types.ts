import { Edge, Node } from '@xyflow/react';

import type {
  Metadata,
  NodeInputValue,
  SubgraphUiSchema,
} from '@/shared/gatewayClient';
import { ApiErrorPayload } from '@/shared/lib/errors';

export interface CustomNodeData {
  name: string;
  displayName: string;
  comment?: string;
  storeEnabled?: boolean;
  showSignalIo?: boolean;
  showVariablesIo?: boolean;
  inputValues: {
    [inputName: string]: NodeInputValue;
  };
  metadata?: { [outputName: string]: Metadata };

  [key: string]: unknown;
}

export type CustomNodeType = Node<CustomNodeData, 'custom' | 'widget'> & {
  subgraphId?: string | null;
};

export type CustomEdgeType = Edge & {
  subgraphId?: string | null;
};

export interface Output {
  nodeID: string;
  inputName: string;
}

export interface Input {
  nodeID: string;
  outputName: string;
}

export interface GraphSliceState {
  nodeDataByID: { [nodeID: string]: CustomNodeData };
  nodesByID: { [nodeID: string]: CustomNodeType };
  edgesByID: { [edgeID: string]: CustomEdgeType };
  subgraphsByID: { [subgraphID: string]: SubgraphUiSchema };
  outputsBySourceNodeID: {
    [sourceNodeID: string]: { [sourceOutputName: string]: Output };
  };
  inputsByTargetNodeID: {
    [targetNodeID: string]: { [targetInputName: string]: Input };
  };
  graphLoading: boolean;
  graphLoaded: boolean;
  graphLoadingError: ApiErrorPayload | null;
  lastLoadedProjectID: string | null;
}
