import type {
  EnvironmentFilterDefinition,
  EnvironmentGlobalDefinition,
  EnvironmentTestDefinition,
  ExpressionPolicy,
  ExpressionsConfig,
  Io,
} from '@/shared/gatewayClient';
import { getCompatibleVariableTypes } from '@/shared/lib/node-io';
import {
  buildInputVariableReference,
  extractNamespacedVariableReference,
  extractVariableNameFromReference,
  INLINE_OPERATOR_WORDS,
  isSafeVariableIdentifier,
  VARIABLE_NAMESPACE_VALUES,
  type VariableNamespace,
  type VariableOutput,
} from '@/shared/lib/variables';

export const CODE_FONT_FAMILY =
  '"JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, monospace';

export type HighlightedAutocompleteItemKind =
  | 'variable'
  | 'operator'
  | 'value'
  | 'filter'
  | 'test'
  | 'global';

export type HighlightedAutocompleteItem = {
  id: string;
  label: string;
  insertText: string;
  kind: HighlightedAutocompleteItemKind;
  detail?: string | undefined;
  keywords?: string[] | undefined;
  isWordLike?: boolean | undefined;
  isSymbolLike?: boolean | undefined;
};

export type InlineAutocompleteCatalog = {
  items: HighlightedAutocompleteItem[];
  itemsByKind: Record<
    HighlightedAutocompleteItemKind,
    HighlightedAutocompleteItem[]
  >;
};

export type InlineAutocompletePhase =
  | 'disabled'
  | 'operand'
  | 'operator'
  | 'between-and'
  | 'is-tail'
  | 'filter'
  | 'test';

export type InlineAutocompleteDecision = {
  phase: InlineAutocompletePhase;
  query: string;
  replaceStart: number;
  replaceEnd: number;
  allowedKinds: HighlightedAutocompleteItemKind[];
  items: HighlightedAutocompleteItem[];
};

export type InlineExpressionDiagnosticCode =
  | 'unknown-variable'
  | 'unknown-filter'
  | 'test-used-as-filter'
  | 'unknown-test'
  | 'filter-used-as-test'
  | 'symbolic-test-after-is'
  | 'unknown-global'
  | 'variable-used-as-function'
  | 'type-mismatch-direct-variable';

export type InlineExpressionDiagnosticSeverity = 'error' | 'warning';

export type InlineExpressionDiagnostic = {
  code: InlineExpressionDiagnosticCode;
  start: number;
  end: number;
  message: string;
  severity: InlineExpressionDiagnosticSeverity;
};

type BuildExpressionAutocompleteCatalogParams = {
  variables?: VariableOutput[];
  inputVariables?: VariableOutput[] | undefined;
  projectVariables?: VariableOutput[] | undefined;
  inputType?: Io | string | Array<Io> | null | undefined;
  expressionsConfig?: ExpressionsConfig | null;
  expressionPolicyName?: string | null | undefined;
};

type ResolveExpressionsEnvironmentResult = {
  policy: ExpressionPolicy | null;
  filters: EnvironmentFilterDefinition[];
  tests: EnvironmentTestDefinition[];
  globals: EnvironmentGlobalDefinition[];
  allFilters: EnvironmentFilterDefinition[];
  allTests: EnvironmentTestDefinition[];
  allGlobals: EnvironmentGlobalDefinition[];
};

type GetInlineExpressionDiagnosticsParams = {
  variables?: VariableOutput[];
  inputVariables?: VariableOutput[] | undefined;
  projectVariables?: VariableOutput[] | undefined;
  inputType?: Io | string | Array<Io> | null | undefined;
  expressionsConfig?: ExpressionsConfig | null;
  expressionPolicyName?: string | null | undefined;
};

type LexTokenType =
  | 'identifier'
  | 'reference'
  | 'number'
  | 'string'
  | 'operator'
  | 'pipe'
  | 'comma'
  | 'paren-open'
  | 'paren-close'
  | 'bracket-open'
  | 'bracket-close'
  | 'dot'
  | 'equals'
  | 'whitespace'
  | 'unknown';

type LexToken = {
  type: LexTokenType;
  value: string;
  start: number;
  end: number;
};

const WORD_OPERATOR_SET = new Set(INLINE_OPERATOR_WORDS);
const SYMBOLIC_OPERATOR_LABELS = ['==', '!=', '<=', '>=', '<', '>'];
const WORD_TEST_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const IDENTIFIER_CHAR_RE = /[A-Za-z0-9_]/;
const IDENTIFIER_START_RE = /[A-Za-z_]/;
const SYMBOL_FRAGMENT_RE = /[=!<>]/;
const VALUE_KIND_ORDER: Record<HighlightedAutocompleteItemKind, number> = {
  variable: 0,
  global: 1,
  value: 2,
  filter: 3,
  test: 4,
  operator: 5,
};

const dedupeAutocompleteItems = (
  items: HighlightedAutocompleteItem[]
): HighlightedAutocompleteItem[] => {
  const seen = new Set<string>();
  const result: HighlightedAutocompleteItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    result.push(item);
  }

  return result;
};

export const buildInlineAutocompleteCatalog = (
  items: HighlightedAutocompleteItem[]
): InlineAutocompleteCatalog => {
  const dedupedItems = dedupeAutocompleteItems(items);

  return {
    items: dedupedItems,
    itemsByKind: {
      filter: dedupedItems.filter(item => item.kind === 'filter'),
      global: dedupedItems.filter(item => item.kind === 'global'),
      operator: dedupedItems.filter(item => item.kind === 'operator'),
      test: dedupedItems.filter(item => item.kind === 'test'),
      value: dedupedItems.filter(item => item.kind === 'value'),
      variable: dedupedItems.filter(item => item.kind === 'variable'),
    },
  };
};

