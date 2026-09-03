import type { Column, InputDefinitionModel, Io } from '@/shared/gatewayClient';
import { zIo } from '@/shared/gatewayClient';
import { makeExpressionValue } from '@/shared/lib/node-input-values';
import type { VariableOutput } from '@/shared/lib/variables';
import type { MappingNodeInputRow } from '@/shared/ui/node-input';

const createInputDefinition = (
  overrides: Partial<InputDefinitionModel>
): InputDefinitionModel => ({
  attr_name: 'demo_value',
  type: zIo.enum.STRING,
  is_list_type: false,
  is_literal_type: false,
  optional: true,
  is_hidden: false,
  ...overrides,
});

export const componentVariables: VariableOutput[] = [
  {
    name: 'dataset_name',
    type: 'STRING',
    value: 'customer_360_daily',
    scope: 'user',
    source: 'project',
    sourceLabel: 'Project variable',
  },
  {
    name: 'owner_email',
    type: 'STRING',
    value: 'owner@denvic.dev',
    scope: 'system',
    source: 'system',
    sourceLabel: 'Runtime context',
  },
  {
    name: 'batch_limit',
    type: 'INT',
    value: 5000,
    scope: 'user',
    source: 'project',
    sourceLabel: 'Batch control',
  },
  {
    name: 'retry_count',
    type: 'INT',
    value: 3,
    scope: 'system',
    source: 'system',
    sourceLabel: 'Runtime retries',
  },
  {
    name: 'growth_rate',
    type: 'FLOAT',
    value: 1.08,
    scope: 'user',
    source: 'linked',
    sourceLabel: 'Linked pipeline',
  },
  {
    name: 'discount_ratio',
    type: 'FLOAT',
    value: 0.15,
    scope: 'system',
    source: 'system',
    sourceLabel: 'Pricing context',
  },
  {
    name: 'is_backfill',
    type: 'BOOLEAN',
    value: false,
    scope: 'user',
    source: 'manage_variables',
    sourceLabel: 'Manage Variables',
  },
  {
    name: 'notify_on_fail',
    type: 'BOOLEAN',
    value: true,
    scope: 'system',
    source: 'system',
    sourceLabel: 'Alert policy',
  },
  {
    name: 'window_start',
    type: 'DATETIME',
    value: new Date('2026-04-01T04:30:00.000Z'),
    scope: 'user',
    source: 'project',
    sourceLabel: 'Run window start',
  },
  {
    name: 'window_end',
    type: 'DATETIME',
    value: new Date('2026-04-01T07:45:00.000Z'),
    scope: 'system',
    source: 'system',
    sourceLabel: 'Run window end',
  },
  {
    name: 'pipeline_config',
    type: 'DICT',
    value: {
      owner: 'analytics',
      retries: 3,
    },
    scope: 'user',
    source: 'manage_variables',
    sourceLabel: 'Node payload',
  },
  {
    name: 'request_payload',
    type: 'JSON',
    value: {
      filters: ['vip', 'retention'],
      enabled: true,
    },
    scope: 'system',
    source: 'system',
    sourceLabel: 'Serialized payload',
  },
];

export const componentColumns: Column[] = [
  {
    name: 'customer_id',
    dtype: 'INT',
    nullable: false,
    index: true,
  },
  {
    name: 'country',
    dtype: 'STRING',
    nullable: true,
  },
  {
    name: 'signup_at',
    dtype: 'DATETIME',
    nullable: false,
  },
  {
    name: 'revenue',
    dtype: 'FLOAT',
    nullable: true,
  },
  {
    name: 'is_active',
    dtype: 'BOOLEAN',
    nullable: false,
  },
  {
    name: 'segment',
    dtype: 'STRING',
    nullable: true,
  },
];

export type PrimitiveDemoKey =
  | 'STRING'
  | 'INT'
  | 'FLOAT'
  | 'BOOLEAN'
  | 'DATETIME'
  | 'TIMEDELTA';

export interface PrimitiveInputDemoConfig {
  definition: InputDefinitionModel;
  hint: string;
  initialValue: unknown;
  key: PrimitiveDemoKey;
  label: string;
}

export const primitiveInputDemoConfigs: Record<
  PrimitiveDemoKey,
  PrimitiveInputDemoConfig
