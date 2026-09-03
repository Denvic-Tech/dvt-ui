import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useStore } from '@xyflow/react';

import { useNodeDefinition } from '@/features/node/get-node-definition';
import { useNodeData } from '@/features/node/manage-node-data';

import { hasIoType } from './useCustomNodeInputsOutputs';

type SpecialIoType = 'SIGNAL' | 'VARIABLE' | null;
type RevealDirection = 'input' | 'output' | null;

type ConnectionRevealStoreState = {
  fromSpecialIoType: SpecialIoType;
  revealDirection: RevealDirection;
  sessionKey: string | null;
  stickyInputNodeIds: ReadonlySet<string>;
  stickyOutputNodeIds: ReadonlySet<string>;
};

type ConnectionRevealRuntimePayload = {
  fromSpecialIoType: SpecialIoType;
  hoveredTargetNodeId: string | null;
  revealDirection: RevealDirection;
  sessionKey: string | null;
};

type NodeConnectionRevealState = {
  connectionFromSpecialIoType: SpecialIoType;
  temporaryInputDefinitionsReveal: boolean;
  temporaryOutputDefinitionsReveal: boolean;
};

const EMPTY_NODE_ID_SET: ReadonlySet<string> = new Set();

const INITIAL_STORE_STATE: ConnectionRevealStoreState = {
  fromSpecialIoType: null,
  revealDirection: null,
  sessionKey: null,
  stickyInputNodeIds: EMPTY_NODE_ID_SET,
  stickyOutputNodeIds: EMPTY_NODE_ID_SET,
};

const NODE_CONNECTION_REVEAL_STATE_CACHE = new Map<
  string,
  NodeConnectionRevealState
>();

const getNodeConnectionRevealState = (
  state: ConnectionRevealStoreState,
  nodeId: string
): NodeConnectionRevealState => {
  const temporaryInputDefinitionsReveal = state.stickyInputNodeIds.has(nodeId);
  const temporaryOutputDefinitionsReveal =
    state.stickyOutputNodeIds.has(nodeId);

  const cacheKey = [
    state.fromSpecialIoType ?? 'none',
    temporaryInputDefinitionsReveal ? '1' : '0',
    temporaryOutputDefinitionsReveal ? '1' : '0',
  ].join(':');

  const cached = NODE_CONNECTION_REVEAL_STATE_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const nextState = {
    connectionFromSpecialIoType: state.fromSpecialIoType,
    temporaryInputDefinitionsReveal,
    temporaryOutputDefinitionsReveal,
  };
  NODE_CONNECTION_REVEAL_STATE_CACHE.set(cacheKey, nextState);
  return nextState;
};

class ConnectionRevealStore {
  private state: ConnectionRevealStoreState = INITIAL_STORE_STATE;

  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): ConnectionRevealStoreState => this.state;

  update = (payload: ConnectionRevealRuntimePayload): void => {
    const resetForNewSession = payload.sessionKey !== this.state.sessionKey;

    let stickyInputNodeIds = resetForNewSession
      ? EMPTY_NODE_ID_SET
      : this.state.stickyInputNodeIds;
    let stickyOutputNodeIds = resetForNewSession
      ? EMPTY_NODE_ID_SET
      : this.state.stickyOutputNodeIds;

    if (payload.sessionKey && payload.hoveredTargetNodeId) {
      if (payload.revealDirection === 'input') {
        if (!stickyInputNodeIds.has(payload.hoveredTargetNodeId)) {
          stickyInputNodeIds = new Set(stickyInputNodeIds).add(
            payload.hoveredTargetNodeId
          );
        }
      } else if (payload.revealDirection === 'output') {
        if (!stickyOutputNodeIds.has(payload.hoveredTargetNodeId)) {
          stickyOutputNodeIds = new Set(stickyOutputNodeIds).add(
            payload.hoveredTargetNodeId
          );
        }
      }
    }

    const nextState: ConnectionRevealStoreState = {
      fromSpecialIoType: payload.fromSpecialIoType,
      revealDirection: payload.revealDirection,
      sessionKey: payload.sessionKey,
      stickyInputNodeIds,
      stickyOutputNodeIds,
    };

    const current = this.state;
    if (
      current.fromSpecialIoType === nextState.fromSpecialIoType &&
      current.revealDirection === nextState.revealDirection &&
      current.sessionKey === nextState.sessionKey &&
      current.stickyInputNodeIds === nextState.stickyInputNodeIds &&
      current.stickyOutputNodeIds === nextState.stickyOutputNodeIds
    ) {
      return;
    }

    this.state = nextState;
    this.listeners.forEach(listener => listener());
  };
}

const connectionRevealStore = new ConnectionRevealStore();

export const connectionEndToClientPosition = (params: {
  domNode: HTMLDivElement | null;
  transform: [number, number, number] | null | undefined;
  to: { x: number; y: number } | null | undefined;
  toHandle: unknown | null | undefined;
  isValid: boolean | null | undefined;
}): { x: number; y: number } | null => {
  const { domNode, transform, to, toHandle, isValid } = params;
  if (!domNode || !to) return null;

  const container =
    (domNode.querySelector('.react-flow__renderer') as HTMLDivElement | null) ??
    domNode;
  const rect = container.getBoundingClientRect();

  if (toHandle && isValid && transform) {
    const [tx, ty, zoom] = transform;
    return {
      x: rect.left + tx + to.x * zoom,
      y: rect.top + ty + to.y * zoom,
    };
  }

  return {
    x: rect.left + to.x,
    y: rect.top + to.y,
  };
};

