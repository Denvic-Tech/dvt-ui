import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';
import { useAppDispatch } from '@/app/providers/store';

import {
  CATALOG_EXPRESSION_PLACEHOLDERS,
  type CatalogTreeNode,
  createCatalogTreeNode,
  ExpressionFieldsList,
  ExpressionHint,
  ExpressionLabel,
  getCatalogTreeLevels,
  ROOT_BRANCH_KEY,
  useCatalogTree,
} from '@/features/node/db-catalog-tree';
import { useNodeConnections } from '@/features/node/get-node-connections';

import {
  invalidateDbCatalog,
  requireDbConnectionId,
} from '@/entities/data/db-connection';
import { normalizeDbCatalogParentNames } from '@/entities/data/db-connection/model/catalogNormalizers';
import {
  getDbCatalogCapabilities,
  useDbCatalogTable,
} from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import { useApiUtils } from '@/shared/api/utils';
import {
  type DataFrameMetadata,
  type DbMetadata as DBMetadata,
  type InputDefinitionModel,
} from '@/shared/gatewayClient';
import { isExpressionValue } from '@/shared/lib/node-input-values';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { buildSingleExpressionValue } from '@/shared/ui/node-input/primitiveExpression';
import PrimitiveNodeInput from '@/shared/ui/node-input/PrimitiveNodeInput';

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
  registerCreatedDatabase,
  registerCreatedSchema,
  resolveCreationMode,
  supportsDatabaseSelection,
  supportsSchemas,
  type WriteDataFrameToDBValues,
} from '../../lib/helpers';
import {
  formatCatalogLocation,
  getCatalogNameError,
} from '../../lib/targetNames';
import { StepRoot } from '../kit.styles';

import {
  CreateNamespaceDialog,
  type CreateNamespaceRequest,
} from './CreateNamespaceDialog';
import {
  type TargetDetail,
  TargetDetailPane,
  type TargetTablePath,
} from './TargetDetailPane';
import { type TableDraft, TargetTreePane } from './TargetTreePane';

type UITableSelectMode = 'select' | 'create';
type SelectorField = 'database_name' | 'schema_name' | 'table_name';
type SelectorSnapshot = Partial<
  Record<SelectorField, WriteDataFrameToDBValues[SelectorField]>
>;

const EMPTY_TARGET_FINGERPRINT = ['', '', ''].join('::');
/** Сколько держится подсветка только что созданной базы или схемы. */
const CREATED_HIGHLIGHT_MS = 1600;

const SELECTOR_FIELD_LABELS: Record<SelectorField, string> = {
  database_name: 'База данных',
  schema_name: 'Схема',
  table_name: 'Таблица',
};

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

