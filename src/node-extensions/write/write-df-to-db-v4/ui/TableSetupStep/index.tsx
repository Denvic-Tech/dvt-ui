import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';

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
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { commentTargetKey } from '../../lib/columnComments';
import { getPendingColumnActions } from '../../lib/helpers';
import {
  buildWriteTargetAfterDatabaseChange,
  type ExtensionState,
  extractApiErrorMessage,
  findWriteTargetTable,
  getLiteralStringValue,
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

import { CatalogColumns } from './sections/CatalogColumn.styles';
import { DatabaseSection } from './sections/DatabaseSection';
import { SchemaSection } from './sections/SchemaSection';
import { TableSection } from './sections/TableSection';

type UITableSelectMode = 'select' | 'create';
type UIDatabaseSelectMode = 'select' | 'create';
type UISchemaSelectMode = 'select' | 'create';

type Notice = {
  severity: 'success' | 'error';
  message: string;
} | null;

const EMPTY_TARGET_FINGERPRINT = ['', '', ''].join('::');
const DATABASE_SELECTION_REQUIRED_MESSAGE = 'Выберите базу данных';

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
  const { confirm } = useConfirmDialog();
  const runTargetChange = useCallback(
    async (change: () => void | Promise<void>) => {
      const pending =
        getPendingColumnActions({
          ...sharedState,
          selectedColumnActions: [],
        }).some(
          action =>
            action.type === 'set_column_comment' ||
            action.type === 'set_column_nullable'
        ) || Object.keys(sharedState?.typedCommentOverrides ?? {}).length > 0;
      if (
        pending &&
        !(await confirm({
          title: 'Сбросить изменения колонок?',
          message:
            'При выборе другой таблицы несохранённые изменения NULL и комментариев будут сброшены.',
          confirmLabel: 'Сбросить',
          cancelLabel: 'Отмена',
          confirmColor: 'primary',
        }))
      )
        return;
      setSharedState(prev => ({
        ...(prev ?? {}),
        typedCommentOverrides: {},
        dbCommentOverrides: {},
        dbNullableOverrides: {},
        lastResolveColumnsKey: null,
        columnCommentsSupported: false,
        suppressDefaultColumnActions: false,
      }));
      await change();
    },
    [confirm, sharedState, setSharedState]
  );

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
  const [isCreateTableNameEditorOpen, setIsCreateTableNameEditorOpen] =
    useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [creatingEntity, setCreatingEntity] = useState<
    'database' | 'schema' | null
  >(null);
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
    databasesEnabled: isOpen,
    schemasEnabled:
      isOpen &&
      (!supportsDatabaseSelection(inputConnectionMetadata) ||
        Boolean(literalDatabaseName)),
    tablesEnabled:
      isOpen &&
      (!supportsDatabaseSelection(inputConnectionMetadata) ||
        Boolean(literalDatabaseName)) &&
      (!supportsSchemas(inputConnectionMetadata) || Boolean(literalSchemaName)),
    detailEnabled: Boolean(literalTableName),
  });
  const isLazyCatalog = catalog.mode === 'lazy';

  useEffect(() => {
    const key = commentTargetKey(
      inputConnectionMetadata?.connection_id,
      literalDatabaseName,
      literalSchemaName,
      literalTableName
    );
    setSharedState(prev => {
      if (prev?.commentTargetKey === key) return prev;
      return {
        ...(prev ?? {}),
        commentTargetKey: key,
        typedCommentOverrides: {},
        dbCommentOverrides: {},
        dbNullableOverrides: {},
        columnCommentsSupported: false,
        suppressDefaultColumnActions: false,
      };
    });
  }, [
    inputConnectionMetadata?.connection_id,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    setSharedState,
  ]);

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

  const createdSchemaNames = useMemo(
    () =>
      (sharedState?.createdSchemas ?? [])
        .filter(schema => schema.databaseName === literalDatabaseName)
        .map(schema => schema.schemaName),
    [literalDatabaseName, sharedState?.createdSchemas]
  );

  const filteredTables = useMemo(() => {
    return getDbMetadataFilteredTables(inputConnectionMetadata, {
      databaseName: literalDatabaseName,
      schemaName: literalSchemaName,
    });
  }, [inputConnectionMetadata, literalDatabaseName, literalSchemaName]);

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
      selectedCreationMode: 'typed',
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
    },
    [handleDatabaseValueChange]
  );

  const handleSchemaSelect = useCallback(
    (schemaName: string) => {
      handleSchemaValueChange(schemaName);
      setSelectSchemaMode('select');
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
      setIsCreateTableNameEditorOpen(false);
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
      setIsCreateTableNameEditorOpen(false);
      setNewTableName('');
      setNotice(null);
      resetAsyncState();
    },
    [resetAsyncState, setLocalInputData]
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
    setSelectTableMode('create');
    setIsCreateTableNameEditorOpen(false);
    setNewTableName(nextName);
    setNotice(null);
    resetAsyncState();
  }, [newTableName, resetAsyncState, setLocalInputData]);

  const handleEditCreatedTableName = useCallback(() => {
    setIsCreateTableNameEditorOpen(true);
    setNewTableName(
      selectTableMode === 'create' ? (literalTableName ?? '') : ''
    );
  }, [literalTableName, selectTableMode]);

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
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <CatalogColumns>
        {isDatabaseSelectionRequired ? (
          <DatabaseSection
            inputDefinition={databaseInputDef}
            isSaving={creatingEntity === 'database'}
            creationResult={notice}
            newDatabaseName={newDatabaseName}
            createdNames={sharedState?.recentlyCreatedDatabases}
            onChange={value =>
              void runTargetChange(() => handleDatabaseValueChange(value))
            }
            onCreateModeSelect={mode => {
              setNotice(null);
              setNewDatabaseName('');
              setSelectDatabaseMode(mode);
            }}
            onDatabaseSelect={value =>
              value !== literalDatabaseName &&
              void runTargetChange(() => handleDatabaseSelect(value))
            }
            onNewDatabaseNameChange={value => {
              setNotice(null);
              setNewDatabaseName(value);
            }}
            onSave={() => runTargetChange(handleDatabaseCreateSave)}
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
            key={`schema:${literalDatabaseName ?? ''}`}
            blockedMessage={
              !hasSelectedDatabase
                ? DATABASE_SELECTION_REQUIRED_MESSAGE
                : !literalDatabaseName && isDatabaseSelectionRequired
                  ? 'База задана выражением. Введите схему выражением.'
                  : null
            }
            inputDefinition={schemaInputDef}
            isSaving={creatingEntity === 'schema'}
            creationResult={notice}
            newSchemaName={newSchemaName}
            createdNames={createdSchemaNames}
            onChange={value =>
              void runTargetChange(() => handleSchemaValueChange(value))
            }
            onCreateModeSelect={mode => {
              setNotice(null);
              setNewSchemaName('');
              setSelectSchemaMode(mode);
            }}
            onNewSchemaNameChange={value => {
              setNotice(null);
              setNewSchemaName(value);
            }}
            onSave={() => runTargetChange(handleSchemaCreateSave)}
            onSchemaSelect={value =>
              value !== literalSchemaName &&
              void runTargetChange(() => handleSchemaSelect(value))
            }
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
          key={`table:${literalDatabaseName ?? ''}:${literalSchemaName ?? ''}`}
          blockedMessage={
            !inputConnectionMetadata
              ? 'Подключите вход connection'
              : !hasSelectedDatabase
                ? isSchemaRequired
                  ? 'Выберите схему'
                  : DATABASE_SELECTION_REQUIRED_MESSAGE
                : isSchemaRequired &&
                    !hasConfiguredSelectorValue(localInputData?.schema_name)
                  ? 'Выберите схему'
                  : (isDatabaseSelectionRequired && !literalDatabaseName) ||
                      (isSchemaRequired && !literalSchemaName)
                    ? 'Родитель задан выражением. Введите таблицу выражением.'
                    : null
          }
          inputDefinition={tableInputDef}
          isCreateTableNameEditorOpen={isCreateTableNameEditorOpen}
          newTableName={newTableName}
          onChange={value =>
            void runTargetChange(() => handleTableValueChange(value))
          }
          onEditCreatedTableName={handleEditCreatedTableName}
          onSaveCreatedTableName={() => runTargetChange(handleCreateTableSave)}
          onCloseTableNameEditor={() => setIsCreateTableNameEditorOpen(false)}
          onTableNameChange={setNewTableName}
          onTableSelect={table =>
            (selectTableMode !== 'select' || table.name !== literalTableName) &&
            void runTargetChange(() => {
              if ('catalogRef' in table) {
                handleLazyTableSelect(table.catalogRef);
                return;
              }
              handleTableSelect(table);
            })
          }
          selectedValue={literalTableName}
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
      </CatalogColumns>
    </Box>
  );
};