export const getHoveredNodeIdAtClientPosition = (
  point: { x: number; y: number } | null | undefined
): string | null => {
  if (!point || typeof document === 'undefined') {
    return null;
  }

  const hoveredElements = document.elementsFromPoint(point.x, point.y);
  for (const element of hoveredElements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    const nodeElement = element.closest('.react-flow__node');
    if (!(nodeElement instanceof HTMLElement)) {
      continue;
    }

    return nodeElement.dataset['id'] ?? null;
  }

  return null;
};

export const useNodeConnectionReveal = (
  nodeId: string
): NodeConnectionRevealState =>
  useSyncExternalStore(
    connectionRevealStore.subscribe,
    () =>
      getNodeConnectionRevealState(connectionRevealStore.getState(), nodeId),
    () => getNodeConnectionRevealState(INITIAL_STORE_STATE, nodeId)
  );

export const CustomNodeConnectionRevealRuntime: React.FC = () => {
  const connectionInProgress = useStore(state => state.connection.inProgress);
  const connectionFromHandle = useStore(state => state.connection.fromHandle);
  const connectionTo = useStore(state => state.connection.to);
  const connectionToHandle = useStore(state => state.connection.toHandle);
  const connectionToNodeId = useStore(
    state => state.connection.toNode?.id ?? null
  );
  const connectionIsValid = useStore(state => state.connection.isValid);
  const rfDomNode = useStore(state => state.domNode);
  const rfTransform = useStore(
    state => state.transform as [number, number, number]
  );

  const { nodeData: connectionFromNodeData } = useNodeData(
    connectionFromHandle?.nodeId ?? null
  );
  const connectionFromNodeDefinition = useNodeDefinition(
    connectionFromNodeData?.name
  );

  const connectionFromSpecialIoType = useMemo<SpecialIoType>(() => {
    if (!connectionInProgress || !connectionFromHandle) {
      return null;
    }

    if (!connectionFromNodeDefinition) {
      return null;
    }

    const handleId = connectionFromHandle.id;
    if (!handleId) {
      return null;
    }

    if (connectionFromHandle.type === 'source') {
      const outputName = handleId.replace(/^output-/, '');
      const outputDefinition =
        connectionFromNodeDefinition.output_definitions?.[outputName];

      if (hasIoType(outputDefinition?.type, 'SIGNAL')) {
        return 'SIGNAL';
      }
      if (hasIoType(outputDefinition?.type, 'VARIABLE')) {
        return 'VARIABLE';
      }
      return null;
    }

    const inputName = handleId.replace(/^input-/, '');
    const inputDefinition =
      connectionFromNodeDefinition.input_definitions?.[inputName];

    if (hasIoType(inputDefinition?.type, 'SIGNAL')) {
      return 'SIGNAL';
    }
    if (hasIoType(inputDefinition?.type, 'VARIABLE')) {
      return 'VARIABLE';
    }
    return null;
  }, [
    connectionFromHandle,
    connectionFromNodeDefinition,
    connectionInProgress,
  ]);

  const connectionEndClientPosition = useMemo(
    () =>
      connectionEndToClientPosition({
        domNode: rfDomNode,
        transform: rfTransform,
        to: connectionTo,
        toHandle: connectionToHandle,
        isValid: connectionIsValid,
      }),
    [
      connectionIsValid,
      connectionTo,
      connectionToHandle,
      rfDomNode,
      rfTransform,
    ]
  );

  const hoveredTargetNodeId = useMemo(
    () =>
      getHoveredNodeIdAtClientPosition(connectionEndClientPosition) ??
      connectionToNodeId,
    [connectionEndClientPosition, connectionToNodeId]
  );

  const sessionKey = useMemo(() => {
    if (
      !connectionInProgress ||
      !connectionFromSpecialIoType ||
      !connectionFromHandle
    ) {
      return null;
    }

    return [
      connectionFromHandle.nodeId,
      connectionFromHandle.id ?? '',
      connectionFromHandle.type ?? '',
      connectionFromSpecialIoType,
    ].join(':');
  }, [connectionFromHandle, connectionFromSpecialIoType, connectionInProgress]);

  const revealDirection = useMemo<RevealDirection>(() => {
    if (!sessionKey || !connectionFromHandle?.type) {
      return null;
    }

    return connectionFromHandle.type === 'source' ? 'input' : 'output';
  }, [connectionFromHandle?.type, sessionKey]);

  useEffect(() => {
    connectionRevealStore.update({
      fromSpecialIoType: connectionFromSpecialIoType,
      hoveredTargetNodeId,
      revealDirection,
      sessionKey,
    });
  }, [
    connectionFromSpecialIoType,
    hoveredTargetNodeId,
    revealDirection,
    sessionKey,
  ]);

  return null;
};
