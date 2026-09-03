import type { InputDefinitionModel } from '@/shared/gatewayClient';
import { zIo } from '@/shared/gatewayClient';
import { getDefaultValueForTypeInternal } from '@/shared/lib/node-io';

export type PrimitiveVariableType =
  | 'STRING'
  | 'BOOLEAN'
  | 'INT'
  | 'FLOAT'
  | 'JSON'
  | 'DATETIME'
  | 'TIMEDELTA';

export const PRIMITIVE_VARIABLE_TYPES: PrimitiveVariableType[] = [
  'STRING',
  'BOOLEAN',
  'INT',
  'FLOAT',
  'JSON',
  'DATETIME',
  'TIMEDELTA',
];

export const isPrimitiveVariableType = (
  value: unknown
): value is PrimitiveVariableType =>
  typeof value === 'string' &&
  PRIMITIVE_VARIABLE_TYPES.includes(value as PrimitiveVariableType);

export const getDefaultValueForPrimitiveType = (
  type: PrimitiveVariableType
): unknown => getDefaultValueForTypeInternal(type);

const toIoType = (type: PrimitiveVariableType) => {
  switch (type) {
    case 'STRING':
      return zIo.enum.STRING;
    case 'BOOLEAN':
      return zIo.enum.BOOLEAN;
    case 'INT':
      return zIo.enum.INT;
    case 'FLOAT':
      return zIo.enum.FLOAT;
    case 'JSON':
      return zIo.enum.JSON;
    case 'DATETIME':
      return zIo.enum.DATETIME;
    case 'TIMEDELTA':
      return zIo.enum.TIMEDELTA;
    default:
      return zIo.enum.STRING;
  }
};

export const buildPrimitiveInputDefinition = (
  type: Exclude<PrimitiveVariableType, 'JSON'>,
  allowExpressions: boolean
): InputDefinitionModel => ({
  attr_name: 'value',
  display_name: 'value',
  type: toIoType(type),
  display_type: type,
  is_list_type: false,
  is_literal_type: false,
  options: null,
  optional: false,
  is_hidden: false,
  description: null,
  default: getDefaultValueForPrimitiveType(type),
  multiline: false,
  metadata_source_field: null,
  min_value: null,
  max_value: null,
  step: null,
  round_val: null,
  schema: null,
  allow_multiple_connections: false,
  allow_new: false,
  allow_expressions: allowExpressions,
  expression_policy: 'default',
  force_handle_visible: false,
});

export const isTypedLiteralValueValid = (
  type: PrimitiveVariableType,
  value: unknown
): boolean => {
  if (value === null) {
    return true;
  }

  switch (type) {
    case 'STRING':
      return typeof value === 'string';
    case 'BOOLEAN':
      return typeof value === 'boolean';
    case 'INT':
      return typeof value === 'number' && Number.isInteger(value);
    case 'FLOAT':
      return typeof value === 'number' && Number.isFinite(value);
    case 'JSON':
      return typeof value === 'object' && value !== null;
    case 'DATETIME':
      return typeof value === 'string' && !Number.isNaN(Date.parse(value));
    case 'TIMEDELTA':
      return typeof value === 'string';
    default:
      return false;
  }
};
