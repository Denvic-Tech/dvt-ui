import {
  createAction,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { Edge, EdgeChange, NodeChange, XYPosition } from '@xyflow/react';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import {
  type NodeInputValue,
  type SubgraphUiSchema,
} from '@/shared/gatewayClient';
import { createUnknownError, ensureApiErrorPayload } from '@/shared/lib/errors';
import { isInputValue, makeConst } from '@/shared/lib/node-input-values';

import { graphApi } from '../api';

import {
  applyCustomNodeDataDefaults,
  buildConnections,
  pruneConnections,
} from './helpers';
import type {
  CustomEdgeType,
  CustomNodeData,
  CustomNodeType,
  GraphSliceState,
} from './types';

const initialState: GraphSliceState = {
  nodeDataByID: {},
  nodesByID: {},
  edgesByID: {},
  subgraphsByID: {},
  outputsBySourceNodeID: {}, // TODO: вынести в node-io feature
  inputsByTargetNodeID: {}, // TODO: вынести в node-io feature
  graphLoading: false,
  graphLoaded: false,
  graphLoadingError: null,
  lastLoadedProjectID: null,
};

type GraphResponsePayload = {
  projectID: string;
  nodes: CustomNodeType[];
  edges: CustomEdgeType[];
  subgraphs: SubgraphUiSchema[];
};

const normalizeInputValues = (
  inputValues: Record<string, unknown> | undefined
): Record<string, NodeInputValue> => {
  const normalized: Record<string, NodeInputValue> = {};
  for (const [inputName, value] of Object.entries(inputValues ?? {})) {
    if (value === undefined) {
      continue;
    }
    normalized[inputName] = isInputValue(value) ? value : makeConst(value);
  }
  return normalized;
};

const normalizeNodeData = (
  data: CustomNodeData | undefined
): CustomNodeData => {
  const resolvedData = applyCustomNodeDataDefaults(
    (data ?? {}) as CustomNodeData
  );
  return {
    ...resolvedData,
    inputValues: normalizeInputValues(
      resolvedData.inputValues as Record<string, unknown> | undefined
    ),
  };
};

const applyGraphSnapshot = (
  state: GraphSliceState,
  payload: {
    nodes: CustomNodeType[];
    edges: CustomEdgeType[];
    subgraphs: SubgraphUiSchema[];
  }
) => {
  const { nodes, edges, subgraphs } = payload;

  state.nodeDataByID = {};
  state.nodesByID = {};
  for (const node of nodes) {
    state.nodeDataByID[node.id] = normalizeNodeData(node.data);
    state.nodesByID[node.id] = {
      ...node,
      data: state.nodeDataByID[node.id],
    };
  }

  state.edgesByID = {};
  for (const edge of edges) {
    state.edgesByID[edge.id] = edge;
  }

  state.subgraphsByID = {};
  for (const subgraph of subgraphs) {
    state.subgraphsByID[subgraph.id] = subgraph;
  }

  const { outputsBySourceNodeID, inputsByTargetNodeID } =
    buildConnections(edges);
  state.outputsBySourceNodeID = outputsBySourceNodeID;
  state.inputsByTargetNodeID = inputsByTargetNodeID;
};

const applyCreatedNodes = (state: GraphSliceState, nodes: CustomNodeType[]) => {
  for (const node of nodes) {
    state.nodeDataByID[node.id] = normalizeNodeData(node.data);
    state.nodesByID[node.id] = {
      ...node,
      data: state.nodeDataByID[node.id],
    };
  }
};

const applyCreatedEdges = (state: GraphSliceState, edges: CustomEdgeType[]) => {
  if (!edges.length) {
    return;
  }

  for (const edge of edges) {
    state.edgesByID[edge.id] = edge;

    const sourceNodeID = edge.source;
    const targetNodeID = edge.target;
    const sourceHandle = edge.sourceHandle?.replace(/^output-/, '');
    const targetHandle = edge.targetHandle?.replace(/^input-/, '');

    if (!sourceNodeID || !targetNodeID || !sourceHandle || !targetHandle) {
      continue;
    }

    if (!state.outputsBySourceNodeID[sourceNodeID]) {
      state.outputsBySourceNodeID[sourceNodeID] = {};
    }
    state.outputsBySourceNodeID[sourceNodeID][sourceHandle] = {
      nodeID: targetNodeID,
      inputName: targetHandle,
    };

    if (!state.inputsByTargetNodeID[targetNodeID]) {
      state.inputsByTargetNodeID[targetNodeID] = {};
    }
    state.inputsByTargetNodeID[targetNodeID][targetHandle] = {
      nodeID: sourceNodeID,
      outputName: sourceHandle,
    };
  }
};

const applyCreatedSubgraphs = (
  state: GraphSliceState,
  subgraphs: SubgraphUiSchema[]
) => {
  for (const subgraph of subgraphs) {
    state.subgraphsByID[subgraph.id] = subgraph;
  }
};

export const fetchGraph = createAppAsyncThunk<
  GraphResponsePayload,
  { projectID: string }
>(
  'graph/fetchGraph',
  async ({ projectID }) => {
    const { nodes, edges, subgraphs } = await graphApi.getGraph(projectID);

    return {
      projectID,
      nodes: nodes as unknown as CustomNodeType[],
      edges: edges as unknown as CustomEdgeType[],
      subgraphs,
    };
  },
  {
    mapUnknownError: () =>
      createUnknownError('Не удалось загрузить граф проекта', 'GRAPH.UNKNOWN'),
  }
);

export const changeGraphNodes = createAction<NodeChange<CustomNodeType>[]>(
  'graph/changeGraphNodes'
);
export const changeGraphEdges = createAction<EdgeChange<Edge>[]>(
  'graph/changeGraphEdges'
);
export const updateGraphNodePositions = createAction<
  { nodeID: string; position: XYPosition }[]
>('graph/updateGraphNodePositions');

const graphSlice = createSlice({
  name: 'graphSlice',
  initialState,
  reducers: {
    // --- Graph ---
    setGraph(
      state,
      action: PayloadAction<{
        nodes: CustomNodeType[];
        edges: CustomEdgeType[];
        subgraphs?: SubgraphUiSchema[];
      }>
    ) {
      const { nodes, edges, subgraphs = [] } = action.payload;
      applyGraphSnapshot(state, { nodes, edges, subgraphs });
    },

    // Nodes
    createNodes(state, action: PayloadAction<{ nodes: CustomNodeType[] }>) {
      applyCreatedNodes(state, action.payload.nodes);
    },
    createEntities(
      state,
      action: PayloadAction<{
        nodes: CustomNodeType[];
        edges: CustomEdgeType[];
        subgraphs?: SubgraphUiSchema[];
      }>
    ) {
      applyCreatedNodes(state, action.payload.nodes);
      applyCreatedEdges(state, action.payload.edges);
      applyCreatedSubgraphs(state, action.payload.subgraphs ?? []);
    },
    deleteNodes(state, action: PayloadAction<{ nodes: CustomNodeType[] }>) {
      const nodeIDs = new Set(action.payload.nodes.map(node => node.id));
      if (nodeIDs.size === 0) {
        return;
      }

      for (const nodeID of nodeIDs) {
        delete state.nodeDataByID[nodeID];
        delete state.nodesByID[nodeID];
      }

      for (const [edgeID, edge] of Object.entries(state.edgesByID)) {
        if (nodeIDs.has(edge.source) || nodeIDs.has(edge.target)) {
          delete state.edgesByID[edgeID];
        }
      }

      pruneConnections(state, nodeIDs);
    },
    updateNodeSubgraphBindings(
      state,
      action: PayloadAction<{
        items: { id: string; subgraphId: string | null }[];
      }>
    ) {
      for (const item of action.payload.items) {
        const node = state.nodesByID[item.id];
        if (!node) {
          continue;
        }
        node.subgraphId = item.subgraphId;
      }
    },

    // Subgraphs
    createSubgraphs(
      state,
      action: PayloadAction<{ subgraphs: SubgraphUiSchema[] }>
    ) {
      applyCreatedSubgraphs(state, action.payload.subgraphs);
    },
    updateSubgraphs(
      state,
      action: PayloadAction<{
        subgraphs: (Partial<SubgraphUiSchema> & { id: string })[];
      }>
    ) {
      for (const patch of action.payload.subgraphs) {
        const current = state.subgraphsByID[patch.id];
        if (!current) {
          continue;
        }

        state.subgraphsByID[patch.id] = {
          ...current,
          ...patch,
          data: patch.data
            ? {
                ...current.data,
                ...patch.data,
              }
            : current.data,
        };
      }
    },
    deleteSubgraphs(state, action: PayloadAction<{ ids: string[] }>) {
      for (const id of action.payload.ids) {
        delete state.subgraphsByID[id];
      }
    },

    // Edges
    createEdges(state, action: PayloadAction<{ edges: CustomEdgeType[] }>) {
      applyCreatedEdges(state, action.payload.edges);
    },
    deleteEdges(state, action: PayloadAction<{ edges: CustomEdgeType[] }>) {
      const edges = action.payload.edges;
      if (!edges.length) {
        return;
      }

      const toRemove = new Map<
        string,
        { outputs?: Set<string>; inputs?: Set<string> }
      >();

      for (const edge of edges) {
        delete state.edgesByID[edge.id];

        const sourceHandle = edge.sourceHandle?.replace(/^output-/, '');
        const targetHandle = edge.targetHandle?.replace(/^input-/, '');
        if (!sourceHandle || !targetHandle) continue;

        let sourceEntry = toRemove.get(edge.source);
        if (!sourceEntry) {
          sourceEntry = {};
          toRemove.set(edge.source, sourceEntry);
        }
        if (!sourceEntry.outputs) {
          sourceEntry.outputs = new Set();
        }
        sourceEntry.outputs.add(sourceHandle);

        let targetEntry = toRemove.get(edge.target);
        if (!targetEntry) {
          targetEntry = {};
          toRemove.set(edge.target, targetEntry);
        }
        if (!targetEntry.inputs) {
          targetEntry.inputs = new Set();
        }
        targetEntry.inputs.add(targetHandle);
      }

      for (const [nodeID, { outputs, inputs }] of toRemove) {
        if (outputs?.size) {
          const existingOutputs = state.outputsBySourceNodeID[nodeID];
          if (existingOutputs) {
            for (const handle of outputs) {
              delete existingOutputs[handle];
            }
            if (Object.keys(existingOutputs).length === 0) {
              delete state.outputsBySourceNodeID[nodeID];
            }
          }
        }

        if (inputs?.size) {
          const existingInputs = state.inputsByTargetNodeID[nodeID];
          if (existingInputs) {
            for (const handle of inputs) {
              delete existingInputs[handle];
            }
            if (Object.keys(existingInputs).length === 0) {
              delete state.inputsByTargetNodeID[nodeID];
            }
          }
        }
      }
    },
    updateEdgeSubgraphBindings(
      state,
      action: PayloadAction<{
        items: { id: string; subgraphId: string | null }[];
      }>
    ) {
      for (const item of action.payload.items) {
        const edge = state.edgesByID[item.id];
        if (!edge) {
          continue;
        }
        edge.subgraphId = item.subgraphId;
      }
    },

    // --- Node Data ---
    updateDisplayName(
      state,
      { payload }: PayloadAction<{ nodeID: string; displayName: string }>
    ) {
      state.nodeDataByID[payload.nodeID] = {
        ...state.nodeDataByID[payload.nodeID],
        displayName: payload.displayName,
      };

      const node = state.nodesByID[payload.nodeID];
      if (node) {
        node.data = {
          ...node.data,
          displayName: payload.displayName,
        };
      }
    },
    updateComment(
      state,
      { payload }: PayloadAction<{ nodeID: string; comment: string }>
    ) {
      state.nodeDataByID[payload.nodeID] = {
        ...state.nodeDataByID[payload.nodeID],
        comment: payload.comment,
      };

      const node = state.nodesByID[payload.nodeID];
      if (node) {
        node.data = {
          ...node.data,
          comment: payload.comment,
        };
      }
    },
    updateStoreEnabled(
      state,
      { payload }: PayloadAction<{ nodeID: string; storeEnabled: boolean }>
    ) {
      state.nodeDataByID[payload.nodeID] = {
        ...state.nodeDataByID[payload.nodeID],
        storeEnabled: payload.storeEnabled,
      };

      const node = state.nodesByID[payload.nodeID];
      if (node) {
        node.data = {
          ...node.data,
          storeEnabled: payload.storeEnabled,
        };
      }
    },
    updateShowSignalIo(
      state,
      { payload }: PayloadAction<{ nodeID: string; showSignalIo: boolean }>
    ) {
      state.nodeDataByID[payload.nodeID] = {
        ...state.nodeDataByID[payload.nodeID],
        showSignalIo: payload.showSignalIo,
      };

      const node = state.nodesByID[payload.nodeID];
      if (node) {
        node.data = {
          ...node.data,
          showSignalIo: payload.showSignalIo,
        };
      }
    },
    updateShowVariablesIo(
      state,
      { payload }: PayloadAction<{ nodeID: string; showVariablesIo: boolean }>
    ) {
      state.nodeDataByID[payload.nodeID] = {
        ...state.nodeDataByID[payload.nodeID],
        showVariablesIo: payload.showVariablesIo,
      };

      const node = state.nodesByID[payload.nodeID];
      if (node) {
        node.data = {
          ...node.data,
          showVariablesIo: payload.showVariablesIo,
        };
      }
    },
    updateInputValue(
      state,
      {
        payload,
      }: PayloadAction<{
        nodeID: string;
        inputName: string;
        value: NodeInputValue;
      }>
    ) {
      state.nodeDataByID[payload.nodeID] = {
        ...state.nodeDataByID[payload.nodeID],
        inputValues: {
          ...state.nodeDataByID[payload.nodeID].inputValues,
          [payload.inputName]: payload.value,
        },
      };

      const node = state.nodesByID[payload.nodeID];
      if (node) {
        node.data = {
          ...node.data,
          inputValues: {
            ...(node.data.inputValues ?? {}),
            [payload.inputName]: payload.value,
          },
        };
      }
    },
    updateInputValues(
      state,
      {
        payload,
      }: PayloadAction<{
        nodeID: string;
        inputValues: { [inputName: string]: NodeInputValue };
      }>
    ) {
      state.nodeDataByID[payload.nodeID] = {
        ...state.nodeDataByID[payload.nodeID],
        inputValues: {
          ...state.nodeDataByID[payload.nodeID].inputValues,
          ...payload.inputValues,
        },
      };

      const node = state.nodesByID[payload.nodeID];
      if (node) {
        node.data = {
          ...node.data,
          inputValues: {
            ...(node.data.inputValues ?? {}),
            ...payload.inputValues,
          },
        };
      }
    },
    replaceInputValues(
      state,
      {
        payload,
      }: PayloadAction<{
        nodeID: string;
        inputValues: { [inputName: string]: NodeInputValue };
      }>
    ) {
      state.nodeDataByID[payload.nodeID] = {
        ...state.nodeDataByID[payload.nodeID],
        inputValues: payload.inputValues,
      };

      const node = state.nodesByID[payload.nodeID];
      if (node) {
        node.data = {
          ...node.data,
          inputValues: payload.inputValues,
        };
      }
    },

    // --- Reset ---
    resetGraphState() {
      return { ...initialState };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchGraph.pending, state => {
        state.graphLoading = true;
        state.graphLoaded = false;
        state.graphLoadingError = null;
      })
      .addCase(fetchGraph.fulfilled, (state, action) => {
        const { nodes, edges, subgraphs, projectID } = action.payload;
        state.graphLoading = false;
        state.graphLoaded = true;
        state.lastLoadedProjectID = projectID;
        state.graphLoadingError = null;

        applyGraphSnapshot(state, { nodes, edges, subgraphs });
      })
      .addCase(fetchGraph.rejected, (state, action) => {
        state.graphLoading = false;
        state.graphLoaded = false;
        state.graphLoadingError = ensureApiErrorPayload(
          action.payload,
          'Не удалось загрузить граф проекта'
        );
      })
      .addCase(changeGraphNodes, (state, action) => {
        for (const change of action.payload) {
          if (!('id' in change)) {
            continue;
          }

          const node = state.nodesByID[change.id];
          if (!node) {
            continue;
          }

          if (change.type === 'select') {
            node.selected = Boolean(change.selected);
          }
        }
      })
      .addCase(changeGraphEdges, (state, action) => {
        for (const change of action.payload) {
          if (!('id' in change)) {
            continue;
          }

          const edge = state.edgesByID[change.id];
          if (!edge) {
            continue;
          }

          if (change.type === 'select') {
            edge.selected = Boolean(change.selected);
          }
        }
      })
      .addCase(updateGraphNodePositions, (state, action) => {
        for (const { nodeID, position } of action.payload) {
          const node = state.nodesByID[nodeID];
          if (!node) {
            continue;
          }
          node.position = position;
        }
      });
  },
});

export const graphReducer = graphSlice.reducer;

export const graphActions = graphSlice.actions;
