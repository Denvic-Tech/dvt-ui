import type * as monacoTypes from 'monaco-editor';

import type {
  CodeEditorCompletionProvider,
  CodeEditorCompletionSection,
} from '../types';

export type SqlCompletionColumn = {
  name: string;
  detail?: string | undefined;
  tableName?: string | undefined;
  type?: string | undefined;
};

export type SqlCompletionTable = {
  name: string;
  detail?: string | undefined;
  columns?: SqlCompletionColumn[] | undefined;
};

export type SqlCompletionCatalog = {
  dialect?: string | undefined;
  keywords?: string[] | undefined;
  tables?: SqlCompletionTable[] | undefined;
};

const DEFAULT_SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'INNER JOIN',
  'ON',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'WITH',
  'UNION',
  'UNION ALL',
  'DISTINCT',
  'AS',
  'IN',
  'NOT IN',
  'BETWEEN',
  'LIKE',
  'ILIKE',
  'IS NULL',
  'IS NOT NULL',
];

const SQL_IDENTIFIER_RE =
  /(?:"[^"]+"|`[^`]+`|[A-Za-z_][\w$]*)(?:\.(?:"[^"]+"|`[^`]+`|[A-Za-z_][\w$]*))*/;
const SQL_ALIAS_RE = new RegExp(
  `\\b(?:from|join)\\s+(${SQL_IDENTIFIER_RE.source})(?:\\s+(?:as\\s+)?("[^"]+"|\`[^\`]+\`|[A-Za-z_][\\w$]*))?`,
  'gi'
);
const RESERVED_ALIAS_WORDS = new Set([
  'where',
  'join',
  'left',
  'right',
  'full',
  'inner',
  'outer',
  'on',
  'group',
  'order',
  'having',
  'limit',
  'offset',
]);

const stripIdentifierQuotes = (value: string): string =>
  value.replace(/^["`]|["`]$/g, '');

const normalizeIdentifier = (value: string): string =>
  stripIdentifierQuotes(value).toLowerCase();

const getLastIdentifierPart = (value: string): string => {
  const parts = value.split('.');
  return normalizeIdentifier(parts[parts.length - 1] ?? value);
};

const getModelTextBeforePosition = (
  model: monacoTypes.editor.ITextModel,
  position: monacoTypes.Position
): string => {
  if (typeof model.getValueInRange === 'function') {
    return model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });
  }

  return model.getValue().slice(0, model.getOffsetAt(position));
};

const getAliasMap = (sql: string): Map<string, string> => {
  const aliases = new Map<string, string>();
  let match: RegExpExecArray | null = null;

  while ((match = SQL_ALIAS_RE.exec(sql)) != null) {
    const tableName = match[1];
    const alias = match[2];

    if (!tableName) {
      continue;
    }

    aliases.set(normalizeIdentifier(tableName), tableName);
    aliases.set(getLastIdentifierPart(tableName), tableName);

    if (!alias) {
      continue;
    }

    const normalizedAlias = normalizeIdentifier(alias);
    if (!RESERVED_ALIAS_WORDS.has(normalizedAlias)) {
      aliases.set(normalizedAlias, tableName);
    }
  }

  return aliases;
};

const getQualifierBeforeCursor = (textBeforeCursor: string): string | null => {
  const match = textBeforeCursor.match(
    /("[^"]+"|`[^`]+`|[A-Za-z_][\w$]*)\.\w*$/
  );
  return match?.[1] ?? null;
};

const isTablePosition = (textBeforeCursor: string): boolean =>
  /\b(from|join)\s+(?:"[^"]*"|`[^`]*`|[\w$.]*)$/i.test(textBeforeCursor);

const isColumnPosition = (textBeforeCursor: string): boolean =>
  /\b(select|where|on|having|group\s+by|order\s+by)\b[\s\S]*$/i.test(
    textBeforeCursor
  );