const normalizeExpressionName = (value: string) => value.trim().toLowerCase();

const buildExpressionPolicyAllowSet = (items?: string[] | null) => {
  if (!items || items.length === 0) {
    return null;
  }

  return new Set(items.map(normalizeExpressionName));
};

export const resolveExpressionsPolicy = (
  expressionsConfig?: ExpressionsConfig | null,
  _expressionPolicyName?: string | null
): ExpressionPolicy | null => expressionsConfig?.default_policy ?? null;

export const resolveExpressionsEnvironment = (
  expressionsConfig?: ExpressionsConfig | null,
  expressionPolicyName?: string | null
): ResolveExpressionsEnvironmentResult => {
  const allFilters = expressionsConfig?.filters ?? [];
  const allTests = expressionsConfig?.tests ?? [];
  const allGlobals = expressionsConfig?.globals ?? [];
  const policy = resolveExpressionsPolicy(
    expressionsConfig,
    expressionPolicyName
  );

  const allowedFilters = buildExpressionPolicyAllowSet(policy?.allowed_filters);
  const allowedTests = buildExpressionPolicyAllowSet(policy?.allowed_tests);
  const allowedGlobals = buildExpressionPolicyAllowSet(policy?.allowed_globals);

  return {
    allFilters,
    allGlobals,
    allTests,
    filters:
      allowedFilters == null
        ? allFilters
        : allFilters.filter(filter =>
            allowedFilters.has(normalizeExpressionName(filter.expression))
          ),
    globals:
      allowedGlobals == null
        ? allGlobals
        : allGlobals.filter(global =>
            allowedGlobals.has(normalizeExpressionName(global.expression))
          ),
    policy,
    tests:
      allowedTests == null
        ? allTests
        : allTests.filter(test =>
            allowedTests.has(normalizeExpressionName(test.expression))
          ),
  };
};

const getValueAutocompleteItems = (
  inputType?: Io | string | Array<Io> | null | undefined
): HighlightedAutocompleteItem[] => {
  switch (inputType) {
    case 'BOOLEAN':
      return [
        {
          id: 'value:true',
          insertText: 'true',
          kind: 'value',
          label: 'true',
          detail: 'Boolean literal',
        },
        {
          id: 'value:false',
          insertText: 'false',
          kind: 'value',
          label: 'false',
          detail: 'Boolean literal',
        },
      ];
    case 'INT':
    case 'FLOAT':
      return [
        {
          id: 'value:0',
          insertText: '0',
          kind: 'value',
          label: '0',
          detail: 'Numeric literal',
        },
        {
          id: 'value:1',
          insertText: '1',
          kind: 'value',
          label: '1',
          detail: 'Numeric literal',
        },
      ];
    case 'STRING':
    case 'DATETIME':
    case 'TIMEDELTA':
    case 'PRIMITIVE':
    default:
      return [
        {
          id: 'value:string',
          insertText: '""',
          kind: 'value',
          label: '""',
          detail:
            inputType === 'TIMEDELTA' ? 'Time delta literal' : 'String literal',
          keywords:
            inputType === 'TIMEDELTA'
              ? ['duration', 'timedelta']
              : ['string', 'text'],
        },
        {
          id: 'value:true',
          insertText: 'true',
          kind: 'value',
          label: 'true',
          detail: 'Boolean literal',
        },
        {
          id: 'value:false',
          insertText: 'false',
          kind: 'value',
          label: 'false',
          detail: 'Boolean literal',
        },
      ];
  }
};

