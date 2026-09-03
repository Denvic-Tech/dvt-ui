import type {
  DataType,
  NodeInputExpressionValue,
} from '@/shared/gatewayClient';

export const DEFAULT_NULL_LITERAL_TOKEN = '__dvt_null_value';
export const DEFAULT_EMPTY_STRING_LITERAL_TOKEN = '__dvt_empty_string_value';

type Nullable<T> = T | null | undefined;

const DEFAULT_OPERATORS = [
  '==',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'contains',
  'startswith',
  'endswith',
  'isin',
  'notin',
  'isnull',
  'notnull',
];

const DEFAULT_OPERATORS_WITHOUT_RIGHT = ['isnull', 'notnull'];
const DEFAULT_OPERATORS_WITH_LIST_RIGHT = ['isin', 'notin'];
const DEFAULT_OPERATORS_WITH_LITERAL_RIGHT_ONLY = [
  'contains',
  'startswith',
  'endswith',
  'isin',
  'notin',
];
const DEFAULT_GROUP_KINDS: FilterGroupKind[] = ['and', 'or'];

const COMPARISON_OPERATORS_WITH_NULL_FORBIDDEN = new Set([
  '>',
  '<',
  '>=',
  '<=',
]);

const normalizeToken = (value: string): string => {
  const trimmed = value.trim();
  return /^[A-Za-z_]+$/.test(trimmed) ? trimmed.toLowerCase() : trimmed;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }
    const normalized = normalizeToken(item);
    if (normalized) {
      unique.add(normalized);
    }
  }
  return Array.from(unique);
};

const toOperatorSet = (
  value: unknown,
  fallback: string[]
): ReadonlySet<string> => {
  const parsed = toStringArray(value);
  return new Set(parsed.length > 0 ? parsed : fallback);
};

export type FilterOperandType = 'column' | 'literal' | 'expression';
export type FilterGroupKind = 'and' | 'or';

export interface FilterColumnOperand {
  type: 'column';
  column: string;
}

export interface FilterLiteralOperand {
  type: 'literal';
  value: unknown;
}

export interface FilterExpressionOperand {
  type: 'expression';
  value: NodeInputExpressionValue;
}

export type FilterOperand =
  | FilterColumnOperand
  | FilterLiteralOperand
  | FilterExpressionOperand;

export interface FilterConditionNode {
  kind: 'condition';
  left: FilterOperand;
  operator: string;
  right?: FilterOperand;
}

export interface FilterGroupNode {
  kind: FilterGroupKind;
  conditions: FilterTreeNode[];
}

export type FilterTreeNode = FilterConditionNode | FilterGroupNode;

export interface LegacyFilterCondition {
  column?: string;
  operator?: string;
  value?: unknown;
}

export interface DataFrameFilterInputValues {
  conditions?: Nullable<FilterTreeNode>;
  filter_conditions?: Nullable<LegacyFilterCondition[]>;
  logic?: Nullable<string>;
}

export interface NormalizedFilterRulesSpec {
  version: number;
  nullLiteralToken: string;
  emptyStringLiteralToken: string;
  operators: string[];
  logicOptions: FilterGroupKind[];
  operandTypes: ReadonlySet<FilterOperandType>;
  operatorsWithoutRight: ReadonlySet<string>;
  operatorsWithListRight: ReadonlySet<string>;
  operatorsWithLiteralRightOnly: ReadonlySet<string>;
  expressionOperandEnabled: boolean;
}

export type BuilderNode = BuilderConditionNode | BuilderGroupNode;

export interface BuilderState {
  rootLogic: FilterGroupKind;
  nodes: BuilderNode[];
}

export interface BuilderGroupNode {
  id: string;
  type: 'group';
  logic: FilterGroupKind;
  children: BuilderNode[];
}

export type BuilderListValue = BuilderListLiteralValue | BuilderListNullValue;

export interface BuilderListLiteralValue {
  id: string;
  kind: 'literal';
  value: string;
}

export interface BuilderListNullValue {
  id: string;
  kind: 'null';
}

export type BuilderRightValue =
  | BuilderRightLiteralValue
  | BuilderRightNullValue
  | BuilderRightColumnValue
  | BuilderRightExpressionValue;

