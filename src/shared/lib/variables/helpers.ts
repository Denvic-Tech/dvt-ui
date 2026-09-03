import type { Io } from '@/shared/gatewayClient';

import type {
  VariableNamespace,
  VariableNamespaceCompletionContext,
  VariableOutput,
  VariableScope,
  VariableSource,
  VariableType,
  VariableValue,
} from './types';

const SAFE_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PYTHON_KEYWORDS = new Set([
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
]);
const RESERVED_VARIABLE_NAMES = new Set([
  'False',
  'None',
  'True',
  'false',
  'input_variables',
  'project_variables',
  'len',
  'none',
  'true',
]);

const stringifyVariableKey = (name: string): string =>
  JSON.stringify(name).replace(/</g, '\\u003c');

export const isSafeVariableIdentifier = (name: string): boolean =>
  SAFE_IDENTIFIER_RE.test(name) &&
  !PYTHON_KEYWORDS.has(name) &&
  !RESERVED_VARIABLE_NAMES.has(name);

export const buildInputVariableReference = (name: string): string =>
  isSafeVariableIdentifier(name)
    ? name
    : `input_variables[${stringifyVariableKey(name)}]`;

export const buildNamespacedVariableReference = (
  name: string,
  namespace: VariableNamespace
): string =>
  isSafeVariableIdentifier(name)
    ? `${namespace}.${name}`
    : `${namespace}[${stringifyVariableKey(name)}]`;

export const buildPythonVariableReference = (
  name: string,
  namespace: VariableNamespace = 'input_variables'
): string => buildNamespacedVariableReference(name, namespace);

export const extractNamespacedVariableReference = (
  reference: string
): { name: string; namespace: VariableNamespace } | null => {
  const dotMatch = reference.match(
    /^(input_variables|project_variables)\.([A-Za-z_][A-Za-z0-9_]*)$/
  );
  if (dotMatch) {
    return {
      namespace: dotMatch[1] as VariableNamespace,
      name: dotMatch[2],
    };
  }

  const bracketMatch = reference.match(
    /^(input_variables|project_variables)\[(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')\]$/
  );
  if (!bracketMatch) {
    return null;
  }

  const rawName = bracketMatch[2] ?? bracketMatch[3] ?? '';
  return {
    namespace: bracketMatch[1] as VariableNamespace,
    name: rawName
      .replace(/\\u003c/g, '<')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'"),
  };
};

export const getVariableNamespaceCompletionContext = (
  value: string,
  cursorOffset: number
): VariableNamespaceCompletionContext | null => {
  const prefix = value.slice(0, cursorOffset);
  const dotMatch = prefix.match(
    /\b(input_variables|project_variables)\.([A-Za-z_][A-Za-z0-9_]*)?$/
  );
  if (dotMatch) {
    const query = dotMatch[2] ?? '';
    return {
      namespace: dotMatch[1] as VariableNamespace,
      query,
      replaceStart: cursorOffset - query.length,
      replaceEnd: cursorOffset,
    };
  }

  const bracketMatch = prefix.match(
    /\b(input_variables|project_variables)\[\s*["']([^"']*)$/
  );
  if (!bracketMatch) {
    return null;
  }

  const query = bracketMatch[2] ?? '';
  return {
    namespace: bracketMatch[1] as VariableNamespace,
    query,
    replaceStart: cursorOffset - query.length,
    replaceEnd: cursorOffset,
  };
};

export const extractVariableNameFromReference = (
  reference: string
): string | null => {
  if (isSafeVariableIdentifier(reference)) {
    return reference;
  }

  return extractNamespacedVariableReference(reference)?.name ?? null;
};

export const getVariablePlaceholderValue = (
  type: VariableType | Io
): VariableValue => {
  switch (type) {
    case 'BOOLEAN':
      return false;
    case 'INT':
    case 'FLOAT':
      return 0;
    case 'DICT':
    case 'JSON':
      return {};
    case 'DATETIME':
      return new Date(0);
    case 'TIMEDELTA':
      return '';
    case 'STRING':
    default:
      return '';
  }
};

export const createVariableOutput = (args: {
  isListType?: boolean;
  name: string;
  type: VariableType;
  value?: VariableValue;
  scope: VariableScope;
  source?: VariableSource;
  sourceLabel?: string;
}): VariableOutput => {
  const { isListType, name, type, value, scope, source, sourceLabel } = args;
  const hasExplicitValue = Object.prototype.hasOwnProperty.call(args, 'value');
  const result: VariableOutput = {
    name,
    type,
    value: hasExplicitValue ? (value ?? null) : null,
    scope,
  };

  if (isListType !== undefined) {
    result.isListType = isListType;
  }

  if (source) {
    result.source = source;
  }

  if (sourceLabel) {
    result.sourceLabel = sourceLabel;
  }

  return result;
};