export const buildExpressionAutocompleteCatalog = ({
  variables = [],
  inputVariables,
  projectVariables,
  inputType,
  expressionsConfig,
  expressionPolicyName,
}: BuildExpressionAutocompleteCatalogParams): InlineAutocompleteCatalog => {
  const environment = resolveExpressionsEnvironment(
    expressionsConfig,
    expressionPolicyName
  );

  const hasVariableNamespaces =
    inputVariables !== undefined || projectVariables !== undefined;
  const variableItems: HighlightedAutocompleteItem[] = hasVariableNamespaces
    ? VARIABLE_NAMESPACE_VALUES.map(namespace => ({
        id: `variable-namespace:${namespace}`,
        insertText: namespace,
        kind: 'variable' as const,
        label: namespace,
        detail:
          namespace === 'input_variables'
            ? 'Переменные из входящих нод'
            : 'Переменные проекта',
        keywords: [namespace],
      }))
    : variables.map(variable => ({
        id: `variable:${variable.scope}:${variable.name}`,
        insertText: variable.name,
        kind: 'variable' as const,
        label: variable.name,
        detail: `${variable.scope} / ${variable.type}${
          variable.isListType ? '[]' : ''
        }${variable.sourceLabel ? ` / ${variable.sourceLabel}` : ''}`,
        keywords: [
          variable.name,
          buildInputVariableReference(variable.name),
          variable.scope,
          variable.type,
          ...(variable.isListType ? ['list', 'array'] : ['scalar']),
        ],
      }));

  const operatorItems: HighlightedAutocompleteItem[] = [
    ...INLINE_OPERATOR_WORDS.map(operator => ({
      id: `operator:${operator}`,
      insertText: `${operator} `,
      kind: 'operator' as const,
      label: operator,
      detail: 'Expression operator',
      isWordLike: true,
    })),
    ...environment.allTests
      .filter(test => !WORD_TEST_NAME_RE.test(test.expression))
      .map(test => ({
        id: `operator:test:${test.name}`,
        insertText: `${test.expression} `,
        kind: 'operator' as const,
        label: test.expression,
        detail: test.description ?? `Test: ${test.name}`,
        isSymbolLike: true,
        keywords: [test.name, test.expression],
      })),
  ];

  const filterItems: HighlightedAutocompleteItem[] = environment.filters.map(
    filter => ({
      id: `filter:${filter.name}`,
      insertText: filter.expression,
      kind: 'filter',
      label: filter.expression,
      detail: filter.description ?? `Filter: ${filter.name}`,
      keywords: [filter.name, filter.expression],
      isWordLike: WORD_TEST_NAME_RE.test(filter.expression),
    })
  );

  const testItems: HighlightedAutocompleteItem[] = environment.tests
    .filter(test => WORD_TEST_NAME_RE.test(test.expression))
    .map(test => ({
      id: `test:${test.name}`,
      insertText: test.expression,
      kind: 'test',
      label: test.expression,
      detail: test.description ?? `Test: ${test.name}`,
      keywords: [test.name, test.expression],
      isWordLike: true,
    }));

  const globalItems: HighlightedAutocompleteItem[] = environment.globals.map(
    global => ({
      id: `global:${global.name}`,
      insertText: `${global.expression}()`,
      kind: 'global',
      label: global.expression,
      detail: global.description ?? `Global: ${global.name}`,
      keywords: [global.name, global.expression],
      isWordLike: true,
    })
  );

  return buildInlineAutocompleteCatalog([
    ...variableItems,
    ...operatorItems,
    ...getValueAutocompleteItems(inputType),
    ...filterItems,
    ...testItems,
    ...globalItems,
  ]);
};

const normalizeAutocompleteQuery = (query: string) =>
  query.trim().toLowerCase();

const getAutocompleteMatchScore = (
  query: string,
  item: HighlightedAutocompleteItem
) => {
  const normalizedQuery = normalizeAutocompleteQuery(query);
  if (!normalizedQuery) {
    return 0;
  }

  const candidates = [
    item.label,
    item.insertText,
    ...(item.keywords ?? []),
  ].map(candidate => candidate.toLowerCase());

  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (candidate === normalizedQuery) {
      bestScore = Math.min(bestScore, 0);
      continue;
    }
    if (candidate.startsWith(normalizedQuery)) {
      bestScore = Math.min(bestScore, 1);
      continue;
    }
    const wordMatchIndex = candidate.indexOf(` ${normalizedQuery}`);
    if (wordMatchIndex >= 0) {
      bestScore = Math.min(bestScore, 2 + wordMatchIndex);
      continue;
    }
  }

  return Number.isFinite(bestScore) ? bestScore : null;
};

export const filterHighlightedAutocompleteItems = (
  query: string,
  items: HighlightedAutocompleteItem[]
): HighlightedAutocompleteItem[] => {
  const normalizedQuery = normalizeAutocompleteQuery(query);
  const nextItems =
    normalizedQuery.length === 0
      ? items
      : items.filter(
          item => getAutocompleteMatchScore(normalizedQuery, item) != null
        );

  return [...nextItems].sort((left, right) => {
    const leftScore =
      getAutocompleteMatchScore(normalizedQuery, left) ??
      Number.MAX_SAFE_INTEGER;
    const rightScore =
      getAutocompleteMatchScore(normalizedQuery, right) ??
      Number.MAX_SAFE_INTEGER;

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    const leftKindWeight = VALUE_KIND_ORDER[left.kind];
    const rightKindWeight = VALUE_KIND_ORDER[right.kind];
    if (leftKindWeight !== rightKindWeight) {
      return leftKindWeight - rightKindWeight;
    }

    return left.label.localeCompare(right.label);
  });
};

const lexQuotedString = (value: string, start: number): LexToken => {
  const quote = value[start];
  let cursor = start + 1;

  while (cursor < value.length) {
    const currentChar = value[cursor];
    if (currentChar === '\\') {
      cursor += 2;
      continue;
    }
    if (currentChar === quote) {
      cursor += 1;
      break;
    }
    cursor += 1;
  }

  return {
    type: 'string',
    value: value.slice(start, cursor),
    start,
    end: cursor,
  };
};

const lexVariableReference = (
  value: string,
  start: number
): LexToken | null => {
  const namespace = VARIABLE_NAMESPACE_VALUES.find(item =>
    value.startsWith(item, start)
  );
  if (!namespace) {
    return null;
  }

  let cursor = start + namespace.length;
  if (
    value[cursor] === '.' &&
    IDENTIFIER_START_RE.test(value[cursor + 1] ?? '')
  ) {
    cursor += 1;
    while (cursor < value.length && IDENTIFIER_CHAR_RE.test(value[cursor])) {
      cursor += 1;
    }

    return {
      type: 'reference',
      value: value.slice(start, cursor),
      start,
      end: cursor,
    };
  }

  if (
    value[cursor] === '[' &&
    (value[cursor + 1] === '"' || value[cursor + 1] === "'")
  ) {
    cursor += 1;
    const stringToken = lexQuotedString(value, cursor);
    cursor = stringToken.end;
    if (value[cursor] === ']') {
      cursor += 1;
      return {
        type: 'reference',
        value: value.slice(start, cursor),
        start,
        end: cursor,
      };
    }
  }

  return null;
};

