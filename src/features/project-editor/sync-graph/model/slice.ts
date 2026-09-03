import {
  createListenerMiddleware,
  createSlice,
  isAnyOf,
} from '@reduxjs/toolkit';
import type { Edge, EdgeChange, NodeChange, XYPosition } from '@xyflow/react';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';
import type { RootState } from '@/app/providers/store/types';

import {
  changeGraphEdges,
  changeGraphNodes,
  CustomNodeData,
  CustomNodeType,
  generateShortGraphEntityID,
  graphActions,
  updateGraphNodePositions,
} from '@/entities/project-editor/graph';
import {
  selectIsSystemAvailabilityBlocking,
  systemAvailabilityActions,
} from '@/entities/system-availability';

import {
  client,
  type GraphEdgeUiSchema,
  type GraphEdgeUpdateUiSchema,
  type GraphNodeUiSchema,
  type GraphOperationResponse,
  type GraphOperationsAggregated,
  type SubgraphUiSchema,
  type SubgraphUiUpdateSchema,
} from '@/shared/gatewayClient';
import {
  ApiErrorPayload,
  createUnknownError,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { deepMerge } from '@/helpers/deepMerge';

enum OperationType {
  Create = 'Create',
  Delete = 'Delete',
  Select = 'Select',
  Position = 'Position',
  Replace = 'Replace',
  InputData = 'InputData',
  DisplayName = 'DisplayName',
  Comment = 'Comment',
  StoreEnabled = 'StoreEnabled',
  ShowSignalIo = 'ShowSignalIo',
  ShowVariablesIo = 'ShowVariablesIo',
  SubgraphBinding = 'SubgraphBinding',
}

type NodeOperationPayloadTypeMap = {
  [OperationType.Create]: CustomNodeType;
  [OperationType.Delete]: { id: string };
  [OperationType.Position]: Pick<CustomNodeType, 'id' | 'position'>;
  [OperationType.Select]: Pick<CustomNodeType, 'id' | 'selected'>;
  [OperationType.Replace]: Partial<CustomNodeType> & { id: string };
  [OperationType.InputData]: {
    id: string;
    data: Pick<CustomNodeData, 'inputValues'>;
  };
  [OperationType.DisplayName]: {
    id: string;
    data: Pick<CustomNodeData, 'displayName'>;
  };
  [OperationType.Comment]: {
    id: string;
    data: Pick<CustomNodeData, 'comment'>;
  };
  [OperationType.StoreEnabled]: {
    id: string;
    data: Pick<CustomNodeData, 'storeEnabled'>;
  };
  [OperationType.ShowSignalIo]: {
    id: string;
    data: Pick<CustomNodeData, 'showSignalIo'>;
  };
  [OperationType.ShowVariablesIo]: {
    id: string;
    data: Pick<CustomNodeData, 'showVariablesIo'>;
  };
  [OperationType.SubgraphBinding]: {
    id: string;
    subgraphId: CustomNodeType['subgraphId'];
  };
};

type EdgeOperationPayloadTypeMap = {
  [OperationType.Create]: Edge;
  [OperationType.Delete]: { id: string };
  [OperationType.Select]: { id: string; selected: boolean };
  [OperationType.Replace]: Partial<Edge> & { id: string };
};

type SubgraphOperationPayloadTypeMap = {
  [OperationType.Create]: SubgraphUiSchema;
  [OperationType.Delete]: { id: string };
  [OperationType.Position]: { id: string; position: XYPosition };
  [OperationType.Select]: { id: string; selected: boolean };
  [OperationType.Replace]: Partial<SubgraphUiUpdateSchema> & { id: string };
};

type OperationPayloadMap<Entity extends 'node' | 'edge' | 'subgraph'> =
  Entity extends 'node'
    ? NodeOperationPayloadTypeMap
    : Entity extends 'edge'
      ? EdgeOperationPayloadTypeMap
      : SubgraphOperationPayloadTypeMap;

const ImportantOperationTypes = [
  OperationType.Create,
  OperationType.Delete,
  OperationType.InputData,
  OperationType.StoreEnabled,
  OperationType.SubgraphBinding,
] as const;

type ImportantOperationType = (typeof ImportantOperationTypes)[number];

type ImportantFlag<Op extends OperationType> = Op extends ImportantOperationType
  ? true
  : boolean;

type GraphOperation<
  Entity extends 'node' | 'edge' | 'subgraph',
  OpType extends keyof OperationPayloadMap<Entity> & OperationType,
> = {
  id: string;
  type: OpType;
  entity: Entity;
  payload: OperationPayloadMap<Entity>[OpType];
  ts: number;
  important: ImportantFlag<OpType> | boolean;
};

type GraphNodeOperation = GraphOperation<
  'node',
  keyof NodeOperationPayloadTypeMap & OperationType
>;
type GraphEdgeOperation = GraphOperation<
  'edge',
  keyof EdgeOperationPayloadTypeMap & OperationType
>;
type GraphSubgraphOperation = GraphOperation<
  'subgraph',
  keyof SubgraphOperationPayloadTypeMap & OperationType
>;

type AnyGraphOperation =
  | GraphNodeOperation
  | GraphEdgeOperation
  | GraphSubgraphOperation;

type AggregatedOperations = Required<GraphOperationsAggregated>;

const now = () => Date.now();

const importantSet = new Set<OperationType>(ImportantOperationTypes);

const resolveImportantFlag = <Op extends OperationType>(
  op: Op
): ImportantFlag<Op> | boolean => (importantSet.has(op) ? true : false);

function buildGraphOperation<
  Entity extends 'node' | 'edge' | 'subgraph',
  Op extends keyof OperationPayloadMap<Entity> & OperationType,
>(entity: Entity, opType: Op, payload: OperationPayloadMap<Entity>[Op]) {
  return {
    id: generateShortGraphEntityID(entity),
    type: opType,
    entity,
    payload,
    ts: now(),
    important: resolveImportantFlag(opType),
  } as GraphOperation<Entity, Op>;
}

const mapNodeChangesToOperations = (
  changes: NodeChange<CustomNodeType>[]
): GraphNodeOperation[] => {
  const operations: GraphNodeOperation[] = [];

  for (const change of changes) {
    if (change.type === 'position') {
      const position = change.position ?? change.positionAbsolute;
      if (!position) continue;
      operations.push(
        buildGraphOperation('node', OperationType.Position, {
          id: change.id,
          position,
        })
      );
      continue;
    }

    if (change.type === 'select') {
      operations.push(
        buildGraphOperation('node', OperationType.Select, {
          id: change.id,
          selected: Boolean(change.selected),
        })
      );
    }
  }

  return operations;
};

const mapEdgeChangesToOperations = (
  changes: EdgeChange<Edge>[]
): GraphEdgeOperation[] => {
  const operations: GraphEdgeOperation[] = [];

  for (const change of changes) {
    if (change.type === 'select') {
      operations.push(
        buildGraphOperation('edge', OperationType.Select, {
          id: change.id,
          selected: Boolean(change.selected),
        })
      );
    }
  }

  return operations;
};

const aggregateOperations = (
  ops: AnyGraphOperation[]
): AggregatedOperations => {
  const opsByNode = new Map<string, GraphNodeOperation[]>();
  const opsByEdge = new Map<string, GraphEdgeOperation[]>();
  const opsBySubgraph = new Map<string, GraphSubgraphOperation[]>();

  for (const op of ops) {
    const itemId = op.payload?.id ?? (op.payload as any)?.item?.id;
    if (!itemId) continue;

    if (op.entity === 'node') {
      const nodeOps = opsByNode.get(itemId) ?? [];
      nodeOps.push(op as GraphNodeOperation);
      opsByNode.set(itemId, nodeOps);
      continue;
    }

    if (op.entity === 'edge') {
      const edgeOps = opsByEdge.get(itemId) ?? [];
      edgeOps.push(op as GraphEdgeOperation);
      opsByEdge.set(itemId, edgeOps);
      continue;
    }

    const subgraphOps = opsBySubgraph.get(itemId) ?? [];
    subgraphOps.push(op as GraphSubgraphOperation);
    opsBySubgraph.set(itemId, subgraphOps);
  }

  const result: AggregatedOperations = {
    nodes_to_delete: [],
    nodes_to_create: [],
    nodes_to_update: [],
    edges_to_delete: [],
    edges_to_create: [],
    edges_to_update: [],
    subgraphs_to_delete: [],
    subgraphs_to_create: [],
    subgraphs_to_update: [],
  };

  for (const [id, nodeOps] of opsByNode) {
    if (nodeOps.some(op => op.type === OperationType.Delete)) {
      result.nodes_to_delete.push({ id });
      continue;
    }

    const createOps = nodeOps
      .filter(op => op.type === OperationType.Create)
      .sort((a, b) => a.ts - b.ts);
    const patchOps = nodeOps
      .filter(op => op.type !== OperationType.Create)
      .sort((a, b) => a.ts - b.ts);

    if (createOps.length > 0) {
      const base = createOps.reduce<CustomNodeType>(
        (acc, op) => deepMerge(acc, op.payload as CustomNodeType),
        {} as CustomNodeType
      );
      const fullNode = patchOps.reduce<CustomNodeType>(
        (acc, op) =>
          deepMerge(
            acc,
            op.payload as Partial<CustomNodeType> & { id: string }
          ),
        base
      );
      result.nodes_to_create.push(fullNode as GraphNodeUiSchema);
    } else if (patchOps.length > 0) {
      const patch = patchOps.reduce<Partial<CustomNodeType> & { id: string }>(
        (acc, op) =>
          deepMerge(
            acc,
            op.payload as Partial<CustomNodeType> & { id: string }
          ),
        { id } as Partial<CustomNodeType> & { id: string }
      );
      result.nodes_to_update.push(patch);
    }
  }

  for (const [id, edgeOps] of opsByEdge) {
    if (edgeOps.some(op => op.type === OperationType.Delete)) {
      result.edges_to_delete.push({ id });
      continue;
    }

    const createOps = edgeOps
      .filter(op => op.type === OperationType.Create)
      .sort((a, b) => a.ts - b.ts);
    const patchOps = edgeOps
      .filter(op => op.type !== OperationType.Create)
      .sort((a, b) => a.ts - b.ts);

    if (createOps.length > 0) {
      const base = createOps.reduce<Edge>(
        (acc, op) => deepMerge(acc, op.payload as Edge),
        {} as Edge
      );
      const fullEdge = patchOps.reduce<Edge>(
        (acc, op) =>
          deepMerge(acc, op.payload as Partial<Edge> & { id: string }),
        base
      );
      result.edges_to_create.push(fullEdge as GraphEdgeUiSchema);
    } else if (patchOps.length > 0) {
      const patch = patchOps.reduce<Partial<Edge> & { id: string }>(
        (acc, op) =>
          deepMerge(acc, op.payload as Partial<Edge> & { id: string }),
        { id } as Partial<Edge> & { id: string }
      );
      result.edges_to_update.push(patch as GraphEdgeUpdateUiSchema);
    }
  }

  for (const [id, subgraphOps] of opsBySubgraph) {
    if (subgraphOps.some(op => op.type === OperationType.Delete)) {
      result.subgraphs_to_delete.push({ id });
      continue;
    }

    const createOps = subgraphOps
      .filter(op => op.type === OperationType.Create)
      .sort((a, b) => a.ts - b.ts);
    const patchOps = subgraphOps
      .filter(op => op.type !== OperationType.Create)
      .sort((a, b) => a.ts - b.ts);

    if (createOps.length > 0) {
      const base = createOps.reduce<SubgraphUiSchema>(
        (acc, op) => deepMerge(acc, op.payload as SubgraphUiSchema),
        {} as SubgraphUiSchema
      );
      const fullSubgraph = patchOps.reduce<SubgraphUiSchema>(
        (acc, op) =>
          deepMerge(
            acc,
            op.payload as Partial<SubgraphUiSchema> & { id: string }
          ),
        base
      );
      result.subgraphs_to_create.push(fullSubgraph);
      continue;
    }

    if (patchOps.length > 0) {
      const patch = patchOps.reduce<
        Partial<SubgraphUiUpdateSchema> & { id: string }
      >(
        (acc, op) =>
          deepMerge(
            acc,
            op.payload as Partial<SubgraphUiUpdateSchema> & { id: string }
          ),
        { id }
      );
      result.subgraphs_to_update.push(patch);
    }
  }

  return result;
};

const responsesMatchRequest = (
  response: GraphOperationResponse | undefined,
  aggregated: AggregatedOperations
) => {
  if (!response) return true;

  const compare = (
    original: string[] | undefined,
    requested: { id?: string | null }[]
  ) => {
    if (!original && requested.length === 0) return true;
    if (!original && requested.length > 0) return false;
    if (!original) return false;
    const a = [...original].sort();
    const b = requested.map(item => item.id).sort();
    return JSON.stringify(a) === JSON.stringify(b);
  };

  if (!compare(response.nodes_deleted, aggregated.nodes_to_delete))
    return false;
  if (!compare(response.nodes_created, aggregated.nodes_to_create))
    return false;
  if (!compare(response.nodes_updated, aggregated.nodes_to_update))
    return false;
  if (!compare(response.edges_deleted, aggregated.edges_to_delete))
    return false;
  if (!compare(response.edges_created, aggregated.edges_to_create))
    return false;
  if (!compare(response.edges_updated, aggregated.edges_to_update))
    return false;
  if (!compare(response.subgraphs_deleted, aggregated.subgraphs_to_delete))
    return false;
  if (!compare(response.subgraphs_created, aggregated.subgraphs_to_create))
    return false;
  if (!compare(response.subgraphs_updated, aggregated.subgraphs_to_update))
    return false;

  return true;
};

export const flushGraphOperations = createAppAsyncThunk<
  { ackedIds: string[]; response: GraphOperationResponse | undefined },
  void
>(
  'syncGraph/flushGraphOperations',
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const projectID = state.projects.selectedProject?.id;
    if (!projectID) {
      return rejectWithValue(
        createUnknownError(
          'Проект не выбран, синхронизация невозможна',
          'GRAPH_SYNC.NO_PROJECT'
        )
      );
    }

    const outbox = state.syncGraph.outbox;
    if (!outbox.length) {
      return { ackedIds: [], response: undefined };
    }

    const aggregated = aggregateOperations(outbox);
    const hasPayload = Object.values(aggregated).some(arr => arr.length > 0);

    if (!hasPayload) {
      return { ackedIds: outbox.map(op => op.id), response: undefined };
    }

    const result = await client.projects
      .projectId(projectID)
      .graphOps.post({ body: aggregated });

    const ok = responsesMatchRequest(result.data, aggregated);
    if (!ok) {
      throw new Error(
        'Backend response does not match the requested operations'
      );
    }

    return {
      ackedIds: outbox.map(op => op.id),
      response: result.data,
    };
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      return !state.syncGraph.inFlight;
    },
    mapUnknownError: () =>
      createUnknownError(
        'Не удалось синхронизировать граф с сервером',
        'GRAPH_SYNC.UNKNOWN'
      ),
  }
);

