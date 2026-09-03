import { useEffect, useMemo, useState } from 'react';

import type { DatabaseObjectListItem } from '@/entities/data/database';
import {
  normalizeDbCatalogParentNames,
  resolveDbCatalogMode,
} from '@/entities/data/db-connection/model/catalogNormalizers';
import type { DbCatalogTableRef } from '@/entities/data/db-connection/model/catalogTypes';
import {
  getDbCatalogCapabilities,
  useDbCatalogDatabases,
  useDbCatalogSchemas,
  useDbCatalogTable,
  useDbCatalogTables,
  useRefreshDbCatalog,
} from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type { DbMetadata } from '@/shared/gatewayClient';

export type DbCatalogTableListItem = DatabaseObjectListItem & {
  catalogRef: DbCatalogTableRef;
};

type ControllerOptions = {
  databaseName?: string | null;
  schemaName?: string | null;
  tableName?: string | null;
  databasesEnabled?: boolean;
  schemasEnabled?: boolean;
  tablesEnabled?: boolean;
  detailEnabled?: boolean;
};

export const useDbTargetCatalogController = (
  metadata: DbMetadata | null | undefined,
  {
    databaseName = null,
    schemaName = null,
    tableName = null,
    databasesEnabled = true,
    schemasEnabled = true,
    tablesEnabled = true,
    detailEnabled = true,
  }: ControllerOptions = {}
) => {
  const mode = resolveDbCatalogMode(metadata);
  const capabilities = getDbCatalogCapabilities(metadata);
  const {
    databaseName: effectiveDatabaseName,
    schemaName: effectiveSchemaName,
  } = normalizeDbCatalogParentNames(capabilities, databaseName, schemaName);
  const [databaseSearch, setDatabaseSearch] = useState('');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [openedCatalogLevels, setOpenedCatalogLevels] = useState<
    Record<string, true>
  >({});
  const catalogIdentity = `${metadata?.connection_id ?? ''}::${metadata?.connection_revision ?? ''}`;
  const databaseLevelKey = `${catalogIdentity}::databases`;
  const schemaLevelKey = `${catalogIdentity}::schemas::${effectiveDatabaseName ?? ''}`;
  const tableLevelKey = `${catalogIdentity}::tables::${effectiveDatabaseName ?? ''}::${effectiveSchemaName ?? ''}`;

  useEffect(() => {
    setOpenedCatalogLevels(current => {
      const next = { ...current };
      if (databasesEnabled) next[databaseLevelKey] = true;
      if (schemasEnabled) next[schemaLevelKey] = true;
      if (tablesEnabled) next[tableLevelKey] = true;
      return next;
    });
  }, [
    databaseLevelKey,
    databasesEnabled,
    schemaLevelKey,
    schemasEnabled,
    tableLevelKey,
    tablesEnabled,
  ]);

  useEffect(() => {
    setSchemaSearch('');
    setTableSearch('');
  }, [effectiveDatabaseName]);

  useEffect(() => {
    setTableSearch('');
  }, [effectiveSchemaName]);

  const databases = useDbCatalogDatabases(metadata, {
    enabled: databasesEnabled || Boolean(openedCatalogLevels[databaseLevelKey]),
    search: databaseSearch,
  });
  const schemas = useDbCatalogSchemas(metadata, effectiveDatabaseName, {
    enabled: schemasEnabled || Boolean(openedCatalogLevels[schemaLevelKey]),
    search: schemaSearch,
  });
  const tables = useDbCatalogTables(
    metadata,
    effectiveDatabaseName,
    effectiveSchemaName,
    {
      enabled: tablesEnabled || Boolean(openedCatalogLevels[tableLevelKey]),
      search: tableSearch,
    }
  );
  const table = useDbCatalogTable(
    metadata,
    effectiveDatabaseName,
    effectiveSchemaName,
    tableName,
    { enabled: detailEnabled }
  );
  const refresh = useRefreshDbCatalog(metadata);

  const databaseOptions = useMemo(
    () =>
      databases.items.map(item => ({
        label: item.name,
        value: item.name,
      })),
    [databases.items]
  );
  const schemaOptions = useMemo(
    () =>
      schemas.items.map(item => ({
        label: item.name,
        value: item.name,
      })),
    [schemas.items]
  );
  const tableItems = useMemo<DbCatalogTableListItem[]>(
    () =>
      tables.items.map(item => ({
        name: item.name,
        type: item.kind === 'view' ? 'VIEW' : 'BASE_TABLE',
        database_name: item.databaseName,
        schema_name: item.schemaName,
        catalogRef: item,
      })),
    [tables.items]
  );
  const selectedTableItem = useMemo(
    () =>
      tableItems.find(
        item =>
          item.name === tableName &&
          item.database_name === effectiveDatabaseName &&
          item.schema_name === effectiveSchemaName
      ) ?? null,
    [effectiveDatabaseName, effectiveSchemaName, tableItems, tableName]
  );

  return {
    mode,
    capabilities,
    databaseSearch,
    setDatabaseSearch,
    schemaSearch,
    setSchemaSearch,
    tableSearch,
    setTableSearch,
    databases,
    schemas,
    tables,
    table,
    databaseOptions,
    schemaOptions,
    tableItems,
    selectedTableItem,
    refresh,
  };
};
