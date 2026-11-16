import type {
  DbCatalogCapabilities,
  DbCatalogState,
  DbCatalogTableRef,
} from '@/entities/data/db-connection/model/catalogTypes';

export type CatalogTreeLevel = 'database' | 'schema' | 'table';

/**
 * Узел дерева каталога. `databaseName`/`schemaName` — контекст родителей
 * (null для уровней, которые диалект не поддерживает).
 */
export type CatalogTreeNode = {
  key: string;
  level: CatalogTreeLevel;
  name: string;
  databaseName: string | null;
  schemaName: string | null;
  /** Исходная ссылка каталога, только для таблиц. */
  tableRef: DbCatalogTableRef | null;
};

export type CatalogTreeBranch = {
  items: readonly CatalogTreeNode[];
  state: DbCatalogState;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isRefreshing: boolean;
};

export type CatalogTreeSelection = {
  databaseName: string | null;
  schemaName: string | null;
  tableName: string | null;
  /**
   * Выбрана ещё не созданная таблица (черновик). Путь до её родителя
   * подсвечивается, но ни одна строка таблицы не выделяется, даже если
   * имя совпало с существующей.
   */
  draft?: boolean;
};

export type CatalogTreeNodeRow = {
  type: 'node';
  key: string;
  node: CatalogTreeNode;
  depth: number;
  expanded: boolean;
  loading: boolean;
  selected: boolean;
  onPath: boolean;
  /** Число загруженных детей («12», «50+»); null, пока ветка не загружена. */
  count: string | null;
  /** Сколько детей видно при активном фильтре узла; null — фильтра нет. */
  shownCount: number | null;
};

export type CatalogTreeStatus = 'empty' | 'error' | 'more' | 'noMatches';

export type CatalogTreeStatusRow = {
  type: 'status';
  key: string;
  branchKey: string;
  depth: number;
  status: CatalogTreeStatus;
  childLevel: CatalogTreeLevel;
  busy: boolean;
};

/** Поле поиска среди детей раскрытого узла (первая строка внутри узла). */
export type CatalogTreeFilterRow = {
  type: 'filter';
  key: string;
  /** Ключ узла, чьих детей фильтрует поле. */
  branchKey: string;
  depth: number;
  childLevel: CatalogTreeLevel;
  query: string;
};

export type CatalogTreeRow =
  | CatalogTreeNodeRow
  | CatalogTreeStatusRow
  | CatalogTreeFilterRow;

/**
 * Раскрытый узел вместе с детьми: шапка (строка узла и его поле поиска)
 * прилипает к верху списка, пока видны дети группы.
 */
export type CatalogTreeGroup = {
  type: 'group';
  key: string;
  row: CatalogTreeNodeRow;
  filter: CatalogTreeFilterRow | null;
  children: CatalogTreeEntry[];
};

export type CatalogTreeEntry =
  | CatalogTreeGroup
  | CatalogTreeNodeRow
  | CatalogTreeStatusRow
  | CatalogTreeFilterRow;

/** Фильтры детей по ключу узла (база; база/схема). */
export type CatalogTreeNodeQueries = Readonly<Record<string, string>>;

export const ROOT_BRANCH_KEY = '__root__';

/** Поле поиска внутри узла появляется, когда детей больше этого числа. */
export const NODE_FILTER_MIN_CHILDREN = 8;

const EMPTY_NODE_QUERIES: CatalogTreeNodeQueries = {};

const normalizeQuery = (query: string) => query.trim().toLocaleLowerCase();

const nameContains = (name: string, needle: string) =>
  name.toLocaleLowerCase().includes(needle);

const ERROR_STATES = new Set<DbCatalogState>([
  'notFound',
  'badGateway',
  'gatewayTimeout',
  'error',
]);

export const isCatalogErrorState = (state: DbCatalogState) =>
  ERROR_STATES.has(state);

export const getCatalogTreeLevels = (
  capabilities: Pick<
    DbCatalogCapabilities,
    'supportsDatabases' | 'supportsSchemas'
  >
): CatalogTreeLevel[] => [
  ...(capabilities.supportsDatabases ? (['database'] as const) : []),
  ...(capabilities.supportsSchemas ? (['schema'] as const) : []),
  'table',
];

export const getCatalogChildLevel = (
  levels: readonly CatalogTreeLevel[],
  level: CatalogTreeLevel
): CatalogTreeLevel | null => levels[levels.indexOf(level) + 1] ?? null;

export const createCatalogTreeNode = (
  level: CatalogTreeLevel,
  name: string,
  databaseName: string | null,
  schemaName: string | null,
  tableRef: DbCatalogTableRef | null = null
): CatalogTreeNode => ({
  key: JSON.stringify([
    level,
    databaseName,
    schemaName,
    name,
    tableRef?.kind ?? null,
  ]),
  level,
  name,
  databaseName,
  schemaName,
  tableRef,
});

