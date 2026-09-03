import type { Io } from '@/shared/gatewayClient';

import {
  extractVariableNameFromReference,
  isSafeVariableIdentifier,
} from './helpers';
import type { VariableOutput, VariableType } from './types';

export type InlineValueSemanticType =
  | 'numeric'
  | 'string'
  | 'boolean'
  | 'operator'
  | 'unknown';

export type InlineExpressionTokenKind =
  | 'text'
  | 'variable'
  | 'number'
  | 'string'
  | 'boolean'
  | 'operator';

export interface InlineExpressionToken {
  kind: InlineExpressionTokenKind;
  value: string;
  start: number;
  end: number;
  semanticType?: InlineValueSemanticType;
  variable?: VariableOutput;
  variableName?: string;
}

export const INLINE_VALUE_TYPE_COLORS: Record<InlineValueSemanticType, string> =
  {
    numeric: '#2AACB8',
    string: '#6AAB73',
    boolean: '#CF8E6D',
    operator: '#CF8E6D',
    unknown: '#4C84FF',
  };

const NUMERIC_TYPES = new Set<Io | VariableType>(['INT', 'FLOAT', 'FLOAT,INT']);
const STRING_TYPES = new Set<Io | VariableType>([
  'STRING',
  'DATETIME',
  'TIMEDELTA',
]);
const BOOLEAN_TYPES = new Set<Io | VariableType>(['BOOLEAN']);

export const INLINE_OPERATOR_WORDS = [
  'and',
  'as',
  'between',
  'contains',
  'in',
  'is',
  'like',
  'not',
  'or',
];

const OPERATOR_WORDS = new Set(INLINE_OPERATOR_WORDS);

const VARIABLE_REFERENCE_PATTERN =
  /input_variables(?:\.[A-Za-z_][A-Za-z0-9_]*|\[(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')\])/;

const TOKEN_PATTERN = new RegExp(
  [
    VARIABLE_REFERENCE_PATTERN.source,
    `"(?:\\\\.|[^"])*"`,
    `'(?:\\\\.|[^'])*'`,
    `\\b(?:true|false)\\b`,
    `\\b\\d+(?:\\.\\d+)?\\b`,
    `\\b[A-Za-z_][A-Za-z0-9_]*\\b`,
  ].join('|'),
  'gi'
);

export const getInlineValueSemanticType = (
  type: VariableType | Io | null | undefined
): InlineValueSemanticType => {
  if (!type) {
    return 'unknown';
  }

  if (NUMERIC_TYPES.has(type)) {
    return 'numeric';
  }

  if (STRING_TYPES.has(type)) {
    return 'string';
  }

  if (BOOLEAN_TYPES.has(type)) {
    return 'boolean';
  }

  return 'unknown';
};

const buildTextToken = (
  value: string,
  start: number,
  end: number
): InlineExpressionToken => ({
  kind: 'text',
  value,
  start,
  end,
});

export const tokenizeInlineExpression = (
  value: string,
  variables: VariableOutput[] = []
): InlineExpressionToken[] => {
  if (!value) {
    return [];
  }

  const variablesByName = new Map(
    variables.map(variable => [variable.name, variable])
  );
  const tokens: InlineExpressionToken[] = [];
  let cursor = 0;

  for (const match of value.matchAll(TOKEN_PATTERN)) {
    const matchedValue = match[0];
    const start = match.index ?? 0;
    const end = start + matchedValue.length;

    if (start > cursor) {
      tokens.push(buildTextToken(value.slice(cursor, start), cursor, start));
    }

    const variableName = extractVariableNameFromReference(matchedValue);
    const variable = variableName
      ? variablesByName.get(variableName)
      : undefined;
    const isLegacyOrBracketReference =
      VARIABLE_REFERENCE_PATTERN.test(matchedValue);

    if (
      isLegacyOrBracketReference ||
      (variable && isSafeVariableIdentifier(matchedValue))
    ) {
      const variableToken: InlineExpressionToken = {
        kind: 'variable',
        value: matchedValue,
        start,
        end,
        semanticType: getInlineValueSemanticType(variable?.type),
      };

      if (variable) {
        variableToken.variable = variable;
      }

      if (variableName) {
        variableToken.variableName = variableName;
      }

      tokens.push(variableToken);
    } else if (/^['"]/.test(matchedValue)) {
      tokens.push({
        kind: 'string',
        value: matchedValue,
        start,
        end,
        semanticType: 'string',
      });
    } else if (/^(true|false)$/i.test(matchedValue)) {
      tokens.push({
        kind: 'boolean',
        value: matchedValue,
        start,
        end,
        semanticType: 'boolean',
      });
    } else if (/^\d/.test(matchedValue)) {
      tokens.push({
        kind: 'number',
        value: matchedValue,
        start,
        end,
        semanticType: 'numeric',
      });
    } else if (OPERATOR_WORDS.has(matchedValue.toLowerCase())) {
      tokens.push({
        kind: 'operator',
        value: matchedValue,
        start,
        end,
        semanticType: 'operator',
      });
    } else {
      tokens.push(buildTextToken(matchedValue, start, end));
    }

    cursor = end;
  }

  if (cursor < value.length) {
    tokens.push(buildTextToken(value.slice(cursor), cursor, value.length));
  }

  return tokens;
};
