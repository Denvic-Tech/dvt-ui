import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

export type GraphNodeSearchContextValue = {
  query: string;
  matchNodeIds: string[];
  matchNodeIdSet: ReadonlySet<string>;
  activeIndex: number;
  activeNodeId: string | null;
};

const EMPTY_SET: ReadonlySet<string> = new Set();
const EMPTY_IDS: string[] = [];

type GraphNodeSearchSnapshot = GraphNodeSearchContextValue & {
  normalizedQuery: string;
};

type GraphNodeSearchNodeState = {
  searchMatch: boolean;
  searchActive: boolean;
  matchesDisplayName: boolean;
  matchesNodeID: boolean;
};

const INITIAL_SNAPSHOT: GraphNodeSearchSnapshot = {
  query: '',
  normalizedQuery: '',
  matchNodeIds: EMPTY_IDS,
  matchNodeIdSet: EMPTY_SET,
  activeIndex: -1,
  activeNodeId: null,
};

const EMPTY_NODE_SEARCH_STATE: GraphNodeSearchNodeState = {
  searchMatch: false,
  searchActive: false,
  matchesDisplayName: false,
  matchesNodeID: false,
};

const NODE_SEARCH_STATE_CACHE = new Map<number, GraphNodeSearchNodeState>([
  [0, EMPTY_NODE_SEARCH_STATE],
]);

const getNodeSearchState = (
  snapshot: GraphNodeSearchSnapshot,
  nodeId: string,
  displayName: string
): GraphNodeSearchNodeState => {
  if (!snapshot.normalizedQuery) {
    return EMPTY_NODE_SEARCH_STATE;
  }

  const searchMatch = snapshot.matchNodeIdSet.has(nodeId);
  const searchActive = snapshot.activeNodeId === nodeId;
  const matchesDisplayName = displayName
    .toLowerCase()
    .includes(snapshot.normalizedQuery);
  const matchesNodeID = nodeId.toLowerCase().includes(snapshot.normalizedQuery);

  const cacheKey =
    (searchMatch ? 1 : 0) |
    (searchActive ? 1 << 1 : 0) |
    (matchesDisplayName ? 1 << 2 : 0) |
    (matchesNodeID ? 1 << 3 : 0);

  const cached = NODE_SEARCH_STATE_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const nextState = {
    searchMatch,
    searchActive,
    matchesDisplayName,
    matchesNodeID,
  };
  NODE_SEARCH_STATE_CACHE.set(cacheKey, nextState);
  return nextState;
};

class GraphNodeSearchStore {
  private snapshot: GraphNodeSearchSnapshot = INITIAL_SNAPSHOT;

  private listeners = new Set<() => void>();

  getSnapshot = (): GraphNodeSearchSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setSnapshot = (value: GraphNodeSearchContextValue): void => {
    const normalizedQuery = value.query.trim().toLowerCase();
    const nextSnapshot: GraphNodeSearchSnapshot = {
      ...value,
      normalizedQuery,
    };

    const current = this.snapshot;
    if (
      current.query === nextSnapshot.query &&
      current.normalizedQuery === nextSnapshot.normalizedQuery &&
      current.matchNodeIds === nextSnapshot.matchNodeIds &&
      current.matchNodeIdSet === nextSnapshot.matchNodeIdSet &&
      current.activeIndex === nextSnapshot.activeIndex &&
      current.activeNodeId === nextSnapshot.activeNodeId
    ) {
      return;
    }

    this.snapshot = nextSnapshot;
    this.listeners.forEach(listener => listener());
  };
}

const graphNodeSearchStore = new GraphNodeSearchStore();

const GraphNodeSearchContext = createContext<GraphNodeSearchContextValue>({
  query: '',
  matchNodeIds: EMPTY_IDS,
  matchNodeIdSet: EMPTY_SET,
  activeIndex: -1,
  activeNodeId: null,
});

interface GraphNodeSearchProviderProps {
  children: React.ReactNode;
  value: GraphNodeSearchContextValue;
}

export const GraphNodeSearchProvider: React.FC<
  GraphNodeSearchProviderProps
> = ({ children, value }) => {
  const memoizedValue = useMemo(
    () => value,
    [
      value.activeIndex,
      value.activeNodeId,
      value.matchNodeIdSet,
      value.matchNodeIds,
      value.query,
    ]
  );

  useLayoutEffect(() => {
    graphNodeSearchStore.setSnapshot(memoizedValue);
  }, [memoizedValue]);

  return (
    <GraphNodeSearchContext.Provider value={memoizedValue}>
      {children}
    </GraphNodeSearchContext.Provider>
  );
};

export const useGraphNodeSearch = (): GraphNodeSearchContextValue => {
  return useContext(GraphNodeSearchContext);
};

export const useGraphNodeSearchNodeState = (
  nodeId: string,
  displayName: string | null | undefined
): GraphNodeSearchNodeState =>
  useSyncExternalStore(
    graphNodeSearchStore.subscribe,
    () =>
      getNodeSearchState(
        graphNodeSearchStore.getSnapshot(),
        nodeId,
        String(displayName ?? '')
      ),
    () => EMPTY_NODE_SEARCH_STATE
  );
