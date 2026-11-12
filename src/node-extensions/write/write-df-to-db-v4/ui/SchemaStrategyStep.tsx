import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Divider, MenuItem } from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { useNodeConnections } from '@/features/node/get-node-connections';

import {
  invalidateDbCatalog,
  requireDbConnectionId,
  resolveDbCatalogMode,
} from '@/entities/data/db-connection';
import { useDbCatalogTable } from '@/entities/data/db-connection/model/hooks/useDbCatalog';
import {
  useGetNodeFieldsQuery,
  useSetNodeColumnDescriptionsMutation,
} from '@/entities/data/lineage';
import { setOutputMetadata } from '@/entities/node/node-metadata';

import type {
  DataFrameMetadata,
  DataType,
  DbMetadata as DBMetadata,
  DbTable,
  Metadata,
  TableColumnActionInput,
  TableColumnActionOutput,
} from '@/shared/gatewayClient';
import { client } from '@/shared/gatewayClient';
import { upsertDbMetadataTable } from '@/shared/lib/db-metadata';
import {
  IconButtonBase,
  SearchField,
  SearchLead,
  Spinner,
} from '@/shared/ui/clean-minimal/controls';
import { ActionMenu } from '@/shared/ui/clean-minimal/dropdown';
import { dropdownBoundaryProps } from '@/shared/ui/clean-minimal/dropdownPlacement';
import {
  CheckIcon,
  CopyIcon,
  MoreIcon,
  RefreshIcon,
  SearchIcon,
} from '@/shared/ui/clean-minimal/icons';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  buildCatalogDescriptions,
  resolveCommentBaseline,
} from '../lib/catalogDescriptions';
import {
  commentsForRecreatedColumns,
  commentValue,
  normalizeComment,
} from '../lib/columnComments';
import {
  buildColumnMappingNameKey,
  buildCreateSqlCacheKey,
  buildDbColumnsFromColumnMapping,
  buildExistingTableColumnDiff,
  buildRequestedColumnMappingDraft,
  buildResolveWriteColumnsRequest,
  buildResolveWriteColumnsTriggerKey,
  buildSelectedWriteTargetLabel,
  type ColumnMappingItem,
  type ColumnResolveState,
  type CreationMode,
  type ExistingTableColumnDiffRow,
  type ExtensionState,
  extractApiErrorMessage,
  findWriteTargetTable,
  getChangedTargetNameSourceNames,
  getColumnActionLabel,
  getColumnMappingValidationErrors,
  getColumnResolutionValidationErrors,
  getDefaultSelectedColumnActions,
  getEffectiveDbCommentOverrides,
  getLiteralStringValue,
  getResolvedTargetColumnNames,
  getResolvedTargetName,
  getSyncingColumnCount,
  getTypedSpecValidationErrors,
  normalizeName,
  normalizeResolvedColumnRows,
  normalizeTableCreateSpecColumns,
  normalizeTableCreateSpecForDialect,
  persistCatalogDescriptions,
  resolveCreationMode,
  type ResolvedColumnMappingRow,
  serializeColumnMapping,
  type WriteDataFrameToDBValues,
} from '../lib/helpers';
import {
  buildSchemaRolesByTarget,
  EMPTY_SCHEMA_ROLES,
} from '../lib/schemaRoles';

import { ColumnCommentPanel } from './schema-step/ColumnCommentPanel';
import { ExistingTableMapping } from './schema-step/ExistingTableMapping';
import { formatColumnCount } from './schema-step/format';
import { NewTableColumnsTable } from './schema-step/NewTableColumnsTable';
import {
  HeaderSpacer,
  LinkButton,
  MessageBox,
  MessageList,
  SchemaStepHeader,
  SchemaStepRoot,
  SegmentGroup,
  SegmentTab,
  SqlEditor,
} from './schema-step/SchemaStep.styles';
import { TablePathChip } from './schema-step/TablePathChip';
import { CatalogDescriptionNote } from './CatalogDescriptionNote';

const COMMENTS_UNSUPPORTED_REASON =
  'Эта СУБД не поддерживает комментарии: текст DF не будет перенесён';
const EMPTY_RESOLVE_STATES: Record<string, ColumnResolveState> = {};
const EFFECTIVE_NAME_FLASH_DURATION_MS = 950;
const COLUMN_RESOLVE_DEBOUNCE_MS = 1200;
const COLUMN_RESOLVE_FLASH_MS = 1000;

const normalizeSourceKeys = (sourceNames: Array<string | null | undefined>) => {
  return Array.from(
    new Set(
      sourceNames.map(sourceName => normalizeName(sourceName)).filter(Boolean)
    )
  );
};

const buildResolvedTargetBySource = (
  rows: ResolvedColumnMappingRow[]
): Map<string, string | null> => {
  return new Map(
    rows
      .filter(
        (
          row
        ): row is ResolvedColumnMappingRow & {
          source_name: string;
        } => Boolean(row.source_name)
      )
      .map(row => [normalizeName(row.source_name), getResolvedTargetName(row)])
  );
};

const getMappingFingerprint = (mapping?: ColumnMappingItem[] | null) => {
  return JSON.stringify(serializeColumnMapping(mapping) ?? null);
};

const isClickHouseConnection = (metadata: DBMetadata | null) => {
  return metadata?.dialect?.toLowerCase() === 'clickhouse';
};

const toSnakeCase = (value: string) => {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase()
    .trim();
};

