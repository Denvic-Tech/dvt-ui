import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  normalizeDbCatalogParentNames,
  resolveDbCatalogMode,
} from '@/entities/data/db-connection/model/catalogNormalizers';
import type { DbCatalogListResult } from '@/entities/data/db-connection/model/catalogTypes';
import {
  getDbCatalogCapabilities,
  useDbCatalogDatabases,
  useDbCatalogSchemas,
  useDbCatalogTables,
  useRefreshDbCatalog,
} from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type { DbMetadata } from '@/shared/gatewayClient';

import {
  buildCatalogTreeRows,
  type CatalogTreeBranch,
  type CatalogTreeNode,
  type CatalogTreeNodeQueries,
  type CatalogTreeSelection,
  createCatalogTreeNode,
  getCatalogParentBranchKey,
  getCatalogSelectionPath,
  getCatalogTreeLevels,
  mergeCatalogBranchNodes,
  ROOT_BRANCH_KEY,
} from '../lib/catalogTree';

export type CatalogBranchActions = {
  loadNextPage: () => Promise<void>;
  retry: () => Promise<void>;
};

export type ReportCatalogBranch = (
  key: string,
  branch: CatalogTreeBranch | null,
  actions?: CatalogBranchActions
) => void;

type UseCatalogTreeArgs = {
  metadata: DbMetadata | null;
  selection: CatalogTreeSelection;
  enabled: boolean;
  /**
   * Узлы, которые нужно показать, даже если каталог их ещё не вернул
   * (созданные в этой сессии базы и схемы). Кладутся в ветку родителя,
   * когда она загружена.
   */
  injectedNodes?: readonly CatalogTreeNode[];
};

const EMPTY_KEYS: ReadonlySet<string> = new Set();
const EMPTY_NODES: readonly CatalogTreeNode[] = [];
const EMPTY_NODE_QUERIES: CatalogTreeNodeQueries = {};

const omitQueries = (
  queries: CatalogTreeNodeQueries,
  keys: readonly string[]
): CatalogTreeNodeQueries => {
  if (!keys.some(key => key in queries)) return queries;
  const next = { ...queries };
  for (const key of keys) delete next[key];
  return next;
};

const addKeys = (keys: ReadonlySet<string>, nextKeys: readonly string[]) => {
  if (nextKeys.every(key => keys.has(key))) return keys;
  return new Set([...keys, ...nextKeys]);
};

const addNodes = (
  nodes: readonly CatalogTreeNode[],
  nextNodes: readonly CatalogTreeNode[]
) => {
  const known = new Set(nodes.map(node => node.key));
  const added = nextNodes.filter(node => !known.has(node.key));
  return added.length > 0 ? [...nodes, ...added] : nodes;
};

/**
 * Состояние дерева База → Схема → Таблица. Дочерние узлы грузятся
 * подписчиками веток (`loaderNodes`), которые остаются смонтированными
 * после сворачивания — повторное раскрытие берёт данные из кэша.
 */