/** Узлы-предки выбранной таблицы, которые нужно раскрыть, чтобы её показать. */
export const getCatalogSelectionPath = (
  levels: readonly CatalogTreeLevel[],
  selection: CatalogTreeSelection
): CatalogTreeNode[] => {
  if (!selection.tableName && !selection.draft) {
    return [];
  }

  const path: CatalogTreeNode[] = [];
  if (levels.includes('database')) {
    if (!selection.databaseName) return [];
    path.push(
      createCatalogTreeNode('database', selection.databaseName, null, null)
    );
  }
  if (levels.includes('schema')) {
    if (!selection.schemaName) return [];
    path.push(
      createCatalogTreeNode(
        'schema',
        selection.schemaName,
        selection.databaseName,
        null
      )
    );
  }
  return path;
};

const isSelectedNode = (
  node: CatalogTreeNode,
  selection: CatalogTreeSelection
) =>
  !selection.draft &&
  node.level === 'table' &&
  node.name === selection.tableName &&
  node.databaseName === selection.databaseName &&
  node.schemaName === selection.schemaName;

const isNodeOnSelectionPath = (
  node: CatalogTreeNode,
  selection: CatalogTreeSelection
) => {
  if (!selection.tableName && !selection.draft) return false;
  if (node.level === 'database') return node.name === selection.databaseName;
  if (node.level === 'schema') {
    return (
      node.name === selection.schemaName &&
      node.databaseName === selection.databaseName
    );
  }
  return false;
};

/**
 * Ключ ветки, в которой лежит узел: корень дерева или раскрытый родитель.
 */
export const getCatalogParentBranchKey = (
  levels: readonly CatalogTreeLevel[],
  node: CatalogTreeNode
): string => {
  const parentLevel = levels[levels.indexOf(node.level) - 1];
  if (!parentLevel) return ROOT_BRANCH_KEY;
  if (parentLevel === 'database') {
    return createCatalogTreeNode(
      'database',
      node.databaseName ?? '',
      null,
      null
    ).key;
  }
  return createCatalogTreeNode(
    'schema',
    node.schemaName ?? '',
    node.databaseName,
    null
  ).key;
};

const byNodeName = (left: CatalogTreeNode, right: CatalogTreeNode) =>
  left.name.localeCompare(right.name);

/**
 * Добавляет в ветку узлы, которых ещё нет в загруженном списке (например,
 * только что созданные база или схема, пока каталог не перечитан).
 * Возвращает исходную ветку, если добавлять нечего.
 */
export const mergeCatalogBranchNodes = (
  branch: CatalogTreeBranch,
  extraNodes: readonly CatalogTreeNode[]
): CatalogTreeBranch => {
  if (extraNodes.length === 0 || branch.state === 'loading') return branch;
  if (isCatalogErrorState(branch.state)) return branch;
  const known = new Set(branch.items.map(item => item.name));
  const added = extraNodes.filter(node => !known.has(node.name));
  if (added.length === 0) return branch;
  return {
    ...branch,
    state: 'ready',
    items: [...branch.items, ...added].sort(byNodeName),
  };
};

const buildStatusRows = (
  branch: CatalogTreeBranch,
  branchKey: string,
  depth: number,
  childLevel: CatalogTreeLevel
): CatalogTreeStatusRow[] => {
  const base = {
    type: 'status' as const,
    branchKey,
    depth,
    childLevel,
    busy: false,
  };

  if (isCatalogErrorState(branch.state)) {
    return [{ ...base, key: `${branchKey}::status:error`, status: 'error' }];
  }
  if (branch.state === 'empty') {
    return [{ ...base, key: `${branchKey}::status:empty`, status: 'empty' }];
  }
  if (branch.state === 'ready' && branch.hasNextPage) {
    return [
      {
        ...base,
        key: `${branchKey}::status:more`,
        status: 'more',
        busy: branch.isFetchingNextPage,
      },
    ];
  }
  return [];
};

type BuildCatalogTreeRowsArgs = {
  levels: readonly CatalogTreeLevel[];
  root: CatalogTreeBranch;
  branches: Readonly<Record<string, CatalogTreeBranch>>;
  expandedKeys: ReadonlySet<string>;
  query: string;
  nodeQueries?: CatalogTreeNodeQueries;
  selection: CatalogTreeSelection;
};

/**
 * Плоский список видимых строк дерева. Верхний поиск смотрит только на уже
 * раскрытые узлы: совпавший узел показывается вместе с предками,
 * а у совпавшего предка видны все загруженные потомки.
 *
 * Фильтр узла (`nodeQueries[node.key]`) сужает только его прямых детей
 * по уже загруженному списку и работает вместе с верхним поиском. Узел
 * с активным фильтром остаётся видимым, даже если внутри ничего не нашлось,
 * чтобы поле, в которое идёт ввод, не исчезало.
 */
