import { describe, expect, it } from 'vitest';

import {
  buildCatalogTreeRows,
  type CatalogTreeBranch,
  type CatalogTreeEntry,
  type CatalogTreeNode,
  type CatalogTreeSelection,
  createCatalogTreeNode,
  getCatalogSelectionPath,
  getCatalogTreeLevels,
  groupCatalogTreeRows,
} from './catalogTree';

const branch = (
  items: CatalogTreeNode[],
  overrides: Partial<CatalogTreeBranch> = {}
): CatalogTreeBranch => ({
  items,
  state: items.length > 0 ? 'ready' : 'empty',
  hasNextPage: false,
  isFetchingNextPage: false,
  isRefreshing: false,
  ...overrides,
});

const levels = getCatalogTreeLevels({
  supportsDatabases: true,
  supportsSchemas: true,
});

const analytics = createCatalogTreeNode('database', 'analytics', null, null);
const warehouse = createCatalogTreeNode('database', 'warehouse', null, null);
const publicSchema = createCatalogTreeNode(
  'schema',
  'public',
  'analytics',
  null
);
const archiveSchema = createCatalogTreeNode(
  'schema',
  'archive',
  'analytics',
  null
);
const orders = createCatalogTreeNode('table', 'orders', 'analytics', 'public', {
  name: 'orders',
  kind: 'table',
  databaseName: 'analytics',
  schemaName: 'public',
});
const customers = createCatalogTreeNode(
  'table',
  'customers',
  'analytics',
  'public',
  {
    name: 'customers',
    kind: 'table',
    databaseName: 'analytics',
    schemaName: 'public',
  }
);

const root = branch([analytics, warehouse]);
const branches = {
  [analytics.key]: branch([publicSchema, archiveSchema]),
  [publicSchema.key]: branch([orders, customers]),
};
const noSelection = { databaseName: null, schemaName: null, tableName: null };

const visibleNames = (rows: ReturnType<typeof buildCatalogTreeRows>) =>
  rows.map(row =>
    row.type === 'node'
      ? row.node.name
      : row.type === 'filter'
        ? `?${row.childLevel}`
        : `#${row.status}`
  );

const tableNode = (name: string, schemaName: string | null = 'public') =>
  createCatalogTreeNode('table', name, 'analytics', schemaName, {
    name,
    kind: 'table',
    databaseName: 'analytics',
    schemaName,
  });

const schemaNode = (name: string) =>
  createCatalogTreeNode('schema', name, 'analytics', null);

/** 10 таблиц: больше порога, после которого у узла появляется поле поиска. */
const manyTables = [
  'orders',
  'order_items',
  'customers',
  'payments',
  'refunds',
  'invoices',
  'products',
  'stores',
  'users',
  'visits',
].map(name => tableNode(name));