const lexInlineExpression = (value: string): LexToken[] => {
  const tokens: LexToken[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const currentChar = value[cursor];
    const variableReference = lexVariableReference(value, cursor);
    if (variableReference) {
      tokens.push(variableReference);
      cursor = variableReference.end;
      continue;
    }

    if (/\s/.test(currentChar)) {
      const start = cursor;
      while (cursor < value.length && /\s/.test(value[cursor])) {
        cursor += 1;
      }
      tokens.push({
        type: 'whitespace',
        value: value.slice(start, cursor),
        start,
        end: cursor,
      });
      continue;
    }

    if (currentChar === '"' || currentChar === "'") {
      const stringToken = lexQuotedString(value, cursor);
      tokens.push(stringToken);
      cursor = stringToken.end;
      continue;
    }

    if (/\d/.test(currentChar)) {
      const start = cursor;
      cursor += 1;
      while (cursor < value.length && /[\d.]/.test(value[cursor])) {
        cursor += 1;
      }
      tokens.push({
        type: 'number',
        value: value.slice(start, cursor),
        start,
        end: cursor,
      });
      continue;
    }

    if (IDENTIFIER_START_RE.test(currentChar)) {
      const start = cursor;
      cursor += 1;
      while (cursor < value.length && IDENTIFIER_CHAR_RE.test(value[cursor])) {
        cursor += 1;
      }
      tokens.push({
        type: 'identifier',
        value: value.slice(start, cursor),
        start,
        end: cursor,
      });
      continue;
    }

    const twoCharOperator = value.slice(cursor, cursor + 2);
    if (SYMBOLIC_OPERATOR_LABELS.includes(twoCharOperator)) {
      tokens.push({
        type: 'operator',
        value: twoCharOperator,
        start: cursor,
        end: cursor + 2,
      });
      cursor += 2;
      continue;
    }

    const singleType: LexTokenType | null =
      currentChar === '|'
        ? 'pipe'
        : currentChar === ','
          ? 'comma'
          : currentChar === '('
            ? 'paren-open'
            : currentChar === ')'
              ? 'paren-close'
              : currentChar === '['
                ? 'bracket-open'
                : currentChar === ']'
                  ? 'bracket-close'
                  : currentChar === '.'
                    ? 'dot'
                    : currentChar === '='
                      ? 'equals'
                      : '+-*/%<>'.includes(currentChar)
                        ? 'operator'
                        : null;

    if (singleType) {
      tokens.push({
        type: singleType,
        value: currentChar,
        start: cursor,
        end: cursor + 1,
      });
      cursor += 1;
      continue;
    }

    tokens.push({
      type: 'unknown',
      value: currentChar,
      start: cursor,
      end: cursor + 1,
    });
    cursor += 1;
  }

  return tokens;
};

const getSignificantTokens = (tokens: LexToken[]) =>
  tokens.filter(token => token.type !== 'whitespace');

const isBooleanLiteralToken = (token: LexToken | undefined) =>
  token?.type === 'identifier' &&
  ['true', 'false'].includes(token.value.toLowerCase());

const isWordOperatorToken = (token: LexToken | undefined) =>
  token?.type === 'identifier' &&
  WORD_OPERATOR_SET.has(token.value.toLowerCase());

const isOperandToken = (token: LexToken | undefined) => {
  if (!token) {
    return false;
  }

  if (
    token.type === 'reference' ||
    token.type === 'number' ||
    token.type === 'string' ||
    token.type === 'paren-close' ||
    token.type === 'bracket-close'
  ) {
    return true;
  }

  if (token.type === 'identifier' && !isWordOperatorToken(token)) {
    return true;
  }

  return isBooleanLiteralToken(token);
};

const isOperatorLikeToken = (token: LexToken | undefined) => {
  if (!token) {
    return false;
  }

  return (
    token.type === 'operator' ||
    token.type === 'equals' ||
    token.type === 'comma' ||
    token.type === 'paren-open' ||
    token.type === 'pipe' ||
    isWordOperatorToken(token)
  );
};

const getLastToken = (tokens: LexToken[]) =>
  tokens.length > 0 ? tokens[tokens.length - 1] : undefined;

const getIdentifierFragmentAtCursor = (value: string, cursor: number) => {
  let start = cursor;
  let end = cursor;

  while (start > 0 && IDENTIFIER_CHAR_RE.test(value[start - 1])) {
    start -= 1;
  }
  while (end < value.length && IDENTIFIER_CHAR_RE.test(value[end])) {
    end += 1;
  }

  if (!IDENTIFIER_START_RE.test(value[start] ?? '')) {
    return null;
  }

  return {
    start,
    end,
    value: value.slice(start, end),
  };
};

const getSymbolFragmentAtCursor = (value: string, cursor: number) => {
  let start = cursor;
  let end = cursor;

  while (start > 0 && SYMBOL_FRAGMENT_RE.test(value[start - 1])) {
    start -= 1;
  }
  while (end < value.length && SYMBOL_FRAGMENT_RE.test(value[end])) {
    end += 1;
  }

  if (!SYMBOL_FRAGMENT_RE.test(value[start] ?? '')) {
    return null;
  }

  return {
    start,
    end,
    value: value.slice(start, end),
  };
};

