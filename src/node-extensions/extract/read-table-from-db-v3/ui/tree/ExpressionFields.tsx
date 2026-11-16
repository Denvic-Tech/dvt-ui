import {
  CATALOG_EXPRESSION_PLACEHOLDERS,
  ExpressionFieldsList,
  ExpressionHint,
  ExpressionLabel,
} from '@/features/node/db-catalog-tree';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';
import { PrimitiveNodeInput } from '@/shared/ui/node-input';

import type {
  ReadTableFromDBV3SelectorField,
  ReadTableFromDBV3Values,
} from '../../lib/types';

const SELECTOR_FIELD_LABELS: Record<ReadTableFromDBV3SelectorField, string> = {
  database_name: 'База данных',
  schema_name: 'Схема',
  table_name: 'Таблица',
};

type ExpressionFieldsProps = {
  fields: readonly ReadTableFromDBV3SelectorField[];
  values: ReadTableFromDBV3Values | undefined;
  getInputDefinition: (
    field: ReadTableFromDBV3SelectorField
  ) => InputDefinitionModel | undefined;
  onChange: (field: ReadTableFromDBV3SelectorField, value: unknown) => void;
  variables: VariableOutput[];
};

export const ExpressionFields = ({
  fields,
  values,
  getInputDefinition,
  onChange,
  variables,
}: ExpressionFieldsProps) => (
  <ExpressionFieldsList>
    {fields.map(field => (
      <div
        key={field}
        data-testid={`node-extensions/extract/read-table-from-db-v3/expression-${field}`}
      >
        <ExpressionLabel>{SELECTOR_FIELD_LABELS[field]}</ExpressionLabel>
        <PrimitiveNodeInput
          appearance='clean-minimal'
          placeholder={CATALOG_EXPRESSION_PLACEHOLDERS[field].literal}
          expressionPlaceholder={
            CATALOG_EXPRESSION_PLACEHOLDERS[field].expression
          }
          inputDefinition={getInputDefinition(field)}
          value={values?.[field]}
          onChange={value => onChange(field, value)}
          variables={variables}
        />
      </div>
    ))}
    <ExpressionHint>Значения вычисляются при запуске</ExpressionHint>
  </ExpressionFieldsList>
);