interface SyncGraphState {
  outbox: AnyGraphOperation[];
  inFlight: boolean;
  flushMode: 'none' | 'debounced' | 'immediate';
  debounceMs: number;
  backoffMs: number;
  lastError: ApiErrorPayload | null;
  lastFlushAt?: number | undefined;
}

const initialState: SyncGraphState = {
  outbox: [],
  inFlight: false,
  flushMode: 'none',
  debounceMs: 2000,
  backoffMs: 0,
  lastError: null,
  lastFlushAt: undefined,
};

const appendOperations = (
  state: SyncGraphState,
  operations: AnyGraphOperation[]
) => {
  if (!operations.length) {
    return;
  }

  let hasImmediate = false;
  let didMutate = false;

  for (const operation of operations) {
    if (operation.important === true) {
      hasImmediate = true;
    }

    if (operation.type === OperationType.Position) {
      const targetID = (operation.payload as { id: string }).id;
      let replaced = false;
      for (let i = state.outbox.length - 1; i >= 0; i--) {
        const existing = state.outbox[i];
        if (
          existing.entity === operation.entity &&
          existing.type === OperationType.Position &&
          (existing.payload as { id: string }).id === targetID
        ) {
          state.outbox[i] = operation;
          didMutate = true;
          replaced = true;
          break;
        }
      }
      if (replaced) {
        continue;
      }
    }

    state.outbox.push(operation);
    didMutate = true;
  }

  if (hasImmediate) {
    state.flushMode = 'immediate';
  } else if (didMutate && state.flushMode !== 'immediate') {
    state.flushMode = 'debounced';
  }
};