const isInsideStringContext = (value: string, cursor: number) => {
  let activeQuote: '"' | "'" | null = null;

  for (let index = 0; index < cursor; index += 1) {
    const currentChar = value[index];
    if (currentChar === '\\') {
      index += 1;
      continue;
    }

    if (!activeQuote && (currentChar === '"' || currentChar === "'")) {
      activeQuote = currentChar;
      continue;
    }

    if (activeQuote && currentChar === activeQuote) {
      activeQuote = null;
    }
  }

  return activeQuote != null;
};

const isInsideVariableKeyStringContext = (value: string, cursor: number) => {
  const prefix = value.slice(0, cursor);
  const bracketStart = Math.max(
    ...VARIABLE_NAMESPACE_VALUES.map(namespace =>
      prefix.lastIndexOf(`${namespace}[`)
    )
  );
  if (bracketStart < 0) {
    return false;
  }

  const closedBracket = prefix.lastIndexOf(']');
  if (closedBracket > bracketStart) {
    return false;
  }

  const quoteIndex = Math.max(prefix.lastIndexOf('"'), prefix.lastIndexOf("'"));
  return quoteIndex > bracketStart;
};

const buildAutocompleteDecision = (
  phase: InlineAutocompletePhase,
  allowedKinds: HighlightedAutocompleteItemKind[],
  query: string,
  replaceStart: number,
  replaceEnd: number,
  catalog: InlineAutocompleteCatalog,
  overrideItems?: HighlightedAutocompleteItem[],
  preserveOverrideOrder = false
): InlineAutocompleteDecision => {
  const baseItems =
    overrideItems ??
    allowedKinds.flatMap(kind => catalog.itemsByKind[kind] ?? []);

  return {
    phase,
    query,
    replaceStart,
    replaceEnd,
    allowedKinds,
    items:
      preserveOverrideOrder && normalizeAutocompleteQuery(query).length === 0
        ? baseItems
        : filterHighlightedAutocompleteItems(query, baseItems),
  };
};

export const resolveInlineAutocomplete = (
  value: string,
  cursorOffset: number,
  catalog: InlineAutocompleteCatalog
): InlineAutocompleteDecision => {
  if (
    isInsideStringContext(value, cursorOffset) ||
    isInsideVariableKeyStringContext(value, cursorOffset)
  ) {
    return {
      phase: 'disabled',
      query: '',
      replaceStart: cursorOffset,
      replaceEnd: cursorOffset,
      allowedKinds: [],
      items: [],
    };
  }

  const prefix = value.slice(0, cursorOffset);
  const filterMatch = prefix.match(/\|\s*([A-Za-z_][A-Za-z0-9_]*)?$/);
  if (filterMatch) {
    const query = filterMatch[1] ?? '';
    const replaceStart = query ? cursorOffset - query.length : cursorOffset;
    return buildAutocompleteDecision(
      'filter',
      ['filter'],
      query,
      replaceStart,
      cursorOffset,
      catalog
    );
  }

  const isNotMatch = prefix.match(/\bis\s+not\s+([A-Za-z_][A-Za-z0-9_]*)?$/);
  if (isNotMatch) {
    const query = isNotMatch[1] ?? '';
    const replaceStart = query ? cursorOffset - query.length : cursorOffset;
    return buildAutocompleteDecision(
      'test',
      ['test'],
      query,
      replaceStart,
      cursorOffset,
      catalog
    );
  }

  const isTailMatch = prefix.match(/\bis\s+([A-Za-z_][A-Za-z0-9_]*)?$/);
  if (isTailMatch) {
    const query = isTailMatch[1] ?? '';
    const replaceStart = query ? cursorOffset - query.length : cursorOffset;
    const notItem = catalog.itemsByKind.operator.find(
      item => item.label.toLowerCase() === 'not'
    );

    return buildAutocompleteDecision(
      'is-tail',
      ['operator', 'test'],
      query,
      replaceStart,
      cursorOffset,
      catalog,
      [...(notItem ? [notItem] : []), ...catalog.itemsByKind.test],
      true
    );
  }

  const tokens = lexInlineExpression(prefix);
  const significantTokens = getSignificantTokens(tokens);
  const lastToken = getLastToken(significantTokens);
  const endsWithWhitespace = /\s$/.test(prefix);
  const identifierFragment = getIdentifierFragmentAtCursor(value, cursorOffset);
  const symbolFragment = getSymbolFragmentAtCursor(value, cursorOffset);

  if (endsWithWhitespace && lastToken && isOperandToken(lastToken)) {
    const previousToken =
      significantTokens.length > 1
        ? significantTokens[significantTokens.length - 2]
        : undefined;
    if (
      previousToken &&
      isWordOperatorToken(previousToken) &&
      previousToken.value.toLowerCase() === 'between'
    ) {
      const andItem = catalog.itemsByKind.operator.find(
        item => item.label.toLowerCase() === 'and'
      );
      return buildAutocompleteDecision(
        'between-and',
        ['operator'],
        '',
        cursorOffset,
        cursorOffset,
        catalog,
        andItem ? [andItem] : []
      );
    }

    return buildAutocompleteDecision(
      'operator',
      ['operator'],
      '',
      cursorOffset,
      cursorOffset,
      catalog
    );
  }

  if (
    identifierFragment &&
    identifierFragment.end === cursorOffset &&
    !endsWithWhitespace
  ) {
    const fragmentTokens = getSignificantTokens(
      lexInlineExpression(prefix.slice(0, identifierFragment.start))
    );
    const previousToken = getLastToken(fragmentTokens);
    const operandLikeContext =
      !previousToken ||
      previousToken.type === 'equals' ||
      previousToken.type === 'paren-open' ||
      previousToken.type === 'comma' ||
      previousToken.type === 'operator' ||
      (isWordOperatorToken(previousToken) &&
        previousToken.value.toLowerCase() !== 'between');

    if (operandLikeContext) {
      return buildAutocompleteDecision(
        'operand',
        ['variable', 'value', 'global'],
        identifierFragment.value,
        identifierFragment.start,
        identifierFragment.end,
        catalog
      );
    }

    if (isOperandToken(previousToken)) {
      return buildAutocompleteDecision(
        'operator',
        ['operator'],
        identifierFragment.value,
        identifierFragment.start,
        identifierFragment.end,
        catalog
      );
    }
  }

  if (
    symbolFragment &&
    symbolFragment.end === cursorOffset &&
    !endsWithWhitespace &&
    !(symbolFragment.value === '=' && symbolFragment.start === 0) &&
    catalog.itemsByKind.operator.some(item => item.isSymbolLike)
  ) {
    return buildAutocompleteDecision(
      'operator',
      ['operator'],
      symbolFragment.value,
      symbolFragment.start,
      symbolFragment.end,
      catalog
    );
  }

  if (!lastToken) {
    return buildAutocompleteDecision(
      'operand',
      ['variable', 'value', 'global'],
      '',
      cursorOffset,
      cursorOffset,
      catalog
    );
  }

  if (
    lastToken.type === 'equals' ||
    lastToken.type === 'paren-open' ||
    lastToken.type === 'comma' ||
    lastToken.type === 'operator' ||
    (isWordOperatorToken(lastToken) &&
      lastToken.value.toLowerCase() !== 'between')
  ) {
    return buildAutocompleteDecision(
      'operand',
      ['variable', 'value', 'global'],
      '',
      cursorOffset,
      cursorOffset,
      catalog
    );
  }

  if (isOperandToken(lastToken)) {
    return buildAutocompleteDecision(
      'operator',
      ['operator'],
      '',
      cursorOffset,
      cursorOffset,
      catalog
    );
  }

  return {
    phase: 'disabled',
    query: '',
    replaceStart: cursorOffset,
    replaceEnd: cursorOffset,
    allowedKinds: [],
    items: [],
  };
};

