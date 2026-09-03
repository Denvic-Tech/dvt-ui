import { useEffect, useMemo, useRef, useState } from 'react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import {
  DatabaseSection,
  SchemaSection,
  TableSection,
  useDbTargetCatalogController,
} from '@/features/node/db-target-selector';
import { useNodeConnections } from '@/features/node/get-node-connections';
import { useNodeData } from '@/features/node/manage-node-data';

import { resolveDbCatalogMode } from '@/entities/data/db-connection/model/catalogNormalizers';
import { getDbCatalogCapabilities } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import { apiUtilsApi } from '@/shared/api/utils';
import type { DataType, DbMetadata, DbTable } from '@/shared/gatewayClient';
import {
  getConstValue,
  unwrapInputValues,
} from '@/shared/lib/node-input-values';
import { sanitizeSqlForBackend } from '@/shared/lib/sql';
import { TemplateMonacoInput } from '@/shared/ui/node-input';

import {
  buildEmptyManualVariableDraft,
  buildManualVariablePayloadFingerprint,
  buildSqlPolicyDrafts,
  buildSqlPreviewFingerprint,
  extractApiErrorMessage,
  extractSqlQueryText,
  findManualVariableTable,
  getManualColumnNullable,
  getManualDatabaseCollapsedValue,
  getManualDatabaseMetadataOptions,
  getManualFilteredTables,
  getManualSchemaCollapsedValue,
  getManualSchemaMetadataOptions,
  getManualSelectedTableLabel,
  getManualTableCollapsedValue,
  getMode,
  getOrderByRequiredAggregations,
  getSqlPreviewColumns,
  getSupportedAggregations,
  hasConfiguredManualTarget,
  hasConfiguredSelectorValue,
  hydrateManualTarget,
  hydrateManualVariableDrafts,
  serializeManualVariableDrafts,
  serializeSqlPolicyDrafts,
} from '../lib/helpers';
import type {
  ManualTargetDraft,
  ManualVariableDraft,
  ReadVariablesFromDBValues,
  SqlPreviewState,
  SqlVariablePolicyDraft,
} from '../lib/types';
import {
  validateManualDefinition,
  validateManualPolicyStep,
  validateSqlPolicyStep,
  validateSqlPreviewState,
} from '../lib/validation';

import { PlusIcon, SuccessCheckIcon } from './components/icons';
import { ManualVariableDefinitionRow } from './components/ManualVariableDefinitionRow';
import { SqlVariablePolicyRow } from './components/SqlVariablePolicyRow';
import {
  AddVariableButton,
  EditorRoot,
  ModeRow,
  ModeToggleButton,
  ModeToggleContainer,
  MonacoEditorWrapper,
  MonacoHint,
  NoticeBlock,
  NoticeList,
  NoticesStack,
  NoticeTitle,
  SectionCount,
  SectionLabel,
  SectionStack,
  StatusErrorBlock,
  StatusInfoBlock,
  StatusSuccessBlock,
  VariableList,
} from './styles';

const emptySqlPreviewState: SqlPreviewState = {
  status: 'idle',
  fingerprint: null,
  metadata: null,
  error: null,
};

const buildSqlOverridesFingerprint = (
  rows: SqlVariablePolicyDraft[],
  columns: string[]
) =>
  JSON.stringify({
    columns,
    overrides: serializeSqlPolicyDrafts(rows),
  });

const buildManualTargetSectionsState = ({
  shouldShowDatabaseSelector,
  shouldShowSchemaSelector,
  target,
}: {
  shouldShowDatabaseSelector: boolean;
  shouldShowSchemaSelector: boolean;
  target: ManualTargetDraft;
}) => {
  if (shouldShowDatabaseSelector) {
    if (!hasConfiguredSelectorValue(target.database_name)) {
      return {
        database: true,
        schema: false,
        table: false,
      };
    }

    if (
      shouldShowSchemaSelector &&
      !hasConfiguredSelectorValue(target.schema_name)
    ) {
      return {
        database: false,
        schema: true,
        table: false,
      };
    }

    if (!hasConfiguredSelectorValue(target.table_name)) {
      return {
        database: false,
        schema: false,
        table: true,
      };
    }

    return {
      database: false,
      schema: false,
      table: false,
    };
  }

  if (shouldShowSchemaSelector) {
    if (!hasConfiguredSelectorValue(target.schema_name)) {
      return {
        database: false,
        schema: true,
        table: false,
      };
    }

    if (!hasConfiguredSelectorValue(target.table_name)) {
      return {
        database: false,
        schema: false,
        table: true,
      };
    }

    return {
      database: false,
      schema: false,
      table: false,
    };
  }

  if (!hasConfiguredSelectorValue(target.table_name)) {
    return {
      database: false,
      schema: false,
      table: true,
    };
  }

  return {
    database: false,
    schema: false,
    table: false,
  };
};

