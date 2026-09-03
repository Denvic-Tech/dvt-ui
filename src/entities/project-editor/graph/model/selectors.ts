import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '@/app/providers/store';

import type { SubgraphUiSchema } from '@/shared/gatewayClient';

import type {
  CustomEdgeType,
  CustomNodeData,
  CustomNodeType,
  Input,
  Output,
} from './types';

export const selectGraphState = (state: RootState) => state.graph;

export const selectNodeDataMap = createSelector(
  selectGraphState,
  graph => graph.nodeDataByID
);

export const selectGraphNodesMap = createSelector(
  selectGraphState,
  graph => graph.nodesByID
);

export const selectGraphNodesRaw = createSelector(
  selectGraphNodesMap,
  nodesByID => Object.values(nodesByID) as CustomNodeType[]
);

export const selectGraphEdgesMap = createSelector(
  selectGraphState,
  graph => graph.edgesByID
);

export const selectGraphEdgesRaw = createSelector(
  selectGraphEdgesMap,
  edgesByID => Object.values(edgesByID) as CustomEdgeType[]
);

export const selectSubgraphsMap = createSelector(
  selectGraphState,
  graph => graph.subgraphsByID
);

export const selectSubgraphsList = createSelector(
  selectSubgraphsMap,
  subgraphsByID => Object.values(subgraphsByID) as SubgraphUiSchema[]
);

export const selectSubgraphByID = createSelector(
  [
    selectSubgraphsMap,
    (_state: RootState, subgraphID: string | null | undefined) => subgraphID,
  ],
  (subgraphsByID, subgraphID): SubgraphUiSchema | null => {
    if (!subgraphID) {
      return null;
    }
    return subgraphsByID[subgraphID] ?? null;
  }
);

export const selectGraphInputs = createSelector(
  selectGraphState,
  graph => graph.inputsByTargetNodeID
);

export const selectGraphOutputs = createSelector(
  selectGraphState,
  graph => graph.outputsBySourceNodeID
);

export const selectGraphLoading = createSelector(
  selectGraphState,
  graph => graph.graphLoading
);

export const selectGraphLoaded = createSelector(
  selectGraphState,
  graph => graph.graphLoaded
);

export const selectGraphLoadingError = createSelector(
  selectGraphState,
  graph => graph.graphLoadingError
);

export const selectGraphLastLoadedProjectID = createSelector(
  selectGraphState,
  graph => graph.lastLoadedProjectID
);

export const selectNodeDataByID = createSelector(
  [
    selectGraphState,
    (_state: RootState, nodeID: string | null | undefined) => nodeID,
  ],
  (RootState, nodeID): CustomNodeData | null => {
    if (!nodeID) return null;
    return RootState.nodeDataByID[nodeID] ?? null;
  }
);

export const makeNodeDataByIDSelector = () =>
  createSelector(
    [
      selectGraphState,
      (_state: RootState, nodeID: string | null | undefined) => nodeID,
    ],
    (RootState, nodeID): CustomNodeData | null => {
      if (!nodeID) return null;
      return RootState.nodeDataByID[nodeID] ?? null;
    }
  );

export const selectConnectedInputsByNodeID = createSelector(
  [selectGraphInputs, (_state: RootState, nodeID: string) => nodeID],
  (inputsByTargetNodeID, nodeID): Record<string, Input> | null => {
    const connectedInputs = nodeID ? inputsByTargetNodeID[nodeID] : null;
    return connectedInputs ?? null;
  }
);

export const makeConnectedInputsByNodeIDSelector = () =>
  createSelector(
    [
      selectGraphInputs,
      (_state: RootState, nodeID: string | null | undefined) => nodeID,
    ],
    (inputsByTargetNodeID, nodeID) => {
      if (!nodeID) return null;
      return inputsByTargetNodeID[nodeID] ?? null;
    }
  );

export const selectConnectedOutputsByNodeID = createSelector(
  [
    selectGraphOutputs,
    (_state: RootState, nodeID: string | null | undefined) => nodeID,
  ],
  (outputsBySourceNodeID, nodeID): Record<string, Output> | null => {
    if (!nodeID) return null;
    const connectedOutputs = outputsBySourceNodeID[nodeID];
    return connectedOutputs ?? null;
  }
);

export const makeConnectedOutputsByNodeID = () =>
  createSelector(
    [selectGraphOutputs, (_state, nodeID: string) => nodeID],
    (outputsBySourceNodeID, nodeID) => outputsBySourceNodeID[nodeID]
  );

export const makeConnectedOutputsByNodeIDSelector = () =>
  createSelector(
    [
      selectGraphOutputs,
      (_state: RootState, nodeID: string | null | undefined) => nodeID,
    ],
    (outputsBySourceNodeID, nodeID) => {
      if (!nodeID) return null;
      return outputsBySourceNodeID[nodeID] ?? null;
    }
  );

export const selectInputValues = createSelector(
  [
    selectGraphState,
    (_state: RootState, nodeID: string | null | undefined) => nodeID,
  ],
  (RootState, nodeID) => {
    if (!nodeID) return null;
    return RootState.nodeDataByID[nodeID]?.inputValues ?? null;
  }
);

export const makeConnectedNodesDataSelector = (connectedInputs: {
  [inputName: string]: Input;
}) =>
  createSelector(selectGraphState, RootState =>
    Object.fromEntries(
      Object.entries(connectedInputs).map(([inputName, input]) => [
        input.nodeID,
        RootState.nodeDataByID[input.nodeID],
      ])
    )
  );
