import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';

import type { Input } from '@/entities/project-editor/graph';

import type { NodeMetadata } from '@/shared/gatewayClient';

export const selectAllMetadata = (state: RootState) =>
  state.nodeMetadata.nodeMetadataByID;

export const selectMetadataByNodeID = (
  state: RootState,
  nodeID: string | null | undefined
) => {
  if (!nodeID) return {};
  const nodeMetadata = state.nodeMetadata.nodeMetadataByID[nodeID];
  return nodeMetadata ? { ...nodeMetadata } : {};
};

export const makeMetadataByNodeIDSelector = () => selectMetadataByNodeID;

export const selectMetadataActualityByNodeID = (
  state: RootState,
  nodeID: string | null | undefined
) => {
  if (!nodeID) return true;
  const actual = state.nodeMetadata.nodeMetadataActuality[nodeID];
  return actual === undefined ? true : actual;
};

export const makeMetadataActualityByNodeIDSelector = () =>
  selectMetadataActualityByNodeID;

export const makeConnectedMetadataByInputNameSelector = () =>
  createSelector(
    [
      (state: RootState, connectedInputs: Record<string, Input>) =>
        connectedInputs,
      (state: RootState) => state.nodeMetadata.nodeMetadataByID,
      (state: RootState) => state.nodeMetadata.nodeMetadataActuality,
    ],
    (connectedInputs, metadataByID, metadataActualityByID): NodeMetadata => {
      const result: NodeMetadata = {};
      for (const [inputName, { nodeID, outputName }] of Object.entries(
        connectedInputs
      )) {
        if (metadataActualityByID[nodeID] === false) {
          continue;
        }

        const meta = metadataByID[nodeID]?.[outputName];
        if (meta != null) result[inputName] = meta;
      }
      return result;
    }
  );

export const selectNodeMetadataExistsAndActual = createSelector(
  [
    (state: RootState, nodeID: string): NodeMetadata | undefined =>
      state.nodeMetadata.nodeMetadataByID[nodeID],
    (state: RootState, nodeID: string): boolean | undefined =>
      state.nodeMetadata.nodeMetadataActuality[nodeID],
  ],
  (metadata, actual) => metadata && actual
);

export const selectNodesMetadataExistsAndActual = createSelector(
  [
    (state: RootState, nodeIDs: string[]): (NodeMetadata | undefined)[] =>
      nodeIDs.map(nodeID => state.nodeMetadata.nodeMetadataByID[nodeID]),

    (state: RootState, nodeIDs: string[]): (boolean | undefined)[] =>
      nodeIDs.map(nodeID => state.nodeMetadata.nodeMetadataActuality[nodeID]),
  ],
  (metadatas, actualities) =>
    metadatas.length > 0 &&
    actualities.length > 0 &&
    actualities.every(actual => actual)
);