describe('catalog tree rows', () => {
  it('derives levels from dialect capabilities', () => {
    expect(levels).toEqual(['database', 'schema', 'table']);
    expect(
      getCatalogTreeLevels({ supportsDatabases: true, supportsSchemas: false })
    ).toEqual(['database', 'table']);
  });

  it('shows only expanded branches with counts and loading state', () => {
    const rows = buildCatalogTreeRows({
      levels,
      root,
      branches,
      expandedKeys: new Set([analytics.key, publicSchema.key, warehouse.key]),
      query: '',
      selection: noSelection,
    });

    expect(visibleNames(rows)).toEqual([
      'analytics',
      'public',
      'orders',
      'customers',
      'archive',
      'warehouse',
    ]);
    const nodeRows = rows.filter(row => row.type === 'node');
    expect(nodeRows[0]).toMatchObject({ count: '2', expanded: true });
    // Ветка warehouse раскрыта, но ещё не загружена — вместо шеврона спиннер.
    expect(nodeRows[5]).toMatchObject({ loading: true, count: null });
  });

  it('marks the selected table and its ancestors', () => {
    const rows = buildCatalogTreeRows({
      levels,
      root,
      branches,
      expandedKeys: new Set([analytics.key, publicSchema.key]),
      query: '',
      selection: {
        databaseName: 'analytics',
        schemaName: 'public',
        tableName: 'orders',
      },
    });
    const byName = Object.fromEntries(
      rows.flatMap(row => (row.type === 'node' ? [[row.node.name, row]] : []))
    );

    expect(byName['orders']).toMatchObject({ selected: true });
    expect(byName['customers']).toMatchObject({ selected: false });
    expect(byName['analytics']).toMatchObject({ onPath: true });
    expect(byName['public']).toMatchObject({ onPath: true });
    expect(byName['archive']).toMatchObject({ onPath: false });
  });

  it('searches only expanded nodes and keeps matching ancestors', () => {
    const search = (query: string, expanded: string[]) =>
      visibleNames(
        buildCatalogTreeRows({
          levels,
          root,
          branches,
          expandedKeys: new Set(expanded),
          query,
          selection: noSelection,
        })
      );

    expect(search('cust', [analytics.key, publicSchema.key])).toEqual([
      'analytics',
      'public',
      'customers',
    ]);
    // Схема public свёрнута — её таблицы в поиск не попадают.
    expect(search('cust', [analytics.key])).toEqual([]);
    // Совпавший предок показывает всех загруженных потомков.
    expect(search('public', [analytics.key, publicSchema.key])).toEqual([
      'analytics',
      'public',
      'orders',
      'customers',
    ]);
  });

  it('adds status rows for empty, failed and paginated branches', () => {
    const rows = buildCatalogTreeRows({
      levels,
      root: branch([analytics], { hasNextPage: true }),
      branches: {
        [analytics.key]: branch([], { state: 'badGateway' }),
      },
      expandedKeys: new Set([analytics.key]),
      query: '',
      selection: noSelection,
    });

    expect(visibleNames(rows)).toEqual(['analytics', '#error', '#more']);
  });

  it('adds a search field inside loaded nodes with more than 8 children', () => {
    const schemas = Array.from({ length: 9 }, (_, index) =>
      schemaNode(`s${index}`)
    );
    const build = (overrides: Partial<CatalogTreeBranch> = {}) =>
      buildCatalogTreeRows({
        levels,
        root,
        branches: {
          [analytics.key]: branch(schemas, overrides),
          [publicSchema.key]: branch([orders, customers]),
        },
        expandedKeys: new Set([analytics.key, publicSchema.key]),
        query: '',
        selection: noSelection,
      });

    const rows = build();
    expect(rows[1]).toMatchObject({
      type: 'filter',
      branchKey: analytics.key,
      depth: 1,
      childLevel: 'schema',
      query: '',
    });
    // У схемы public всего 2 таблицы — поля нет.
    expect(rows.filter(row => row.type === 'filter')).toHaveLength(1);
    // Пока узел грузится, поля нет.
    expect(
      build({ state: 'loading', items: [] }).some(row => row.type === 'filter')
    ).toBe(false);

    // В диалекте без схем база сразу ищет таблицы.
    const noSchemaLevels = getCatalogTreeLevels({
      supportsDatabases: true,
      supportsSchemas: false,
    });
    const flatTables = manyTables.map(table => tableNode(table.name, null));
    const flatRows = buildCatalogTreeRows({
      levels: noSchemaLevels,
      root,
      branches: { [analytics.key]: branch(flatTables) },
      expandedKeys: new Set([analytics.key]),
      query: '',
      selection: noSelection,
    });
    expect(flatRows[1]).toMatchObject({ type: 'filter', childLevel: 'table' });
  });

  it('filters only the children of its node and shows «N из M»', () => {
    const schemas = [
      publicSchema,
      archiveSchema,
      ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(schemaNode),
    ];
    const build = (
      nodeQueries: Record<string, string>,
      query = '',
      selection: CatalogTreeSelection = noSelection
    ) =>
      buildCatalogTreeRows({
        levels,
        root,
        branches: {
          [analytics.key]: branch(schemas),
          [publicSchema.key]: branch(manyTables),
        },
        expandedKeys: new Set([analytics.key, publicSchema.key]),
        query,
        nodeQueries,
        selection,
      });
    const nodeRow = (
      rows: ReturnType<typeof buildCatalogTreeRows>,
      name: string
    ) =>
      rows.find(
        row => row.type === 'node' && row.node.name === name
      ) as Extract<(typeof rows)[number], { type: 'node' }>;

    // Фильтр таблиц схемы, регистр не важен; схемы базы не трогает.
    const tablesFiltered = build({ [publicSchema.key]: 'ORDER' });
    expect(visibleNames(tablesFiltered).slice(0, 7)).toEqual([
      'analytics',
      '?schema',
      'public',
      '?table',
      'orders',
      'order_items',
      'archive',
    ]);
    expect(nodeRow(tablesFiltered, 'public')).toMatchObject({
      count: '10',
      shownCount: 2,
    });
    expect(nodeRow(tablesFiltered, 'analytics')).toMatchObject({
      count: '9',
      shownCount: null,
    });

    // Фильтр схем и фильтр таблиц внутри работают вместе.
    const combined = build({
      [analytics.key]: 'pub',
      [publicSchema.key]: 'pay',
    });
    expect(visibleNames(combined)).toEqual([
      'analytics',
      '?schema',
      'public',
      '?table',
      'payments',
      'warehouse',
    ]);
    expect(nodeRow(combined, 'analytics')).toMatchObject({ shownCount: 1 });

    // Совпадений нет — строка «Ничего не найдено» на уровне детей.
    const nothing = build({ [publicSchema.key]: 'zzz' });
    const noMatches = nothing.find(
      row => row.type === 'status' && row.status === 'noMatches'
    );
    expect(noMatches).toMatchObject({ branchKey: publicSchema.key, depth: 2 });
    expect(nodeRow(nothing, 'public')).toMatchObject({ shownCount: 0 });

    // Верхний поиск работает вместе с фильтром узла.
    expect(
      visibleNames(build({ [publicSchema.key]: 'order' }, 'items'))
    ).toEqual(['analytics', '?schema', 'public', '?table', 'order_items']);

    // Выбранная таблица остаётся выбранной, просто скрыта фильтром.
    const hidden = build({ [publicSchema.key]: 'pay' }, '', {
      databaseName: 'analytics',
      schemaName: 'public',
      tableName: 'orders',
    });
    expect(visibleNames(hidden)).not.toContain('orders');
    expect(nodeRow(hidden, 'public')).toMatchObject({ onPath: true });
  });

  it('keeps a node with an active filter visible under the top search', () => {
    const rows = buildCatalogTreeRows({
      levels,
      root,
      branches: {
        [analytics.key]: branch([publicSchema]),
        [publicSchema.key]: branch(manyTables),
      },
      expandedKeys: new Set([analytics.key, publicSchema.key]),
      query: 'orders',
      nodeQueries: { [publicSchema.key]: 'zzz' },
      selection: noSelection,
    });

    // Иначе поле, в которое идёт ввод, исчезло бы вместе со схемой.
    expect(visibleNames(rows)).toEqual([
      'analytics',
      'public',
      '?table',
      '#noMatches',
    ]);
  });

  it('groups expanded nodes with their search field and children', () => {
    const schemas = [
      publicSchema,
      archiveSchema,
      ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(schemaNode),
    ];
    const rows = buildCatalogTreeRows({
      levels,
      root,
      branches: {
        [analytics.key]: branch(schemas),
        [publicSchema.key]: branch(manyTables),
      },
      expandedKeys: new Set([analytics.key, publicSchema.key]),
      query: '',
      selection: noSelection,
    });
    const entries = groupCatalogTreeRows(rows);
    const describeEntry = (entry: CatalogTreeEntry): unknown =>
      entry.type === 'group'
        ? {
            group: entry.row.node.name,
            filter: entry.filter?.childLevel ?? null,
            children: entry.children.map(describeEntry),
          }
        : entry.type === 'node'
          ? entry.node.name
          : entry.type;

    expect(entries.map(describeEntry)).toEqual([
      {
        group: 'analytics',
        filter: 'schema',
        children: [
          {
            group: 'public',
            filter: 'table',
            children: manyTables.map(table => table.name),
          },
          'archive',
          'a',
          'b',
          'c',
          'd',
          'e',
          'f',
          'g',
        ],
      },
      'warehouse',
    ]);
  });

  it('keeps status rows inside their group and root status rows on top', () => {
    const entries = groupCatalogTreeRows(
      buildCatalogTreeRows({
        levels,
        root: branch([analytics], { hasNextPage: true }),
        branches: { [analytics.key]: branch([], { state: 'badGateway' }) },
        expandedKeys: new Set([analytics.key]),
        query: '',
        selection: noSelection,
      })
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      type: 'group',
      filter: null,
      children: [{ type: 'status', status: 'error' }],
    });
    expect(entries[1]).toMatchObject({ type: 'status', status: 'more' });
  });

  it('builds the path that has to be expanded to reveal a table', () => {
    expect(
      getCatalogSelectionPath(levels, {
        databaseName: 'analytics',
        schemaName: 'public',
        tableName: 'orders',
      }).map(node => node.key)
    ).toEqual([analytics.key, publicSchema.key]);
    expect(getCatalogSelectionPath(levels, noSelection)).toEqual([]);
  });
});
