import { Io } from '@/shared/gatewayClient';

export const VARIABLE_TYPE_VALUES = [
  'STRING',
  'BOOLEAN',
  'INT',
  'FLOAT',
  'DICT',
  'JSON',
  'DATETIME',
  'TIMEDELTA',
] as const satisfies readonly Io[];

export type VariableType = (typeof VARIABLE_TYPE_VALUES)[number];

export type VariableValue =
  | string
  | boolean
  | number
  | Record<string, unknown>
  | unknown[]
  | Date
  | null;

export type VariableScope = 'user' | 'system';

export type VariableSource =
  | 'project'
  | 'linked'
  | 'system'
  | 'create_variable'
  | 'manage_variables';

export const VARIABLE_NAMESPACE_VALUES = [
  'input_variables',
  'project_variables',
] as const;

export type VariableNamespace = (typeof VARIABLE_NAMESPACE_VALUES)[number];

export type VariableNamespaceCompletionContext = {
  namespace: VariableNamespace;
  query: string;
  replaceStart: number;
  replaceEnd: number;
};

export interface VariableOutput {
  isListType?: boolean;
  name: string;
  type: VariableType;
  value: VariableValue;
  scope: VariableScope;
  source?: VariableSource;
  sourceLabel?: string;
}
