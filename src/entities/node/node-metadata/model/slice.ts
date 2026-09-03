import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { Metadata, NodeMetadata } from '@/shared/gatewayClient';
import { wsMessageActions } from '@/shared/wsMessageActions';

export interface NodeMetadataState {
  nodeMetadataByID: { [nodeID: string]: NodeMetadata };
  nodeMetadataActuality: { [nodeID: string]: boolean };
}

const initialState: NodeMetadataState = {
  nodeMetadataByID: {},
  nodeMetadataActuality: {},
};

type NodeOutputMetadata = Exclude<NodeMetadata[string], null>;

const sanitizeMetadata = <T extends Metadata | NodeOutputMetadata>(
  metadata: T
): T => {
  if (metadata.type !== 'DATABASE') {
    return metadata;
  }

  const { connection_string: _legacyConnectionString, ...descriptor } =
    metadata;
  return descriptor as T;
};

const sanitizeNodeMetadata = (metadata: NodeMetadata): NodeMetadata =>
  Object.fromEntries(
    Object.entries(metadata).map(([outputName, outputMetadata]) => [
      outputName,
      outputMetadata ? sanitizeMetadata(outputMetadata) : outputMetadata,
    ])
  );

export const nodeMetadataSlice = createSlice({
  name: 'nodeMetadata',
  initialState,
  reducers: {
    // --- Set Metadata ---
    setNodesMetadata: (
      state,
      action: PayloadAction<{ [nodeID: string]: NodeMetadata }>
    ) => {
      state.nodeMetadataByID = Object.fromEntries(
        Object.entries(action.payload).map(([nodeID, metadata]) => [
          nodeID,
          sanitizeNodeMetadata(metadata),
        ])
      );
      state.nodeMetadataActuality = Object.fromEntries(
        Object.keys(action.payload).map(nodeID => [nodeID, true])
      );
    },
    setNodeMetadata: (
      state,
      action: PayloadAction<{ nodeID: string; metadata: NodeMetadata }>
    ) => {
      const { nodeID, metadata } = action.payload;
      state.nodeMetadataByID[nodeID] = sanitizeNodeMetadata(metadata);
      state.nodeMetadataActuality[nodeID] = true;
    },
    setOutputMetadata: (
      state,
      action: PayloadAction<{
        nodeID: string;
        outputName: string;
        metadata: Metadata;
      }>
    ) => {
      const { nodeID, outputName, metadata } = action.payload;
      if (!state.nodeMetadataByID[nodeID]) {
        state.nodeMetadataByID[nodeID] = {};
      }
      state.nodeMetadataByID[nodeID][outputName] = sanitizeMetadata(metadata);
    },

    // --- Set Actuality ---
    setNodeMetadataActuality: (
      state,
      action: PayloadAction<{ nodeID: string; actual: boolean }>
    ) => {
      const { nodeID, actual } = action.payload;
      state.nodeMetadataActuality[nodeID] = actual;
    },

    resetNodesMetadata: state => {
      state.nodeMetadataByID = {};
      state.nodeMetadataActuality = {};
    },
  },
  extraReducers: builder => {
    builder.addCase(wsMessageActions.NODE_METADATA, (state, action) => {
      const { node_id, metadata } = action.payload;
      state.nodeMetadataByID[node_id] = sanitizeNodeMetadata(metadata);
      state.nodeMetadataActuality[node_id] = true;
    });
  },
});

export const {
  setNodesMetadata,
  setNodeMetadata,
  setOutputMetadata,

  setNodeMetadataActuality,

  resetNodesMetadata,
} = nodeMetadataSlice.actions;

export const nodeMetadataReducer = nodeMetadataSlice.reducer;

export const nodeMetadataActions = nodeMetadataSlice.actions;