export const sanitizeSingleLineValue = (value: string) =>
  value.replace(/\r?\n+/g, ' ');

const needsSpaceBeforeToken = (
  token: LexToken,
  previousToken: LexToken | undefined
) => {
  if (!previousToken) {
    return false;
  }

  if (
    token.type === 'paren-close' ||
    token.type === 'bracket-close' ||
    token.type === 'comma' ||
    token.type === 'dot'
  ) {
    return false;
  }

  if (
    previousToken.type === 'paren-open' ||
    previousToken.type === 'bracket-open' ||
    previousToken.type === 'dot'
  ) {
    return false;
  }

  if (token.type === 'paren-open') {
    return !(
      previousToken.type === 'identifier' ||
      previousToken.type === 'reference' ||
      previousToken.type === 'paren-close'
    );
  }

  if (token.type === 'bracket-open') {
    return false;
  }

  if (token.type === 'equals') {
    return true;
  }

  if (token.type === 'pipe' || previousToken.type === 'pipe') {
    return true;
  }

  if (token.type === 'operator' || previousToken.type === 'operator') {
    if (
      token.value === '-' &&
      (!previousToken || isOperatorLikeToken(previousToken))
    ) {
      return false;
    }
    return true;
  }

  if (isWordOperatorToken(token) || isWordOperatorToken(previousToken)) {
    return true;
  }

  return true;
};

const needsTrailingSpace = (
  token: LexToken,
  nextToken: LexToken | undefined
) => {
  if (!nextToken) {
    return false;
  }

  if (token.type === 'comma' || token.type === 'pipe') {
    return true;
  }

  if (token.type === 'operator') {
    return !(
      token.value === '-' &&
      (nextToken.type === 'number' ||
        nextToken.type === 'identifier' ||
        nextToken.type === 'reference')
    );
  }

  if (isWordOperatorToken(token) || token.type === 'equals') {
    return true;
  }

  return false;
};

export const formatSingleLineExpression = (
  value: string,
  _variables: VariableOutput[] = []
) => {
  const sanitizedValue = sanitizeSingleLineValue(value).trim();
  if (!sanitizedValue) {
    return '';
  }

  const tokens = getSignificantTokens(lexInlineExpression(sanitizedValue));
  if (tokens.length === 0) {
    return sanitizedValue;
  }

  let result = '';
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previousToken = tokens[index - 1];
    const nextToken = tokens[index + 1];

    if (index > 0 && needsSpaceBeforeToken(token, previousToken)) {
      result = result.trimEnd() + ' ';
    }

    result += token.value;

    if (needsTrailingSpace(token, nextToken)) {
      result += ' ';
    }
  }

  return result.replace(/\s+\)/g, ')').replace(/\(\s+/g, '(').trim();
};

const createDefinitionMap = <T extends { name: string; expression: string }>(
  items: T[]
) => {
  const byExpression = new Map<string, T>();
  const byName = new Map<string, T>();

  for (const item of items) {
    byExpression.set(normalizeExpressionName(item.expression), item);
    byName.set(normalizeExpressionName(item.name), item);
  }

  return {
    byExpression,
    byName,
  };
};

