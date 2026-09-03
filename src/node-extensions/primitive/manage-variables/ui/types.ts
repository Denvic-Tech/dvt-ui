import type { PrimitiveVariableType } from '@/shared/lib/variables';

export type ManageVariableRow = {
  default_literal: string;
  id: string;
  mode: 'value' | 'value_input';
  name: string;
  nullable: boolean;
  type: PrimitiveVariableType;
  value?: unknown;
  value_input?: unknown;
  valueJsonError?: string | null | undefined;
};

export type ManageVariablesValues = {
  defined_variables?: Record<string, unknown>;
};