> = {
  STRING: {
    key: 'STRING',
    label: 'STRING',
    definition: createInputDefinition({
      attr_name: 'dataset_name',
      display_name: 'Dataset name',
      type: zIo.enum.STRING,
      default: 'customer_360_daily',
      allow_expressions: true,
    }),
    initialValue: makeExpressionValue('dataset_name + "_draft"', 'single'),
    hint: 'Доступны 2 STRING-переменные: dataset_name и owner_email.',
  },
  INT: {
    key: 'INT',
    label: 'INT',
    definition: createInputDefinition({
      attr_name: 'row_limit',
      display_name: 'Row limit',
      type: zIo.enum.INT,
      default: 1000,
      min_value: 0,
      max_value: 50000,
      allow_expressions: true,
    }),
    initialValue: makeExpressionValue('batch_limit + retry_count', 'single'),
    hint: 'Доступны 2 INT-переменные: batch_limit и retry_count.',
  },
  FLOAT: {
    key: 'FLOAT',
    label: 'FLOAT',
    definition: createInputDefinition({
      attr_name: 'growth_threshold',
      display_name: 'Growth threshold',
      type: zIo.enum.FLOAT,
      default: 0.5,
      min_value: 0,
      max_value: 10,
      round_val: 2,
      allow_expressions: true,
    }),
    initialValue: makeExpressionValue('growth_rate * discount_ratio', 'single'),
    hint: 'Доступны 2 FLOAT-переменные: growth_rate и discount_ratio. Также допустимы INT-переменные.',
  },
  BOOLEAN: {
    key: 'BOOLEAN',
    label: 'BOOLEAN',
    definition: createInputDefinition({
      attr_name: 'notify_on_fail',
      display_name: 'Notify on fail',
      type: zIo.enum.BOOLEAN,
      default: true,
      allow_expressions: true,
    }),
    initialValue: true,
    hint: 'Доступны 2 BOOLEAN-переменные: is_backfill и notify_on_fail.',
  },
  DATETIME: {
    key: 'DATETIME',
    label: 'DATETIME',
    definition: createInputDefinition({
      attr_name: 'window_start',
      display_name: 'Window start',
      type: zIo.enum.DATETIME,
      default: '2026-04-01T04:30:00.000Z',
      allow_expressions: true,
    }),
    initialValue: '2026-04-01T04:30:00.000Z',
    hint: 'Доступны 2 DATETIME-переменные: window_start и window_end.',
  },
  TIMEDELTA: {
    key: 'TIMEDELTA',
    label: 'TIMEDELTA',
    definition: createInputDefinition({
      attr_name: 'window_shift',
      display_name: 'Window shift',
      type: zIo.enum.TIMEDELTA,
      default: '+0-0-1-2-30-0',
      allow_expressions: true,
    }),
    initialValue: '+0-0-1-2-30-0',
    hint: 'Демо для timedelta в literal-режиме и быстрого перехода в expression mode через отдельную action-кнопку.',
  },
};

export const primitiveInputTypeOrder: PrimitiveDemoKey[] = [
  'STRING',
  'INT',
  'FLOAT',
  'BOOLEAN',
  'DATETIME',
  'TIMEDELTA',
];

export const singleLineStringDefinition = createInputDefinition({
  attr_name: 'pipeline_name',
  display_name: 'Pipeline name',
  type: zIo.enum.STRING,
  default: 'daily_refresh',
  allow_expressions: true,
});

export const singleLineIntDefinition = createInputDefinition({
  attr_name: 'row_limit',
  display_name: 'Row limit',
  type: zIo.enum.INT,
  default: 1000,
  min_value: 0,
  max_value: 50000,
  allow_expressions: true,
});

export const literalDefinition = createInputDefinition({
  attr_name: 'write_mode',
  display_name: 'Write mode',
  type: zIo.enum.STRING,
  is_literal_type: true,
  options: ['append', 'replace', 'upsert'],
  default: 'append',
});

export const listDefinition = createInputDefinition({
  attr_name: 'selected_segments',
  display_name: 'Segments',
  type: [zIo.enum.STRING],
  is_list_type: true,
  default: ['vip', 'retention'],
});

export const columnNameSingleDefinition = createInputDefinition({
  attr_name: 'target_column',
  display_name: 'Target column',
  type: zIo.enum.STRING,
  allow_new: true,
  optional: false,
}) as InputDefinitionModel & { is_list_type: false };

export const columnNameMultiDefinition = createInputDefinition({
  attr_name: 'selected_columns',
  display_name: 'Selected columns',
  type: [zIo.enum.STRING],
  is_list_type: true,
  allow_new: true,
  optional: false,
}) as InputDefinitionModel & { is_list_type: true };

export const mappingInitialRows: MappingNodeInputRow[] = [
  {
    id: 'mapping-1',
    key: 'customer_id',
    value: 'client_id',
  },
  {
    id: 'mapping-2',
    key: 'signup_at',
    value: 'registered_at',
  },
];

export const jsonInitialValue = {
  owner: 'analytics',
  retries: 3,
  tags: ['nightly', 'critical'],
};

export const pythonInitialValue = [
  'result = df.copy()',
  "result['revenue_with_tax'] = result['revenue'] * 1.2",
  'return result',
].join('\n');

export const templateInitialValue = [
  'SELECT customer_id, country, revenue',
  'FROM mart.customer_metrics',
  'WHERE revenue >= {{ batch_limit }}',
  "  AND owner_email = '{{ owner_email }}'",
].join('\n');

export const primitiveVariableTypes: Record<PrimitiveDemoKey, Io> = {
  STRING: zIo.enum.STRING,
  INT: zIo.enum.INT,
  FLOAT: zIo.enum.FLOAT,
  BOOLEAN: zIo.enum.BOOLEAN,
  DATETIME: zIo.enum.DATETIME,
  TIMEDELTA: zIo.enum.TIMEDELTA,
};