const isReservedLiteralIdentifier = (token: LexToken) => {
  const normalized = token.value.toLowerCase();
  return (
    normalized === 'true' ||
    normalized === 'false' ||
    normalized === 'none' ||
    VARIABLE_NAMESPACE_VALUES.includes(normalized as VariableNamespace)
  );
};

const getDirectVariableReferenceInfo = (value: string) => {
  const trimmedExpression = sanitizeSingleLineValue(value)
    .replace(/^=/, '')
    .trim();
  if (!trimmedExpression) {
    return null;
  }

  const variableName = extractVariableNameFromReference(trimmedExpression);
  if (!variableName) {
    return null;
  }

  return {
    namespace:
      extractNamespacedVariableReference(trimmedExpression)?.namespace ?? null,
    variableName,
    start: value.indexOf(trimmedExpression),
    end: value.indexOf(trimmedExpression) + trimmedExpression.length,
  };
};

export const getInlineExpressionDiagnostics = (
  value: string,
  {
    variables = [],
    inputVariables,
    projectVariables,
    inputType,
    expressionsConfig,
    expressionPolicyName,
  }: GetInlineExpressionDiagnosticsParams = {}
): InlineExpressionDiagnostic[] => {
  const sanitizedValue = sanitizeSingleLineValue(value);
  if (!sanitizedValue.trim()) {
    return [];
  }

  const environment = resolveExpressionsEnvironment(
    expressionsConfig,
    expressionPolicyName
  );
  const filterMaps = createDefinitionMap(environment.allFilters);
  const testMaps = createDefinitionMap(environment.allTests);
  const globalMaps = createDefinitionMap(environment.allGlobals);
  const variableNames = new Set(variables.map(variable => variable.name));
  const variableNamesByNamespace: Record<VariableNamespace, Set<string>> = {
    input_variables: new Set(
      (inputVariables ?? variables).map(variable => variable.name)
    ),
    project_variables: new Set(
      (projectVariables ?? variables).map(variable => variable.name)
    ),
  };
  const diagnostics: InlineExpressionDiagnostic[] = [];
  const significantTokens = getSignificantTokens(
    lexInlineExpression(sanitizedValue)
  );

  const pushDiagnostic = (
    code: InlineExpressionDiagnosticCode,
    token: LexToken,
    message: string,
    severity: InlineExpressionDiagnosticSeverity = 'error'
  ) => {
    if (
      diagnostics.some(
        existing =>
          existing.code === code &&
          existing.start === token.start &&
          existing.end === token.end &&
          existing.severity === severity
      )
    ) {
      return;
    }

    diagnostics.push({
      code,
      start: token.start,
      end: token.end,
      message,
      severity,
    });
  };

  for (let index = 0; index < significantTokens.length; index += 1) {
    const token = significantTokens[index];
    const previousToken = significantTokens[index - 1];
    const twoTokensBack = significantTokens[index - 2];
    const nextToken = significantTokens[index + 1];

    if (token.type === 'pipe') {
      const filterToken = significantTokens[index + 1];
      if (!filterToken || filterToken.type !== 'identifier') {
        continue;
      }

      const normalizedFilter = normalizeExpressionName(filterToken.value);
      const knownFilter =
        filterMaps.byExpression.get(normalizedFilter) ??
        filterMaps.byName.get(normalizedFilter);

      if (!knownFilter) {
        const matchingTest =
          testMaps.byExpression.get(normalizedFilter) ??
          testMaps.byName.get(normalizedFilter);

        if (matchingTest) {
          pushDiagnostic(
            'test-used-as-filter',
            filterToken,
            `Тест "${filterToken.value}" используется как фильтр. Используйте его после "is".`
          );
          continue;
        }

        pushDiagnostic(
          'unknown-filter',
          filterToken,
          `Неизвестный или запрещённый фильтр "${filterToken.value}".`
        );
        continue;
      }

      if (
        !environment.filters.some(
          filter =>
            normalizeExpressionName(filter.expression) === normalizedFilter ||
            normalizeExpressionName(filter.name) === normalizedFilter
        )
      ) {
        pushDiagnostic(
          'unknown-filter',
          filterToken,
          `Фильтр "${filterToken.value}" недоступен по policy.`
        );
      }
      continue;
    }

    if (
      token.type === 'identifier' &&
      previousToken &&
      previousToken.type === 'identifier' &&
      previousToken.value.toLowerCase() === 'is'
    ) {
      const normalizedTest = normalizeExpressionName(token.value);
      const matchingFilter =
        filterMaps.byExpression.get(normalizedTest) ??
        filterMaps.byName.get(normalizedTest);
      const knownTest =
        testMaps.byExpression.get(normalizedTest) ??
        testMaps.byName.get(normalizedTest);

      if (matchingFilter && !knownTest) {
        pushDiagnostic(
          'filter-used-as-test',
          token,
          `Фильтр "${token.value}" используется как тест. Используйте его после "|".`
        );
        continue;
      }

      if (!knownTest) {
        pushDiagnostic(
          'unknown-test',
          token,
          `Неизвестный или запрещённый тест "${token.value}".`
        );
        continue;
      }

      if (
        !environment.tests.some(
          test =>
            normalizeExpressionName(test.expression) === normalizedTest ||
            normalizeExpressionName(test.name) === normalizedTest
        )
      ) {
        pushDiagnostic(
          'unknown-test',
          token,
          `Тест "${token.value}" недоступен по policy.`
        );
      }
      continue;
    }

    if (
      token.type === 'identifier' &&
      previousToken &&
      previousToken.type === 'identifier' &&
      previousToken.value.toLowerCase() === 'not' &&
      twoTokensBack &&
      twoTokensBack.type === 'identifier' &&
      twoTokensBack.value.toLowerCase() === 'is'
    ) {
      const normalizedTest = normalizeExpressionName(token.value);
      const matchingFilter =
        filterMaps.byExpression.get(normalizedTest) ??
        filterMaps.byName.get(normalizedTest);
      const knownTest =
        testMaps.byExpression.get(normalizedTest) ??
        testMaps.byName.get(normalizedTest);

      if (matchingFilter && !knownTest) {
        pushDiagnostic(
          'filter-used-as-test',
          token,
          `Фильтр "${token.value}" используется как тест. Используйте его после "|".`
        );
        continue;
      }

      if (!knownTest) {
        pushDiagnostic(
          'unknown-test',
          token,
          `Неизвестный или запрещённый тест "${token.value}".`
        );
        continue;
      }

      if (
        !environment.tests.some(
          test =>
            normalizeExpressionName(test.expression) === normalizedTest ||
            normalizeExpressionName(test.name) === normalizedTest
        )
      ) {
        pushDiagnostic(
          'unknown-test',
          token,
          `Тест "${token.value}" недоступен по policy.`
        );
      }
      continue;
    }

    if (
      token.type === 'operator' &&
      previousToken &&
      previousToken.type === 'identifier' &&
      previousToken.value.toLowerCase() === 'is'
    ) {
      pushDiagnostic(
        'symbolic-test-after-is',
        token,
        `Символьный тест "${token.value}" нельзя использовать после "is". Используйте его как оператор без "is".`
      );
      continue;
    }

    if (
      token.type === 'identifier' &&
      nextToken?.type === 'paren-open' &&
      !isWordOperatorToken(token)
    ) {
      const normalizedGlobal = normalizeExpressionName(token.value);
      const knownGlobal =
        globalMaps.byExpression.get(normalizedGlobal) ??
        globalMaps.byName.get(normalizedGlobal);

      if (!knownGlobal) {
        if (variableNames.has(token.value)) {
          pushDiagnostic(
            'variable-used-as-function',
            token,
            `Переменная "${token.value}" используется как функция.`
          );
          continue;
        }

        pushDiagnostic(
          'unknown-global',
          token,
          `Неизвестный или запрещённый global "${token.value}".`
        );
        continue;
      }

      if (
        !environment.globals.some(
          global =>
            normalizeExpressionName(global.expression) === normalizedGlobal ||
            normalizeExpressionName(global.name) === normalizedGlobal
        )
      ) {
        pushDiagnostic(
          'unknown-global',
          token,
          `Global "${token.value}" недоступен по policy.`
        );
      }
      continue;
    }

    if (
      token.type === 'identifier' &&
      !isWordOperatorToken(token) &&
      !isReservedLiteralIdentifier(token) &&
      previousToken?.type !== 'pipe' &&
      previousToken?.value.toLowerCase() !== 'is' &&
      !(
        previousToken?.type === 'identifier' &&
        previousToken.value.toLowerCase() === 'not' &&
        twoTokensBack?.type === 'identifier' &&
        twoTokensBack.value.toLowerCase() === 'is'
      )
    ) {
      if (variableNames.has(token.value)) {
        continue;
      }

      const normalizedIdentifier = normalizeExpressionName(token.value);
      const knownGlobal =
        globalMaps.byExpression.get(normalizedIdentifier) ??
        globalMaps.byName.get(normalizedIdentifier);
      if (knownGlobal) {
        continue;
      }

      if (
        isSafeVariableIdentifier(token.value) &&
        nextToken?.type !== 'paren-open'
      ) {
        pushDiagnostic(
          'unknown-variable',
          token,
          `Неизвестная переменная "${token.value}".`
        );
        continue;
      }
    }

    if (token.type === 'reference') {
      const variableReference = extractNamespacedVariableReference(token.value);
      if (
        variableReference &&
        !variableNamesByNamespace[variableReference.namespace].has(
          variableReference.name
        )
      ) {
        pushDiagnostic(
          'unknown-variable',
          token,
          `Неизвестная переменная "${variableReference.name}" в ${variableReference.namespace}.`
        );
      }
    }
  }

  const directVariableReference =
    getDirectVariableReferenceInfo(sanitizedValue);
  if (directVariableReference && inputType) {
    const compatibleTypes = getCompatibleVariableTypes(inputType as Io | Io[]);
    const directVariables = directVariableReference.namespace
      ? directVariableReference.namespace === 'input_variables'
        ? (inputVariables ?? variables)
        : (projectVariables ?? variables)
      : variables;
    const directVariable = directVariables.find(
      variable => variable.name === directVariableReference.variableName
    );

    if (
      directVariable &&
      compatibleTypes.length > 0 &&
      !compatibleTypes.includes(directVariable.type)
    ) {
      diagnostics.push({
        code: 'type-mismatch-direct-variable',
        start: directVariableReference.start,
        end: directVariableReference.end,
        message: `Переменная "${directVariable.name}" имеет тип ${directVariable.type}, который может быть несовместим с полем ${Array.isArray(inputType) ? inputType[0] : inputType}.`,
        severity: 'warning',
      });
    }
  }

  return diagnostics;
};