export interface BuilderRightLiteralValue {
  kind: 'literal';
  value: string;
}

export interface BuilderRightNullValue {
  kind: 'null';
}

export interface BuilderRightColumnValue {
  kind: 'column';
  column: string;
}

export interface BuilderRightExpressionValue {
  kind: 'expression';
  value: unknown;
}

export interface BuilderConditionNode {
  id: string;
  type: 'condition';
  leftColumn: string;
  operator: string;
  right: BuilderRightValue;
  listValues: BuilderListValue[];
}

export interface BuildConditionsTreeOptions {
  strict?: boolean;
  columnNames?: string[];
  columnTypes?: Record<string, DataType | string>;
}

export interface BuildConditionsTreeResult {
  tree: FilterGroupNode;
  errors: string[];
}

const normalizeOperandTypes = (
  value: unknown
): ReadonlySet<FilterOperandType> => {
  const parsed = toStringArray(value);
  const allowed = parsed.filter(
    item => item === 'column' || item === 'literal' || item === 'expression'
  ) as FilterOperandType[];

  if (allowed.length === 0) {
    return new Set<FilterOperandType>(['column', 'literal', 'expression']);
  }

  return new Set<FilterOperandType>(allowed);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCanonicalSingleExpressionValue = (
  value: unknown
): value is NodeInputExpressionValue =>
  isRecord(value) &&
  value['__dvt_type'] === 'expr' &&
  typeof value['value'] === 'string' &&
  value['expression_kind'] === 'single';

const normalizeExpressionOperandEnabled = (
  raw: Record<string, unknown>,
  operandTypes: ReadonlySet<FilterOperandType>
): boolean => {
  if (!operandTypes.has('expression')) {
    return false;
  }

  const expressionOperand = raw['expression_operand'];
  if (
    isRecord(expressionOperand) &&
    typeof expressionOperand['enabled'] === 'boolean'
  ) {
    return expressionOperand['enabled'];
  }

  return true;
};

const normalizeLogicOptions = (value: unknown): FilterGroupKind[] => {
  const parsed = toStringArray(value);
  const kinds = parsed.filter(
    item => item === 'and' || item === 'or'
  ) as FilterGroupKind[];

  return kinds.length > 0 ? kinds : DEFAULT_GROUP_KINDS;
};

export const normalizeFilterRulesSpec = (
  value: unknown
): NormalizedFilterRulesSpec => {
  const raw = (value ?? {}) as Record<string, unknown>;
  const operators = toStringArray(raw['operators']);
  const operandTypes = normalizeOperandTypes(raw['operand_types']);

  return {
    version: typeof raw['version'] === 'number' ? raw['version'] : 3,
    nullLiteralToken:
      typeof raw['null_literal_token'] === 'string' &&
      raw['null_literal_token'].trim().length > 0
        ? raw['null_literal_token']
        : DEFAULT_NULL_LITERAL_TOKEN,
    emptyStringLiteralToken:
      typeof raw['empty_string_literal_token'] === 'string' &&
      raw['empty_string_literal_token'].trim().length > 0
        ? raw['empty_string_literal_token']
        : DEFAULT_EMPTY_STRING_LITERAL_TOKEN,
    operators: operators.length > 0 ? operators : [...DEFAULT_OPERATORS],
    logicOptions: normalizeLogicOptions(raw['node_kinds']),
    operandTypes,
    operatorsWithoutRight: toOperatorSet(
      raw['operators_without_right'],
      DEFAULT_OPERATORS_WITHOUT_RIGHT
    ),
    operatorsWithListRight: toOperatorSet(
      raw['operators_with_list_right'],
      DEFAULT_OPERATORS_WITH_LIST_RIGHT
    ),
    operatorsWithLiteralRightOnly: toOperatorSet(
      raw['operators_with_literal_right_only'],
      DEFAULT_OPERATORS_WITH_LITERAL_RIGHT_ONLY
    ),
    expressionOperandEnabled: normalizeExpressionOperandEnabled(
      raw,
      operandTypes
    ),
  };
};

export const normalizeLogic = (
  value: Nullable<string>,
  options: FilterGroupKind[]
): FilterGroupKind => {
  const normalized = typeof value === 'string' ? normalizeToken(value) : '';
  if (normalized === 'and' || normalized === 'or') {
    if (options.includes(normalized)) {
      return normalized;
    }
  }
  return options[0] ?? 'and';
};

export const requiresRightOperand = (
  operator: string,
  spec: NormalizedFilterRulesSpec
): boolean => !spec.operatorsWithoutRight.has(normalizeToken(operator));

export const isListOperator = (
  operator: string,
  spec: NormalizedFilterRulesSpec
): boolean => spec.operatorsWithListRight.has(normalizeToken(operator));

export const supportsColumnRightOperand = (
  operator: string,
  spec: NormalizedFilterRulesSpec
): boolean => {
  const normalized = normalizeToken(operator);
  return (
    spec.operandTypes.has('column') &&
    requiresRightOperand(normalized, spec) &&
    !spec.operatorsWithLiteralRightOnly.has(normalized)
  );
};

export const supportsExpressionRightOperand = (
  operator: string,
  spec: NormalizedFilterRulesSpec
): boolean =>
  spec.expressionOperandEnabled &&
  spec.operandTypes.has('expression') &&
  requiresRightOperand(operator, spec);

const isNullLiteralValue = (
  value: unknown,
  nullLiteralToken: string
): boolean => value === null || value === nullLiteralToken;

const stringifyLiteralValue = (
  value: unknown,
  nullLiteralToken: string
): string => {
  if (isNullLiteralValue(value, nullLiteralToken)) {
    return nullLiteralToken;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value === undefined) {
    return '';
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const normalizeOperator = (
  operator: Nullable<string>,
  spec: NormalizedFilterRulesSpec
): string => {
  const normalized = normalizeToken(operator ?? '');
  if (spec.operators.includes(normalized)) {
    return normalized;
  }
  return spec.operators[0] ?? DEFAULT_OPERATORS[0];
};

const parseListValueToBuilder = (
  value: unknown,
  spec: NormalizedFilterRulesSpec,
  nextId: () => string
): BuilderListValue[] => {
  const toItem = (item: unknown): BuilderListValue => {
    if (isNullLiteralValue(item, spec.nullLiteralToken)) {
      return {
        id: nextId(),
        kind: 'null',
      };
    }

    return {
      id: nextId(),
      kind: 'literal',
      value: stringifyLiteralValue(item, spec.nullLiteralToken),
    };
  };

  if (Array.isArray(value)) {
    return value.map(toItem);
  }

  if (typeof value === 'string') {
    const parts = value
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

    return parts.map(toItem);
  }

  if (value === undefined) {
    return [];
  }

  return [toItem(value)];
};

const parseRightValueToBuilder = (
  right: unknown,
  operator: string,
  spec: NormalizedFilterRulesSpec,
  nextId: () => string
): {
  rightValue: BuilderRightValue;
  listValues: BuilderListValue[];
} => {
  if (!requiresRightOperand(operator, spec)) {
    return {
      rightValue: { kind: 'literal', value: '' },
      listValues: [],
    };
  }

  const rightOperand = right as FilterOperand | undefined;
  if (isListOperator(operator, spec)) {
    if (rightOperand && rightOperand.type === 'expression') {
      return {
        rightValue: { kind: 'expression', value: rightOperand.value },
        listValues: [],
      };
    }

    const literal =
      rightOperand && rightOperand.type === 'literal'
        ? rightOperand.value
        : right;

    return {
      rightValue: { kind: 'literal', value: '' },
      listValues: parseListValueToBuilder(literal, spec, nextId),
    };
  }

  if (rightOperand && rightOperand.type === 'expression') {
    return {
      rightValue: { kind: 'expression', value: rightOperand.value },
      listValues: [],
    };
  }

  if (
    rightOperand &&
    rightOperand.type === 'column' &&
    typeof rightOperand.column === 'string'
  ) {
    return {
      rightValue: { kind: 'column', column: rightOperand.column },
      listValues: [],
    };
  }

  const literal =
    rightOperand && rightOperand.type === 'literal'
      ? rightOperand.value
      : right;

  if (isNullLiteralValue(literal, spec.nullLiteralToken)) {
    return {
      rightValue: { kind: 'null' },
      listValues: [],
    };
  }

  return {
    rightValue: {
      kind: 'literal',
      value: stringifyLiteralValue(literal, spec.nullLiteralToken),
    },
    listValues: [],
  };
};

const toBuilderConditionNode = (
  node: FilterConditionNode,
  spec: NormalizedFilterRulesSpec,
  nextId: () => string,
  defaultLeftColumn: string
): BuilderConditionNode => {
  const operator = normalizeOperator(node.operator, spec);
  const leftColumn =
    node.left &&
    node.left.type === 'column' &&
    typeof node.left.column === 'string'
      ? node.left.column
      : defaultLeftColumn;

  const parsed = parseRightValueToBuilder(node.right, operator, spec, nextId);

  return {
    id: nextId(),
    type: 'condition',
    leftColumn,
    operator,
    right: parsed.rightValue,
    listValues: parsed.listValues,
  };
};

const toBuilderNode = (
  node: FilterTreeNode,
  spec: NormalizedFilterRulesSpec,
  nextId: () => string,
  defaultLeftColumn: string
): BuilderNode => {
  if (node.kind === 'condition') {
    return toBuilderConditionNode(node, spec, nextId, defaultLeftColumn);
  }

  return {
    id: nextId(),
    type: 'group',
    logic: normalizeLogic(node.kind, spec.logicOptions),
    children: (node.conditions ?? []).map(child =>
      toBuilderNode(child, spec, nextId, defaultLeftColumn)
    ),
  };
};

const legacyConditionToBuilderNode = (
  item: LegacyFilterCondition,
  spec: NormalizedFilterRulesSpec,
  nextId: () => string,
  defaultLeftColumn: string
): BuilderConditionNode => {
  const operator = normalizeOperator(item.operator, spec);
  const leftColumn =
    typeof item.column === 'string' && item.column.trim().length > 0
      ? item.column
      : defaultLeftColumn;

  const parsed = parseRightValueToBuilder(
    {
      type: 'literal',
      value: item.value,
    },
    operator,
    spec,
    nextId
  );

  return {
    id: nextId(),
    type: 'condition',
    leftColumn,
    operator,
    right: parsed.rightValue,
    listValues: parsed.listValues,
  };
};

export const createIdFactory = (start = 0): (() => string) => {
  let counter = start;
  return () => {
    counter += 1;
    return `df_filter_node_${counter}`;
  };
};

export const createEmptyBuilderCondition = (
  columns: Array<{ name: string }>,
  spec: NormalizedFilterRulesSpec,
  nextId: () => string
): BuilderConditionNode => {
  const leftColumn = columns[0]?.name ?? '';
  const operator =
    spec.operators.find(op => requiresRightOperand(op, spec)) ??
    spec.operators[0] ??
    DEFAULT_OPERATORS[0];

  return {
    id: nextId(),
    type: 'condition',
    leftColumn,
    operator,
    right: { kind: 'literal', value: '' },
    listValues: [],
  };
};

export const createEmptyBuilderGroup = (
  spec: NormalizedFilterRulesSpec,
  nextId: () => string
): BuilderGroupNode => ({
  id: nextId(),
  type: 'group',
  logic: normalizeLogic(undefined, spec.logicOptions),
  children: [],
});

export const createBuilderStateFromInput = (
  values: Nullable<DataFrameFilterInputValues>,
  spec: NormalizedFilterRulesSpec,
  nextId: () => string,
  defaultLeftColumn = ''
): BuilderState => {
  const safeValues = values ?? {};

  if (safeValues.conditions) {
    const source = safeValues.conditions;

    if (source.kind === 'condition') {
      return {
        rootLogic: normalizeLogic(undefined, spec.logicOptions),
        nodes: [
          toBuilderConditionNode(source, spec, nextId, defaultLeftColumn),
        ],
      };
    }

    return {
      rootLogic: normalizeLogic(source.kind, spec.logicOptions),
      nodes: (source.conditions ?? []).map(child =>
        toBuilderNode(child, spec, nextId, defaultLeftColumn)
      ),
    };
  }

  const legacy = safeValues.filter_conditions ?? [];
  if (legacy.length > 0) {
    return {
      rootLogic: normalizeLogic(safeValues.logic, spec.logicOptions),
      nodes: legacy.map(item =>
        legacyConditionToBuilderNode(item, spec, nextId, defaultLeftColumn)
      ),
    };
  }

  return {
    rootLogic: normalizeLogic(safeValues.logic, spec.logicOptions),
    nodes: [],
  };
};

const parseScalarByType = (
  raw: string,
  dataType: Nullable<DataType | string>,
  nullLiteralToken: string,
  emptyStringLiteralToken: string
): unknown => {
  const trimmed = raw.trim();
  if (trimmed === emptyStringLiteralToken) {
    return emptyStringLiteralToken;
  }

  if (!trimmed) {
    return '';
  }

  if (trimmed === nullLiteralToken) {
    return nullLiteralToken;
  }

  const upper = String(dataType ?? '').toUpperCase();

  if (upper === 'INT' || upper === 'FLOAT') {
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (upper === 'BOOLEAN') {
    const lower = trimmed.toLowerCase();
    if (lower === 'true') {
      return true;
    }
    if (lower === 'false') {
      return false;
    }
  }

  return trimmed;
};

const listItemToLiteralValue = (
  item: BuilderListValue,
  dataType: Nullable<DataType | string>,
  nullLiteralToken: string,
  emptyStringLiteralToken: string
): unknown => {
  if (item.kind === 'null') {
    return nullLiteralToken;
  }
  return parseScalarByType(
    item.value,
    dataType,
    nullLiteralToken,
    emptyStringLiteralToken
  );
};

const rightValueToLiteral = (
  right: BuilderRightValue,
  dataType: Nullable<DataType | string>,
  nullLiteralToken: string,
  emptyStringLiteralToken: string
): unknown => {
  switch (right.kind) {
    case 'null':
      return nullLiteralToken;
    case 'column':
      return right.column;
    case 'expression':
      return right.value;
    case 'literal':
    default:
      return parseScalarByType(
        right.value,
        dataType,
        nullLiteralToken,
        emptyStringLiteralToken
      );
  }
};

const buildConditionNode = (
  node: BuilderConditionNode,
  spec: NormalizedFilterRulesSpec,
  options: BuildConditionsTreeOptions,
  strict: boolean,
  pathLabel: string,
  errors: string[]
): FilterConditionNode => {
  const knownColumns = new Set(options.columnNames ?? []);

  const operator = normalizeOperator(node.operator, spec);
  const leftColumn = node.leftColumn.trim();

  if (strict) {
    if (!leftColumn) {
      errors.push(`${pathLabel}: выберите левую колонку.`);
    } else if (knownColumns.size > 0 && !knownColumns.has(leftColumn)) {
      errors.push(
        `${pathLabel}: левая колонка '${leftColumn}' отсутствует во входном DataFrame.`
      );
    }

    if (!spec.operators.includes(operator)) {
      errors.push(
        `${pathLabel}: оператор '${node.operator}' не поддерживается.`
      );
    }
  }

  const result: FilterConditionNode = {
    kind: 'condition',
    left: {
      type: 'column',
      column: leftColumn,
    },
    operator,
  };

  if (!requiresRightOperand(operator, spec)) {
    return result;
  }

  if (isListOperator(operator, spec)) {
    if (node.right.kind === 'expression') {
      if (strict) {
        if (!supportsExpressionRightOperand(operator, spec)) {
          errors.push(
            `${pathLabel}: expression-операнд не поддерживается текущим контрактом.`
          );
        }
        if (!isCanonicalSingleExpressionValue(node.right.value)) {
          errors.push(
            `${pathLabel}: expression должен быть canonical expr(single).`
          );
        } else if (!node.right.value.value.trim()) {
          errors.push(`${pathLabel}: expression не должен быть пустым.`);
        }
      }

      result.right = {
        type: 'expression',
        value: node.right.value as NodeInputExpressionValue,
      };

      return result;
    }

    if (strict && node.listValues.length === 0) {
      errors.push(`${pathLabel}: добавьте хотя бы одно значение списка.`);
    }

    result.right = {
      type: 'literal',
      value: node.listValues.map(item =>
        listItemToLiteralValue(
          item,
          options.columnTypes?.[leftColumn],
          spec.nullLiteralToken,
          spec.emptyStringLiteralToken
        )
      ),
    };

    return result;
  }

  if (node.right.kind === 'column') {
    if (supportsColumnRightOperand(operator, spec)) {
      const rightColumn = node.right.column.trim();

      if (strict) {
        if (!rightColumn) {
          errors.push(`${pathLabel}: выберите правую колонку.`);
        } else if (knownColumns.size > 0 && !knownColumns.has(rightColumn)) {
          errors.push(
            `${pathLabel}: правая колонка '${rightColumn}' отсутствует во входном DataFrame.`
          );
        }
      }

      result.right = {
        type: 'column',
        column: rightColumn,
      };

      return result;
    }

    if (strict) {
      errors.push(
        `${pathLabel}: оператор '${operator}' поддерживает только literal или expression справа.`
      );
    }
  }

  if (node.right.kind === 'expression') {
    if (strict) {
      if (!supportsExpressionRightOperand(operator, spec)) {
        errors.push(
          `${pathLabel}: expression-операнд не поддерживается текущим контрактом.`
        );
      }
      if (!isCanonicalSingleExpressionValue(node.right.value)) {
        errors.push(
          `${pathLabel}: expression должен быть canonical expr(single).`
        );
      } else if (!node.right.value.value.trim()) {
        errors.push(`${pathLabel}: expression не должен быть пустым.`);
      }
    }

    result.right = {
      type: 'expression',
      value: node.right.value as NodeInputExpressionValue,
    };

    return result;
  }

  const literal = rightValueToLiteral(
    node.right,
    options.columnTypes?.[leftColumn],
    spec.nullLiteralToken,
    spec.emptyStringLiteralToken
  );

  if (strict) {
    const isExplicitEmptyStringToken =
      node.right.kind === 'literal' &&
      node.right.value === spec.emptyStringLiteralToken;

    if (
      typeof literal === 'string' &&
      literal.trim().length === 0 &&
      !isExplicitEmptyStringToken
    ) {
      errors.push(`${pathLabel}: правый операнд не должен быть пустым.`);
    }

    if (
      COMPARISON_OPERATORS_WITH_NULL_FORBIDDEN.has(operator) &&
      literal === spec.nullLiteralToken
    ) {
      errors.push(
        `${pathLabel}: оператор '${operator}' нельзя использовать с NULL-литералом.`
      );
    }
  }

  result.right = {
    type: 'literal',
    value: literal,
  };

  return result;
};

const buildNodes = (
  nodes: BuilderNode[],
  spec: NormalizedFilterRulesSpec,
  options: BuildConditionsTreeOptions,
  strict: boolean,
  pathPrefix: string,
  errors: string[],
  allowEmptyGroup: boolean
): FilterTreeNode[] => {
  if (strict && !allowEmptyGroup && nodes.length === 0) {
    errors.push(`${pathPrefix}: группа не должна быть пустой.`);
  }

  return nodes.map((node, index) => {
    const indexLabel = `${index + 1}`;

    if (node.type === 'group') {
      const groupPath = `${pathPrefix}.Группа ${indexLabel}`;
      return {
        kind: normalizeLogic(node.logic, spec.logicOptions),
        conditions: buildNodes(
          node.children,
          spec,
          options,
          strict,
          groupPath,
          errors,
          false
        ),
      };
    }

    return buildConditionNode(
      node,
      spec,
      options,
      strict,
      `${pathPrefix}.Условие ${indexLabel}`,
      errors
    );
  });
};

export const buildConditionsTreeFromBuilder = (
  state: BuilderState,
  spec: NormalizedFilterRulesSpec,
  options: BuildConditionsTreeOptions = {}
): BuildConditionsTreeResult => {
  const strict = options.strict ?? true;
  const errors: string[] = [];

  return {
    tree: {
      kind: normalizeLogic(state.rootLogic, spec.logicOptions),
      conditions: buildNodes(
        state.nodes,
        spec,
        options,
        strict,
        'Корень',
        errors,
        true
      ),
    },
    errors,
  };
};

export const countBuilderConditions = (nodes: BuilderNode[]): number =>
  nodes.reduce((acc, node) => {
    if (node.type === 'condition') {
      return acc + 1;
    }

    return acc + countBuilderConditions(node.children);
  }, 0);