const getSelectorDisplayValue = (value: unknown): string | null => {
  if (isExpressionValue(value)) return value.value.trim() || null;
  return getLiteralStringValue(value as WriteDataFrameToDBValues['table_name']);
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
  const { confirm } = useConfirmDialog();
  const runTargetChange = useCallback(
    async (change: () => void | Promise<void>) => {
      const pending =
        getPendingColumnActions(
          { ...sharedState, selectedColumnActions: [] },
          // Подстановки из DF пересчитаются для новой таблицы, их не жалко.
          { includeCommentFills: false }
        ).some(
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
  const [newTableName, setNewTableName] = useState(() =>
    selectTableMode === 'create'
      ? (getLiteralStringValue(localInputData?.table_name) ?? '')
      : ''
  );
  const [createRequest, setCreateRequest] =
    useState<CreateNamespaceRequest | null>(null);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
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

  const literalDatabaseName = useMemo(() => {
    return getLiteralStringValue(localInputData?.database_name);
  }, [localInputData?.database_name]);
  const literalSchemaName = useMemo(() => {
    return getLiteralStringValue(localInputData?.schema_name);
  }, [localInputData?.schema_name]);
  const literalTableName = useMemo(() => {
    return getLiteralStringValue(localInputData?.table_name);
  }, [localInputData?.table_name]);

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

  /* ---------- Режим выражений ---------- */

  const selectorFields = useMemo<SelectorField[]>(
    () => [
      ...(isDatabaseSelectionRequired ? (['database_name'] as const) : []),
      ...(isSchemaRequired ? (['schema_name'] as const) : []),
      'table_name',
    ],
    [isDatabaseSelectionRequired, isSchemaRequired]
  );
  const canUseExpressions = selectorFields.every(field =>
    Boolean(getInputDefinition(field)?.allow_expressions)
  );
  const [isExpressionMode, setIsExpressionMode] = useState(() =>
    (['database_name', 'schema_name', 'table_name'] as const).some(field =>
      isExpressionValue(localInputData?.[field])
    )
  );
  // Значения ноды модалка подставляет эффектом после первого рендера,
  // поэтому режим выражений определяем и по первым непустым значениям.
  const expressionModeResolvedRef = useRef(
    (['database_name', 'schema_name', 'table_name'] as const).some(field =>
      hasConfiguredSelectorValue(localInputData?.[field])
    )
  );
  useEffect(() => {
    if (expressionModeResolvedRef.current) return;
    const fields = ['database_name', 'schema_name', 'table_name'] as const;
    if (
      !fields.some(field => hasConfiguredSelectorValue(localInputData?.[field]))
    )
      return;
    expressionModeResolvedRef.current = true;
    setIsExpressionMode(
      fields.some(field => isExpressionValue(localInputData?.[field]))
    );
  }, [localInputData]);
  const literalSnapshotRef = useRef<SelectorSnapshot | null>(null);

  const enterExpressionMode = useCallback(() => {
    void runTargetChange(() => {
      const current = (localInputData ?? {}) as WriteDataFrameToDBValues;
      literalSnapshotRef.current = Object.fromEntries(
        selectorFields.map(field => [
          field,
          isExpressionValue(current[field]) ? null : current[field],
        ])
      );
      setLocalInputData(prev => {
        const base = (prev ?? {}) as WriteDataFrameToDBValues;
        const patch: SelectorSnapshot = {};
        for (const field of selectorFields) {
          const value = base[field];
          patch[field] = isExpressionValue(value)
            ? value
            : buildSingleExpressionValue(
                getInputDefinition(field)?.type,
                value
              );
        }
        return resetTargetWriteConfig({ ...base, ...patch });
      });
      setSelectTableMode('select');
      setNewTableName('');
      resetAsyncState();
      expressionModeResolvedRef.current = true;
      setIsExpressionMode(true);
    });
  }, [
    getInputDefinition,
    localInputData,
    resetAsyncState,
    runTargetChange,
    selectorFields,
    setLocalInputData,
  ]);

  const exitExpressionMode = useCallback(() => {
    void runTargetChange(() => {
      const snapshot = literalSnapshotRef.current;
      setLocalInputData(prev => {
        const base = (prev ?? {}) as WriteDataFrameToDBValues;
        const patch: SelectorSnapshot = {};
        for (const field of selectorFields) {
          if (isExpressionValue(base[field])) {
            patch[field] = snapshot?.[field] ?? null;
          }
        }
        return Object.keys(patch).length > 0
          ? resetTargetWriteConfig({ ...base, ...patch })
          : prev;
      });
      resetAsyncState();
      expressionModeResolvedRef.current = true;
      setIsExpressionMode(false);
    });
  }, [resetAsyncState, runTargetChange, selectorFields, setLocalInputData]);

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
      resetAsyncState();
    },
    [resetAsyncState, setLocalInputData]
  );

  const selectorChangeHandlers: Record<
    SelectorField,
    (value: unknown) => void
  > = {
    database_name: handleDatabaseValueChange,
    schema_name: handleSchemaValueChange,
    table_name: handleTableValueChange,
  };

  /* ---------- Выбор таблицы и черновик новой ---------- */

  const handleCatalogTableSelect = useCallback(
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
      setNewTableName('');
      resetAsyncState();
    },
    [resetAsyncState, setLocalInputData]
  );

  const handleStartDraft = useCallback(
    (databaseName: string | null, schemaName: string | null) => {
      void runTargetChange(() => {
        setLocalInputData(prev =>
          resetTargetWriteConfig({
            ...((prev ?? {}) as WriteDataFrameToDBValues),
            database_name: databaseName,
            schema_name: schemaName,
            table_name: null,
          })
        );
        setSelectTableMode('create');
        setNewTableName('');
        resetAsyncState();
      });
    },
    [resetAsyncState, runTargetChange, setLocalInputData]
  );

  const handleDraftNameChange = useCallback(
    (value: string) => {
      void runTargetChange(() => {
        const nextName = value.trim();
        setNewTableName(value);
        setLocalInputData(prev =>
          resetTargetWriteConfig({
            ...((prev ?? {}) as WriteDataFrameToDBValues),
            table_name: nextName || null,
          })
        );
        resetAsyncState();
      });
    },
    [resetAsyncState, runTargetChange, setLocalInputData]
  );

  /* ---------- Дерево ---------- */

  const treeLevels = useMemo(
    () =>
      getCatalogTreeLevels(getDbCatalogCapabilities(inputConnectionMetadata)),
    [inputConnectionMetadata]
  );
  const hasDatabaseLevel = treeLevels.includes('database');

  const draft = useMemo<TableDraft | null>(
    () =>
      selectTableMode === 'create' && !isExpressionMode
        ? {
            databaseName: hasDatabaseLevel ? literalDatabaseName : null,
            schemaName: isSchemaRequired ? literalSchemaName : null,
            name: newTableName,
          }
        : null,
    [
      hasDatabaseLevel,
      isExpressionMode,
      isSchemaRequired,
      literalDatabaseName,
      literalSchemaName,
      newTableName,
      selectTableMode,
    ]
  );

  const treeSelection = useMemo(
    () => ({
      databaseName: literalDatabaseName,
      schemaName: literalSchemaName,
      tableName: literalTableName,
      draft: draft !== null,
    }),
    [draft, literalDatabaseName, literalSchemaName, literalTableName]
  );

  // Созданные в этой сессии базы и схемы: показываем, даже если каталог
  // (или встроенные метаданные) их ещё не вернул.
  const injectedNodes = useMemo<CatalogTreeNode[]>(() => {
    const nodes: CatalogTreeNode[] = [];
    if (hasDatabaseLevel) {
      for (const name of sharedState?.createdDatabases ?? []) {
        if (name.trim()) {
          nodes.push(createCatalogTreeNode('database', name, null, null));
        }
      }
    }
    if (treeLevels.includes('schema')) {
      for (const schema of sharedState?.createdSchemas ?? []) {
        nodes.push(
          createCatalogTreeNode(
            'schema',
            schema.schemaName,
            hasDatabaseLevel ? schema.databaseName : null,
            null
          )
        );
      }
    }
    return nodes;
  }, [
    hasDatabaseLevel,
    sharedState?.createdDatabases,
    sharedState?.createdSchemas,
    treeLevels,
  ]);

  const tree = useCatalogTree({
    metadata: inputConnectionMetadata,
    selection: treeSelection,
    enabled: Boolean(isOpen && inputConnectionMetadata),
    injectedNodes,
  });

  const getBranchNames = useCallback(
    (branchKey: string) =>
      (branchKey === ROOT_BRANCH_KEY
        ? tree.root.items
        : (tree.branches[branchKey]?.items ?? [])
      ).map(node => node.name),
    [tree.branches, tree.root.items]
  );

  const getNamespaceBranchKey = useCallback(
    (databaseName: string | null, schemaName: string | null) => {
      if (schemaName !== null && treeLevels.includes('schema')) {
        return createCatalogTreeNode(
          'schema',
          schemaName,
          hasDatabaseLevel ? databaseName : null,
          null
        ).key;
      }
      if (databaseName !== null && hasDatabaseLevel) {
        return createCatalogTreeNode('database', databaseName, null, null).key;
      }
      return ROOT_BRANCH_KEY;
    },
    [hasDatabaseLevel, treeLevels]
  );

  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    []
  );
  const flashNode = useCallback((key: string) => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedKey(key);
    highlightTimerRef.current = setTimeout(
      () => setHighlightedKey(null),
      CREATED_HIGHLIGHT_MS
    );
  }, []);

  /* ---------- Создание базы и схемы ---------- */

  const handleDatabaseCreate = useCallback(
    async (name: string): Promise<string | null> => {
      if (!inputConnectionMetadata) {
        return 'Подключите вход connection';
      }

      try {
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
        resetAsyncState();
        return null;
      } catch (error: unknown) {
        return extractApiErrorMessage(
          error,
          `Не удалось создать базу данных "${name}".`
        );
      }
    },
    [
      createDatabase,
      dispatch,
      inputConnectionMetadata,
      resetAsyncState,
      setLocalInputData,
      setSharedState,
    ]
  );

  const handleSchemaCreate = useCallback(
    async (
      databaseName: string | null,
      name: string
    ): Promise<string | null> => {
      if (!inputConnectionMetadata) {
        return 'Подключите вход connection';
      }

      try {
        await createSchema({
          connection_id: requireDbConnectionId(inputConnectionMetadata),
          database_name: databaseName,
          schema_name: name,
        });
        dispatch(
          invalidateDbCatalog(requireDbConnectionId(inputConnectionMetadata))
        );
        setSharedState(prev => registerCreatedSchema(prev, databaseName, name));
        setLocalInputData(prev =>
          resetTargetWriteConfig({
            ...((prev ?? {}) as WriteDataFrameToDBValues),
            database_name: databaseName,
            schema_name: name,
            table_name: null,
          })
        );
        resetAsyncState();
        return null;
      } catch (error: unknown) {
        return extractApiErrorMessage(
          error,
          `Не удалось создать схему "${name}".`
        );
      }
    },
    [
      createSchema,
      dispatch,
      inputConnectionMetadata,
      resetAsyncState,
      setLocalInputData,
      setSharedState,
    ]
  );

  const handleNamespaceCreate = useCallback(
    async (name: string): Promise<string | null> => {
      if (!createRequest) return null;
      let failure: string | null = null;
      await runTargetChange(async () => {
        if (createRequest.kind === 'database') {
          failure = await handleDatabaseCreate(name);
          if (failure) return;
          const node = createCatalogTreeNode('database', name, null, null);
          tree.expandNodes([node]);
          flashNode(node.key);
          return;
        }

        const databaseName = hasDatabaseLevel
          ? createRequest.databaseName
          : null;
        failure = await handleSchemaCreate(databaseName, name);
        if (failure) return;
        const schemaNode = createCatalogTreeNode(
          'schema',
          name,
          databaseName,
          null
        );
        tree.expandNodes(
          databaseName !== null
            ? [
                createCatalogTreeNode('database', databaseName, null, null),
                schemaNode,
              ]
            : [schemaNode]
        );
        flashNode(schemaNode.key);
      });
      return failure;
    },
    [
      createRequest,
      flashNode,
      handleDatabaseCreate,
      handleSchemaCreate,
      hasDatabaseLevel,
      runTargetChange,
      tree,
    ]
  );

  const createTakenNames = useMemo(() => {
    if (!createRequest) return [];
    if (createRequest.kind === 'database')
      return getBranchNames(ROOT_BRANCH_KEY);
    return getBranchNames(
      hasDatabaseLevel && createRequest.databaseName !== null
        ? createCatalogTreeNode(
            'database',
            createRequest.databaseName,
            null,
            null
          ).key
        : ROOT_BRANCH_KEY
    );
  }, [createRequest, getBranchNames, hasDatabaseLevel]);

  /* ---------- Правая панель ---------- */

  const isExistingTableSelected =
    !isExpressionMode && !draft && Boolean(literalTableName);
  const tableDetail = useDbCatalogTable(
    inputConnectionMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    { enabled: Boolean(isOpen) && isExistingTableSelected }
  );

  const draftLocation = draft
    ? formatCatalogLocation(draft.databaseName, draft.schemaName)
    : '';
  // Путь в строке вкладок: родители — только поддерживаемые диалектом.
  const getTablePath = (
    databaseName: string | null,
    schemaName: string | null,
    name: string
  ): TargetTablePath => {
    const parents = normalizeDbCatalogParentNames(
      getDbCatalogCapabilities(inputConnectionMetadata),
      databaseName,
      schemaName
    );
    return {
      name,
      schemaName: parents.schemaName,
      fullPath: formatCatalogLocation(
        parents.databaseName,
        parents.schemaName,
        name
      ),
    };
  };
  const draftError = draft
    ? getCatalogNameError(
        draft.name,
        getBranchNames(
          getNamespaceBranchKey(draft.databaseName, draft.schemaName)
        ),
        draftLocation
      )
    : '';

  const detail: TargetDetail = isExpressionMode
    ? {
        kind: 'expression',
        rows: selectorFields.map(field => ({
          label: SELECTOR_FIELD_LABELS[field],
          value: getSelectorDisplayValue(localInputData?.[field]),
        })),
      }
    : draft
      ? {
          kind: 'draft',
          path: getTablePath(
            draft.databaseName,
            draft.schemaName,
            newTableName.trim()
          ),
          name: newTableName,
          location: draftLocation,
          error: draftError,
          onNameChange: handleDraftNameChange,
        }
      : isExistingTableSelected && literalTableName
        ? {
            kind: 'existing',
            tableKey: formatCatalogLocation(
              literalDatabaseName,
              literalSchemaName,
              literalTableName
            ),
            path: getTablePath(
              literalDatabaseName,
              literalSchemaName,
              literalTableName
            ),
            metadata: inputConnectionMetadata,
            databaseName: literalDatabaseName,
            schemaName: literalSchemaName,
            isLoading: tableDetail.state === 'loading',
            columns: tableDetail.item?.columns ?? null,
          }
        : { kind: 'empty' };

  return (
    <StepRoot data-testid='node-extensions/write/write-df-to-db-v4/table-setup-step'>
      <TargetTreePane
        tree={tree}
        metadata={inputConnectionMetadata}
        draft={draft}
        highlightedKey={highlightedKey}
        canCreateDatabase={
          isDatabaseSelectionRequired && Boolean(inputConnectionMetadata)
        }
        canCreateSchema={isSchemaRequired && Boolean(inputConnectionMetadata)}
        onTableSelect={node => {
          if (
            selectTableMode === 'select' &&
            node.name === literalTableName &&
            node.databaseName ===
              (hasDatabaseLevel ? literalDatabaseName : null) &&
            node.schemaName === (isSchemaRequired ? literalSchemaName : null)
          ) {
            return;
          }
          void runTargetChange(() =>
            handleCatalogTableSelect({
              name: node.name,
              databaseName: node.databaseName,
              schemaName: node.schemaName,
            })
          );
        }}
        onStartDraft={handleStartDraft}
        onRequestCreate={setCreateRequest}
        isExpressionMode={isExpressionMode}
        canUseExpressions={canUseExpressions}
        onEnterExpressionMode={enterExpressionMode}
        onExitExpressionMode={exitExpressionMode}
        expressionContent={
          <ExpressionFieldsList>
            {selectorFields.map(field => (
              <div
                key={field}
                data-testid={`node-extensions/write/write-df-to-db-v4/expression-${field}`}
              >
                <ExpressionLabel>
                  {SELECTOR_FIELD_LABELS[field]}
                </ExpressionLabel>
                <PrimitiveNodeInput
                  appearance='clean-minimal'
                  placeholder={CATALOG_EXPRESSION_PLACEHOLDERS[field].literal}
                  expressionPlaceholder={
                    CATALOG_EXPRESSION_PLACEHOLDERS[field].expression
                  }
                  inputDefinition={getInputDefinition(field)}
                  value={localInputData?.[field]}
                  onChange={value =>
                    void runTargetChange(() =>
                      selectorChangeHandlers[field](value)
                    )
                  }
                  variables={variables}
                />
              </div>
            ))}
            <ExpressionHint>Значения вычисляются при запуске</ExpressionHint>
          </ExpressionFieldsList>
        }
      />
      <TargetDetailPane detail={detail} />
      {createRequest ? (
        <CreateNamespaceDialog
          request={createRequest}
          takenNames={createTakenNames}
          onCreate={handleNamespaceCreate}
          onClose={() => setCreateRequest(null)}
        />
      ) : null}
    </StepRoot>
  );
};
