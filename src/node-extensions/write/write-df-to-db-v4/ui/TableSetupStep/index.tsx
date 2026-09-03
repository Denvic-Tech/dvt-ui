import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';
import { useAppDispatch } from '@/app/providers/store';

import { useDbTargetCatalogController } from '@/features/node/db-target-selector';
import { useNodeConnections } from '@/features/node/get-node-connections';

import {
  invalidateDbCatalog,
  requireDbConnectionId,
} from '@/entities/data/db-connection';

import { useApiUtils } from '@/shared/api/utils';
import {
  type DataFrameMetadata,
  type DbMetadata as DBMetadata,
  type DbTable,
  type InputDefinitionModel,
} from '@/shared/gatewayClient';
import {
  getDbMetadataDatabaseOptions,
  getDbMetadataFilteredTables,
  getDbMetadataSchemaOptions,
} from '@/shared/lib/db-metadata';

import {
  buildSelectedWriteTargetLabel,
  buildWriteTargetAfterDatabaseChange,
  buildWriteTargetAfterTableModeChange,
  type ExtensionState,
  extractApiErrorMessage,
  findWriteTargetTable,
  getLiteralStringValue,
  getSelectorCollapsedValue,
  getSelectorFingerprintValue,
  hasConfiguredSelectorValue,
  normalizeName,
  registerCreatedDatabase,
  registerCreatedSchema,
  resolveCreationMode,
  supportsDatabaseSelection,
  supportsSchemas,
  type WriteDataFrameToDBValues,
} from '../../lib/helpers';
import { AccordionContainer } from '../styles';

import { DatabaseSection } from './sections/DatabaseSection';
import { SchemaSection } from './sections/SchemaSection';
import { TableSection } from './sections/TableSection';

type UITableSelectMode = 'select' | 'create';
type UIDatabaseSelectMode = 'select' | 'create';
type UISchemaSelectMode = 'select' | 'create';
type SectionId = 'database' | 'schema' | 'table';

type Notice = {
  severity: 'success' | 'error' | 'warning' | 'info';
  message: string;
} | null;

const EMPTY_TARGET_FINGERPRINT = ['', '', ''].join('::');
const DATABASE_SELECTION_REQUIRED_MESSAGE =
  'Сначала выберите базу данных в секции выше.';

const resetTargetWriteConfig = (
  current: WriteDataFrameToDBValues
): WriteDataFrameToDBValues => ({
  ...current,
  write_mode: null,
  upsert_config: null,
  create_table_sql: null,
  table_create_spec: null,
  use_clickhouse_connect_driver: null,
  column_mapping: null,
});

const buildInitialOpenSections = (
  connectionMetadata: DBMetadata | null,
  inputData?: WriteDataFrameToDBValues | null
): SectionId[] => {
  const sections: SectionId[] = [];

  if (
    supportsDatabaseSelection(connectionMetadata) &&
    !hasConfiguredSelectorValue(inputData?.database_name)
  ) {
    sections.push('database', 'table');
    if (supportsSchemas(connectionMetadata)) {
      sections.splice(1, 0, 'schema');
    }
    return sections;
  }

  if (
    supportsSchemas(connectionMetadata) &&
    !hasConfiguredSelectorValue(inputData?.schema_name)
  ) {
    sections.push('schema', 'table');
    return sections;
  }

  if (!hasConfiguredSelectorValue(inputData?.table_name)) {
    sections.push('table');
  }

  return sections;
};