export const buildCatalogTreeRows = ({
  levels,
  root,
  branches,
  expandedKeys,
  query,
  nodeQueries = EMPTY_NODE_QUERIES,
  selection,
}: BuildCatalogTreeRowsArgs): CatalogTreeRow[] => {
  const needle = normalizeQuery(query);
  const isSearching = needle.length > 0;

  const walk = (
    nodes: readonly CatalogTreeNode[],
    depth: number,
    ancestorMatched: boolean
  ): CatalogTreeRow[] => {
    const rows: CatalogTreeRow[] = [];

    for (const node of nodes) {
      const matched =
        !isSearching || ancestorMatched || nameContains(node.name, needle);
      const expanded = node.level !== 'table' && expandedKeys.has(node.key);
      const branch = expanded ? branches[node.key] : undefined;
      const nodeRow: CatalogTreeNodeRow = {
        type: 'node',
        key: node.key,
        node,
        depth,
        expanded,
        loading:
          expanded &&
          (!branch || branch.state === 'loading' || branch.isRefreshing),
        selected: isSelectedNode(node, selection),
        onPath: isNodeOnSelectionPath(node, selection),
        count:
          branch && (branch.state === 'ready' || branch.state === 'empty')
            ? `${branch.items.length}${branch.hasNextPage ? '+' : ''}`
            : null,
        shownCount: null,
      };

      if (node.level === 'table') {
        if (matched) rows.push(nodeRow);
        continue;
      }

      const childLevel = getCatalogChildLevel(levels, node.level);
      const childRows: CatalogTreeRow[] = [];
      let hasActiveFilter = false;
      if (branch && childLevel) {
        const nodeQuery = nodeQueries[node.key] ?? '';
        const nodeNeedle = normalizeQuery(nodeQuery);
        hasActiveFilter = nodeNeedle.length > 0;
        const children = hasActiveFilter
          ? branch.items.filter(child => nameContains(child.name, nodeNeedle))
          : branch.items;
        const nestedRows = walk(children, depth + 1, isSearching && matched);

        if (
          branch.state === 'ready' &&
          (branch.items.length > NODE_FILTER_MIN_CHILDREN || hasActiveFilter)
        ) {
          childRows.push({
            type: 'filter',
            key: `${node.key}::filter`,
            branchKey: node.key,
            depth: depth + 1,
            childLevel,
            query: nodeQuery,
          });
        }
        childRows.push(...nestedRows);

        if (hasActiveFilter) {
          const shownCount = nestedRows.filter(
            row => row.type === 'node' && row.depth === depth + 1
          ).length;
          nodeRow.shownCount = shownCount;
          if (shownCount === 0) {
            childRows.push({
              type: 'status',
              key: `${node.key}::status:noMatches`,
              branchKey: node.key,
              depth: depth + 1,
              childLevel,
              status: 'noMatches',
              busy: false,
            });
          }
        }
        if (!isSearching) {
          childRows.push(
            ...buildStatusRows(branch, node.key, depth + 1, childLevel)
          );
        }
      }

      if (
        matched ||
        hasActiveFilter ||
        childRows.some(row => row.type === 'node')
      ) {
        rows.push(nodeRow, ...childRows);
      }
    }

    return rows;
  };

  const rows = walk(root.items, 0, false);
  if (!isSearching && levels[0]) {
    rows.push(...buildStatusRows(root, ROOT_BRANCH_KEY, 0, levels[0]));
  }
  return rows;
};

/**
 * Собирает плоский список строк в группы по раскрытым узлам. Дети узла
 * в плоском списке идут сразу за ним и глубже на уровень; поле поиска
 * узла уходит в шапку группы. Свёрнутые узлы, таблицы и статусы остаются
 * обычными строками.
 */
export const groupCatalogTreeRows = (
  rows: readonly CatalogTreeRow[]
): CatalogTreeEntry[] => {
  let index = 0;

  const collect = (minDepth: number): CatalogTreeEntry[] => {
    const entries: CatalogTreeEntry[] = [];

    while (index < rows.length) {
      const row = rows[index];
      if (!row || row.depth < minDepth) break;
      index += 1;

      if (row.type !== 'node' || !row.expanded) {
        entries.push(row);
        continue;
      }

      const next = rows[index];
      const filter =
        next?.type === 'filter' && next.branchKey === row.key ? next : null;
      if (filter) index += 1;

      entries.push({
        type: 'group',
        key: `${row.key}::group`,
        row,
        filter,
        children: collect(row.depth + 1),
      });
    }

    return entries;
  };

  return collect(0);
};
