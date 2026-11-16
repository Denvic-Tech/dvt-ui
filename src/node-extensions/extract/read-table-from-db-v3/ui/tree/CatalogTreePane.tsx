import { useCallback, useMemo } from 'react';

import {
  CatalogTreeView,
  useCatalogTree,
} from '@/features/node/db-catalog-tree';

import type { NodeDefinition } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';

import type {
  ReadTableFromDBV3SelectorField,
  ReadTableFromDBV3Values,
} from '../../lib/types';
import type { ReadTableFromDBV3Form } from '../../model/useReadTableFromDBV3Form';

import { ExpressionFields } from './ExpressionFields';

type CatalogTreePaneProps = {
  form: ReadTableFromDBV3Form;
  values: ReadTableFromDBV3Values | undefined;
  nodeDefinition: NodeDefinition;
  variables: VariableOutput[];
};

export const CatalogTreePane = ({
  form,
  values,
  nodeDefinition,
  variables,
}: CatalogTreePaneProps) => {
  const selection = useMemo(
    () => ({
      databaseName: form.literalDatabaseName,
      schemaName: form.literalSchemaName,
      tableName: form.literalTableName,
    }),
    [form.literalDatabaseName, form.literalSchemaName, form.literalTableName]
  );
  const tree = useCatalogTree({
    metadata: form.inputMetadata,
    selection,
    enabled: !form.isConnectionMetadataLoading,
  });

  const inputDefinitions = nodeDefinition.input_definitions;
  const getInputDefinition = useCallback(
    (field: ReadTableFromDBV3SelectorField) => {
      const definitions = inputDefinitions ?? {};
      return (
        definitions[field] ??
        Object.values(definitions).find(
          definition => definition.attr_name === field
        )
      );
    },
    [inputDefinitions]
  );
  const canUseExpressions = form.selectorFields.every(field =>
    Boolean(getInputDefinition(field)?.allow_expressions)
  );

  return (
    <CatalogTreeView
      tree={tree}
      metadata={form.inputMetadata}
      isMetadataLoading={form.isConnectionMetadataLoading}
      ariaLabel='Источник'
      onTableSelect={node => {
        if (node.tableRef) form.handleCatalogTableSelect(node.tableRef);
      }}
      isExpressionMode={form.isExpressionMode}
      canUseExpressions={canUseExpressions}
      onEnterExpressionMode={form.enterExpressionMode}
      onExitExpressionMode={form.exitExpressionMode}
      expressionContent={
        <ExpressionFields
          fields={form.selectorFields}
          values={values}
          getInputDefinition={getInputDefinition}
          onChange={form.handleSelectorExpressionChange}
          variables={variables}
        />
      }
    />
  );
};