export const syncGraphSlice = createSlice({
  name: 'syncGraph',
  initialState,
  reducers: {
    clear(state) {
      state.outbox = [];
      state.flushMode = 'none';
      state.backoffMs = 0;
      state.lastError = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(graphActions.createNodes, (state, action) => {
        const operations = action.payload.nodes.map(node =>
          buildGraphOperation('node', OperationType.Create, node)
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.createEntities, (state, action) => {
        const nodeOperations = action.payload.nodes.map(node =>
          buildGraphOperation('node', OperationType.Create, node)
        );
        const edgeOperations = action.payload.edges.map(edge =>
          buildGraphOperation('edge', OperationType.Create, edge)
        );
        const subgraphOperations = (action.payload.subgraphs ?? []).map(
          subgraph =>
            buildGraphOperation('subgraph', OperationType.Create, subgraph)
        );
        appendOperations(state, [
          ...nodeOperations,
          ...edgeOperations,
          ...subgraphOperations,
        ]);
      })
      .addCase(graphActions.deleteNodes, (state, action) => {
        const operations = action.payload.nodes.map(node =>
          buildGraphOperation('node', OperationType.Delete, { id: node.id })
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.createEdges, (state, action) => {
        const operations = action.payload.edges.map(edge =>
          buildGraphOperation('edge', OperationType.Create, edge)
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.deleteEdges, (state, action) => {
        const operations = action.payload.edges.map(edge =>
          buildGraphOperation('edge', OperationType.Delete, { id: edge.id })
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.updateNodeSubgraphBindings, (state, action) => {
        const operations = action.payload.items.map(item =>
          buildGraphOperation('node', OperationType.SubgraphBinding, {
            id: item.id,
            subgraphId: item.subgraphId,
          })
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.updateEdgeSubgraphBindings, (state, action) => {
        const operations = action.payload.items.map(item =>
          buildGraphOperation('edge', OperationType.Replace, {
            id: item.id,
            subgraphId: item.subgraphId,
          } as Partial<Edge> & { id: string })
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.createSubgraphs, (state, action) => {
        const operations = action.payload.subgraphs.map(subgraph =>
          buildGraphOperation('subgraph', OperationType.Create, subgraph)
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.updateSubgraphs, (state, action) => {
        const operations = action.payload.subgraphs.map(subgraph =>
          buildGraphOperation('subgraph', OperationType.Replace, subgraph)
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.deleteSubgraphs, (state, action) => {
        const operations = action.payload.ids.map(id =>
          buildGraphOperation('subgraph', OperationType.Delete, { id })
        );
        appendOperations(state, operations);
      })
      .addCase(graphActions.updateDisplayName, (state, action) => {
        const { nodeID, displayName } = action.payload;
        appendOperations(state, [
          buildGraphOperation('node', OperationType.DisplayName, {
            id: nodeID,
            data: { displayName },
          }),
        ]);
      })
      .addCase(graphActions.updateComment, (state, action) => {
        const { nodeID, comment } = action.payload;
        appendOperations(state, [
          buildGraphOperation('node', OperationType.Comment, {
            id: nodeID,
            data: { comment },
          }),
        ]);
      })
      .addCase(graphActions.updateStoreEnabled, (state, action) => {
        const { nodeID, storeEnabled } = action.payload;
        appendOperations(state, [
          buildGraphOperation('node', OperationType.StoreEnabled, {
            id: nodeID,
            data: { storeEnabled },
          }),
        ]);
      })
      .addCase(graphActions.updateShowSignalIo, (state, action) => {
        const { nodeID, showSignalIo } = action.payload;
        appendOperations(state, [
          buildGraphOperation('node', OperationType.ShowSignalIo, {
            id: nodeID,
            data: { showSignalIo },
          }),
        ]);
      })
      .addCase(graphActions.updateShowVariablesIo, (state, action) => {
        const { nodeID, showVariablesIo } = action.payload;
        appendOperations(state, [
          buildGraphOperation('node', OperationType.ShowVariablesIo, {
            id: nodeID,
            data: { showVariablesIo },
          }),
        ]);
      })
      .addCase(graphActions.updateInputValue, (state, action) => {
        const { nodeID, inputName, value } = action.payload;
        appendOperations(state, [
          buildGraphOperation('node', OperationType.InputData, {
            id: nodeID,
            data: { inputValues: { [inputName]: value } },
          }),
        ]);
      })
      .addCase(graphActions.updateInputValues, (state, action) => {
        const { nodeID, inputValues } = action.payload;
        appendOperations(state, [
          buildGraphOperation('node', OperationType.InputData, {
            id: nodeID,
            data: { inputValues },
          }),
        ]);
      })
      .addCase(graphActions.replaceInputValues, (state, action) => {
        const { nodeID, inputValues } = action.payload;
        appendOperations(state, [
          buildGraphOperation('node', OperationType.InputData, {
            id: nodeID,
            data: { inputValues },
          }),
        ]);
      })
      .addCase(updateGraphNodePositions, (state, action) => {
        const operations = action.payload.map(({ nodeID, position }) =>
          buildGraphOperation('node', OperationType.Position, {
            id: nodeID,
            position,
          })
        );
        appendOperations(state, operations);
      })
      .addCase(changeGraphNodes, (state, action) => {
        const operations = mapNodeChangesToOperations(action.payload);
        appendOperations(state, operations);
      })
      .addCase(changeGraphEdges, (state, action) => {
        const operations = mapEdgeChangesToOperations(action.payload);
        appendOperations(state, operations);
      })
      .addCase(graphActions.resetGraphState, state => {
        state.outbox = [];
        state.flushMode = 'none';
        state.backoffMs = 0;
        state.lastError = null;
      })
      .addCase(graphActions.setGraph, state => {
        state.outbox = [];
        state.flushMode = 'none';
        state.backoffMs = 0;
        state.lastError = null;
      })
      .addCase(flushGraphOperations.pending, state => {
        state.inFlight = true;
        state.flushMode = 'none';
      })
      .addCase(flushGraphOperations.fulfilled, (state, action) => {
        state.inFlight = false;
        state.lastError = null;
        state.lastFlushAt = Date.now();
        state.backoffMs = 0;

        const ack = new Set(action.payload.ackedIds);
        if (ack.size > 0) {
          state.outbox = state.outbox.filter(op => !ack.has(op.id));
        }

        if (state.outbox.length === 0) {
          state.flushMode = 'none';
        }
      })
      .addCase(flushGraphOperations.rejected, (state, action) => {
        state.inFlight = false;
        state.lastError = ensureApiErrorPayload(
          action.payload,
          'Не удалось синхронизировать граф'
        );
        const prev = state.backoffMs || 0;
        state.backoffMs = Math.min(prev ? prev * 2 : state.debounceMs, 30000);
        if (state.outbox.length > 0) {
          state.flushMode = 'debounced';
        }
      });
  },
});

export const syncGraphReducer = syncGraphSlice.reducer;
export const syncGraphActions = syncGraphSlice.actions;

const graphChangeMatcher = isAnyOf(
  graphActions.createNodes,
  graphActions.createEntities,
  graphActions.deleteNodes,
  graphActions.createEdges,
  graphActions.deleteEdges,
  graphActions.createSubgraphs,
  graphActions.updateSubgraphs,
  graphActions.deleteSubgraphs,
  graphActions.updateNodeSubgraphBindings,
  graphActions.updateEdgeSubgraphBindings,
  graphActions.updateDisplayName,
  graphActions.updateComment,
  graphActions.updateStoreEnabled,
  graphActions.updateShowSignalIo,
  graphActions.updateShowVariablesIo,
  graphActions.updateInputValue,
  graphActions.updateInputValues,
  graphActions.replaceInputValues,
  updateGraphNodePositions,
  changeGraphNodes,
  changeGraphEdges
);

export const syncGraphListener = createListenerMiddleware<RootState>();

syncGraphListener.startListening({
  matcher: graphChangeMatcher,
  effect: async (
    _,
    { cancelActiveListeners, getState, dispatch, delay, signal }
  ) => {
    if (selectIsSystemAvailabilityBlocking(getState())) return;

    const state = getState().syncGraph;
    if (!state || !state.outbox.length) return;
    if (state.inFlight) return;

    if (state.flushMode === 'immediate') {
      cancelActiveListeners();
      dispatch(flushGraphOperations());
      return;
    }

    if (state.flushMode === 'debounced') {
      cancelActiveListeners();
      const waitMs = state.backoffMs > 0 ? state.backoffMs : state.debounceMs;
      await delay(waitMs);
      if (!signal.aborted && !selectIsSystemAvailabilityBlocking(getState())) {
        dispatch(flushGraphOperations());
      }
    }
  },
});

syncGraphListener.startListening({
  actionCreator: flushGraphOperations.fulfilled,
  effect: async (_, { getState, dispatch }) => {
    if (selectIsSystemAvailabilityBlocking(getState())) return;

    const state = getState().syncGraph;
    if (!state) return;
    if (!state.outbox.length) return;
    if (state.inFlight) return;

    dispatch(flushGraphOperations());
  },
});

syncGraphListener.startListening({
  actionCreator: flushGraphOperations.rejected,
  effect: async (_, { getState, dispatch, delay, signal }) => {
    if (selectIsSystemAvailabilityBlocking(getState())) return;

    const state = getState().syncGraph;
    if (!state || !state.outbox.length) return;
    if (state.inFlight) return;

    const waitMs = state.backoffMs > 0 ? state.backoffMs : state.debounceMs;
    await delay(waitMs);
    if (!signal.aborted && !selectIsSystemAvailabilityBlocking(getState())) {
      dispatch(flushGraphOperations());
    }
  },
});

syncGraphListener.startListening({
  actionCreator: systemAvailabilityActions.systemStateReceived,
  effect: async (action, { getState, dispatch }) => {
    if (action.payload.state !== 'degraded') return;

    const state = getState().syncGraph;
    if (!state || !state.outbox.length || state.inFlight) return;

    dispatch(flushGraphOperations());
  },
});

export const syncGraphMiddleware = syncGraphListener.middleware;