export const ReadVariablesFromDBEditor: React.FC<
  NodeModalExtensionProps<ReadVariablesFromDBValues>
> = ({
  id: nodeID,
  projectID,
  data,
  isOpen,
  localInputData,
  nodeDefinition,
  setLocalInputData,
  setValidationCallback,
  variables,
  inputVariables,
  projectVariables,
}) => {
  const persistedInputData = useMemo(
    () =>
      data.inputValues
        ? (unwrapInputValues(data.inputValues) as ReadVariablesFromDBValues)
        : {},
    [data.inputValues]
  );
  const effectiveManualVariables =
    localInputData.manual_variables ?? persistedInputData.manual_variables;
  const mode = getMode(localInputData.mode ?? persistedInputData.mode);
  const { getConnectedInputMetadata, getConnectedInputNodeID } =
    useNodeConnections(nodeID);
  const connectedNodeID = useMemo(
    () => getConnectedInputNodeID('connection'),
    [getConnectedInputNodeID]
  );
  const { nodeData: connectedNodeData } = useNodeData(connectedNodeID);

  const connectionMetadata = useMemo(
    () => getConnectedInputMetadata('connection') as DbMetadata | null,
    [getConnectedInputMetadata]
  );
  const connectionID = useMemo(() => {
    const connectionIDRaw = getConstValue<string>(
      connectedNodeData?.inputValues?.['connection_id']
    );

    return typeof connectionIDRaw === 'string' && connectionIDRaw.trim()
      ? connectionIDRaw
      : null;
  }, [connectedNodeData]);

  const supportedAggregations = useMemo(
    () =>
      getSupportedAggregations({
        connectionMetadata,
        nodeDefinition,
      }),
    [connectionMetadata, nodeDefinition]
  );
  const orderByRequiredAggregations = useMemo(
    () => getOrderByRequiredAggregations(nodeDefinition),
    [nodeDefinition]
  );
  const catalogMode = resolveDbCatalogMode(connectionMetadata);
  const catalogCapabilities = getDbCatalogCapabilities(connectionMetadata);
  const shouldShowDatabaseSelector = catalogCapabilities.supportsDatabases;
  const shouldShowSchemaSelector = catalogCapabilities.supportsSchemas;

  const initialManualTarget = hydrateManualTarget(effectiveManualVariables);
  const [manualRows, setManualRows] = useState<ManualVariableDraft[]>(() =>
    hydrateManualVariableDrafts(effectiveManualVariables)
  );
  const [manualTarget, setManualTarget] = useState<ManualTargetDraft>(
    () => initialManualTarget.target
  );
  const [hasLegacyMixedTargets, setHasLegacyMixedTargets] = useState(
    initialManualTarget.hasMixedTargets
  );
  const [manualPolicyExpandedByID, setManualPolicyExpandedByID] = useState<
    Record<string, boolean>
  >({});
  const [sqlPolicyExpandedByName, setSqlPolicyExpandedByName] = useState<
    Record<string, boolean>
  >({});
  const [sqlPreviewState, setSqlPreviewState] =
    useState<SqlPreviewState>(emptySqlPreviewState);

  const sqlPreviewStateRef = useRef<SqlPreviewState>(emptySqlPreviewState);
  const manualPayloadFingerprintRef = useRef(
    buildManualVariablePayloadFingerprint(effectiveManualVariables)
  );
  const wasOpenRef = useRef(isOpen);
  const sqlRequestVersionRef = useRef(0);

  useEffect(() => {
    sqlPreviewStateRef.current = sqlPreviewState;
  }, [sqlPreviewState]);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (!isOpen) {
      setManualTargetSections(
        buildManualTargetSectionsState({
          shouldShowDatabaseSelector,
          shouldShowSchemaSelector,
          target: manualTarget,
        })
      );
      return;
    }

    if (wasOpen) {
      return;
    }

    setManualTargetSections(
      buildManualTargetSectionsState({
        shouldShowDatabaseSelector,
        shouldShowSchemaSelector,
        target: manualTarget,
      })
    );
  }, [
    isOpen,
    manualTarget,
    shouldShowDatabaseSelector,
    shouldShowSchemaSelector,
  ]);

  useEffect(() => {
    if (localInputData.mode === undefined) {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        mode: persistedInputData.mode ?? 'manual',
      }));
    }
  }, [localInputData.mode, persistedInputData.mode, setLocalInputData]);

  useEffect(() => {
    const nextFingerprint = buildManualVariablePayloadFingerprint(
      effectiveManualVariables
    );
    if (nextFingerprint === manualPayloadFingerprintRef.current) {
      return;
    }

    manualPayloadFingerprintRef.current = nextFingerprint;

    const hydratedTarget = hydrateManualTarget(effectiveManualVariables);
    setManualRows(hydrateManualVariableDrafts(effectiveManualVariables));
    setManualTarget(hydratedTarget.target);
    setManualTargetSections(
      buildManualTargetSectionsState({
        shouldShowDatabaseSelector,
        shouldShowSchemaSelector,
        target: hydratedTarget.target,
      })
    );
    setHasLegacyMixedTargets(hydratedTarget.hasMixedTargets);
  }, [
    effectiveManualVariables,
    shouldShowDatabaseSelector,
    shouldShowSchemaSelector,
  ]);

  useEffect(() => {
    setManualPolicyExpandedByID(prevState => {
      const nextState: Record<string, boolean> = {};
      manualRows.forEach(row => {
        if (prevState[row.id]) {
          nextState[row.id] = true;
        }
      });
      return nextState;
    });
  }, [manualRows]);

  useEffect(() => {
    setSqlPolicyExpandedByName(prevState => {
      const nextState: Record<string, boolean> = {};
      sqlRowsMemoRef.current.forEach(row => {
        if (prevState[row.name]) {
          nextState[row.name] = true;
        }
      });
      return nextState;
    });
  }, [sqlPreviewState.fingerprint, localInputData.sql_variables]);

  useEffect(() => {
    if (mode !== 'manual') {
      return;
    }

    const serializedRows = serializeManualVariableDrafts(
      manualRows,
      manualTarget
    );
    const nextFingerprint =
      buildManualVariablePayloadFingerprint(serializedRows);
    if (nextFingerprint === manualPayloadFingerprintRef.current) {
      return;
    }

    manualPayloadFingerprintRef.current = nextFingerprint;
    setLocalInputData(prev => ({
      ...(prev ?? {}),
      manual_variables: serializedRows,
    }));
  }, [manualRows, manualTarget, mode, setLocalInputData]);

  const [manualTargetSections, setManualTargetSections] = useState(() =>
    buildManualTargetSectionsState({
      shouldShowDatabaseSelector,
      shouldShowSchemaSelector,
      target: initialManualTarget.target,
    })
  );

  const manualDatabaseOptions = useMemo(
    () => getManualDatabaseMetadataOptions(connectionMetadata),
    [connectionMetadata]
  );
  const manualSchemaOptions = useMemo(
    () =>
      getManualSchemaMetadataOptions({
        connectionMetadata,
        databaseName: manualTarget.database_name,
      }),
    [connectionMetadata, manualTarget.database_name]
  );
  const manualFilteredTables = useMemo(
    () =>
      getManualFilteredTables({
        connectionMetadata,
        databaseName: manualTarget.database_name,
        schemaName: manualTarget.schema_name,
      }),
    [connectionMetadata, manualTarget.database_name, manualTarget.schema_name]
  );
  const selectedManualTable = useMemo(
    () =>
      findManualVariableTable({
        connectionMetadata,
        target: manualTarget,
      }),
    [connectionMetadata, manualTarget]
  );
  const manualCatalog = useDbTargetCatalogController(connectionMetadata, {
    databaseName:
      typeof manualTarget.database_name === 'string'
        ? manualTarget.database_name
        : null,
    schemaName:
      typeof manualTarget.schema_name === 'string'
        ? manualTarget.schema_name
        : null,
    tableName:
      typeof manualTarget.table_name === 'string'
        ? manualTarget.table_name
        : null,
    databasesEnabled: manualTargetSections.database,
    schemasEnabled: manualTargetSections.schema,
    tablesEnabled: manualTargetSections.table,
    detailEnabled: mode === 'manual',
  });
  const lazyManualTable = manualCatalog.table;
  const effectiveSelectedManualTable = useMemo<DbTable | null>(() => {
    if (catalogMode !== 'lazy') return selectedManualTable;
    if (!lazyManualTable.item) return null;
    return {
      name: lazyManualTable.item.name,
      type: lazyManualTable.item.kind === 'view' ? 'VIEW' : 'BASE_TABLE',
      database_name: lazyManualTable.item.databaseName,
      schema_name: lazyManualTable.item.schemaName,
      columns: lazyManualTable.item.columns.map(column => ({
        name: column.name,
        dtype: column.dtype as DataType,
        nullable: column.nullable,
        index: column.indexed,
        primary_key: column.primaryKey,
        indexes: column.indexes,
      })),
    };
  }, [catalogMode, lazyManualTable.item, selectedManualTable]);

  const rawSqlQuery = extractSqlQueryText(localInputData.sql_code);
  const sanitizedSqlQuery = sanitizeSqlForBackend(rawSqlQuery);
  const currentSqlFingerprint =
    mode === 'sql' && connectionID && sanitizedSqlQuery
      ? buildSqlPreviewFingerprint({
          connectionID,
          sqlQuery: sanitizedSqlQuery,
        })
      : null;

  useEffect(() => {
    if (
      mode !== 'sql' ||
      !isOpen ||
      !connectionID ||
      !sanitizedSqlQuery ||
      !currentSqlFingerprint
    ) {
      const currentState = sqlPreviewStateRef.current;
      if (
        currentState.status !== 'idle' ||
        currentState.fingerprint !== null ||
        currentState.metadata !== null ||
        currentState.error !== null
      ) {
        setSqlPreviewState(emptySqlPreviewState);
      }
      return;
    }

    const currentState = sqlPreviewStateRef.current;
    if (
      currentState.fingerprint === currentSqlFingerprint &&
      currentState.status !== 'idle'
    ) {
      return;
    }

    const requestVersion = sqlRequestVersionRef.current + 1;
    sqlRequestVersionRef.current = requestVersion;

    const timer = window.setTimeout(() => {
      setSqlPreviewState({
        status: 'loading',
        fingerprint: currentSqlFingerprint,
        metadata: null,
        error: null,
      });

      void apiUtilsApi
        .getSqlCodeMetadata(connectionID, sanitizedSqlQuery, projectID)
        .then(sqlCodeMetadata => {
          if (sqlRequestVersionRef.current !== requestVersion) {
            return;
          }

          if (!sqlCodeMetadata.dataframe_metadata) {
            setSqlPreviewState({
              status: 'error',
              fingerprint: currentSqlFingerprint,
              metadata: null,
              error: 'Ошибка при вычислении метаданных запроса',
            });
            return;
          }

          setSqlPreviewState({
            status: 'success',
            fingerprint: currentSqlFingerprint,
            metadata: sqlCodeMetadata.dataframe_metadata,
            error: null,
          });
        })
        .catch(error => {
          if (sqlRequestVersionRef.current !== requestVersion) {
            return;
          }

          setSqlPreviewState({
            status: 'error',
            fingerprint: currentSqlFingerprint,
            metadata: null,
            error: extractApiErrorMessage(
              error,
              'Не удалось получить metadata по SQL query.'
            ),
          });
        });
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    connectionID,
    currentSqlFingerprint,
    isOpen,
    mode,
    sanitizedSqlQuery,
    projectID,
  ]);

  const sqlRows = useMemo(() => {
    const isCurrentPreviewReady =
      sqlPreviewState.status === 'success' &&
      sqlPreviewState.fingerprint === currentSqlFingerprint;

    return isCurrentPreviewReady
      ? buildSqlPolicyDrafts({
          columns: getSqlPreviewColumns(sqlPreviewState.metadata),
          rawValue: localInputData.sql_variables,
        })
      : [];
  }, [
    currentSqlFingerprint,
    localInputData.sql_variables,
    sqlPreviewState.fingerprint,
    sqlPreviewState.metadata,
    sqlPreviewState.status,
  ]);

  const sqlRowsMemoRef = useRef<SqlVariablePolicyDraft[]>(sqlRows);
  useEffect(() => {
    sqlRowsMemoRef.current = sqlRows;
  }, [sqlRows]);

  useEffect(() => {
    if (
      mode !== 'sql' ||
      sqlPreviewState.status !== 'success' ||
      sqlPreviewState.fingerprint !== currentSqlFingerprint
    ) {
      return;
    }

    const columns = getSqlPreviewColumns(sqlPreviewState.metadata).map(
      column => column.name
    );
    const currentFingerprint = JSON.stringify({
      columns,
      overrides: localInputData.sql_variables ?? {},
    });
    const nextFingerprint = buildSqlOverridesFingerprint(sqlRows, columns);

    if (currentFingerprint === nextFingerprint) {
      return;
    }

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      sql_variables: serializeSqlPolicyDrafts(sqlRows),
    }));
  }, [
    currentSqlFingerprint,
    localInputData.sql_variables,
    mode,
    setLocalInputData,
    sqlPreviewState.fingerprint,
    sqlPreviewState.metadata,
    sqlPreviewState.status,
    sqlRows,
  ]);

  const validationMessages = useMemo(() => {
    if (mode === 'manual') {
      return [
        ...validateManualDefinition({
          connectionID,
          connectionMetadata,
          manualRows,
          manualTarget,
          orderByRequiredAggregations,
        }),
        ...validateManualPolicyStep(manualRows),
      ];
    }

    return [
      ...validateSqlPreviewState({
        connectionID,
        currentFingerprint: currentSqlFingerprint,
        previewState: sqlPreviewState,
        sqlQueryValue: localInputData.sql_code,
      }),
      ...validateSqlPolicyStep(sqlRows),
    ];
  }, [
    connectionID,
    connectionMetadata,
    currentSqlFingerprint,
    localInputData.sql_code,
    manualRows,
    manualTarget,
    mode,
    orderByRequiredAggregations,
    sqlPreviewState,
    sqlRows,
  ]);

  const visibleValidationMessages = useMemo(() => {
    if (mode !== 'sql') {
      return validationMessages;
    }

    return validationMessages.filter(message => {
      if (message === 'Дождитесь, пока загрузится metadata по SQL query.') {
        return false;
      }

      if (message === 'Metadata по SQL query ещё не готова.') {
        return false;
      }

      if (
        sqlPreviewState.status === 'error' &&
        sqlPreviewState.fingerprint === currentSqlFingerprint &&
        sqlPreviewState.error &&
        message === sqlPreviewState.error
      ) {
        return false;
      }

      return true;
    });
  }, [
    currentSqlFingerprint,
    mode,
    sqlPreviewState.error,
    sqlPreviewState.fingerprint,
    sqlPreviewState.status,
    validationMessages,
  ]);

  useEffect(() => {
    setValidationCallback?.(() => () => validationMessages.length === 0);
  }, [setValidationCallback, validationMessages]);

  const sqlPreviewColumns = getSqlPreviewColumns(sqlPreviewState.metadata);
  const isCurrentSqlPreviewReady =
    sqlPreviewState.status === 'success' &&
    sqlPreviewState.fingerprint === currentSqlFingerprint;
  const manualSelectedTableLabel = getManualSelectedTableLabel(manualTarget);
  const isReopeningModal = isOpen && !wasOpenRef.current;
  const effectiveManualTargetSections = isReopeningModal
    ? buildManualTargetSectionsState({
        shouldShowDatabaseSelector,
        shouldShowSchemaSelector,
        target: manualTarget,
      })
    : manualTargetSections;
  const canAddManualVariable =
    hasConfiguredManualTarget(manualTarget) &&
    (!shouldShowDatabaseSelector ||
      hasConfiguredSelectorValue(manualTarget.database_name));

  useEffect(() => {
    const nextSections = buildManualTargetSectionsState({
      shouldShowDatabaseSelector,
      shouldShowSchemaSelector,
      target: manualTarget,
    });

    setManualTargetSections(prev => {
      if (
        nextSections.database === false &&
        nextSections.schema === false &&
        nextSections.table === false
      ) {
        return prev;
      }

      return nextSections;
    });
  }, [manualTarget, shouldShowDatabaseSelector, shouldShowSchemaSelector]);

  const patchManualRow = (
    rowID: string,
    patch: Partial<ManualVariableDraft>
  ) => {
    setManualRows(prevRows =>
      prevRows.map(prevRow =>
        prevRow.id === rowID ? { ...prevRow, ...patch } : prevRow
      )
    );
  };

  const clearManualRowColumns = () => {
    setManualRows(prevRows =>
      prevRows.map(row => ({
        ...row,
        column_name: undefined,
        order_by_column: undefined,
      }))
    );
  };

  const updateManualTarget = (patch: Partial<ManualTargetDraft>) => {
    setHasLegacyMixedTargets(false);
    setManualTarget(prev => ({
      ...prev,
      ...patch,
    }));
  };

  const getInputDefinition = (attrName: string) => {
    const inputDefinitions = nodeDefinition.input_definitions ?? {};

    return (
      inputDefinitions[attrName] ??
      Object.values(inputDefinitions).find(
        inputDefinition => inputDefinition.attr_name === attrName
      ) ??
      null
    );
  };

  const handleSqlRowPatch = (
    rowID: string,
    patch: Partial<SqlVariablePolicyDraft>
  ) => {
    const nextRows = sqlRows.map(prevRow =>
      prevRow.id === rowID ? { ...prevRow, ...patch } : prevRow
    );

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      sql_variables: serializeSqlPolicyDrafts(nextRows),
    }));
  };

  return (
    <EditorRoot>
      {!connectionID || visibleValidationMessages.length > 0 ? (
        <NoticesStack>
          {!connectionID ? (
            <NoticeBlock>
              <NoticeTitle>Connection</NoticeTitle>
              <NoticeList>
                <div>
                  Подключите вход `connection` к ноде с `connection_id`.
                </div>
              </NoticeList>
            </NoticeBlock>
          ) : null}

          {visibleValidationMessages.length > 0 ? (
            <NoticeBlock variant='error'>
              <NoticeTitle>Validation</NoticeTitle>
              <NoticeList>
                {visibleValidationMessages.map(message => (
                  <div key={message}>{message}</div>
                ))}
              </NoticeList>
            </NoticeBlock>
          ) : null}
        </NoticesStack>
      ) : null}

      <ModeRow>
        <ModeToggleContainer>
          <ModeToggleButton
            type='button'
            isActive={mode === 'manual'}
            onClick={() =>
              setLocalInputData(prev => ({
                ...(prev ?? {}),
                mode: 'manual',
              }))
            }
          >
            manual
          </ModeToggleButton>
          <ModeToggleButton
            type='button'
            isActive={mode === 'sql'}
            onClick={() =>
              setLocalInputData(prev => ({
                ...(prev ?? {}),
                mode: 'sql',
              }))
            }
          >
            sql
          </ModeToggleButton>
        </ModeToggleContainer>
      </ModeRow>

      {mode === 'manual' ? (
        <SectionStack>
          {hasLegacyMixedTargets && !hasConfiguredManualTarget(manualTarget) ? (
            <NoticeBlock>
              <NoticeList>
                <div>
                  В legacy payload найдены переменные с разными
                  `database/schema/table`. Перед сохранением выберите единый
                  target для всей ноды.
                </div>
              </NoticeList>
            </NoticeBlock>
          ) : null}

          <SectionStack>
            <SectionLabel>
              <span className='label'>Источник таблицы</span>
            </SectionLabel>

            <>
              {shouldShowDatabaseSelector ? (
                <DatabaseSection
                  collapsedValue={getManualDatabaseCollapsedValue(manualTarget)}
                  inputDefinition={getInputDefinition('database_name')}
                  isOpen={effectiveManualTargetSections.database}
                  onChange={nextValue => {
                    updateManualTarget({
                      database_name:
                        nextValue as ManualTargetDraft['database_name'],
                      schema_name: undefined,
                      table_name: undefined,
                    });
                    clearManualRowColumns();
                  }}
                  onDatabaseSelect={databaseName => {
                    updateManualTarget({
                      database_name: databaseName,
                      schema_name: undefined,
                      table_name: undefined,
                    });
                    clearManualRowColumns();
                    setManualTargetSections(prev => ({
                      ...prev,
                      database: false,
                      schema: shouldShowSchemaSelector,
                      table: !shouldShowSchemaSelector,
                    }));
                  }}
                  onToggle={() =>
                    setManualTargetSections(prev => ({
                      ...prev,
                      database: !prev.database,
                    }))
                  }
                  options={
                    catalogMode === 'lazy'
                      ? manualCatalog.databaseOptions
                      : manualDatabaseOptions
                  }
                  selectedValue={
                    typeof manualTarget.database_name === 'string'
                      ? manualTarget.database_name
                      : null
                  }
                  value={manualTarget.database_name}
                  variables={variables}
                  {...(catalogMode === 'lazy'
                    ? {
                        query: manualCatalog.databaseSearch,
                        onQueryChange: manualCatalog.setDatabaseSearch,
                        state: manualCatalog.databases.state,
                        hasNextPage: manualCatalog.databases.hasNextPage,
                        isFetchingNextPage:
                          manualCatalog.databases.isFetchingNextPage,
                        loadMoreError: manualCatalog.databases.loadMoreError,
                        onLoadNextPage: () =>
                          void manualCatalog.databases.loadNextPage(),
                        onRetry: () => manualCatalog.databases.retry(),
                        onRefresh: () => manualCatalog.refresh.refresh(),
                        isRefreshing: manualCatalog.refresh.isLoading,
                      }
                    : {})}
                />
              ) : null}

              {shouldShowSchemaSelector ? (
                <SchemaSection
                  collapsedValue={getManualSchemaCollapsedValue(manualTarget)}
                  inputDefinition={getInputDefinition('schema_name')}
                  isOpen={effectiveManualTargetSections.schema}
                  onChange={nextValue => {
                    updateManualTarget({
                      schema_name:
                        nextValue as ManualTargetDraft['schema_name'],
                      table_name: undefined,
                    });
                    clearManualRowColumns();
                  }}
                  onSchemaSelect={schemaName => {
                    updateManualTarget({
                      schema_name: schemaName,
                      table_name: undefined,
                    });
                    clearManualRowColumns();
                    setManualTargetSections(prev => ({
                      ...prev,
                      schema: false,
                      table: true,
                    }));
                  }}
                  onToggle={() =>
                    setManualTargetSections(prev => ({
                      ...prev,
                      schema: !prev.schema,
                    }))
                  }
                  options={
                    catalogMode === 'lazy'
                      ? manualCatalog.schemaOptions
                      : manualSchemaOptions
                  }
                  selectedValue={
                    typeof manualTarget.schema_name === 'string'
                      ? manualTarget.schema_name
                      : null
                  }
                  value={manualTarget.schema_name}
                  variables={variables}
                  {...(catalogMode === 'lazy'
                    ? {
                        query: manualCatalog.schemaSearch,
                        onQueryChange: manualCatalog.setSchemaSearch,
                        state: manualCatalog.schemas.state,
                        hasNextPage: manualCatalog.schemas.hasNextPage,
                        isFetchingNextPage:
                          manualCatalog.schemas.isFetchingNextPage,
                        loadMoreError: manualCatalog.schemas.loadMoreError,
                        onLoadNextPage: () =>
                          void manualCatalog.schemas.loadNextPage(),
                        onRetry: () => manualCatalog.schemas.retry(),
                        onRefresh: () => manualCatalog.refresh.refresh(),
                        isRefreshing: manualCatalog.refresh.isLoading,
                      }
                    : {})}
                />
              ) : null}

              {catalogMode === 'lazy' ? (
                <TableSection
                  collapsedValue={getManualTableCollapsedValue(manualTarget)}
                  inputDefinition={getInputDefinition('table_name')}
                  isOpen={effectiveManualTargetSections.table}
                  onChange={nextValue => {
                    updateManualTarget({
                      table_name: nextValue as ManualTargetDraft['table_name'],
                    });
                    clearManualRowColumns();
                  }}
                  onTableSelect={table => {
                    updateManualTarget({
                      database_name: table.catalogRef.databaseName,
                      schema_name: table.catalogRef.schemaName,
                      table_name: table.catalogRef.name,
                    });
                    clearManualRowColumns();
                    setManualTargetSections(prev => ({
                      ...prev,
                      table: false,
                    }));
                  }}
                  onToggle={() =>
                    setManualTargetSections(prev => ({
                      ...prev,
                      table: !prev.table,
                    }))
                  }
                  selectedTable={manualCatalog.selectedTableItem}
                  selectedTableLabel={manualSelectedTableLabel}
                  tables={manualCatalog.tableItems}
                  value={manualTarget.table_name}
                  variables={variables}
                  query={manualCatalog.tableSearch}
                  onQueryChange={manualCatalog.setTableSearch}
                  state={manualCatalog.tables.state}
                  hasNextPage={manualCatalog.tables.hasNextPage}
                  isFetchingNextPage={manualCatalog.tables.isFetchingNextPage}
                  loadMoreError={manualCatalog.tables.loadMoreError}
                  onLoadNextPage={() =>
                    void manualCatalog.tables.loadNextPage()
                  }
                  onRetry={() => manualCatalog.tables.retry()}
                  onRefresh={() => manualCatalog.refresh.refresh()}
                  isRefreshing={manualCatalog.refresh.isLoading}
                />
              ) : (
                <TableSection
                  collapsedValue={getManualTableCollapsedValue(manualTarget)}
                  inputDefinition={getInputDefinition('table_name')}
                  isOpen={effectiveManualTargetSections.table}
                  onChange={nextValue => {
                    updateManualTarget({
                      table_name: nextValue as ManualTargetDraft['table_name'],
                    });
                    clearManualRowColumns();
                  }}
                  onTableSelect={(table: DbTable) => {
                    updateManualTarget({
                      database_name: table.database_name,
                      schema_name: table.schema_name,
                      table_name: table.name,
                    });
                    clearManualRowColumns();
                    setManualTargetSections(prev => ({
                      ...prev,
                      table: false,
                    }));
                  }}
                  onToggle={() =>
                    setManualTargetSections(prev => ({
                      ...prev,
                      table: !prev.table,
                    }))
                  }
                  selectedTable={effectiveSelectedManualTable}
                  selectedTableLabel={manualSelectedTableLabel}
                  tables={manualFilteredTables}
                  value={manualTarget.table_name}
                  variables={variables}
                />
              )}
            </>

            {!effectiveSelectedManualTable &&
            hasConfiguredManualTarget(manualTarget) ? (
              <NoticeBlock>
                <NoticeList>
                  <div>
                    Если target задан expression-значением, список колонок нужно
                    будет заполнить вручную или тоже через expression.
                  </div>
                </NoticeList>
              </NoticeBlock>
            ) : null}
          </SectionStack>

          <SectionStack>
            <SectionLabel>
              <span className='label'>Переменные</span>
              <SectionCount>{manualRows.length}</SectionCount>
            </SectionLabel>

            <VariableList>
              {manualRows.map((row, rowIndex) => (
                <ManualVariableDefinitionRow
                  key={row.id}
                  row={row}
                  selectedTable={effectiveSelectedManualTable}
                  orderByRequiredAggregations={orderByRequiredAggregations}
                  supportedAggregations={supportedAggregations}
                  toneIndex={rowIndex}
                  isPolicyExpanded={Boolean(manualPolicyExpandedByID[row.id])}
                  onDelete={() =>
                    setManualRows(prevRows =>
                      prevRows.filter(prevRow => prevRow.id !== row.id)
                    )
                  }
                  onPatch={patch => {
                    if (
                      !Object.prototype.hasOwnProperty.call(
                        patch,
                        'column_name'
                      )
                    ) {
                      patchManualRow(row.id, patch);
                      return;
                    }

                    const nextNullable = getManualColumnNullable({
                      columnValue: patch.column_name,
                      table: effectiveSelectedManualTable,
                    });

                    patchManualRow(row.id, {
                      ...patch,
                      ...(nextNullable === undefined
                        ? {}
                        : { nullable: nextNullable }),
                    });
                  }}
                  onTogglePolicy={() =>
                    setManualPolicyExpandedByID(prev => ({
                      ...prev,
                      [row.id]: !prev[row.id],
                    }))
                  }
                />
              ))}
            </VariableList>

            {canAddManualVariable ? (
              <AddVariableButton
                type='button'
                onClick={() =>
                  setManualRows(prevRows => [
                    ...prevRows,
                    buildEmptyManualVariableDraft(),
                  ])
                }
              >
                <PlusIcon />
                Добавить переменную
              </AddVariableButton>
            ) : null}
          </SectionStack>
        </SectionStack>
      ) : (
        <SectionStack>
          <SectionStack>
            <SectionLabel>
              <span className='label'>SQL Query</span>
            </SectionLabel>

            <MonacoEditorWrapper>
              <TemplateMonacoInput
                value={localInputData.sql_code ?? ''}
                onChange={nextValue =>
                  setLocalInputData(prev => ({
                    ...(prev ?? {}),
                    sql_code: nextValue,
                  }))
                }
                allowExpressions={Boolean(
                  nodeDefinition.input_definitions['sql_code']
                    ?.allow_expressions
                )}
                expressionPolicyName={
                  nodeDefinition.input_definitions['sql_code']
                    ?.expression_policy
                }
                language='sql'
                height={280}
                variables={variables}
                inputVariables={inputVariables}
                projectVariables={projectVariables}
                helperText='В шаблонах используйте {{ input_variables.name }} для входящих переменных и {{ project_variables.name }} для переменных проекта.'
              />
            </MonacoEditorWrapper>
            <MonacoHint>
              Metadata обновляется автоматически с дебаунсом, когда SQL и
              connection готовы.
            </MonacoHint>

            {sqlPreviewState.status === 'loading' &&
            sqlPreviewState.fingerprint === currentSqlFingerprint ? (
              <StatusInfoBlock>
                Получаем metadata по SQL query...
              </StatusInfoBlock>
            ) : null}

            {sqlPreviewState.status === 'error' &&
            sqlPreviewState.fingerprint === currentSqlFingerprint ? (
              <StatusErrorBlock>
                {sqlPreviewState.error ??
                  'Не удалось получить metadata по SQL query.'}
              </StatusErrorBlock>
            ) : null}

            {isCurrentSqlPreviewReady ? (
              <StatusSuccessBlock>
                <span className='icon'>
                  <SuccessCheckIcon />
                </span>
                <span className='text'>
                  Получено колонок: {sqlPreviewColumns.length}
                </span>
              </StatusSuccessBlock>
            ) : null}
          </SectionStack>

          <SectionStack>
            <SectionLabel>
              <span className='label'>Колонки</span>
              <SectionCount>
                {isCurrentSqlPreviewReady ? sqlRows.length : 0}
              </SectionCount>
            </SectionLabel>

            {isCurrentSqlPreviewReady ? (
              sqlRows.length > 0 ? (
                <VariableList>
                  {sqlRows.map((row, rowIndex) => (
                    <SqlVariablePolicyRow
                      key={row.name}
                      row={row}
                      toneIndex={rowIndex}
                      isExpanded={Boolean(sqlPolicyExpandedByName[row.name])}
                      onPatch={patch => handleSqlRowPatch(row.id, patch)}
                      onToggle={() =>
                        setSqlPolicyExpandedByName(prev => ({
                          ...prev,
                          [row.name]: !prev[row.name],
                        }))
                      }
                    />
                  ))}
                </VariableList>
              ) : (
                <StatusInfoBlock>
                  Query не вернул колонок для настройки policy.
                </StatusInfoBlock>
              )
            ) : (
              <StatusInfoBlock>
                Policy станет доступна после успешного получения metadata по
                текущему SQL query.
              </StatusInfoBlock>
            )}
          </SectionStack>
        </SectionStack>
      )}
    </EditorRoot>
  );
};
