import type { FC } from 'react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { getDbCatalogConnectionId } from '@/entities/data/db-connection/model/catalogNormalizers';

import type { ReadTableFromDBV3Values } from '../lib/types';
import { useReadTableFromDBV3Form } from '../model/useReadTableFromDBV3Form';

import { SettingsPane } from './settings/SettingsPane';
import { CatalogTreePane } from './tree/CatalogTreePane';
import { Root } from './ReadTableFromDBV3.styles';

export const ReadTableFromDBV3: FC<
  NodeModalExtensionProps<ReadTableFromDBV3Values>
> = ({
  id: nodeID,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  nodeDefinition,
  variables,
}) => {
  const form = useReadTableFromDBV3Form({
    nodeID,
    localInputData,
    setLocalInputData,
    setValidationCallback,
  });

  // Дерево сбрасывается при смене подключения, правая панель —
  // при смене таблицы.
  const catalogKey = `${form.catalogMode}:${
    getDbCatalogConnectionId(form.inputMetadata) ?? ''
  }`;
  const tableKey = JSON.stringify([
    form.literalDatabaseName,
    form.literalSchemaName,
    form.literalTableName,
  ]);

  return (
    <Root data-testid='node-extensions/extract/read-table-from-db-v3/root'>
      <CatalogTreePane
        key={catalogKey}
        form={form}
        values={localInputData}
        nodeDefinition={nodeDefinition}
        variables={variables}
      />
      <SettingsPane key={tableKey} form={form} values={localInputData} />
    </Root>
  );
};

export default ReadTableFromDBV3;
