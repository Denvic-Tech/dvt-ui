import {
  NodeInputConstantValue,
  NodeInputExpressionValue,
  NodeInputValue,
} from '@/shared/gatewayClient';
import type {
  NodeInputValuesMap,
  RawNodeInputValues,
} from '@/shared/lib/node-input-values/types';
import {
  buildInputVariableReference,
  extractVariableNameFromReference,
} from '@/shared/lib/variables';

export const makeExpressionValue = (
  value: string,
  expressionKind: NodeInputExpressionValue['expression_kind']
): NodeInputExpressionValue => ({
  __dvt_type: 'expr',
  value,
  expression_kind: expressionKind,
});

export const makeVariableExpressionValue = (
  name: string
): NodeInputExpressionValue =>
  makeExpressionValue(buildInputVariableReference(name), 'single');

export const normalizePrimitiveExpressionValue = (
  value: unknown
): NodeInputExpressionValue | null => {
  if (isExpressionValue(value)) {
    return value;
  }

  if (typeof value === 'string' && value.startsWith('=')) {
    return makeExpressionValue(value.slice(1).trimStart(), 'single');
  }

  return null;
};

export const makeConst = (value: unknown): NodeInputConstantValue => ({
  __dvt_type: 'const',
  value,
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isExpressionValue = (
  v: unknown
): v is NodeInputExpressionValue => {
  if (!isObject(v)) return false;
  return (
    v['__dvt_type'] === 'expr' &&
    typeof v['value'] === 'string' &&
    (v['expression_kind'] === 'single' || v['expression_kind'] === 'template')
  );
};

export const isConst = (v: unknown): v is NodeInputConstantValue => {
  if (!isObject(v)) return false;
  return v['__dvt_type'] === 'const' && 'value' in v;
};

export const isLinkValue = (
  v: unknown
): v is Extract<NodeInputValue, { __dvt_type: 'link' }> => {
  if (!isObject(v)) return false;
  return (
    v['__dvt_type'] === 'link' &&
    typeof v['node_id'] === 'string' &&
    typeof v['output_name'] === 'string'
  );
};

export const isInputValue = (v: unknown): v is NodeInputValue =>
  isExpressionValue(v) || isConst(v) || isLinkValue(v);

export const getSingleVariableNameFromValue = (
  value: unknown
): string | null => {
  if (!isExpressionValue(value) || value.expression_kind !== 'single') {
    return null;
  }

  return extractVariableNameFromReference(value.value);
};

export const isVariableExpressionValue = (value: unknown): boolean =>
  getSingleVariableNameFromValue(value) != null;

export const getConstValue = <T = unknown>(
  value: NodeInputValue | null | undefined
): T | undefined => {
  if (!value || !isConst(value)) {
    return undefined;
  }
  return value.value as T;
};

export const unwrapInputValue = (
  value: NodeInputValue | null | undefined
): unknown => {
  if (!value) {
    return undefined;
  }
  return isConst(value) ? value.value : value;
};

export const unwrapInputValues = (
  inputValues: NodeInputValuesMap | null | undefined
): RawNodeInputValues => {
  if (!inputValues) {
    return {};
  }

  const result: RawNodeInputValues = {};
  for (const [key, value] of Object.entries(inputValues)) {
    result[key] = unwrapInputValue(value);
  }
  return result;
};

export const wrapConstInputValues = (
  rawInputValues: RawNodeInputValues
): NodeInputValuesMap => {
  const result: NodeInputValuesMap = {};
  for (const [key, value] of Object.entries(rawInputValues)) {
    if (value === undefined) {
      continue;
    }
    if (isInputValue(value)) {
      result[key] = value;
      continue;
    }
    result[key] = makeConst(value);
  }
  return result;
};