const getColumnsForQualifier = (
  catalog: SqlCompletionCatalog,
  qualifier: string,
  sql: string
): SqlCompletionColumn[] => {
  const tables = catalog.tables ?? [];
  const aliasMap = getAliasMap(sql);
  const tableName = aliasMap.get(normalizeIdentifier(qualifier));

  if (!tableName) {
    return [];
  }

  const normalizedTableName = normalizeIdentifier(tableName);
  const table = tables.find(
    item =>
      normalizeIdentifier(item.name) === normalizedTableName ||
      getLastIdentifierPart(item.name) === normalizedTableName
  );

  return table?.columns ?? [];
};

const getAllColumns = (catalog: SqlCompletionCatalog): SqlCompletionColumn[] =>
  (catalog.tables ?? []).flatMap(table =>
    (table.columns ?? []).map(column => ({
      ...column,
      tableName: column.tableName ?? table.name,
    }))
  );

const buildColumnSection = (
  columns: SqlCompletionColumn[],
  range: monacoTypes.IRange
): CodeEditorCompletionSection => ({
  id: 'sql-columns',
  priority: 0,
  items: columns.map(column => ({
    label: column.name,
    insertText: column.name,
    kind: 'field',
    detail:
      column.detail ??
      [column.type, column.tableName].filter(Boolean).join(' / ') ??
      undefined,
    range,
    keywords: [column.name, column.tableName ?? '', column.type ?? ''].filter(
      Boolean
    ),
  })),
});

const buildTableSection = (
  tables: SqlCompletionTable[],
  range: monacoTypes.IRange
): CodeEditorCompletionSection => ({
  id: 'sql-tables',
  priority: 0,
  items: tables.map(table => ({
    label: table.name,
    insertText: table.name,
    kind: 'class',
    detail: table.detail ?? 'table',
    range,
  })),
});

const buildKeywordSection = (
  catalog: SqlCompletionCatalog,
  range: monacoTypes.IRange
): CodeEditorCompletionSection => ({
  id: 'sql-keywords',
  priority: 80,
  items: (catalog.keywords ?? DEFAULT_SQL_KEYWORDS).map(keyword => ({
    label: keyword,
    insertText: keyword,
    kind: 'keyword',
    range,
  })),
});

const buildSnippetSection = (
  monaco: typeof monacoTypes,
  range: monacoTypes.IRange
): CodeEditorCompletionSection => ({
  id: 'sql-snippets',
  priority: 20,
  items: [
    {
      label: 'select from',
      insertText: 'SELECT ${1:*}\nFROM ${2:table}\nLIMIT ${3:100}',
      kind: 'snippet',
      detail: 'SELECT query template',
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    },
    {
      label: 'where equals',
      insertText: 'WHERE ${1:column} = ${2:value}',
      kind: 'snippet',
      detail: 'WHERE predicate',
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    },
  ],
});

export const createSqlCompletionProvider = (
  getCatalog: () => SqlCompletionCatalog
): CodeEditorCompletionProvider<void> => ({
  id: 'dvt-sql',
  priority: 5,
  triggerCharacters: ['.', ' ', '\n', '_'],
  getSections: ({ model, monaco, position, wordRange }) => {
    const catalog = getCatalog();
    const textBeforeCursor = getModelTextBeforePosition(model, position);
    const qualifier = getQualifierBeforeCursor(textBeforeCursor);

    if (qualifier) {
      const scopedColumns = getColumnsForQualifier(
        catalog,
        qualifier,
        model.getValue()
      );

      return scopedColumns.length > 0
        ? [buildColumnSection(scopedColumns, wordRange)]
        : [buildKeywordSection(catalog, wordRange)];
    }

    if (isTablePosition(textBeforeCursor)) {
      return [buildTableSection(catalog.tables ?? [], wordRange)];
    }

    if (isColumnPosition(textBeforeCursor)) {
      const columns = getAllColumns(catalog);
      return [
        ...(columns.length > 0 ? [buildColumnSection(columns, wordRange)] : []),
        buildSnippetSection(monaco, wordRange),
        buildKeywordSection(catalog, wordRange),
      ];
    }

    return [
      buildSnippetSection(monaco, wordRange),
      buildKeywordSection(catalog, wordRange),
    ];
  },
});
