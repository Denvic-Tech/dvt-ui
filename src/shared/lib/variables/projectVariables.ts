import type {
  ProjectVariableBase,
  ProjectVariableRead,
} from '@/shared/gatewayClient';

import { createVariableOutput } from './helpers';
import type { VariableOutput, VariableValue } from './types';

export const PROJECT_VARIABLE_TYPE_VALUES = [
  'STRING',
  'BOOLEAN',
  'INT',
  'FLOAT',
  'DATETIME',
  'TIMEDELTA',
  'JSON',
] as const;

export type ProjectVariableType = (typeof PROJECT_VARIABLE_TYPE_VALUES)[number];

export type ProjectVariablePayload = Record<string, ProjectVariableBase>;

export const isProjectVariableType = (
  value: unknown
): value is ProjectVariableType =>
  typeof value === 'string' &&
  PROJECT_VARIABLE_TYPE_VALUES.includes(value as ProjectVariableType);

const isScalarProjectVariableValueValid = (
  type: ProjectVariableType,
  value: unknown
): boolean => {
  if (value === null) {
    return true;
  }

  switch (type) {
    case 'STRING':
    case 'TIMEDELTA':
      return typeof value === 'string';
    case 'BOOLEAN':
      return typeof value === 'boolean';
    case 'INT':
      return typeof value === 'number' && Number.isInteger(value);
    case 'FLOAT':
      return typeof value === 'number' && Number.isFinite(value);
    case 'DATETIME':
      return (
        typeof value === 'string' ||
        typeof value === 'number' ||
        value instanceof Date
      );
    case 'JSON':
      return value !== undefined;
    default:
      return false;
  }
};

export const isProjectVariableValueValid = ({
  isListType,
  type,
  value,
}: {
  isListType: boolean;
  type: ProjectVariableType;
  value: unknown;
}): boolean => {
  if (isListType) {
    return (
      Array.isArray(value) &&
      value.every(item => isScalarProjectVariableValueValid(type, item))
    );
  }

  return isScalarProjectVariableValueValid(type, value);
};

export const projectVariableReadToOutput = (
  variable: ProjectVariableRead
): VariableOutput | null => {
  const name = variable.key.trim();
  const type = variable.type;
  const isListType = Boolean(variable.is_list_type);

  if (!name || !isProjectVariableType(type)) {
    return null;
  }

  if (
    !isProjectVariableValueValid({
      isListType,
      type,
      value: variable.value,
    })
  ) {
    return null;
  }

  return createVariableOutput({
    isListType,
    name,
    type,
    value: variable.value as VariableValue,
    scope: 'user',
    source: 'project',
    sourceLabel: 'Project variable',
  });
};

export const projectVariableReadsToOutputs = (
  variables: ProjectVariableRead[]
): VariableOutput[] =>
  variables.flatMap(variable => {
    const normalized = projectVariableReadToOutput(variable);
    return normalized ? [normalized] : [];
  });