export const SchemaStrategyStep = ({
  id: nodeID,
  isOpen,
  localInputData,
  setLocalInputData,
  setSharedState,
  sharedState,
  goToStep,
}: NodeModalStepperExtensionProps<
  WriteDataFrameToDBValues,
  ExtensionState
>) => {
  const { getConnectedInputMetadata, connectedInputs } =
    useNodeConnections(nodeID);
  const { confirm } = useConfirmDialog();
  const dispatch = useAppDispatch();
  const projectId = useAppSelector(
    state => state.projects.selectedProject?.id ?? null
  );
  // Baseline комментариев: описания каталога для входа `df` (свои и унаследованные).
  const { data: catalogFields } = useGetNodeFieldsQuery(
    projectId && isOpen ? { projectId, nodeId: nodeID, port: 'df' } : skipToken,
    { refetchOnMountOrArgChange: true }
  );
  const [setNodeColumnDescriptions] = useSetNodeColumnDescriptionsMutation();
  const catalogDescriptions = useMemo(
    () => buildCatalogDescriptions(catalogFields?.fields),
    [catalogFields]
  );
  useEffect(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      catalogDescriptions,
      persistColumnDescriptions: projectId
        ? async fields => {
            await setNodeColumnDescriptions({
              projectId,
              nodeId: nodeID,
              port: 'df',
              fields,
            }).unwrap();
          }
        : undefined,
    }));
  }, [
    catalogDescriptions,
    nodeID,
    projectId,
    setNodeColumnDescriptions,
    setSharedState,
  ]);

  const [isSqlCopied, setIsSqlCopied] = useState<'raw' | 'typed' | null>(null);
  const [mappingSearch, setMappingSearch] = useState('');
  const deferredMappingSearch = useDeferredValue(mappingSearch);
  const [bulkAnchorEl, setBulkAnchorEl] = useState<HTMLElement | null>(null);
  // Колонка, комментарий которой открыт в боковой панели (новая таблица).
  const [activeCommentSource, setActiveCommentSource] = useState<string | null>(
    null
  );
  const [pendingEffectiveSourceKeys, setPendingEffectiveSourceKeys] = useState<
    string[]
  >([]);
  const [resolvingEffectiveSourceKeys, setResolvingEffectiveSourceKeys] =
    useState<string[]>([]);
  const [flashingEffectiveSourceKeys, setFlashingEffectiveSourceKeys] =
    useState<string[]>([]);
  const lastTypedInputsFingerprintRef = useRef<string | null>(null);
  const pendingEffectiveSourceKeysRef = useRef<string[]>([]);
  const effectiveFlashTimeoutRef = useRef<number | null>(null);
  const createSqlAbortControllerRef = useRef<AbortController | null>(null);
  const targetNameResolveAbortControllerRef = useRef<AbortController | null>(
    null
  );
  const forceFlashAllEffectiveColumnsRef = useRef(false);
  const resolveDebounceTimersRef = useRef(new Map<string, number>());
  const resolveFlashTimersRef = useRef(new Map<string, number>());
  const resolveRequestTokensRef = useRef(new Map<string, number>());
  const latestGlobalResolveTokenRef = useRef(0);
  const requestedMappingRef = useRef<ColumnMappingItem[]>([]);
  const committedTargetNamesRef = useRef(new Map<string, string>());
  const initialTargetNamesRef = useRef(new Map<string, string>());
  const columnResolveStatesRef = useRef<Record<string, ColumnResolveState>>({});

  useEffect(() => () => createSqlAbortControllerRef.current?.abort(), []);
  useEffect(
    () => () => targetNameResolveAbortControllerRef.current?.abort(),
    []
  );

  const inputConnectionMetadata = useMemo(
    () => getConnectedInputMetadata('connection') as DBMetadata | null,
    [getConnectedInputMetadata]
  );
  const inputDataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );
  const literalTableName = useMemo(() => {
    return getLiteralStringValue(localInputData?.table_name);
  }, [localInputData?.table_name]);
  const literalDatabaseName = useMemo(() => {
    return getLiteralStringValue(localInputData?.database_name);
  }, [localInputData?.database_name]);
  const literalSchemaName = useMemo(() => {
    return getLiteralStringValue(localInputData?.schema_name);
  }, [localInputData?.schema_name]);

  const isTableNew = sharedState?.isTableNew ?? false;
  const lazySelectedTable = useDbCatalogTable(
    inputConnectionMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    { enabled: !isTableNew }
  );
  const isClickHouse = useMemo(() => {
    return isClickHouseConnection(inputConnectionMetadata);
  }, [inputConnectionMetadata]);
  const selectedCreationMode = useMemo(() => {
    return resolveCreationMode(sharedState, localInputData);
  }, [localInputData, sharedState]);
  const requestedMapping = useMemo(() => {
    return buildRequestedColumnMappingDraft({
      dataframeMetadata: inputDataframeMetadata,
      existingMapping: localInputData?.column_mapping,
      existingDraft: sharedState?.requestedColumnMappingDraft,
    });
  }, [
    inputDataframeMetadata,
    localInputData?.column_mapping,
    sharedState?.requestedColumnMappingDraft,
  ]);
  const hasEmptyTargetName = requestedMapping.some(
    item => !item.target_name.trim()
  );
  const syncingColumnCount = getSyncingColumnCount(
    sharedState?.columnResolveStates
  );

  for (const item of requestedMapping) {
    const sourceKey = normalizeName(item.source_name);
    if (sourceKey && !initialTargetNamesRef.current.has(sourceKey)) {
      initialTargetNamesRef.current.set(sourceKey, item.target_name);
    }
  }

  useEffect(() => {
    requestedMappingRef.current = requestedMapping;
    for (const item of requestedMapping) {
      const sourceKey = normalizeName(item.source_name);
      if (!committedTargetNamesRef.current.has(sourceKey)) {
        committedTargetNamesRef.current.set(sourceKey, item.target_name);
      }
    }
  }, [requestedMapping]);

  useEffect(() => {
    columnResolveStatesRef.current = sharedState?.columnResolveStates ?? {};
  }, [sharedState?.columnResolveStates]);
  const baseMapping = useMemo(() => {
    return buildRequestedColumnMappingDraft({
      dataframeMetadata: inputDataframeMetadata,
      existingMapping: null,
    });
  }, [inputDataframeMetadata]);
  const baseMappingBySource = useMemo(() => {
    return new Map(
      baseMapping.map(item => [normalizeName(item.source_name), item] as const)
    );
  }, [baseMapping]);
  const sourceDtypeBySource = useMemo(() => {
    return new Map(
      baseMapping.map(
        item => [normalizeName(item.source_name), item.dtype] as const
      )
    );
  }, [baseMapping]);
  const resolvedMappingRows = useMemo(() => {
    return normalizeResolvedColumnRows({
      dataframeMetadata: inputDataframeMetadata,
      requestedMapping,
      response: {
        columns: sharedState?.resolvedColumnRows ?? undefined,
        diagnostics: sharedState?.resolvedDiagnostics ?? undefined,
      },
    });
  }, [
    inputDataframeMetadata,
    requestedMapping,
    sharedState?.resolvedColumnRows,
    sharedState?.resolvedDiagnostics,
  ]);
  const selectedTable = useMemo(() => {
    const embedded = findWriteTargetTable(
      inputConnectionMetadata,
      localInputData
    );
    if (embedded || !lazySelectedTable.item) {
      return embedded;
    }
    return {
      name: lazySelectedTable.item.name,
      type: lazySelectedTable.item.kind === 'view' ? 'VIEW' : 'BASE_TABLE',
      database_name: lazySelectedTable.item.databaseName,
      schema_name: lazySelectedTable.item.schemaName,
      columns: lazySelectedTable.item.columns.map(column => ({
        name: column.name,
        comment: column.comment ?? null,
        dtype: column.dtype as DataType,
        nullable: column.nullable,
        index: column.indexed,
        primary_key: column.primaryKey,
        indexes: column.indexes,
      })),
    } as DbTable;
  }, [inputConnectionMetadata, lazySelectedTable.item, localInputData]);
  const existingTableColumnDiff = useMemo<ExistingTableColumnDiffRow[]>(() => {
    if (isTableNew) {
      return [];
    }

    return buildExistingTableColumnDiff({
      dataframeMetadata: inputDataframeMetadata,
      requestedMapping,
      resolvedColumnRows: sharedState?.resolvedColumnRows,
      resolvedDiagnostics: sharedState?.resolvedDiagnostics,
    });
  }, [
    inputDataframeMetadata,
    isTableNew,
    requestedMapping,
    sharedState?.resolvedColumnRows,
    sharedState?.resolvedDiagnostics,
  ]);
  const resolvedTargetBySource = useMemo(() => {
    return buildResolvedTargetBySource(resolvedMappingRows);
  }, [resolvedMappingRows]);
  const serializedEffectiveMapping = useMemo(() => {
    return serializeColumnMapping(
      requestedMapping.map(item => ({
        ...item,
        target_name:
          resolvedTargetBySource.get(normalizeName(item.source_name)) ??
          item.target_name,
      }))
    );
  }, [requestedMapping, resolvedTargetBySource]);
  const targetColumnNames = useMemo(() => {
    const resolvedNames = getResolvedTargetColumnNames(resolvedMappingRows);
    return resolvedNames.length > 0
      ? resolvedNames
      : requestedMapping.map(item => item.target_name);
  }, [requestedMapping, resolvedMappingRows]);
  const normalizedTypedSpec = useMemo(() => {
    return normalizeTableCreateSpecColumns(
      localInputData?.table_create_spec ?? null,
      targetColumnNames
    );
  }, [localInputData?.table_create_spec, targetColumnNames]);
  const normalizedTypedSpecForDialect = useMemo(() => {
    return normalizeTableCreateSpecForDialect({
      connectionMetadata: inputConnectionMetadata,
      value: normalizedTypedSpec,
      allowedColumnNames: targetColumnNames,
    });
  }, [inputConnectionMetadata, normalizedTypedSpec, targetColumnNames]);
  const schemaRolesByTarget = useMemo(() => {
    return buildSchemaRolesByTarget(normalizedTypedSpecForDialect);
  }, [normalizedTypedSpecForDialect]);
  const searchableMapping = useMemo(() => {
    return resolvedMappingRows.map(item => {
      const sourceDtype =
        sourceDtypeBySource.get(normalizeName(item.source_name)) ?? item.dtype;
      const effectiveTargetName = getResolvedTargetName(item);
      const schemaRoleTokens = (
        schemaRolesByTarget.get(normalizeName(effectiveTargetName)) ??
        EMPTY_SCHEMA_ROLES
      )
        .map(role => role.label.toLowerCase())
        .join(' ');

      return {
        item,
        searchText: [
          item.source_name,
          item.requested_target_name,
          effectiveTargetName,
          item.db_name,
          item.status,
          item.dtype,
          String(sourceDtype),
          schemaRoleTokens,
        ]
          .join(' ')
          .toLowerCase(),
      };
    });
  }, [resolvedMappingRows, schemaRolesByTarget, sourceDtypeBySource]);
  const filteredMapping = useMemo(() => {
    const query = deferredMappingSearch.trim().toLowerCase();
    if (!query) {
      return resolvedMappingRows;
    }

    return searchableMapping
      .filter(({ searchText }) => searchText.includes(query))
      .map(({ item }) => item);
  }, [deferredMappingSearch, resolvedMappingRows, searchableMapping]);
  const mappingChangeStateBySource = useMemo(() => {
    return new Map(
      requestedMapping.map(item => {
        const baseItem = baseMappingBySource.get(
          normalizeName(item.source_name)
        );
        const state = {
          targetNameChanged: Boolean(
            baseItem && item.target_name !== baseItem.target_name
          ),
          dtypeChanged: Boolean(baseItem && item.dtype !== baseItem.dtype),
          nullableChanged: Boolean(
            baseItem && Boolean(item.nullable) !== Boolean(baseItem.nullable)
          ),
        };
        return [normalizeName(item.source_name), state] as const;
      })
    );
  }, [baseMappingBySource, requestedMapping]);
  const selectedTargetLabel = useMemo(() => {
    return (
      buildSelectedWriteTargetLabel(localInputData) ||
      literalTableName ||
      'Target table'
    );
  }, [literalTableName, localInputData]);
  const selectedTargetParts = [
    getLiteralStringValue(localInputData?.database_name),
    getLiteralStringValue(localInputData?.schema_name),
    literalTableName,
  ].filter((part): part is string => Boolean(part));

  const typedSpecErrors = useMemo(() => {
    if (!isTableNew || selectedCreationMode !== 'typed') {
      return [] as string[];
    }

    return getTypedSpecValidationErrors({
      connectionMetadata: inputConnectionMetadata,
      mapping: serializedEffectiveMapping ?? requestedMapping,
      tableCreateSpec: localInputData?.table_create_spec ?? null,
      upsertKeyColumn: localInputData?.upsert_config?.key_column ?? null,
      requireUpsertKey:
        (localInputData?.write_mode ?? '').toLowerCase() === 'upsert',
      requireClickHouseCoreFields: false,
    });
  }, [
    inputConnectionMetadata,
    isTableNew,
    localInputData?.table_create_spec,
    localInputData?.upsert_config?.key_column,
    localInputData?.write_mode,
    requestedMapping,
    selectedCreationMode,
    serializedEffectiveMapping,
  ]);
  const mappingErrors = useMemo(() => {
    return getColumnMappingValidationErrors(requestedMapping);
  }, [requestedMapping]);
  const resolutionErrors = useMemo(() => {
    if (!isTableNew || selectedCreationMode !== 'typed') {
      return [] as string[];
    }

    return getColumnResolutionValidationErrors({
      rows: resolvedMappingRows,
      diagnostics: sharedState?.resolvedDiagnostics,
    });
  }, [
    isTableNew,
    resolvedMappingRows,
    selectedCreationMode,
    sharedState?.resolvedDiagnostics,
  ]);
  const typedPreviewSql = sharedState?.typedPreviewSql ?? '';
  const sqlErrorMessage = (sharedState?.createSqlError ?? '').trim();

  const canFetchRawPreviewSql = Boolean(
    selectedCreationMode === 'raw' &&
    isTableNew &&
    literalTableName &&
    inputConnectionMetadata &&
    inputDataframeMetadata
  );
  const resolveWriteColumnsRequest = useMemo(() => {
    if (hasEmptyTargetName) {
      return null;
    }

    return buildResolveWriteColumnsRequest({
      connectionMetadata: inputConnectionMetadata,
      dataframeMetadata: inputDataframeMetadata,
      inputValues: localInputData,
      isTableNew,
      creationMode: selectedCreationMode,
      requestedMapping,
    });
  }, [
    hasEmptyTargetName,
    inputConnectionMetadata,
    inputDataframeMetadata,
    isTableNew,
    localInputData,
    requestedMapping,
    selectedCreationMode,
  ]);
  const resolveWriteColumnsKey = useMemo(() => {
    return buildResolveWriteColumnsTriggerKey(resolveWriteColumnsRequest);
  }, [resolveWriteColumnsRequest]);

  useEffect(() => {
    pendingEffectiveSourceKeysRef.current = pendingEffectiveSourceKeys;
  }, [pendingEffectiveSourceKeys]);

  useEffect(() => {
    return () => {
      if (effectiveFlashTimeoutRef.current !== null) {
        window.clearTimeout(effectiveFlashTimeoutRef.current);
      }
      for (const timer of resolveDebounceTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      for (const timer of resolveFlashTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      inputConnectionMetadata,
      inputDataframeMetadata,
      isTableNew,
      selectedCreationMode: resolveCreationMode(prev, localInputData),
    }));
  }, [
    inputConnectionMetadata,
    inputDataframeMetadata,
    isTableNew,
    localInputData,
    setSharedState,
  ]);

  useEffect(() => {
    if (isOpen && isTableNew && selectedCreationMode === 'typed') {
      return;
    }

    if (effectiveFlashTimeoutRef.current !== null) {
      window.clearTimeout(effectiveFlashTimeoutRef.current);
      effectiveFlashTimeoutRef.current = null;
    }
    setPendingEffectiveSourceKeys([]);
    setResolvingEffectiveSourceKeys([]);
    setFlashingEffectiveSourceKeys([]);
    forceFlashAllEffectiveColumnsRef.current = false;
  }, [isOpen, isTableNew, selectedCreationMode]);

  useEffect(() => {
    if (
      !isOpen ||
      !resolveWriteColumnsRequest ||
      !resolveWriteColumnsKey ||
      syncingColumnCount > 0 ||
      (isTableNew && selectedCreationMode !== 'typed')
    ) {
      return;
    }

    if (
      sharedState?.lastResolveColumnsKey === resolveWriteColumnsKey &&
      (sharedState?.resolvedColumnRows || sharedState?.resolveColumnsError)
    ) {
      // Ключ уже обработан (успех или ошибка) — не запускаем авто-повтор,
      // повторная попытка инициируется вручную через кнопку retry.
      if (pendingEffectiveSourceKeysRef.current.length > 0) {
        setPendingEffectiveSourceKeys([]);
        setResolvingEffectiveSourceKeys([]);
      }
      return;
    }

    let cancelled = false;
    let abortController: AbortController | null = null;
    const previousResolvedTargetBySource = new Map(resolvedTargetBySource);
    const timeout = window.setTimeout(() => {
      abortController = new AbortController();
      const nextResolvingSourceKeys = pendingEffectiveSourceKeysRef.current;
      setPendingEffectiveSourceKeys([]);
      setResolvingEffectiveSourceKeys(nextResolvingSourceKeys);
      setSharedState(prev => ({
        ...(prev ?? {}),
        isResolvingColumns: true,
        resolveColumnsError: null,
      }));

      void client.utils.ddl.resolveWriteColumns
        .post(
          {
            body: resolveWriteColumnsRequest,
          },
          { silent: true, signal: abortController.signal }
        )
        .then(response => {
          if (cancelled) {
            return;
          }

          const nextResolvedRows = normalizeResolvedColumnRows({
            dataframeMetadata: inputDataframeMetadata,
            requestedMapping,
            response: {
              columns: response.data.columns ?? undefined,
              diagnostics: response.data.diagnostics ?? undefined,
            },
          });
          const nextResolvedTargetBySource =
            buildResolvedTargetBySource(nextResolvedRows);
          const nextFlashingSourceKeys =
            forceFlashAllEffectiveColumnsRef.current
              ? nextResolvingSourceKeys
              : nextResolvingSourceKeys.filter(
                  sourceKey =>
                    previousResolvedTargetBySource.get(sourceKey) !==
                    nextResolvedTargetBySource.get(sourceKey)
                );
          forceFlashAllEffectiveColumnsRef.current = false;

          const effectiveMapping = serializeColumnMapping(
            (response.data.effective_column_mapping ?? []).map(item => ({
              source_name: item.source_name,
              target_name: item.target_name,
              dtype: (item.dtype ?? 'UNKNOWN') as DataType | string,
              nullable: item.nullable ?? null,
            }))
          );

          setSharedState(prev => ({
            ...(prev ?? {}),
            isRecreatingTable: false,
            isResolvingColumns: false,
            resolveColumnsError: null,
            lastResolveColumnsKey: resolveWriteColumnsKey,
            resolvedColumnRows: response.data.columns ?? [],
            columnCommentsSupported:
              response.data.column_comments_supported ?? false,
            resolvedDiagnostics: response.data.diagnostics ?? [],
            selectedColumnActions: prev?.suppressDefaultColumnActions
              ? []
              : getDefaultSelectedColumnActions(response.data.columns),
          }));
          setResolvingEffectiveSourceKeys([]);

          if (effectiveFlashTimeoutRef.current !== null) {
            window.clearTimeout(effectiveFlashTimeoutRef.current);
            effectiveFlashTimeoutRef.current = null;
          }
          setFlashingEffectiveSourceKeys(nextFlashingSourceKeys);
          if (nextFlashingSourceKeys.length > 0) {
            effectiveFlashTimeoutRef.current = window.setTimeout(() => {
              setFlashingEffectiveSourceKeys(current =>
                current.filter(
                  sourceKey => !nextFlashingSourceKeys.includes(sourceKey)
                )
              );
              effectiveFlashTimeoutRef.current = null;
            }, EFFECTIVE_NAME_FLASH_DURATION_MS);
          }

          setLocalInputData(prev => {
            const currentFingerprint = getMappingFingerprint(
              prev?.column_mapping
            );
            const nextFingerprint = getMappingFingerprint(effectiveMapping);

            if (currentFingerprint === nextFingerprint) {
              return prev;
            }

            return {
              ...(prev ?? {}),
              column_mapping: effectiveMapping,
            };
          });
        })
        .catch(error => {
          if (cancelled) {
            return;
          }

          forceFlashAllEffectiveColumnsRef.current = false;
          setResolvingEffectiveSourceKeys([]);
          setSharedState(prev => ({
            ...(prev ?? {}),
            isRecreatingTable: false,
            isResolvingColumns: false,
            resolveColumnsError: extractApiErrorMessage(
              error,
              'Не удалось разрешить имена колонок через backend.'
            ),
            lastResolveColumnsKey: resolveWriteColumnsKey,
          }));
        });
    }, 250);

    return () => {
      cancelled = true;
      abortController?.abort();
      window.clearTimeout(timeout);
    };
  }, [
    isOpen,
    isTableNew,
    inputDataframeMetadata,
    requestedMapping,
    resolvedTargetBySource,
    resolveWriteColumnsKey,
    resolveWriteColumnsRequest,
    selectedCreationMode,
    syncingColumnCount,
    setLocalInputData,
    setSharedState,
    sharedState?.lastResolveColumnsKey,
    sharedState?.resolvedColumnRows,
    sharedState?.resolveColumnsError,
  ]);

  useEffect(() => {
    if (!isOpen || !isTableNew || selectedCreationMode !== 'typed') {
      return;
    }

    const currentFingerprint = buildColumnMappingNameKey(
      sharedState?.requestedColumnMappingDraft ?? null
    );
    const nextFingerprint = buildColumnMappingNameKey(requestedMapping);

    if (currentFingerprint === nextFingerprint) {
      return;
    }

    setSharedState(prev => ({
      ...(prev ?? {}),
      requestedColumnMappingDraft: serializeColumnMapping(requestedMapping),
    }));
  }, [
    isOpen,
    isTableNew,
    requestedMapping,
    selectedCreationMode,
    setSharedState,
    sharedState?.requestedColumnMappingDraft,
  ]);

  useEffect(() => {
    if (!isOpen || !isTableNew || selectedCreationMode !== 'typed') {
      return;
    }

    setLocalInputData(prev => {
      const nextSpec = normalizeTableCreateSpecColumns(
        prev?.table_create_spec ?? null,
        targetColumnNames
      );
      const nextUpsert =
        prev?.upsert_config?.key_column &&
        !targetColumnNames.some(
          columnName =>
            normalizeName(columnName) ===
            normalizeName(prev.upsert_config?.key_column)
        )
          ? null
          : (prev?.upsert_config ?? null);

      if (
        JSON.stringify(prev?.table_create_spec ?? null) ===
          JSON.stringify(nextSpec) &&
        JSON.stringify(prev?.upsert_config ?? null) ===
          JSON.stringify(nextUpsert)
      ) {
        return prev;
      }

      return {
        ...(prev ?? {}),
        table_create_spec: nextSpec,
        upsert_config: nextUpsert,
      };
    });
  }, [
    isOpen,
    isTableNew,
    selectedCreationMode,
    setLocalInputData,
    targetColumnNames,
  ]);

  useEffect(() => {
    if (!isOpen || !isTableNew || selectedCreationMode !== 'typed') {
      lastTypedInputsFingerprintRef.current = null;
      return;
    }

    const nextFingerprint = JSON.stringify({
      table: literalTableName,
      database: literalDatabaseName,
      schema: literalSchemaName,
      mapping: serializedEffectiveMapping,
      spec: normalizedTypedSpecForDialect,
      comments: sharedState?.typedCommentOverrides,
      sourceComments: inputDataframeMetadata?.columns.map(
        column => column.comment
      ),
    });

    if (lastTypedInputsFingerprintRef.current === nextFingerprint) {
      return;
    }

    lastTypedInputsFingerprintRef.current = nextFingerprint;
    setSharedState(prev => ({
      ...(prev ?? {}),
      typedPreviewSql: null,
      lastCreateSqlKey: null,
      createSqlError: null,
    }));
  }, [
    isOpen,
    isTableNew,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    normalizedTypedSpecForDialect,
    selectedCreationMode,
    serializedEffectiveMapping,
    setSharedState,
    sharedState?.typedCommentOverrides,
    sharedState?.columnCommentsSupported,
    inputDataframeMetadata,
  ]);

  const handleCreationModeChange = useCallback(
    (mode: CreationMode) => {
      setSharedState(prev => ({
        ...(prev ?? {}),
        selectedCreationMode: mode,
        ...(mode === 'typed' && prev?.selectedCreationMode !== 'typed'
          ? {
              typedPreviewSql: null,
              lastCreateSqlKey: null,
              createSqlError: null,
            }
          : {}),
      }));
    },
    [setSharedState]
  );

  const patchMapping = useCallback(
    (
      sourceName: string,
      updater: (current: ColumnMappingItem) => ColumnMappingItem,
      invalidateResolution: boolean
    ) => {
      const nextMapping = requestedMapping.map(item => {
        if (normalizeName(item.source_name) !== normalizeName(sourceName)) {
          return item;
        }

        return updater(item);
      });
      const changedTargetNameSourceKeys = invalidateResolution
        ? normalizeSourceKeys(
            getChangedTargetNameSourceNames(requestedMapping, nextMapping)
          )
        : [];

      if (changedTargetNameSourceKeys.length > 0) {
        setPendingEffectiveSourceKeys(current =>
          normalizeSourceKeys([...current, ...changedTargetNameSourceKeys])
        );
        setFlashingEffectiveSourceKeys(current =>
          current.filter(
            sourceKey => !changedTargetNameSourceKeys.includes(sourceKey)
          )
        );
      }

      if (!invalidateResolution) {
        const effectiveMapping = serializeColumnMapping(
          nextMapping.map(item => ({
            ...item,
            target_name:
              resolvedTargetBySource.get(normalizeName(item.source_name)) ??
              item.target_name,
          }))
        );

        setLocalInputData(prev => ({
          ...(prev ?? {}),
          column_mapping: effectiveMapping,
        }));
      }

      setSharedState(prev => {
        return {
          ...(prev ?? {}),
          requestedColumnMappingDraft: serializeColumnMapping(nextMapping),
          ...(invalidateResolution ? { lastResolveColumnsKey: null } : {}),
        };
      });
    },
    [
      requestedMapping,
      resolvedTargetBySource,
      setLocalInputData,
      setSharedState,
    ]
  );

  const handleRefreshResolvedColumns = useCallback(() => {
    if (hasEmptyTargetName) {
      return;
    }

    const nextSourceKeys = normalizeSourceKeys(
      requestedMapping.map(item => item.source_name)
    );

    if (nextSourceKeys.length === 0) {
      return;
    }

    forceFlashAllEffectiveColumnsRef.current = true;
    setPendingEffectiveSourceKeys(nextSourceKeys);
    setFlashingEffectiveSourceKeys([]);
    setSharedState(prev => ({
      ...(prev ?? {}),
      lastResolveColumnsKey: null,
      resolveColumnsError: null,
    }));
  }, [hasEmptyTargetName, requestedMapping, setSharedState]);

  const setMappingValue = useCallback(
    (nextMapping: ColumnMappingItem[], invalidateResolution: boolean) => {
      const changedTargetNameSourceKeys = invalidateResolution
        ? normalizeSourceKeys(
            getChangedTargetNameSourceNames(requestedMapping, nextMapping)
          )
        : [];

      if (changedTargetNameSourceKeys.length > 0) {
        setPendingEffectiveSourceKeys(current =>
          normalizeSourceKeys([...current, ...changedTargetNameSourceKeys])
        );
        setFlashingEffectiveSourceKeys(current =>
          current.filter(
            sourceKey => !changedTargetNameSourceKeys.includes(sourceKey)
          )
        );
      }

      if (!invalidateResolution) {
        const effectiveMapping = serializeColumnMapping(
          nextMapping.map(item => ({
            ...item,
            target_name:
              resolvedTargetBySource.get(normalizeName(item.source_name)) ??
              item.target_name,
          }))
        );

        setLocalInputData(prev => ({
          ...(prev ?? {}),
          column_mapping: effectiveMapping,
        }));
      }

      setSharedState(prev => ({
        ...(prev ?? {}),
        requestedColumnMappingDraft: serializeColumnMapping(nextMapping),
        ...(invalidateResolution ? { lastResolveColumnsKey: null } : {}),
      }));
    },
    [
      requestedMapping,
      resolvedTargetBySource,
      setLocalInputData,
      setSharedState,
    ]
  );

  const updateResolveState = useCallback(
    (sourceName: string, state: ColumnResolveState) => {
      const sourceKey = normalizeName(sourceName);
      const nextStates = {
        ...columnResolveStatesRef.current,
        [sourceKey]: state,
      };
      columnResolveStatesRef.current = nextStates;
      setSharedState(prev => ({
        ...(prev ?? {}),
        columnResolveStates: {
          ...(prev?.columnResolveStates ?? {}),
          [sourceKey]: state,
        },
      }));
    },
    [setSharedState]
  );

  const abortPendingTargetNameResolve = useCallback(() => {
    targetNameResolveAbortControllerRef.current?.abort();
    targetNameResolveAbortControllerRef.current = null;
    latestGlobalResolveTokenRef.current += 1;

    let changed = false;
    const nextStates = { ...columnResolveStatesRef.current };
    for (const [sourceKey, state] of Object.entries(nextStates)) {
      if (state === 'loading') {
        nextStates[sourceKey] = 'idle';
        changed = true;
      }
    }
    if (!changed) {
      return;
    }

    columnResolveStatesRef.current = nextStates;
    setSharedState(prev => ({
      ...(prev ?? {}),
      isResolvingColumns: false,
      columnResolveStates: nextStates,
    }));
  }, [setSharedState]);

  const updateTargetNameDraft = useCallback(
    (sourceName: string, value: string) => {
      const sourceKey = normalizeName(sourceName);
      const nextMapping = requestedMappingRef.current.map(item =>
        normalizeName(item.source_name) === sourceKey
          ? { ...item, target_name: value }
          : item
      );
      requestedMappingRef.current = nextMapping;
      setSharedState(prev => ({
        ...(prev ?? {}),
        requestedColumnMappingDraft: serializeColumnMapping(nextMapping),
      }));
      return nextMapping;
    },
    [setSharedState]
  );

  const scheduleResolveFlashReset = useCallback(
    (sourceKeys: string[]) => {
      for (const sourceKey of sourceKeys) {
        const previousTimer = resolveFlashTimersRef.current.get(sourceKey);
        if (previousTimer !== undefined) {
          window.clearTimeout(previousTimer);
        }
        const timer = window.setTimeout(() => {
          resolveFlashTimersRef.current.delete(sourceKey);
          setSharedState(prev => {
            if (prev?.columnResolveStates?.[sourceKey] !== 'flash') {
              return prev;
            }
            const nextStates = {
              ...prev.columnResolveStates,
              [sourceKey]: 'idle' as const,
            };
            columnResolveStatesRef.current = nextStates;
            return { ...prev, columnResolveStates: nextStates };
          });
        }, COLUMN_RESOLVE_FLASH_MS);
        resolveFlashTimersRef.current.set(sourceKey, timer);
      }
    },
    [setSharedState]
  );

  const doResolveTargetName = useCallback(
    async (sourceName: string, value: string) => {
      const sourceKey = normalizeName(sourceName);
      const debounceTimer = resolveDebounceTimersRef.current.get(sourceKey);
      if (debounceTimer !== undefined) {
        window.clearTimeout(debounceTimer);
        resolveDebounceTimersRef.current.delete(sourceKey);
      }

      const trimmedValue = value.trim();
      const nextMapping = updateTargetNameDraft(sourceName, trimmedValue);
      if (!trimmedValue) {
        updateResolveState(sourceName, 'dirty');
        return;
      }

      const request = buildResolveWriteColumnsRequest({
        connectionMetadata: inputConnectionMetadata,
        dataframeMetadata: inputDataframeMetadata,
        inputValues: localInputData,
        isTableNew,
        creationMode: selectedCreationMode,
        requestedMapping: nextMapping,
      });
      if (!request) {
        updateResolveState(sourceName, 'dirty');
        return;
      }

      abortPendingTargetNameResolve();
      const abortController = new AbortController();
      targetNameResolveAbortControllerRef.current = abortController;
      const requestToken =
        (resolveRequestTokensRef.current.get(sourceKey) ?? 0) + 1;
      resolveRequestTokensRef.current.set(sourceKey, requestToken);
      const globalToken = latestGlobalResolveTokenRef.current + 1;
      latestGlobalResolveTokenRef.current = globalToken;
      updateResolveState(sourceName, 'loading');

      try {
        const response = await client.utils.ddl.resolveWriteColumns.post(
          { body: request },
          { signal: abortController.signal, silent: true }
        );
        if (
          resolveRequestTokensRef.current.get(sourceKey) !== requestToken ||
          latestGlobalResolveTokenRef.current !== globalToken
        ) {
          return;
        }

        const effectiveMapping = serializeColumnMapping(
          (response.data.effective_column_mapping ?? []).map(item => ({
            source_name: item.source_name,
            target_name: item.target_name,
            dtype: (item.dtype ?? 'UNKNOWN') as DataType | string,
            nullable: item.nullable ?? null,
          }))
        );
        const loadingSourceKeys = Object.entries(columnResolveStatesRef.current)
          .filter(([, state]) => state === 'loading')
          .map(([key]) => key);
        const nextStates = {
          ...columnResolveStatesRef.current,
        };
        for (const key of loadingSourceKeys) {
          nextStates[key] = 'flash';
          const mappingItem = requestedMappingRef.current.find(
            item => normalizeName(item.source_name) === key
          );
          if (mappingItem) {
            committedTargetNamesRef.current.set(key, mappingItem.target_name);
          }
        }
        columnResolveStatesRef.current = nextStates;

        setSharedState(prev => ({
          ...(prev ?? {}),
          resolveColumnsError: null,
          lastResolveColumnsKey: buildResolveWriteColumnsTriggerKey(request),
          resolvedColumnRows: response.data.columns ?? [],
          columnCommentsSupported:
            response.data.column_comments_supported ?? false,
          resolvedDiagnostics: response.data.diagnostics ?? [],
          selectedColumnActions: prev?.suppressDefaultColumnActions
            ? []
            : getDefaultSelectedColumnActions(response.data.columns),
          columnResolveStates: nextStates,
        }));
        setLocalInputData(prev => ({
          ...(prev ?? {}),
          column_mapping: effectiveMapping,
        }));
        setResolvingEffectiveSourceKeys([]);
        setFlashingEffectiveSourceKeys(loadingSourceKeys);
        scheduleResolveFlashReset(loadingSourceKeys);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        if (
          resolveRequestTokensRef.current.get(sourceKey) !== requestToken ||
          latestGlobalResolveTokenRef.current !== globalToken
        ) {
          return;
        }

        const nextStates = { ...columnResolveStatesRef.current };
        for (const [key, state] of Object.entries(nextStates)) {
          if (state === 'loading') {
            nextStates[key] = 'idle';
          }
        }
        columnResolveStatesRef.current = nextStates;
        setSharedState(prev => ({
          ...(prev ?? {}),
          resolveColumnsError: extractApiErrorMessage(
            error,
            'Не удалось разрешить имена колонок через backend.'
          ),
          lastResolveColumnsKey: buildResolveWriteColumnsTriggerKey(request),
          columnResolveStates: nextStates,
        }));
      } finally {
        if (targetNameResolveAbortControllerRef.current === abortController) {
          targetNameResolveAbortControllerRef.current = null;
        }
      }
    },
    [
      abortPendingTargetNameResolve,
      inputConnectionMetadata,
      inputDataframeMetadata,
      isTableNew,
      localInputData,
      scheduleResolveFlashReset,
      selectedCreationMode,
      setLocalInputData,
      setSharedState,
      updateResolveState,
      updateTargetNameDraft,
    ]
  );

  const handleTargetNameEdit = useCallback(
    (sourceName: string, value: string) => {
      const sourceKey = normalizeName(sourceName);
      abortPendingTargetNameResolve();
      updateTargetNameDraft(sourceName, value);
      updateResolveState(sourceName, 'dirty');
      setSharedState(prev => ({
        ...(prev ?? {}),
        resolveColumnsError: null,
        isResolvingColumns: false,
      }));

      const previousTimer = resolveDebounceTimersRef.current.get(sourceKey);
      if (previousTimer !== undefined) {
        window.clearTimeout(previousTimer);
      }
      if (!value.trim()) {
        resolveDebounceTimersRef.current.delete(sourceKey);
        return;
      }
      const timer = window.setTimeout(() => {
        resolveDebounceTimersRef.current.delete(sourceKey);
        void doResolveTargetName(sourceName, value);
      }, COLUMN_RESOLVE_DEBOUNCE_MS);
      resolveDebounceTimersRef.current.set(sourceKey, timer);
    },
    [
      abortPendingTargetNameResolve,
      doResolveTargetName,
      setSharedState,
      updateResolveState,
      updateTargetNameDraft,
    ]
  );

  const handleTargetNameCommit = useCallback(
    (sourceName: string, value: string) => {
      if (
        columnResolveStatesRef.current[normalizeName(sourceName)] !== 'dirty'
      ) {
        return;
      }
      void doResolveTargetName(sourceName, value);
    },
    [doResolveTargetName]
  );

  const handleTargetNameCancel = useCallback(
    (sourceName: string) => {
      const sourceKey = normalizeName(sourceName);
      abortPendingTargetNameResolve();
      const debounceTimer = resolveDebounceTimersRef.current.get(sourceKey);
      if (debounceTimer !== undefined) {
        window.clearTimeout(debounceTimer);
        resolveDebounceTimersRef.current.delete(sourceKey);
      }
      resolveRequestTokensRef.current.set(
        sourceKey,
        (resolveRequestTokensRef.current.get(sourceKey) ?? 0) + 1
      );
      latestGlobalResolveTokenRef.current += 1;
      const committedValue =
        committedTargetNamesRef.current.get(sourceKey) ?? sourceName;
      updateTargetNameDraft(sourceName, committedValue);
      updateResolveState(sourceName, 'idle');
    },
    [abortPendingTargetNameResolve, updateResolveState, updateTargetNameDraft]
  );

  const handleTargetNameReset = useCallback(
    (sourceName: string) => {
      const initialValue = initialTargetNamesRef.current.get(
        normalizeName(sourceName)
      );
      if (initialValue === undefined) {
        return;
      }
      void doResolveTargetName(sourceName, initialValue);
    },
    [doResolveTargetName]
  );

  const handleRecreateTable = useCallback(async () => {
    if (sharedState?.isRecreatingTable || sharedState?.isResolvingColumns) {
      return;
    }

    const validationError = (() => {
      if (!inputConnectionMetadata) {
        return 'Отсутствует connection metadata для пересоздания таблицы.';
      }
      if (!selectedTable || !literalTableName) {
        return 'Не выбрана существующая target table.';
      }
      if (!inputDataframeMetadata) {
        return 'Отсутствуют metadata входного DataFrame.';
      }
      if (!resolveWriteColumnsRequest) {
        return 'Не удалось подготовить запрос проверки колонок.';
      }
      if (requestedMapping.length === 0) {
        return 'Для пересоздания таблицы нужна хотя бы одна колонка DataFrame.';
      }
      if (mappingErrors.length > 0) {
        return mappingErrors.join('\n');
      }
      return null;
    })();

    if (validationError) {
      setSharedState(prev => ({
        ...(prev ?? {}),
        recreateTableError: validationError,
      }));
      return;
    }

    const confirmed = await confirm({
      title: 'Пересоздать таблицу?',
      message: `Таблица "${selectedTargetLabel}" будет полностью пересоздана по текущему маппингу DataFrame. Все находящиеся в ней данные будут удалены. Продолжить?`,
      confirmLabel: 'Пересоздать',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
    });

    if (!confirmed) {
      return;
    }

    setSharedState(prev => ({
      ...(prev ?? {}),
      isRecreatingTable: true,
      recreateTableError: null,
      resolveColumnsError: null,
    }));

    try {
      await persistCatalogDescriptions(sharedState, setSharedState);
      const response = await client.utils.ddl.recreateTable.post(
        {
          body: {
            connection_id: requireDbConnectionId(inputConnectionMetadata),
            table_name: literalTableName!,
            database_name: literalDatabaseName,
            schema_name: literalSchemaName,
            columns: commentsForRecreatedColumns(
              buildDbColumnsFromColumnMapping({
                dataframeMetadata: inputDataframeMetadata!,
                mapping: requestedMapping,
                commentOverrides: sharedState?.typedCommentOverrides,
                commentsSupported: sharedState?.columnCommentsSupported,
              }),
              sharedState?.resolvedColumnRows ?? [],
              getEffectiveDbCommentOverrides(sharedState),
              sharedState?.columnCommentsSupported !== false
            ),
            table_create_spec: null,
          },
        },
        { silent: true }
      );

      sharedState?.invalidateCatalog?.();
      sharedState?.applyTableMetadataUpdate?.(response.data.table_metadata);

      const sourceKeys = normalizeSourceKeys(
        requestedMapping.map(item => item.source_name)
      );
      forceFlashAllEffectiveColumnsRef.current = true;
      setPendingEffectiveSourceKeys(sourceKeys);
      setFlashingEffectiveSourceKeys([]);
      setSharedState(prev => ({
        ...(prev ?? {}),
        recreateTableError: null,
        resolveColumnsError: null,
        dbCommentOverrides: {},
        dbNullableOverrides: {},
        suppressDefaultColumnActions: false,
        resolvedColumnRows: null,
        resolvedDiagnostics: null,
        selectedColumnActions: [],
        lastResolveColumnsKey: null,
      }));
    } catch (error: unknown) {
      sharedState?.invalidateCatalog?.();
      setSharedState(prev => ({
        ...(prev ?? {}),
        selectedColumnActions: [],
        suppressDefaultColumnActions: true,
        lastResolveColumnsKey: null,
        isRecreatingTable: false,
        recreateTableError: extractApiErrorMessage(
          error,
          'Не удалось пересоздать таблицу через backend.'
        ),
      }));
    }
  }, [
    confirm,
    inputConnectionMetadata,
    inputDataframeMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    mappingErrors,
    requestedMapping,
    resolveWriteColumnsRequest,
    selectedTable,
    selectedTargetLabel,
    setSharedState,
    sharedState,
  ]);

  const selectedColumnActions = useMemo(
    () => sharedState?.selectedColumnActions ?? [],
    [sharedState?.selectedColumnActions]
  );
  const selectedActionColumns = useMemo(
    () => new Set(selectedColumnActions.map(action => action.column_name)),
    [selectedColumnActions]
  );
  const selectedActionsByColumn = useMemo(
    () =>
      new Map(
        selectedColumnActions.map(action => [action.column_name, action])
      ),
    [selectedColumnActions]
  );

  const handleToggleColumnAction = useCallback(
    (action: TableColumnActionOutput) => {
      setSharedState(prev => {
        const current = prev?.selectedColumnActions ?? [];
        const exists = current.some(
          item => item.column_name === action.column_name
        );
        const next = exists
          ? current.filter(item => item.column_name !== action.column_name)
          : [
              ...current,
              {
                type: action.type,
                column_name: action.column_name,
                column: action.column ?? null,
                ...(action.comment !== undefined
                  ? { comment: action.comment }
                  : {}),
                ...(action.nullable !== undefined
                  ? { nullable: action.nullable }
                  : {}),
              } satisfies TableColumnActionInput,
            ];
        return {
          ...(prev ?? {}),
          selectedColumnActions: next,
        };
      });
    },
    [setSharedState]
  );

  const handleExistingColumnNullableChange = useCallback(
    (columnName: string, nullable: boolean, baseline: boolean | null) => {
      setSharedState(prev => {
        const overrides = { ...prev?.dbNullableOverrides };
        if (nullable === baseline) {
          delete overrides[columnName];
        } else {
          overrides[columnName] = nullable;
        }
        return {
          ...(prev ?? {}),
          dbNullableOverrides: overrides,
          selectedColumnActions: (prev?.selectedColumnActions ?? []).filter(
            action =>
              action.column_name !== columnName ||
              action.type !== 'set_column_nullable'
          ),
        };
      });
    },
    [setSharedState]
  );

  const handleColumnActionNullableChange = useCallback(
    (action: TableColumnActionOutput, nullable: boolean) => {
      setSharedState(prev => ({
        ...(prev ?? {}),
        selectedColumnActions: (prev?.selectedColumnActions ?? []).map(item =>
          item.column_name === action.column_name
            ? {
                ...item,
                column: {
                  ...(item.column ?? action.column!),
                  nullable,
                },
              }
            : item
        ),
      }));
    },
    [setSharedState]
  );

  useEffect(() => {
    if (isTableNew || sharedState?.isResolvingColumns) {
      return;
    }

    if (selectedColumnActions.length === 0) {
      return;
    }

    const availableActionColumns = new Set(
      existingTableColumnDiff
        .filter(row => row.suggestedAction)
        .map(row => row.suggestedAction!.column_name)
    );

    const prunedActions = selectedColumnActions.filter(action =>
      availableActionColumns.has(action.column_name)
    );

    if (prunedActions.length === selectedColumnActions.length) {
      return;
    }

    setSharedState(prev => ({
      ...(prev ?? {}),
      selectedColumnActions: prunedActions,
    }));
  }, [
    existingTableColumnDiff,
    isTableNew,
    selectedColumnActions,
    setSharedState,
    sharedState?.isResolvingColumns,
  ]);

  useEffect(() => {
    const confirmColumnActions = async (
      actions: TableColumnActionInput[]
    ): Promise<boolean> => {
      const lines = actions
        .map(action => {
          const previous =
            sharedState?.resolvedColumnRows?.find(
              row => row.db_name === action.column_name
            )?.db_comment ?? null;
          const next =
            action.type === 'set_column_comment'
              ? action.comment
              : action.column?.comment;
          if (action.type === 'set_column_nullable') {
            return `• ${getColumnActionLabel(action.type)}: ${action.column_name} → ${action.nullable ? 'NULL' : 'NOT NULL'}`;
          }
          return (
            `• ${getColumnActionLabel(action.type)}: ${action.column_name}` +
            (action.type !== 'drop_column' &&
            normalizeComment(next) !== normalizeComment(previous)
              ? `\n  ${previous == null ? 'нет комментария' : JSON.stringify(previous)} → ${next == null ? 'удалить' : JSON.stringify(next)}`
              : '')
          );
        })
        .join('\n');

      const onlyComments = actions.every(
        action => action.type === 'set_column_comment'
      );
      return confirm({
        maxWidth: 'sm',
        width: 480,
        title: onlyComments
          ? 'Применить комментарии?'
          : 'Применить изменения схемы?',
        message: `Будут применены изменения ${onlyComments ? 'комментариев' : 'структуры'} таблицы "${selectedTargetLabel}" в базе данных:\n${lines}\n\nЭто действие изменит таблицу. Продолжить?`,
        confirmLabel: 'Применить',
        cancelLabel: 'Отмена',
        confirmColor: actions.some(
          action =>
            action.type === 'drop_column' || action.type === 'recreate_column'
        )
          ? 'error'
          : 'primary',
      });
    };

    setSharedState(prev => ({
      ...(prev ?? {}),
      requestColumnActionsConfirm: confirmColumnActions,
    }));
  }, [
    confirm,
    selectedTargetLabel,
    setSharedState,
    sharedState?.resolvedColumnRows,
  ]);

  useEffect(() => {
    const connectionInput = connectedInputs?.['connection'];

    const applyTableMetadataUpdate = (tableMetadata: DbTable) => {
      if (!connectionInput || !inputConnectionMetadata) {
        return;
      }

      if (resolveDbCatalogMode(inputConnectionMetadata) === 'lazy') {
        dispatch(
          invalidateDbCatalog(requireDbConnectionId(inputConnectionMetadata))
        );
        return;
      }

      const nextMetadata = upsertDbMetadataTable(
        inputConnectionMetadata,
        tableMetadata,
        {
          // Матчим целевую таблицу так же, как её находит нода (findWriteTargetTable):
          // по значениям из inputData, а не по db/schema объекта из ответа.
          tableName: literalTableName,
          databaseName: literalDatabaseName,
          schemaName: literalSchemaName,
        }
      );

      dispatch(
        setOutputMetadata({
          nodeID: connectionInput.nodeID,
          outputName: connectionInput.outputName,
          // upsertDbMetadataTable сохраняет исходный type: 'DATABASE'.
          metadata: nextMetadata as Metadata,
        })
      );
    };

    setSharedState(prev => ({
      ...(prev ?? {}),
      applyTableMetadataUpdate,
    }));
  }, [
    connectedInputs,
    dispatch,
    inputConnectionMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    setSharedState,
  ]);

  const copySql = useCallback(async (sql: string, mode: 'raw' | 'typed') => {
    if (!sql.trim()) {
      return;
    }

    await navigator.clipboard.writeText(sql);
    setIsSqlCopied(mode);
    window.setTimeout(() => {
      setIsSqlCopied(current => (current === mode ? null : current));
    }, 1400);
  }, []);

  const fetchCreateTableSql = useCallback(
    async (mode: CreationMode, forceRefresh = false) => {
      if (
        !literalTableName ||
        !inputConnectionMetadata ||
        !inputDataframeMetadata
      ) {
        return;
      }

      const requestKey = buildCreateSqlCacheKey({
        connectionMetadata: inputConnectionMetadata,
        dataframeMetadata: inputDataframeMetadata,
        inputValues: {
          ...(localInputData ?? {}),
          column_mapping: mode === 'typed' ? serializedEffectiveMapping : null,
          table_create_spec:
            mode === 'typed' ? normalizedTypedSpecForDialect : null,
        },
        mode,
        commentOverrides: sharedState?.typedCommentOverrides,
        commentsSupported: sharedState?.columnCommentsSupported,
      });
      const hasExistingSql =
        mode === 'typed'
          ? Boolean(typedPreviewSql.trim())
          : Boolean(localInputData?.create_table_sql?.trim());

      if (
        !forceRefresh &&
        sharedState?.lastCreateSqlKey === requestKey &&
        hasExistingSql
      ) {
        return;
      }

      setSharedState(prev => ({
        ...(prev ?? {}),
        isCreateSqlLoading: true,
        createSqlError: null,
        createTableError: null,
        createTableSuccess: null,
      }));

      createSqlAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      createSqlAbortControllerRef.current = abortController;

      try {
        const response = await client.utils.ddl.generateTableDdl.post(
          {
            body: {
              connection_id: requireDbConnectionId(inputConnectionMetadata),
              table_name: literalTableName,
              database_name: literalDatabaseName,
              schema_name: literalSchemaName,
              columns: buildDbColumnsFromColumnMapping({
                dataframeMetadata: inputDataframeMetadata,
                commentOverrides: sharedState?.typedCommentOverrides,
                commentsSupported: sharedState?.columnCommentsSupported,
                mapping:
                  mode === 'typed'
                    ? serializedEffectiveMapping
                    : localInputData?.column_mapping,
              }),
              table_create_spec:
                mode === 'typed'
                  ? (normalizedTypedSpecForDialect as any)
                  : null,
            },
          },
          { silent: true, signal: abortController.signal }
        );

        if (createSqlAbortControllerRef.current !== abortController) {
          return;
        }

        if (mode === 'typed') {
          setSharedState(prev => ({
            ...(prev ?? {}),
            typedPreviewSql: response.data.sql,
          }));
        } else {
          setLocalInputData(prev => ({
            ...(prev ?? {}),
            create_table_sql: response.data.sql,
          }));
        }

        setSharedState(prev => ({
          ...(prev ?? {}),
          isCreateSqlLoading: false,
          createSqlError: null,
          lastCreateSqlKey: requestKey,
        }));
      } catch (error: unknown) {
        if (abortController.signal.aborted) {
          return;
        }
        setSharedState(prev => ({
          ...(prev ?? {}),
          isCreateSqlLoading: false,
          createSqlError:
            error instanceof Error && error.message.trim()
              ? error.message
              : 'Не удалось получить SQL для создания таблицы.',
          lastCreateSqlKey: requestKey,
        }));
      } finally {
        if (createSqlAbortControllerRef.current === abortController) {
          createSqlAbortControllerRef.current = null;
        }
      }
    },
    [
      inputConnectionMetadata,
      inputDataframeMetadata,
      literalDatabaseName,
      literalSchemaName,
      literalTableName,
      localInputData,
      normalizedTypedSpecForDialect,
      serializedEffectiveMapping,
      setLocalInputData,
      setSharedState,
      sharedState?.lastCreateSqlKey,
      sharedState?.typedCommentOverrides,
      sharedState?.columnCommentsSupported,
      typedPreviewSql,
    ]
  );

  useEffect(() => {
    if (
      !isOpen ||
      !isTableNew ||
      selectedCreationMode !== 'raw' ||
      !canFetchRawPreviewSql ||
      localInputData?.create_table_sql?.trim()
    ) {
      return;
    }

    void fetchCreateTableSql('raw', false);
  }, [
    canFetchRawPreviewSql,
    fetchCreateTableSql,
    isOpen,
    isTableNew,
    localInputData?.create_table_sql,
    selectedCreationMode,
  ]);

  const typedCommentOverrides = sharedState?.typedCommentOverrides;
  const commentsDisabledReason = sharedState?.columnCommentsSupported
    ? null
    : COMMENTS_UNSUPPORTED_REASON;

  // Комментарий колонки в DF: описание из каталога или из metadata входа.
  const sourceCommentBySource = useMemo(() => {
    return new Map(
      requestedMapping.map(item => {
        const metadataComment =
          inputDataframeMetadata?.columns.find(
            column => column.name === item.source_name
          )?.comment ?? null;
        return [
          item.source_name,
          resolveCommentBaseline(
            item.source_name,
            catalogDescriptions,
            metadataComment
          ),
        ] as const;
      })
    );
  }, [catalogDescriptions, inputDataframeMetadata, requestedMapping]);

  const getTypedComment = useCallback(
    (sourceName: string) => {
      const baseline = sourceCommentBySource.get(sourceName) ?? null;
      const value = commentValue(typedCommentOverrides, sourceName, baseline);
      return {
        value,
        baseline,
        changed: normalizeComment(value) !== normalizeComment(baseline),
      };
    },
    [sourceCommentBySource, typedCommentOverrides]
  );

  const setTypedCommentOverrides = useCallback(
    (
      updater: (
        current: Record<string, string | null>
      ) => Record<string, string | null>
    ) => {
      setSharedState(prev => ({
        ...(prev ?? {}),
        typedCommentOverrides: updater({ ...prev?.typedCommentOverrides }),
        lastCreateSqlKey: null,
        lastCreateTableKey: null,
        typedPreviewSql: null,
      }));
    },
    [setSharedState]
  );

  type BulkAction =
    | 'all_null'
    | 'all_not_null'
    | 'snake_case'
    | 'lowercase'
    | 'reset_renames'
    | 'comments_from_source'
    | 'clear_comments'
    | 'reset_all';

  // Массовые действия меняют только текущее состояние шага; имена в БД
  // затем пересчитываются обычным запросом разрешения колонок.
  const applyBulkAction = useCallback(
    (action: BulkAction) => {
      setBulkAnchorEl(null);

      switch (action) {
        case 'all_null':
        case 'all_not_null':
          setMappingValue(
            requestedMapping.map(item => ({
              ...item,
              nullable: action === 'all_null',
            })),
            false
          );
          return;
        case 'reset_renames':
          setMappingValue(
            requestedMapping.map(item => {
              const baseItem = baseMappingBySource.get(
                normalizeName(item.source_name)
              );
              return {
                ...item,
                target_name: baseItem?.target_name ?? item.target_name,
              };
            }),
            true
          );
          return;
        case 'snake_case':
        case 'lowercase':
          setMappingValue(
            requestedMapping.map(item => ({
              ...item,
              target_name:
                action === 'snake_case'
                  ? toSnakeCase(item.target_name)
                  : item.target_name.toLowerCase(),
            })),
            true
          );
          return;
        case 'comments_from_source':
          setTypedCommentOverrides(current => {
            for (const item of requestedMapping) {
              if (sourceCommentBySource.get(item.source_name)) {
                delete current[item.source_name];
              }
            }
            return current;
          });
          return;
        case 'clear_comments':
          setTypedCommentOverrides(current => {
            for (const item of requestedMapping) {
              current[item.source_name] = null;
            }
            return current;
          });
          return;
        case 'reset_all':
          setMappingValue(baseMapping, true);
          setTypedCommentOverrides(() => ({}));
          return;
      }
    },
    [
      baseMapping,
      baseMappingBySource,
      requestedMapping,
      setMappingValue,
      setTypedCommentOverrides,
      sourceCommentBySource,
    ]
  );

  const bulkAvailability = useMemo(() => {
    const comments = requestedMapping.map(item =>
      getTypedComment(item.source_name)
    );
    const hasMappingChanges = Array.from(
      mappingChangeStateBySource.values()
    ).some(
      state =>
        state.targetNameChanged || state.dtypeChanged || state.nullableChanged
    );
    return {
      allNull: requestedMapping.some(item => !item.nullable),
      allNotNull: requestedMapping.some(item => Boolean(item.nullable)),
      snakeCase: requestedMapping.some(
        item => toSnakeCase(item.target_name) !== item.target_name
      ),
      lowercase: requestedMapping.some(
        item => item.target_name.toLowerCase() !== item.target_name
      ),
      resetRenames: Array.from(mappingChangeStateBySource.values()).some(
        state => state.targetNameChanged
      ),
      commentsFromSource: comments.some(
        comment => comment.baseline && comment.changed
      ),
      clearComments: comments.some(comment => Boolean(comment.value)),
      resetAll: hasMappingChanges || comments.some(comment => comment.changed),
    };
  }, [getTypedComment, mappingChangeStateBySource, requestedMapping]);

  const setCommentOverride = useCallback(
    (name: string, value: string | null, isNew: boolean) => {
      setSharedState(prev => ({
        ...(prev ?? {}),
        [isNew ? 'typedCommentOverrides' : 'dbCommentOverrides']: {
          ...(isNew ? prev?.typedCommentOverrides : prev?.dbCommentOverrides),
          [name]: normalizeComment(value),
        },
        lastCreateSqlKey: null,
        lastCreateTableKey: null,
        typedPreviewSql: null,
      }));
    },
    [setSharedState]
  );

  const resetTypedComment = useCallback(
    (sourceName: string) => {
      setTypedCommentOverrides(current => {
        delete current[sourceName];
        return current;
      });
    },
    [setTypedCommentOverrides]
  );

  /* ─────────────── Существующая таблица: сбросы ─────────────── */

  const initialTargetMapping = useCallback(
    () =>
      requestedMapping.map(item => ({
        ...item,
        target_name:
          initialTargetNamesRef.current.get(normalizeName(item.source_name)) ??
          item.target_name,
      })),
    [requestedMapping]
  );

  const hasExistingRenames = requestedMapping.some(item => {
    const initial = initialTargetNamesRef.current.get(
      normalizeName(item.source_name)
    );
    return initial !== undefined && initial !== item.target_name;
  });

  const handleResetExistingTargetNames = useCallback(() => {
    setMappingValue(initialTargetMapping(), true);
  }, [initialTargetMapping, setMappingValue]);

  const defaultColumnActionsKey = useMemo(
    () =>
      JSON.stringify(
        getDefaultSelectedColumnActions(sharedState?.resolvedColumnRows)
      ),
    [sharedState?.resolvedColumnRows]
  );

  const hasExistingChanges =
    hasExistingRenames ||
    Object.keys(sharedState?.dbNullableOverrides ?? {}).length > 0 ||
    Object.keys(sharedState?.dbCommentOverrides ?? {}).length > 0 ||
    Object.keys(sharedState?.typedCommentOverrides ?? {}).length > 0 ||
    JSON.stringify(selectedColumnActions) !== defaultColumnActionsKey;

  const handleResetExistingAll = useCallback(() => {
    if (hasExistingRenames) {
      setMappingValue(initialTargetMapping(), true);
    }
    setSharedState(prev => ({
      ...(prev ?? {}),
      dbNullableOverrides: {},
      dbCommentOverrides: {},
      typedCommentOverrides: {},
      selectedColumnActions: getDefaultSelectedColumnActions(
        prev?.resolvedColumnRows
      ),
    }));
  }, [
    hasExistingRenames,
    initialTargetMapping,
    setMappingValue,
    setSharedState,
  ]);

  /* ─────────────────────────── Рендер ─────────────────────────── */

  const tableParents = [literalDatabaseName, literalSchemaName].filter(
    (part): part is string => Boolean(part)
  );
  const tableName = literalTableName ?? selectedTargetLabel;
  const handleTablePathClick = goToStep ? () => goToStep(0) : undefined;

  if (!isTableNew) {
    return (
      <SchemaStepRoot {...dropdownBoundaryProps}>
        <ExistingTableMapping
          tableParents={tableParents}
          tableName={tableName}
          onTablePathClick={handleTablePathClick}
          commentOverrides={sharedState?.dbCommentOverrides}
          sourceCommentOverrides={sharedState?.typedCommentOverrides}
          catalogDescriptions={catalogDescriptions}
          commentsSupported={sharedState?.columnCommentsSupported}
          onCommentChange={setCommentOverride}
          columnDiff={existingTableColumnDiff}
          dbColumns={selectedTable?.columns}
          hasInvalidTargetName={hasEmptyTargetName}
          isResolving={sharedState?.isResolvingColumns ?? false}
          isRecreatingTable={sharedState?.isRecreatingTable ?? false}
          recreateTableError={sharedState?.recreateTableError ?? null}
          resolveError={sharedState?.resolveColumnsError ?? null}
          onRetryResolve={handleRefreshResolvedColumns}
          selectedActionColumns={selectedActionColumns}
          selectedActionsByColumn={selectedActionsByColumn}
          onToggleAction={handleToggleColumnAction}
          onActionNullableChange={handleColumnActionNullableChange}
          nullableOverrides={sharedState?.dbNullableOverrides}
          onExistingNullableChange={handleExistingColumnNullableChange}
          onTargetNameBlur={handleTargetNameCommit}
          onTargetNameCancel={handleTargetNameCancel}
          onTargetNameChange={handleTargetNameEdit}
          onTargetNameReset={handleTargetNameReset}
          onResetTargetNames={handleResetExistingTargetNames}
          onResetAll={handleResetExistingAll}
          hasChanges={hasExistingChanges}
          initialTargetNames={initialTargetNamesRef.current}
          onRecreateTable={() => void handleRecreateTable()}
          resolveStates={
            sharedState?.columnResolveStates ?? EMPTY_RESOLVE_STATES
          }
        />
      </SchemaStepRoot>
    );
  }

  const isTyped = selectedCreationMode === 'typed';
  const rawSql = localInputData?.create_table_sql ?? '';
  const resolveColumnsError = isTyped
    ? (sharedState?.resolveColumnsError ?? '').trim()
    : '';
  const errorMessages = [...mappingErrors, ...typedSpecErrors];

  const activeCommentIndex = activeCommentSource
    ? filteredMapping.findIndex(
        item =>
          normalizeName(item.source_name) === normalizeName(activeCommentSource)
      )
    : -1;
  const activeCommentItem =
    isTyped && activeCommentIndex >= 0
      ? filteredMapping[activeCommentIndex]
      : null;
  const activeComment = activeCommentItem?.source_name
    ? getTypedComment(activeCommentItem.source_name)
    : null;
  const moveActiveComment = (offset: number) => {
    const next = filteredMapping[activeCommentIndex + offset];
    if (next?.source_name) setActiveCommentSource(next.source_name);
  };

  return (
    <SchemaStepRoot {...dropdownBoundaryProps}>
      <SchemaStepHeader>
        <TablePathChip
          parents={tableParents}
          tableName={tableName}
          countLabel={formatColumnCount(requestedMapping.length)}
          onClick={handleTablePathClick}
        />
        <HeaderSpacer />
        {isTyped ? (
          <SearchField style={{ width: 220, flex: 'none' }}>
            <SearchLead>
              <SearchIcon size={14} />
            </SearchLead>
            <input
              aria-label='Поиск колонки'
              value={mappingSearch}
              onChange={event => setMappingSearch(event.target.value)}
              placeholder='Поиск колонки'
            />
          </SearchField>
        ) : null}
        <SegmentGroup role='tablist' aria-label='Режим настройки схемы'>
          <SegmentTab
            type='button'
            role='tab'
            active={isTyped}
            aria-selected={isTyped}
            onClick={() => handleCreationModeChange('typed')}
          >
            Конструктор
          </SegmentTab>
          <SegmentTab
            type='button'
            role='tab'
            active={!isTyped}
            aria-selected={!isTyped}
            onClick={() => {
              setActiveCommentSource(null);
              handleCreationModeChange('raw');
            }}
          >
            SQL
          </SegmentTab>
        </SegmentGroup>
        {isTyped ? (
          <>
            <IconButtonBase
              type='button'
              aria-label='Массовые действия'
              title='Массовые действия'
              aria-haspopup='menu'
              aria-expanded={Boolean(bulkAnchorEl)}
              active={Boolean(bulkAnchorEl)}
              onClick={event => setBulkAnchorEl(event.currentTarget)}
            >
              <MoreIcon />
            </IconButtonBase>
            <ActionMenu
              anchorEl={bulkAnchorEl}
              open={Boolean(bulkAnchorEl)}
              onClose={() => setBulkAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                disabled={!bulkAvailability.allNull}
                onClick={() => applyBulkAction('all_null')}
              >
                Разрешить NULL для всех
              </MenuItem>
              <MenuItem
                disabled={!bulkAvailability.allNotNull}
                onClick={() => applyBulkAction('all_not_null')}
              >
                Запретить NULL для всех
              </MenuItem>
              <Divider />
              <MenuItem
                disabled={!bulkAvailability.snakeCase}
                onClick={() => applyBulkAction('snake_case')}
              >
                Имена в snake_case
              </MenuItem>
              <MenuItem
                disabled={!bulkAvailability.lowercase}
                onClick={() => applyBulkAction('lowercase')}
              >
                Имена в нижний регистр
              </MenuItem>
              <MenuItem
                disabled={!bulkAvailability.resetRenames}
                onClick={() => applyBulkAction('reset_renames')}
              >
                Сбросить переименования
              </MenuItem>
              <Divider />
              <MenuItem
                disabled={
                  !bulkAvailability.commentsFromSource ||
                  Boolean(commentsDisabledReason)
                }
                onClick={() => applyBulkAction('comments_from_source')}
              >
                Взять комментарии из DataFrame
              </MenuItem>
              <MenuItem
                disabled={
                  !bulkAvailability.clearComments ||
                  Boolean(commentsDisabledReason)
                }
                onClick={() => applyBulkAction('clear_comments')}
              >
                Сбросить комментарии
              </MenuItem>
              <Divider />
              <MenuItem
                disabled={!bulkAvailability.resetAll}
                onClick={() => applyBulkAction('reset_all')}
              >
                Сбросить все изменения
              </MenuItem>
            </ActionMenu>
          </>
        ) : (
          <>
            <IconButtonBase
              type='button'
              aria-label='Сгенерировать SQL'
              title='Сгенерировать SQL заново'
              disabled={
                !canFetchRawPreviewSql ||
                Boolean(sharedState?.isCreateSqlLoading)
              }
              onClick={() => void fetchCreateTableSql('raw', true)}
            >
              {sharedState?.isCreateSqlLoading ? (
                <Spinner size={12} role='status' aria-label='Генерируем SQL' />
              ) : (
                <RefreshIcon />
              )}
            </IconButtonBase>
            <IconButtonBase
              type='button'
              aria-label={
                isSqlCopied === 'raw' ? 'Скопировано' : 'Скопировать SQL'
              }
              title={isSqlCopied === 'raw' ? 'Скопировано' : 'Скопировать SQL'}
              disabled={!rawSql.trim()}
              onClick={() => void copySql(rawSql, 'raw')}
            >
              {isSqlCopied === 'raw' ? (
                <CheckIcon size={15} strokeWidth={1.8} color='#1E7A43' />
              ) : (
                <CopyIcon />
              )}
            </IconButtonBase>
          </>
        )}
      </SchemaStepHeader>

      {errorMessages.length > 0 || sqlErrorMessage || resolveColumnsError ? (
        <MessageList>
          {errorMessages.length > 0 ? (
            <MessageBox tone='error' role='alert'>
              <span className='message-text'>{errorMessages.join('\n')}</span>
            </MessageBox>
          ) : null}
          {sqlErrorMessage ? (
            <MessageBox tone='error' role='alert'>
              <span className='message-text'>{sqlErrorMessage}</span>
            </MessageBox>
          ) : null}
          {resolveColumnsError ? (
            <MessageBox tone='error' role='alert'>
              <span className='message-text'>{resolveColumnsError}</span>
              <LinkButton
                type='button'
                disabled={!resolveWriteColumnsRequest}
                onClick={handleRefreshResolvedColumns}
              >
                Повторить
              </LinkButton>
            </MessageBox>
          ) : null}
        </MessageList>
      ) : null}

      {isTyped ? (
        <NewTableColumnsTable
          rows={filteredMapping}
          isFiltered={Boolean(deferredMappingSearch.trim())}
          changeStateBySource={mappingChangeStateBySource}
          sourceDtypeBySource={sourceDtypeBySource}
          schemaRolesByTarget={schemaRolesByTarget}
          initialTargetNames={initialTargetNamesRef.current}
          resolveStates={
            sharedState?.columnResolveStates ?? EMPTY_RESOLVE_STATES
          }
          pendingSourceKeys={pendingEffectiveSourceKeys}
          resolvingSourceKeys={resolvingEffectiveSourceKeys}
          flashingSourceKeys={flashingEffectiveSourceKeys}
          getComment={getTypedComment}
          commentsDisabledReason={commentsDisabledReason}
          activeCommentSource={activeCommentItem?.source_name ?? null}
          onOpenComment={sourceName =>
            setActiveCommentSource(current =>
              normalizeName(current) === normalizeName(sourceName)
                ? null
                : sourceName
            )
          }
          onNullableChange={(sourceName, checked) =>
            patchMapping(
              sourceName,
              current => ({ ...current, nullable: checked }),
              false
            )
          }
          onTargetNameBlur={handleTargetNameCommit}
          onTargetNameCancel={handleTargetNameCancel}
          onTargetNameChange={handleTargetNameEdit}
          onTargetNameReset={handleTargetNameReset}
          onTypeChange={(sourceName, value: DataType) =>
            patchMapping(
              sourceName,
              current => ({ ...current, dtype: value }),
              false
            )
          }
        />
      ) : (
        <SqlEditor
          aria-label='CREATE TABLE SQL'
          value={rawSql}
          spellCheck={false}
          onChange={event =>
            setLocalInputData(prev => ({
              ...(prev ?? {}),
              create_table_sql: event.target.value,
            }))
          }
          placeholder='Введите или сгенерируйте CREATE TABLE SQL...'
        />
      )}

      {activeCommentItem?.source_name && activeComment ? (
        <ColumnCommentPanel
          columnName={
            getResolvedTargetName(activeCommentItem) ??
            activeCommentItem.requested_target_name ??
            activeCommentItem.source_name
          }
          value={activeComment.value}
          onChange={value =>
            setCommentOverride(activeCommentItem.source_name!, value, true)
          }
          sourceComment={activeComment.baseline}
          onUseSource={() => resetTypedComment(activeCommentItem.source_name!)}
          sourceAdornment={
            <CatalogDescriptionNote
              field={catalogDescriptions[activeCommentItem.source_name]}
            />
          }
          disabled={Boolean(commentsDisabledReason)}
          disabledReason={commentsDisabledReason ?? undefined}
          hasPrevious={activeCommentIndex > 0}
          hasNext={activeCommentIndex < filteredMapping.length - 1}
          onPrevious={() => moveActiveComment(-1)}
          onNext={() => moveActiveComment(1)}
          onClose={() => setActiveCommentSource(null)}
        />
      ) : null}
    </SchemaStepRoot>
  );
};