export const TableSetupStep = ({
  id: nodeID,
  isOpen,
  localInputData,
  nodeDefinition,
  setLocalInputData,
  setSharedState,
  sharedState,
  variables = [],
}: NodeModalStepperExtensionProps<
  WriteDataFrameToDBValues,
  ExtensionState
>) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { createDatabase, createSchema } = useApiUtils();
  const dispatch = useAppDispatch();

  const inputConnectionMetadata = useMemo(
    () => getConnectedInputMetadata('connection') as DBMetadata | null,
    [getConnectedInputMetadata]
  );

  useEffect(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      invalidateCatalog: () => {
        const connectionId = inputConnectionMetadata?.connection_id?.trim();
        if (connectionId) dispatch(invalidateDbCatalog(connectionId));
      },
    }));
  }, [dispatch, inputConnectionMetadata?.connection_id, setSharedState]);
  const inputDataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );
  const [selectTableMode, setSelectTableMode] = useState<UITableSelectMode>(
    () => {
      if (
        sharedState?.isTableNew &&
        getLiteralStringValue(localInputData?.table_name)
      ) {
        return 'create';
      }

      return 'select';
    }
  );
  const [selectDatabaseMode, setSelectDatabaseMode] =
    useState<UIDatabaseSelectMode>('select');
  const [selectSchemaMode, setSelectSchemaMode] =
    useState<UISchemaSelectMode>('select');
  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [newSchemaName, setNewSchemaName] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [isDatabaseNew, setIsDatabaseNew] = useState(false);
  const [isSchemaNew, setIsSchemaNew] = useState(false);
  const [isCreateTableNameEditorOpen, setIsCreateTableNameEditorOpen] =
    useState(() => {
      return !(
        sharedState?.isTableNew &&
        getLiteralStringValue(localInputData?.table_name)
      );
    });
  const [isSelectTableBrowserOpen, setIsSelectTableBrowserOpen] = useState(
    !hasConfiguredSelectorValue(localInputData?.table_name)
  );
  const [notice, setNotice] = useState<Notice>(null);
  const [creatingEntity, setCreatingEntity] = useState<
    'database' | 'schema' | null
  >(null);
  const [openSections, setOpenSections] = useState<SectionId[]>(() => {
    return buildInitialOpenSections(inputConnectionMetadata, localInputData);
  });

  const targetFingerprintRef = useRef<string | null>(null);

  const getInputDefinition = useCallback(
    (attrName: string): InputDefinitionModel | undefined => {
      const inputDefinitions = nodeDefinition.input_definitions ?? {};

      return (
        inputDefinitions[attrName] ??
        Object.values(inputDefinitions).find(
          inputDefinition => inputDefinition.attr_name === attrName
        )
      );
    },
    [nodeDefinition.input_definitions]
  );

  const databaseInputDef = useMemo(() => {
    return getInputDefinition('database_name');
  }, [getInputDefinition]);
  const schemaInputDef = useMemo(() => {
    return getInputDefinition('schema_name');
  }, [getInputDefinition]);
  const tableInputDef = useMemo(() => {
    return getInputDefinition('table_name');
  }, [getInputDefinition]);

  const literalDatabaseName = useMemo(() => {
    return getLiteralStringValue(localInputData?.database_name);
  }, [localInputData?.database_name]);
  const literalSchemaName = useMemo(() => {
    return getLiteralStringValue(localInputData?.schema_name);
  }, [localInputData?.schema_name]);
  const literalTableName = useMemo(() => {
    return getLiteralStringValue(localInputData?.table_name);
  }, [localInputData?.table_name]);
  const catalog = useDbTargetCatalogController(inputConnectionMetadata, {
    databaseName: literalDatabaseName,
    schemaName: literalSchemaName,
    tableName: literalTableName,
    databasesEnabled: openSections.includes('database'),
    schemasEnabled: openSections.includes('schema'),
    tablesEnabled: openSections.includes('table') && isSelectTableBrowserOpen,
    detailEnabled: Boolean(literalTableName),
  });
  const isLazyCatalog = catalog.mode === 'lazy';

  const selectedTableLabel = useMemo(() => {
    return buildSelectedWriteTargetLabel(localInputData);
  }, [localInputData]);

  const isSchemaRequired = useMemo(() => {
    return supportsSchemas(inputConnectionMetadata);
  }, [inputConnectionMetadata]);
  const isDatabaseSelectionRequired = useMemo(() => {
    return supportsDatabaseSelection(inputConnectionMetadata);
  }, [inputConnectionMetadata]);
  const hasSelectedDatabase = useMemo(() => {
    return (
      !isDatabaseSelectionRequired ||
      hasConfiguredSelectorValue(localInputData?.database_name)
    );
  }, [isDatabaseSelectionRequired, localInputData?.database_name]);

  const selectedTable = useMemo(() => {
    return findWriteTargetTable(inputConnectionMetadata, localInputData);
  }, [inputConnectionMetadata, localInputData]);
  const isTableNew = useMemo(() => {
    if (!literalTableName) {
      return false;
    }

    if (selectTableMode === 'select') {
      return false;
    }

    return !selectedTable;
  }, [literalTableName, selectTableMode, selectedTable]);

  const targetFingerprint = useMemo(() => {
    return [
      getSelectorFingerprintValue(localInputData?.database_name),
      getSelectorFingerprintValue(localInputData?.schema_name),
      getSelectorFingerprintValue(localInputData?.table_name),
    ].join('::');
  }, [
    localInputData?.database_name,
    localInputData?.schema_name,
    localInputData?.table_name,
  ]);

  const databaseSectionCollapsedValue = useMemo(() => {
    return getSelectorCollapsedValue(
      localInputData?.database_name,
      'База не выбрана'
    );
  }, [localInputData?.database_name]);
  const schemaSectionCollapsedValue = useMemo(() => {
    return getSelectorCollapsedValue(
      localInputData?.schema_name,
      'Схема не выбрана'
    );
  }, [localInputData?.schema_name]);

  const databaseStats = useMemo((): Array<[string, number]> => {
    const grouped = new Map<string, number>(
      getDbMetadataDatabaseOptions(inputConnectionMetadata).map(option => {
        return [option.value, option.tableCount];
      })
    );

    for (const databaseName of sharedState?.createdDatabases ?? []) {
      if (!databaseName.trim()) {
        continue;
      }
      grouped.set(databaseName, grouped.get(databaseName) ?? 0);
    }

    return Array.from(grouped.entries()).sort(([left], [right]) =>
      left.localeCompare(right)
    );
  }, [inputConnectionMetadata, sharedState?.createdDatabases]);

  const databaseOptions = useMemo(() => {
    return databaseStats.map(([value, tableCount]) => ({
      value,
      label: value,
      tableCount,
    }));
  }, [databaseStats]);

  const schemaStats = useMemo((): Array<[string, number]> => {
    const grouped = new Map<string, number>(
      getDbMetadataSchemaOptions(
        inputConnectionMetadata,
        literalDatabaseName
      ).map(option => {
        return [option.value, option.tableCount];
      })
    );
    const normalizedDatabaseName = normalizeName(literalDatabaseName);

    for (const schema of sharedState?.createdSchemas ?? []) {
      if (
        normalizedDatabaseName &&
        normalizeName(schema.databaseName) !== normalizedDatabaseName
      ) {
        continue;
      }

      grouped.set(schema.schemaName, grouped.get(schema.schemaName) ?? 0);
    }

    return Array.from(grouped.entries()).sort(([left], [right]) =>
      left.localeCompare(right)
    );
  }, [
    inputConnectionMetadata,
    literalDatabaseName,
    sharedState?.createdSchemas,
  ]);

  const schemaOptions = useMemo(() => {
    return schemaStats.map(([value, tableCount]) => ({
      value,
      label: value,
      tableCount,
    }));
  }, [schemaStats]);

  const filteredTables = useMemo(() => {
    return getDbMetadataFilteredTables(inputConnectionMetadata, {
      databaseName: literalDatabaseName,
      schemaName: literalSchemaName,
    });
  }, [inputConnectionMetadata, literalDatabaseName, literalSchemaName]);

  const shouldShowCreateDatabaseSelector =
    selectTableMode === 'create' && Boolean(literalTableName);
  const shouldShowCreateSchemaSelector =
    isSchemaRequired &&
    selectTableMode === 'create' &&
    Boolean(literalTableName);

  const selectedCreationMode = useMemo(() => {
    return resolveCreationMode(sharedState, localInputData);
  }, [localInputData, sharedState]);

  const resetAsyncState = useCallback(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      createSqlError: null,
      createTableError: null,
      createTableSuccess: null,
      createTableSuccessAt: null,
      lastCreateSqlKey: null,
      typedPreviewSql: null,
      isCreateSqlLoading: false,
      isCreateTableLoading: false,
      lastCreateTableKey: null,
      requestedColumnMappingDraft: null,
      resolvedColumnRows: null,
      resolvedDiagnostics: null,
      isResolvingColumns: false,
      resolveColumnsError: null,
      lastResolveColumnsKey: null,
      isRecreatingTable: false,
      recreateTableError: null,
    }));
  }, [setSharedState]);

  useEffect(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      inputConnectionMetadata,
      inputDataframeMetadata,
      isTableNew,
      selectedCreationMode: resolveCreationMode(prev, localInputData),
      createdDatabases: prev?.createdDatabases ?? [],
      createdSchemas: prev?.createdSchemas ?? [],
    }));
  }, [
    inputConnectionMetadata,
    inputDataframeMetadata,
    isTableNew,
    localInputData,
    setSharedState,
  ]);

  useEffect(() => {
    if (!isOpen) {
      targetFingerprintRef.current = targetFingerprint;
      return;
    }

    const previousTargetFingerprint = targetFingerprintRef.current;
    if (previousTargetFingerprint == null) {
      targetFingerprintRef.current = targetFingerprint;
      return;
    }
    if (previousTargetFingerprint === targetFingerprint) {
      return;
    }

    targetFingerprintRef.current = targetFingerprint;

    const isInitialHydrationFromPersistedInput =
      previousTargetFingerprint === EMPTY_TARGET_FINGERPRINT &&
      hasConfiguredSelectorValue(localInputData?.table_name) &&
      (localInputData?.write_mode != null ||
        localInputData?.upsert_config != null ||
        localInputData?.create_table_sql != null ||
        localInputData?.table_create_spec != null ||
        localInputData?.column_mapping != null ||
        localInputData?.use_clickhouse_connect_driver != null);

    if (isInitialHydrationFromPersistedInput) {
      return;
    }

    setLocalInputData(prev => {
      const current = (prev ?? {}) as WriteDataFrameToDBValues;

      if (
        current.write_mode == null &&
        current.upsert_config == null &&
        current.create_table_sql == null &&
        current.table_create_spec == null &&
        current.column_mapping == null &&
        current.use_clickhouse_connect_driver == null
      ) {
        return prev;
      }

      return resetTargetWriteConfig(current);
    });

    setSharedState(prev => ({
      ...(prev ?? {}),
      selectedCreationMode: 'raw',
      createSqlError: null,
      createTableError: null,
      createTableSuccess: null,
      createTableSuccessAt: null,
      lastCreateSqlKey: null,
      typedPreviewSql: null,
      isCreateSqlLoading: false,
      isCreateTableLoading: false,
      lastCreateTableKey: null,
      isRecreatingTable: false,
      recreateTableError: null,
    }));
  }, [
    isOpen,
    localInputData?.column_mapping,
    localInputData?.create_table_sql,
    localInputData?.schema_name,
    localInputData?.table_create_spec,
    localInputData?.table_name,
    localInputData?.upsert_config,
    localInputData?.use_clickhouse_connect_driver,
    localInputData?.write_mode,
    setLocalInputData,
    setSharedState,
    targetFingerprint,
  ]);

  useEffect(() => {
    setOpenSections(current =>
      current.length > 0
        ? current
        : buildInitialOpenSections(inputConnectionMetadata, localInputData)
    );
  }, [inputConnectionMetadata, localInputData]);

  useEffect(() => {
    if (selectTableMode !== 'select') {
      return;
    }

    setIsSelectTableBrowserOpen(
      !hasConfiguredSelectorValue(localInputData?.table_name)
    );
  }, [localInputData?.table_name, selectTableMode]);

  useEffect(() => {
    if (!isOpen || isSchemaRequired || !localInputData?.schema_name) {
      return;
    }

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      schema_name: null,
    }));
  }, [
    isOpen,
    isSchemaRequired,
    localInputData?.schema_name,
    setLocalInputData,
  ]);

  const toggleSection = useCallback((sectionId: SectionId) => {
    setOpenSections(current =>
      current.includes(sectionId)
        ? current.filter(section => section !== sectionId)
        : [...current, sectionId]
    );
  }, []);

  const isSectionOpen = useCallback(
    (sectionId: SectionId) => openSections.includes(sectionId),
    [openSections]
  );

  const handleDatabaseValueChange = useCallback(
    (nextValue: unknown) => {
      setLocalInputData(prev => {
        const current = (prev ?? {}) as WriteDataFrameToDBValues;
        return resetTargetWriteConfig(
          buildWriteTargetAfterDatabaseChange(
            current,
            nextValue as WriteDataFrameToDBValues['database_name'],
            selectTableMode === 'create'
          )
        );
      });
      setNotice(null);
      resetAsyncState();
    },
    [resetAsyncState, selectTableMode, setLocalInputData]
  );

  const handleSchemaValueChange = useCallback(
    (nextValue: unknown) => {
      setLocalInputData(prev => {
        const current = (prev ?? {}) as WriteDataFrameToDBValues;
        return resetTargetWriteConfig({
          ...current,
          schema_name: nextValue as WriteDataFrameToDBValues['schema_name'],
          table_name: selectTableMode === 'create' ? current.table_name : null,
        });
      });
      setNotice(null);
      resetAsyncState();
    },
    [resetAsyncState, selectTableMode, setLocalInputData]
  );

  const handleTableValueChange = useCallback(
    (nextValue: unknown) => {
      setLocalInputData(prev =>
        resetTargetWriteConfig({
          ...((prev ?? {}) as WriteDataFrameToDBValues),
          table_name: nextValue as WriteDataFrameToDBValues['table_name'],
        })
      );
      setNotice(null);
      resetAsyncState();
    },
    [resetAsyncState, setLocalInputData]
  );

  const handleDatabaseSelect = useCallback(
    (databaseName: string) => {
      handleDatabaseValueChange(databaseName);
      setSelectDatabaseMode('select');
      setIsDatabaseNew(false);
    },
    [handleDatabaseValueChange]
  );

  const handleSchemaSelect = useCallback(
    (schemaName: string) => {
      handleSchemaValueChange(schemaName);
      setSelectSchemaMode('select');
      setIsSchemaNew(false);
    },
    [handleSchemaValueChange]
  );

  const handleTableSelect = useCallback(
    (table: DbTable) => {
      setLocalInputData(prev =>
        resetTargetWriteConfig({
          ...((prev ?? {}) as WriteDataFrameToDBValues),
          database_name: table.database_name ?? prev?.database_name ?? null,
          schema_name: table.schema_name ?? prev?.schema_name ?? null,
          table_name: table.name,
        })
      );
      setSelectTableMode('select');
      setIsSelectTableBrowserOpen(false);
      setIsCreateTableNameEditorOpen(true);
      setNewTableName('');
      setNotice(null);
      resetAsyncState();
    },
    [resetAsyncState, setLocalInputData]
  );

  const handleLazyTableSelect = useCallback(
    (table: {
      name: string;
      databaseName: string | null;
      schemaName: string | null;
    }) => {
      setLocalInputData(prev =>
        resetTargetWriteConfig({
          ...((prev ?? {}) as WriteDataFrameToDBValues),
          database_name: table.databaseName,
          schema_name: table.schemaName,
          table_name: table.name,
        })
      );
      setSelectTableMode('select');
      setIsSelectTableBrowserOpen(false);
      setIsCreateTableNameEditorOpen(true);
      setNewTableName('');
      setNotice(null);
      resetAsyncState();
    },
    [resetAsyncState, setLocalInputData]
  );

  const handleTableModeChange = useCallback(
    (mode: UITableSelectMode) => {
      setSelectTableMode(mode);
      setNotice(null);

      if (mode === 'create') {
        setIsSelectTableBrowserOpen(false);
        setIsCreateTableNameEditorOpen(true);
        setNewTableName(literalTableName ?? '');
      } else {
        setIsSelectTableBrowserOpen(!literalTableName);
        setIsCreateTableNameEditorOpen(true);
        setNewTableName('');
      }

      setLocalInputData(prev =>
        resetTargetWriteConfig(
          buildWriteTargetAfterTableModeChange(
            (prev ?? {}) as WriteDataFrameToDBValues
          )
        )
      );
      resetAsyncState();
    },
    [literalTableName, resetAsyncState, setLocalInputData]
  );

  const handleCreateTableSave = useCallback(() => {
    const nextName = newTableName.trim();
    if (!nextName) {
      return;
    }

    setLocalInputData(prev =>
      resetTargetWriteConfig({
        ...((prev ?? {}) as WriteDataFrameToDBValues),
        table_name: nextName,
      })
    );
    setIsCreateTableNameEditorOpen(false);
    setNewTableName(nextName);
    setNotice(null);
    resetAsyncState();
  }, [newTableName, resetAsyncState, setLocalInputData]);

  const handleEditCreatedTableName = useCallback(() => {
    setIsCreateTableNameEditorOpen(true);
    setNewTableName(literalTableName ?? '');
  }, [literalTableName]);

  const handleEditSelectedTable = useCallback(() => {
    setIsSelectTableBrowserOpen(true);
  }, []);

  const handleResetTable = useCallback(() => {
    setLocalInputData(prev =>
      resetTargetWriteConfig({
        ...((prev ?? {}) as WriteDataFrameToDBValues),
        table_name: null,
      })
    );
    setIsSelectTableBrowserOpen(true);
    setIsCreateTableNameEditorOpen(true);
    setNewTableName('');
    setNotice(null);
    resetAsyncState();
  }, [resetAsyncState, setLocalInputData]);

  const handleCreateTableInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleCreateTableSave();
      }
    },
    [handleCreateTableSave]
  );

  const handleDatabaseCreateSave = useCallback(async () => {
    const name = newDatabaseName.trim();
    if (!name || !inputConnectionMetadata) {
      return;
    }

    try {
      setCreatingEntity('database');
      await createDatabase({
        connection_id: requireDbConnectionId(inputConnectionMetadata),
        database_name: name,
      });
      dispatch(
        invalidateDbCatalog(requireDbConnectionId(inputConnectionMetadata))
      );
      setSharedState(prev => registerCreatedDatabase(prev, name));
      setLocalInputData(prev =>
        resetTargetWriteConfig({
          ...((prev ?? {}) as WriteDataFrameToDBValues),
          database_name: name,
          schema_name: null,
          table_name: null,
        })
      );
      setSelectDatabaseMode('select');
      setIsDatabaseNew(true);
      setNewDatabaseName('');
      setNotice({
        severity: 'success',
        message: `База данных "${name}" создана.`,
      });
      resetAsyncState();
    } catch (error: unknown) {
      setNotice({
        severity: 'error',
        message: extractApiErrorMessage(
          error,
          `Не удалось создать базу данных "${name}".`
        ),
      });
    } finally {
      setCreatingEntity(null);
    }
  }, [
    createDatabase,
    dispatch,
    inputConnectionMetadata,
    newDatabaseName,
    resetAsyncState,
    setLocalInputData,
    setSharedState,
  ]);

  const handleSchemaCreateSave = useCallback(async () => {
    const name = newSchemaName.trim();
    if (!name || !inputConnectionMetadata) {
      return;
    }

    try {
      setCreatingEntity('schema');
      await createSchema({
        connection_id: requireDbConnectionId(inputConnectionMetadata),
        database_name: literalDatabaseName,
        schema_name: name,
      });
      dispatch(
        invalidateDbCatalog(requireDbConnectionId(inputConnectionMetadata))
      );
      setSharedState(prev =>
        registerCreatedSchema(prev, literalDatabaseName, name)
      );
      setLocalInputData(prev =>
        resetTargetWriteConfig({
          ...((prev ?? {}) as WriteDataFrameToDBValues),
          schema_name: name,
          table_name: null,
        })
      );
      setSelectSchemaMode('select');
      setIsSchemaNew(true);
      setNewSchemaName('');
      setNotice({
        severity: 'success',
        message: `Схема "${name}" создана.`,
      });
      resetAsyncState();
    } catch (error: unknown) {
      setNotice({
        severity: 'error',
        message: extractApiErrorMessage(
          error,
          `Не удалось создать схему "${name}".`
        ),
      });
    } finally {
      setCreatingEntity(null);
    }
  }, [
    createSchema,
    dispatch,
    inputConnectionMetadata,
    literalDatabaseName,
    newSchemaName,
    resetAsyncState,
    setLocalInputData,
    setSharedState,
  ]);

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <AccordionContainer>
        {notice ? (
          <Alert severity={notice.severity}>{notice.message}</Alert>
        ) : null}

        {isDatabaseSelectionRequired ? (
          <DatabaseSection
            collapsedValue={databaseSectionCollapsedValue}
            inputDefinition={databaseInputDef}
            isCreateMode={shouldShowCreateDatabaseSelector}
            isDatabaseNew={isDatabaseNew}
            isOpen={isSectionOpen('database')}
            isSaving={creatingEntity === 'database'}
            newDatabaseName={newDatabaseName}
            onChange={handleDatabaseValueChange}
            onClear={() => handleDatabaseValueChange(null)}
            onCreateModeSelect={setSelectDatabaseMode}
            onDatabaseSelect={handleDatabaseSelect}
            onNewDatabaseNameChange={setNewDatabaseName}
            onSave={() => void handleDatabaseCreateSave()}
            onToggle={() => toggleSection('database')}
            options={isLazyCatalog ? catalog.databaseOptions : databaseOptions}
            selectMode={selectDatabaseMode}
            selectedValue={literalDatabaseName}
            value={localInputData?.database_name}
            variables={variables}
            {...(isLazyCatalog
              ? {
                  query: catalog.databaseSearch,
                  onQueryChange: catalog.setDatabaseSearch,
                  state: catalog.databases.state,
                  hasNextPage: catalog.databases.hasNextPage,
                  isFetchingNextPage: catalog.databases.isFetchingNextPage,
                  loadMoreError: catalog.databases.loadMoreError,
                  onLoadNextPage: () => void catalog.databases.loadNextPage(),
                  onRetry: () => catalog.databases.retry(),
                  onRefresh: () => catalog.refresh.refresh(),
                  isRefreshing:
                    catalog.refresh.isLoading || catalog.databases.isRefreshing,
                }
              : {})}
          />
        ) : null}

        {isSchemaRequired ? (
          <SchemaSection
            blockedMessage={
              hasSelectedDatabase ? null : DATABASE_SELECTION_REQUIRED_MESSAGE
            }
            collapsedValue={schemaSectionCollapsedValue}
            inputDefinition={schemaInputDef}
            isCreateMode={shouldShowCreateSchemaSelector}
            isOpen={isSectionOpen('schema')}
            isSaving={creatingEntity === 'schema'}
            isSchemaNew={isSchemaNew}
            newSchemaName={newSchemaName}
            onChange={handleSchemaValueChange}
            onClear={() => handleSchemaValueChange(null)}
            onCreateModeSelect={setSelectSchemaMode}
            onNewSchemaNameChange={setNewSchemaName}
            onSave={() => void handleSchemaCreateSave()}
            onSchemaSelect={handleSchemaSelect}
            onToggle={() => toggleSection('schema')}
            options={isLazyCatalog ? catalog.schemaOptions : schemaOptions}
            selectMode={selectSchemaMode}
            selectedValue={literalSchemaName}
            value={localInputData?.schema_name}
            variables={variables}
            {...(isLazyCatalog
              ? {
                  query: catalog.schemaSearch,
                  onQueryChange: catalog.setSchemaSearch,
                  state: catalog.schemas.state,
                  hasNextPage: catalog.schemas.hasNextPage,
                  isFetchingNextPage: catalog.schemas.isFetchingNextPage,
                  loadMoreError: catalog.schemas.loadMoreError,
                  onLoadNextPage: () => void catalog.schemas.loadNextPage(),
                  onRetry: () => catalog.schemas.retry(),
                  onRefresh: () => catalog.refresh.refresh(),
                  isRefreshing:
                    catalog.refresh.isLoading || catalog.schemas.isRefreshing,
                }
              : {})}
          />
        ) : null}

        <TableSection
          blockedMessage={
            hasSelectedDatabase ? null : DATABASE_SELECTION_REQUIRED_MESSAGE
          }
          inputConnectionMetadata={inputConnectionMetadata}
          inputDefinition={tableInputDef}
          isCreateTableNameEditorOpen={isCreateTableNameEditorOpen}
          isOpen={isSectionOpen('table')}
          isSelectTableBrowserOpen={isSelectTableBrowserOpen}
          newTableName={newTableName}
          notice={null}
          onChange={handleTableValueChange}
          onCreateTableInputKeyDown={handleCreateTableInputKeyDown}
          onEditCreatedTableName={handleEditCreatedTableName}
          onEditSelectedTable={handleEditSelectedTable}
          onResetTable={handleResetTable}
          onSaveCreatedTableName={handleCreateTableSave}
          onTableModeChange={handleTableModeChange}
          onTableNameChange={setNewTableName}
          onTableSelect={table => {
            if ('catalogRef' in table) {
              handleLazyTableSelect(table.catalogRef);
              return;
            }
            handleTableSelect(table);
          }}
          onToggle={() => toggleSection('table')}
          selectedTable={
            isLazyCatalog ? catalog.selectedTableItem : selectedTable
          }
          selectedTableLabel={selectedTableLabel}
          selectTableMode={selectTableMode}
          tables={isLazyCatalog ? catalog.tableItems : filteredTables}
          value={localInputData?.table_name}
          variables={variables}
          {...(isLazyCatalog
            ? {
                query: catalog.tableSearch,
                onQueryChange: catalog.setTableSearch,
                state: catalog.tables.state,
                hasNextPage: catalog.tables.hasNextPage,
                isFetchingNextPage: catalog.tables.isFetchingNextPage,
                loadMoreError: catalog.tables.loadMoreError,
                onLoadNextPage: () => void catalog.tables.loadNextPage(),
                onRetry: () => catalog.tables.retry(),
                onRefresh: () => catalog.refresh.refresh(),
                isRefreshing:
                  catalog.refresh.isLoading || catalog.tables.isRefreshing,
              }
            : {})}
        />
      </AccordionContainer>
    </Box>
  );
};