export const useCatalogTree = ({
  metadata,
  selection,
  enabled,
  injectedNodes = EMPTY_NODES,
}: UseCatalogTreeArgs) => {
  const capabilities = getDbCatalogCapabilities(metadata);
  const { supportsDatabases, supportsSchemas } = capabilities;
  const levels = useMemo(
    () => getCatalogTreeLevels({ supportsDatabases, supportsSchemas }),
    [supportsDatabases, supportsSchemas]
  );
  const rootLevel = levels[0] ?? 'table';

  const databases = useDbCatalogDatabases(metadata, {
    enabled: enabled && rootLevel === 'database',
  });
  const schemas = useDbCatalogSchemas(metadata, null, {
    enabled: enabled && rootLevel === 'schema',
  });
  const tables = useDbCatalogTables(metadata, null, null, {
    enabled: enabled && rootLevel === 'table',
  });
  const rootResult: DbCatalogListResult<unknown> =
    rootLevel === 'database'
      ? databases
      : rootLevel === 'schema'
        ? schemas
        : tables;

  const rootNodes = useMemo<CatalogTreeNode[]>(() => {
    if (rootLevel === 'database') {
      return databases.items.map(item =>
        createCatalogTreeNode('database', item.name, null, null)
      );
    }
    if (rootLevel === 'schema') {
      return schemas.items.map(item =>
        createCatalogTreeNode('schema', item.name, null, null)
      );
    }
    return tables.items.map(item =>
      createCatalogTreeNode('table', item.name, null, null, item)
    );
  }, [databases.items, rootLevel, schemas.items, tables.items]);

  const injectedByBranch = useMemo(() => {
    const grouped = new Map<string, CatalogTreeNode[]>();
    for (const node of injectedNodes) {
      if (!levels.includes(node.level)) continue;
      const key = getCatalogParentBranchKey(levels, node);
      grouped.set(key, [...(grouped.get(key) ?? []), node]);
    }
    return grouped;
  }, [injectedNodes, levels]);

  const loadedRoot = useMemo<CatalogTreeBranch>(
    () => ({
      items: rootNodes,
      state: rootResult.state,
      hasNextPage: rootResult.hasNextPage,
      isFetchingNextPage: rootResult.isFetchingNextPage,
      isRefreshing: rootResult.isRefreshing,
    }),
    [
      rootNodes,
      rootResult.hasNextPage,
      rootResult.isFetchingNextPage,
      rootResult.isRefreshing,
      rootResult.state,
    ]
  );
  const root = useMemo(
    () =>
      mergeCatalogBranchNodes(
        loadedRoot,
        injectedByBranch.get(ROOT_BRANCH_KEY) ?? EMPTY_NODES
      ),
    [injectedByBranch, loadedRoot]
  );

  const [expandedKeys, setExpandedKeys] =
    useState<ReadonlySet<string>>(EMPTY_KEYS);
  const [loaderNodes, setLoaderNodes] = useState<readonly CatalogTreeNode[]>(
    []
  );
  const [loadedBranches, setBranches] = useState<
    Readonly<Record<string, CatalogTreeBranch>>
  >({});
  const [query, setQuery] = useState('');
  // Фильтры детей по ключу узла. Живут, пока открыта модалка, и
  // переживают сворачивание узла; в настройки ноды не попадают.
  const [nodeQueries, setNodeQueries] =
    useState<CatalogTreeNodeQueries>(EMPTY_NODE_QUERIES);
  const [revealRequest, setRevealRequest] = useState(0);
  const branchActionsRef = useRef<Record<string, CatalogBranchActions>>({});

  const branches = useMemo(() => {
    if (injectedByBranch.size === 0) return loadedBranches;
    let next: Record<string, CatalogTreeBranch> | null = null;
    for (const [key, nodes] of injectedByBranch) {
      const branch = loadedBranches[key];
      if (!branch) continue;
      const merged = mergeCatalogBranchNodes(branch, nodes);
      if (merged === branch) continue;
      next ??= { ...loadedBranches };
      next[key] = merged;
    }
    return next ?? loadedBranches;
  }, [injectedByBranch, loadedBranches]);

  const normalizedSelection = useMemo<CatalogTreeSelection>(
    () => ({
      ...normalizeDbCatalogParentNames(
        { supportsDatabases, supportsSchemas },
        selection.databaseName,
        selection.schemaName
      ),
      tableName: selection.tableName,
      draft: selection.draft ?? false,
    }),
    [
      selection.databaseName,
      selection.draft,
      selection.schemaName,
      selection.tableName,
      supportsDatabases,
      supportsSchemas,
    ]
  );
  const hasSelectionTarget = Boolean(
    normalizedSelection.tableName || normalizedSelection.draft
  );

  const selectionPath = useMemo(
    () => getCatalogSelectionPath(levels, normalizedSelection),
    [levels, normalizedSelection]
  );

  const reportBranch = useCallback<ReportCatalogBranch>(
    (key, branch, actions) => {
      if (!branch) {
        delete branchActionsRef.current[key];
        setBranches(prev => {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
        return;
      }

      if (actions) {
        branchActionsRef.current[key] = actions;
      }
      setBranches(prev => ({ ...prev, [key]: branch }));
    },
    []
  );

  // Пока пользователь не начал работать с деревом, сохранённая таблица
  // раскрывается автоматически, как по «Показать выбранное». Значения ноды
  // модалка подставляет эффектом уже после первого рендера, поэтому ждём
  // их появления, а не решаем по первому кадру.
  const autoRevealPendingRef = useRef(true);
  const cancelAutoReveal = useCallback(() => {
    autoRevealPendingRef.current = false;
  }, []);

  const changeQuery = useCallback((value: string) => {
    autoRevealPendingRef.current = false;
    setQuery(value);
  }, []);

  const setNodeQuery = useCallback((nodeKey: string, value: string) => {
    autoRevealPendingRef.current = false;
    setNodeQueries(prev => {
      if ((prev[nodeKey] ?? '') === value) return prev;
      if (!value) return omitQueries(prev, [nodeKey]);
      return { ...prev, [nodeKey]: value };
    });
  }, []);

  const toggleNode = useCallback((node: CatalogTreeNode) => {
    autoRevealPendingRef.current = false;
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(node.key)) {
        next.delete(node.key);
      } else {
        next.add(node.key);
      }
      return next;
    });
    setLoaderNodes(prev => addNodes(prev, [node]));
  }, []);

  const collapseAll = useCallback(() => {
    autoRevealPendingRef.current = false;
    setExpandedKeys(EMPTY_KEYS);
  }, []);

  /** Раскрывает узлы (например, только что созданные база и схема). */
  const expandNodes = useCallback((nodes: readonly CatalogTreeNode[]) => {
    if (nodes.length === 0) return;
    autoRevealPendingRef.current = false;
    const keys = nodes.map(node => node.key);
    setExpandedKeys(prev => addKeys(prev, keys));
    setLoaderNodes(prev => addNodes(prev, nodes));
  }, []);

  const revealSelection = useCallback(() => {
    if (!hasSelectionTarget) return;

    autoRevealPendingRef.current = false;
    const pathKeys = selectionPath.map(node => node.key);
    setQuery('');
    // Фильтры узлов на пути могли скрыть выбранную таблицу.
    setNodeQueries(prev => omitQueries(prev, pathKeys));
    setExpandedKeys(prev => addKeys(prev, pathKeys));
    setLoaderNodes(prev => addNodes(prev, selectionPath));
    setRevealRequest(value => value + 1);
  }, [hasSelectionTarget, selectionPath]);

  useEffect(() => {
    if (!autoRevealPendingRef.current || !enabled || !metadata) return;
    if (hasSelectionTarget) revealSelection();
  }, [enabled, hasSelectionTarget, metadata, revealSelection]);

  const rootActionsRef = useRef<CatalogBranchActions>(rootResult);
  useEffect(() => {
    rootActionsRef.current = rootResult;
  });

  const loadMore = useCallback((branchKey: string) => {
    const actions =
      branchKey === ROOT_BRANCH_KEY
        ? rootActionsRef.current
        : branchActionsRef.current[branchKey];
    void actions?.loadNextPage();
  }, []);

  const retry = useCallback((branchKey: string) => {
    const actions =
      branchKey === ROOT_BRANCH_KEY
        ? rootActionsRef.current
        : branchActionsRef.current[branchKey];
    void actions?.retry();
  }, []);

  const catalogRefresh = useRefreshDbCatalog(metadata);
  const canRefresh = resolveDbCatalogMode(metadata) === 'lazy';
  const { refresh: refreshCatalog } = catalogRefresh;
  const refresh = useCallback(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  const rows = useMemo(
    () =>
      buildCatalogTreeRows({
        levels,
        root,
        branches,
        expandedKeys,
        query,
        nodeQueries,
        selection: normalizedSelection,
      }),
    [
      branches,
      expandedKeys,
      levels,
      nodeQueries,
      normalizedSelection,
      query,
      root,
    ]
  );

  const isRevealSettled = selectionPath.every(node => {
    const branch = branches[node.key];
    return branch !== undefined && branch.state !== 'loading';
  });

  return {
    branches,
    canCollapse: expandedKeys.size > 0,
    canRefresh,
    canReveal:
      Boolean(normalizedSelection.tableName) && !normalizedSelection.draft,
    cancelAutoReveal,
    collapseAll,
    expandNodes,
    isRefreshing: catalogRefresh.isLoading,
    isRevealSettled,
    levels,
    loadMore,
    loaderNodes,
    query,
    refresh,
    reportBranch,
    revealRequest,
    revealSelection,
    retry,
    root,
    rows,
    setNodeQuery,
    setQuery: changeQuery,
    toggleNode,
  };
};

export type CatalogTreeModel = ReturnType<typeof useCatalogTree>;
