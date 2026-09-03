import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Box, Collapse, Stack, TextField, Tooltip } from '@mui/material';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';
import { useAppDispatch } from '@/app/providers/store';

import { useDbTargetCatalogController } from '@/features/node/db-target-selector';
import { useNodeConnections } from '@/features/node/get-node-connections';

import { ColumnDropdownSelect } from '@/entities/data/dataframe';
import {
  invalidateDbCatalog,
  requireDbConnectionId,
} from '@/entities/data/db-connection';

import { useApiUtils } from '@/shared/api/utils';
import {
  client,
  type Column,
  type DataFrameMetadata,
  type DataType,
  type DbMetadata as DBMetadata,
  type DbTable as DBTable,
  type InputDefinitionModel,
} from '@/shared/gatewayClient';
import {
  getDbMetadataDatabaseOptions,
  getDbMetadataFilteredTables,
  getDbMetadataSchemaOptions,
} from '@/shared/lib/db-metadata';

import {
  buildCreateSqlCacheKey,
  buildSelectedWriteTargetLabel,
  buildWriteTargetAfterDatabaseChange,
  buildWriteTargetAfterTableModeChange,
  createDefaultTypedSpecDraft,
  type CreationMode,
  type DraftForeignKeySpec,
  type DraftIndexSpec,
  type ExtensionState,
  extractApiErrorMessage,
  findWriteTargetTable,
  getLiteralStringValue,
  getSelectorCollapsedValue,
  getSelectorFingerprintValue,
  getTypedSpecValidationError,
  hasConfiguredSelectorValue,
  makeDraftId,
  normalizeName,
  registerCreatedDatabase,
  registerCreatedSchema,
  resolveCreationMode,
  serializeTypedSpecDraft,
  shouldShowCreateTableSql,
  supportsDatabaseSelection,
  supportsSchemas,
  type TypedSpecDraft,
  type WriteDataFrameToDBValues,
} from '../../lib/helpers';
import { MultiSelectColumnPicker } from '../MultiSelectColumnPicker';
import {
  AccAddButton,
  AccCard,
  AccCardBadge,
  AccCardBody,
  AccCardHeader,
  AccCardHeaderContent,
  AccCardIcon,
  AccCardsContainer,
  AccCardSubtitle,
  AccCardTitle,
  AccEmptyIcon,
  AccEmptyState,
  AccEmptyText,
  AccExpandIcon,
  AccFieldInput,
  AccFormField,
  AccFormLabel,
  AccHeaderDeleteButton,
  AccordionContainer,
  AccSection,
  AccSectionHeader,
  AccSectionTitle,
  AccToggleContainer,
  AccToggleOption,
  FieldGroup,
  FieldLabel,
  SchemaSegmentButton,
  SchemaSegmentedControl,
  SqlErrorActionsRow,
  SqlErrorBanner,
  SqlErrorBannerActions,
  SqlErrorBannerContent,
  SqlErrorBannerTextContainer,
  SqlErrorBlockContainer,
  SqlErrorCloseButton,
  SqlErrorDetailsContainer,
  SqlErrorDetailsContent,
  SqlErrorDetailsCopyButton,
  SqlErrorDetailsHeader,
  SqlErrorDetailsHeaderTitle,
  SqlErrorIconContainer,
  SqlErrorMessageText,
  SqlErrorSummary,
  SqlErrorTitle,
  SqlErrorToggleDetailsButton,
  SQLToolbar,
  ToolbarActions,
  ToolbarButton,
  ToolbarHint,
} from '../styles';

import { ConnectionSection } from './sections/ConnectionSection';
import { DatabaseSection } from './sections/DatabaseSection';
import { SchemaSection } from './sections/SchemaSection';
import { SchemaStrategySection } from './sections/SchemaStrategySection';
import { TableSection } from './sections/TableSection';

type UITableSelectMode = 'select' | 'create';
type UIDatabaseSelectMode = 'select' | 'create';
type UISchemaSelectMode = 'select' | 'create';

type Notice = {
  severity: 'success' | 'error' | 'warning' | 'info';
  message: string;
} | null;

type PickerOption = {
  name: string;
  type: string;
};

const EMPTY_TARGET_FINGERPRINT = ['', '', ''].join('::');
const DATABASE_SELECTION_REQUIRED_MESSAGE =
  'Сначала выберите базу данных в секции выше.';

const CLICKHOUSE_ENGINE_OPTIONS = [
  'MergeTree',
  'ReplacingMergeTree',
  'SummingMergeTree',
  'AggregatingMergeTree',
  'CollapsingMergeTree',
  'VersionedCollapsingMergeTree',
  'ReplicatedMergeTree',
  'ReplicatedReplacingMergeTree',
  'ReplicatedSummingMergeTree',
  'ReplicatedAggregatingMergeTree',
  'ReplicatedCollapsingMergeTree',
  'ReplicatedVersionedCollapsingMergeTree',
] as const;
const SHOW_FOREIGN_KEYS_SECTION = false;
const SHOW_TYPED_PRIMARY_KEY_COLUMNS_FOR_CLICKHOUSE = false;

export const TableSetupStep: React.FC<
  NodeModalStepperExtensionProps<WriteDataFrameToDBValues, ExtensionState>
> = ({
  id: nodeID,
  isOpen,
  nodeDefinition,
  localInputData,
  setLocalInputData,
  sharedState,
  setSharedState,
  variables = [],
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const { createDatabase, createSchema } = useApiUtils();
  const dispatch = useAppDispatch();

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
  const [newDatabaseName, setNewDatabaseName] = useState('');
  const [isDatabaseNew, setIsDatabaseNew] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [isCreateTableNameEditorOpen, setIsCreateTableNameEditorOpen] =
    useState(() => {
      return !(
        sharedState?.isTableNew &&
        getLiteralStringValue(localInputData?.table_name)
      );
    });
  const [selectSchemaMode, setSelectSchemaMode] =
    useState<UISchemaSelectMode>('select');
  const [newSchemaName, setNewSchemaName] = useState('');
  const [isSchemaNew, setIsSchemaNew] = useState(false);
  const [isSelectTableBrowserOpen, setIsSelectTableBrowserOpen] = useState(
    !hasConfiguredSelectorValue(localInputData?.table_name)
  );
  const [openSections, setOpenSections] = useState<string[]>(() => {
    const initialConnectionMetadata =
      (getConnectedInputMetadata('connection') as DBMetadata | null) ?? null;
    const sections: string[] = [];

    if (
      supportsDatabaseSelection(initialConnectionMetadata) &&
      !hasConfiguredSelectorValue(localInputData?.database_name)
    ) {
      sections.push('database', 'table');
      if (supportsSchemas(initialConnectionMetadata)) {
        sections.push('schema');
      }
      return sections;
    }

    if (
      supportsSchemas(initialConnectionMetadata) &&
      !hasConfiguredSelectorValue(localInputData?.schema_name)
    ) {
      sections.push('schema', 'table');
      return sections;
    }

    if (!hasConfiguredSelectorValue(localInputData?.table_name)) {
      sections.push('table');
    }

    return sections;
  });
  const [expandedIndexCards, setExpandedIndexCards] = useState<string[]>([]);
  const [expandedForeignKeyCards, setExpandedForeignKeyCards] = useState<
    string[]
  >([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const createSqlEditorRef = useRef<HTMLDivElement>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);
  const copyCreateSqlErrorTimeoutRef = useRef<number | null>(null);
  const copyCreateTableErrorTimeoutRef = useRef<number | null>(null);
  const createSqlAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => createSqlAbortControllerRef.current?.abort(), []);
  const [isSqlCopied, setIsSqlCopied] = useState(false);
  const [isCreateSqlErrorCopied, setIsCreateSqlErrorCopied] = useState(false);
  const [isCreateSqlErrorExpanded, setIsCreateSqlErrorExpanded] =
    useState(false);
  const [isCreateSqlErrorDismissed, setIsCreateSqlErrorDismissed] =
    useState(false);
  const [isCreateTableErrorCopied, setIsCreateTableErrorCopied] =
    useState(false);
  const [isCreateTableErrorExpanded, setIsCreateTableErrorExpanded] =
    useState(false);
  const [isCreateTableErrorDismissed, setIsCreateTableErrorDismissed] =
    useState(false);
  const lastCreateSqlErrorRef = useRef<string | null>(null);
  const lastCreateTableErrorRef = useRef<string | null>(null);
  const recoveredCreateModeErrorRef = useRef<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [creatingEntity, setCreatingEntity] = useState<
    'database' | 'schema' | null
  >(null);
  const targetFingerprintRef = useRef<string | null>(null);

  const inputDataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );
  const dataframeColumns = useMemo(() => {
    return inputDataframeMetadata?.columns ?? [];
  }, [inputDataframeMetadata?.columns]);
  const typedPickerColumns = useMemo(() => {
    return dataframeColumns.map(column => ({
      name: column.name,
      type: column.dtype ?? 'unknown',
    }));
  }, [dataframeColumns]);
  const clickhouseEngineColumns = useMemo(() => {
    return CLICKHOUSE_ENGINE_OPTIONS.map(engineName => ({
      name: engineName,
      dtype: null,
    })) as unknown as Column[];
  }, []);
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

  const dialect = inputConnectionMetadata?.dialect?.toLowerCase() ?? '';
  const isClickHouse = dialect === 'clickhouse';
  const isOracle = dialect === 'oracle';
  const isSchemaRequired = useMemo(() => {
    return supportsSchemas(inputConnectionMetadata);
  }, [inputConnectionMetadata]);
  const isDatabaseSelectionRequired = useMemo(() => {
    return supportsDatabaseSelection(inputConnectionMetadata);
  }, [inputConnectionMetadata]);

  const literalDatabaseName = useMemo(() => {
    return getLiteralStringValue(localInputData?.database_name);
  }, [localInputData?.database_name]);

  const literalSchemaName = useMemo(() => {
    return getLiteralStringValue(localInputData?.schema_name);
  }, [localInputData?.schema_name]);

  const literalTableName = useMemo(() => {
    return getLiteralStringValue(localInputData?.table_name);
  }, [localInputData?.table_name]);
  const hasSelectedDatabase = useMemo(() => {
    return (
      !isDatabaseSelectionRequired ||
      hasConfiguredSelectorValue(localInputData?.database_name)
    );
  }, [isDatabaseSelectionRequired, localInputData?.database_name]);

  const catalog = useDbTargetCatalogController(inputConnectionMetadata, {
    databaseName: literalDatabaseName,
    schemaName: literalSchemaName,
    tableName: literalTableName,
    databasesEnabled: openSections.includes('database'),
    schemasEnabled: openSections.includes('schema'),
    tablesEnabled: openSections.includes('table') && isSelectTableBrowserOpen,
    detailEnabled: selectTableMode === 'select',
  });
  const isLazyCatalog = catalog.mode === 'lazy';
  const lazySelectedTable = catalog.table;
  const selectedTable: DBTable | null = useMemo(() => {
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
        dtype: column.dtype as DataType,
        nullable: column.nullable,
        index: column.indexed,
        primary_key: column.primaryKey,
        indexes: column.indexes,
      })),
    };
  }, [inputConnectionMetadata, lazySelectedTable.item, localInputData]);

  const isTableNew = useMemo(() => {
    if (!literalTableName) {
      return false;
    }

    if (selectTableMode === 'select') {
      return false;
    }

    return !selectedTable;
  }, [literalTableName, selectTableMode, selectedTable]);

  const hasCreateTableName = Boolean(literalTableName);
  const shouldShowCreateDatabaseSelector =
    selectTableMode === 'create' && hasCreateTableName;
  const shouldShowCreateSchemaSelector =
    isSchemaRequired && selectTableMode === 'create' && hasCreateTableName;
  const isCreateDatabaseSelected =
    !shouldShowCreateDatabaseSelector || Boolean(literalDatabaseName);
  const isCreateSchemaSelected =
    !shouldShowCreateSchemaSelector || Boolean(literalSchemaName);

  const selectedCreationMode = useMemo(() => {
    return resolveCreationMode(sharedState);
  }, [sharedState]);

  const typedSpecDraft = useMemo<TypedSpecDraft>(() => {
    return sharedState?.typedSpecDraft ?? createDefaultTypedSpecDraft();
  }, [sharedState?.typedSpecDraft]);
  const typedSpecValidationError = useMemo(() => {
    if (!isTableNew || selectedCreationMode !== 'typed') {
      return null;
    }

    return getTypedSpecValidationError({
      connectionMetadata: inputConnectionMetadata,
      draft: typedSpecDraft,
    });
  }, [
    inputConnectionMetadata,
    isTableNew,
    selectedCreationMode,
    typedSpecDraft,
  ]);

  const toggleIndexCard = useCallback((cardId: string) => {
    setExpandedIndexCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const toggleForeignKeyCard = useCallback((cardId: string) => {
    setExpandedForeignKeyCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const getColumnsCountLabel = useCallback((count: number) => {
    if (count === 0) {
      return 'Нет колонок';
    }

    if (count === 1) {
      return '1 колонка';
    }

    return `${count} колонок`;
  }, []);

  useEffect(() => {
    setExpandedIndexCards(prev =>
      prev.filter(cardId =>
        typedSpecDraft.indexes.some(indexDraft => indexDraft.id === cardId)
      )
    );
  }, [typedSpecDraft.indexes]);

  useEffect(() => {
    setExpandedForeignKeyCards(prev =>
      prev.filter(cardId =>
        typedSpecDraft.foreignKeys.some(foreignKey => foreignKey.id === cardId)
      )
    );
  }, [typedSpecDraft.foreignKeys]);

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

  const writeModeInputDef = useMemo(() => {
    return getInputDefinition('write_mode');
  }, [getInputDefinition]);

  const databaseInputDef = useMemo(() => {
    return getInputDefinition('database_name');
  }, [getInputDefinition]);

  const schemaInputDef = useMemo(() => {
    return getInputDefinition('schema_name');
  }, [getInputDefinition]);

  const tableInputDef = useMemo(() => {
    return getInputDefinition('table_name');
  }, [getInputDefinition]);

  const writeModeOptions = useMemo(() => {
    const options = writeModeInputDef?.options;
    if (!Array.isArray(options)) {
      return [] as string[];
    }
    return options
      .filter((option): option is string => typeof option === 'string')
      .filter(option => {
        const normalizedOption = option.toLowerCase();
        return normalizedOption !== 'recreate';
      });
  }, [writeModeInputDef?.options]);

  const writeModeDisplayOptions = useMemo(() => {
    const hasUpsert = writeModeOptions.some(
      option => option.toLowerCase() === 'upsert'
    );
    return hasUpsert ? writeModeOptions : [...writeModeOptions, 'upsert'];
  }, [writeModeOptions]);

  const writeModeDescription = useMemo(() => {
    if (typeof writeModeInputDef?.description !== 'string') {
      return null;
    }
    return writeModeInputDef.description.trim() || null;
  }, [writeModeInputDef?.description]);

  const localizedWriteModeDescription = useMemo(() => {
    if (!writeModeDescription) {
      return null;
    }

    const normalized = writeModeDescription
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const defaultDescription =
      "mode for writing to the table: 'truncate' truncates the table, 'append' adds data, 'recreate' drops and creates the table again.";

    if (normalized === defaultDescription) {
      return "Режим записи в таблицу: 'truncate' очищает таблицу, 'append' добавляет данные, 'upsert' обновляет/добавляет по key column.";
    }

    return writeModeDescription;
  }, [writeModeDescription]);

  const normalizeWriteMode = useCallback(
    (mode?: string | null) => {
      if (!mode) return null;
      const normalized = mode.toLowerCase();
      return (
        writeModeOptions.find(option => option.toLowerCase() === normalized) ??
        null
      );
    },
    [writeModeOptions]
  );

  const selectedWriteMode = useMemo(() => {
    return normalizeWriteMode(localInputData?.write_mode ?? null);
  }, [localInputData?.write_mode, normalizeWriteMode]);

  const isWriteModeDisabled = useCallback((_mode: string) => {
    return false;
  }, []);

  const selectedTableLabel = useMemo(() => {
    return buildSelectedWriteTargetLabel(localInputData);
  }, [localInputData]);

  const createTableErrorMessage = useMemo(() => {
    return (sharedState?.createTableError ?? '').trim();
  }, [sharedState?.createTableError]);

  const createSqlErrorMessage = useMemo(() => {
    return (sharedState?.createSqlError ?? '').trim();
  }, [sharedState?.createSqlError]);

  const createSqlErrorSummary = useMemo(() => {
    if (!createSqlErrorMessage) {
      return '';
    }

    const syntaxErrorMatch =
      createSqlErrorMessage.match(/syntax error[^\n\r]*/i);
    const lineMatch = createSqlErrorMessage.match(/LINE\s+\d+[^\n\r]*/i);
    if (syntaxErrorMatch) {
      return [syntaxErrorMatch[0].trim(), lineMatch?.[0]?.trim()]
        .filter(Boolean)
        .join(' - ');
    }

    const oneLine = createSqlErrorMessage.replace(/\s+/g, ' ').trim();
    return oneLine.length > 180 ? `${oneLine.slice(0, 180)}...` : oneLine;
  }, [createSqlErrorMessage]);

  const createTableErrorSummary = useMemo(() => {
    if (!createTableErrorMessage) {
      return '';
    }

    const syntaxErrorMatch =
      createTableErrorMessage.match(/syntax error[^\n\r]*/i);
    const lineMatch = createTableErrorMessage.match(/LINE\s+\d+[^\n\r]*/i);
    if (syntaxErrorMatch) {
      return [syntaxErrorMatch[0].trim(), lineMatch?.[0]?.trim()]
        .filter(Boolean)
        .join(' - ');
    }

    const oneLine = createTableErrorMessage.replace(/\s+/g, ' ').trim();
    return oneLine.length > 180 ? `${oneLine.slice(0, 180)}...` : oneLine;
  }, [createTableErrorMessage]);

  const tableSectionCollapsedValue = useMemo(() => {
    return getSelectorCollapsedValue(
      localInputData?.table_name,
      'Таблица не выбрана'
    );
  }, [localInputData?.table_name]);

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

  useEffect(() => {
    setSharedState(prev => {
      if (
        prev?.inputConnectionMetadata === inputConnectionMetadata &&
        prev?.inputDataframeMetadata === inputDataframeMetadata &&
        prev?.isTableNew === isTableNew &&
        prev?.selectedCreationMode &&
        prev?.typedSpecDraft
      ) {
        return prev;
      }

      return {
        ...(prev ?? {}),
        inputConnectionMetadata,
        inputDataframeMetadata,
        isTableNew,
        selectedCreationMode: prev?.selectedCreationMode ?? 'raw',
        typedSpecDraft: prev?.typedSpecDraft ?? createDefaultTypedSpecDraft(),
        createdDatabases: prev?.createdDatabases ?? [],
        createdSchemas: prev?.createdSchemas ?? [],
      };
    });
  }, [
    inputConnectionMetadata,
    inputDataframeMetadata,
    isTableNew,
    setSharedState,
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

  const filteredTables = useMemo(() => {
    return getDbMetadataFilteredTables(inputConnectionMetadata, {
      databaseName: literalDatabaseName,
      schemaName: literalSchemaName,
    });
  }, [inputConnectionMetadata, literalDatabaseName, literalSchemaName]);

  const foreignKeyReferenceTables = useMemo(() => {
    return getDbMetadataFilteredTables(inputConnectionMetadata, {
      databaseName: literalDatabaseName,
    });
  }, [inputConnectionMetadata, literalDatabaseName]);

  const toColumnSelectorOptions = useCallback((options: PickerOption[]) => {
    return options.map(option => ({
      name: option.name,
      dtype: option.type,
    })) as unknown as Column[];
  }, []);

  const foreignKeySchemaOptions = useMemo(() => {
    const grouped = new Map<string, number>();

    for (const table of foreignKeyReferenceTables) {
      const schemaName = (table.schema_name ?? '').trim();
      if (!schemaName) {
        continue;
      }
      grouped.set(schemaName, (grouped.get(schemaName) ?? 0) + 1);
    }

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([schemaName, tableCount]) => ({
        name: schemaName,
        type: `${tableCount} tables`,
      }));
  }, [foreignKeyReferenceTables]);

  const getForeignKeyTableOptions = useCallback(
    (schemaName: string) => {
      const normalizedSchemaName = normalizeName(schemaName);
      const tableByName = new Map<string, PickerOption>();

      for (const table of foreignKeyReferenceTables) {
        const tableSchemaName = (table.schema_name ?? '').trim();
        if (
          normalizedSchemaName &&
          normalizeName(tableSchemaName) !== normalizedSchemaName
        ) {
          continue;
        }

        const normalizedTableName = normalizeName(table.name);
        if (!normalizedTableName || tableByName.has(normalizedTableName)) {
          continue;
        }

        tableByName.set(normalizedTableName, {
          name: table.name,
          type: table.type ?? 'TABLE',
        });
      }

      return Array.from(tableByName.values()).sort((left, right) =>
        left.name.localeCompare(right.name)
      );
    },
    [foreignKeyReferenceTables]
  );

  const getForeignKeyReferencedColumns = useCallback(
    (schemaName: string, tableName: string) => {
      const normalizedTableName = normalizeName(tableName);
      if (!normalizedTableName) {
        return [] as PickerOption[];
      }

      const normalizedSchemaName = normalizeName(schemaName);
      const exactMatch = foreignKeyReferenceTables.find(table => {
        if (normalizeName(table.name) !== normalizedTableName) {
          return false;
        }

        if (!normalizedSchemaName) {
          return true;
        }

        return normalizeName(table.schema_name) === normalizedSchemaName;
      });

      const fallbackMatch =
        exactMatch ??
        foreignKeyReferenceTables.find(table => {
          return normalizeName(table.name) === normalizedTableName;
        });

      return (fallbackMatch?.columns ?? []).map(column => ({
        name: column.name,
        type: column.dtype ?? 'unknown',
      }));
    },
    [foreignKeyReferenceTables]
  );

  const resetCreateSqlState = useCallback(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      createSqlError: null,
      createTableError: null,
      createTableSuccess: null,
      lastCreateSqlKey: null,
      typedPreviewSql: null,
      isCreateSqlLoading: false,
      isCreateTableLoading: false,
    }));
  }, [setSharedState]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
      if (copyCreateSqlErrorTimeoutRef.current !== null) {
        window.clearTimeout(copyCreateSqlErrorTimeoutRef.current);
      }
      if (copyCreateTableErrorTimeoutRef.current !== null) {
        window.clearTimeout(copyCreateTableErrorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!createSqlErrorMessage) {
      lastCreateSqlErrorRef.current = null;
      setIsCreateSqlErrorExpanded(false);
      setIsCreateSqlErrorDismissed(false);
      setIsCreateSqlErrorCopied(false);
      return;
    }

    if (lastCreateSqlErrorRef.current !== createSqlErrorMessage) {
      lastCreateSqlErrorRef.current = createSqlErrorMessage;
      setIsCreateSqlErrorExpanded(false);
      setIsCreateSqlErrorDismissed(false);
      setIsCreateSqlErrorCopied(false);
    }
  }, [createSqlErrorMessage]);

  useEffect(() => {
    if (!createTableErrorMessage) {
      lastCreateTableErrorRef.current = null;
      setIsCreateTableErrorExpanded(false);
      setIsCreateTableErrorDismissed(false);
      setIsCreateTableErrorCopied(false);
      recoveredCreateModeErrorRef.current = null;
      return;
    }

    if (lastCreateTableErrorRef.current !== createTableErrorMessage) {
      lastCreateTableErrorRef.current = createTableErrorMessage;
      setIsCreateTableErrorExpanded(false);
      setIsCreateTableErrorDismissed(false);
      setIsCreateTableErrorCopied(false);
    }
  }, [createTableErrorMessage]);

  useEffect(() => {
    if (!isOpen) return;
    if (!createTableErrorMessage) return;
    if (!literalTableName) return;
    if (recoveredCreateModeErrorRef.current === createTableErrorMessage) return;

    recoveredCreateModeErrorRef.current = createTableErrorMessage;
    setSelectTableMode('create');
    setIsCreateTableNameEditorOpen(false);
    setIsSelectTableBrowserOpen(false);
  }, [createTableErrorMessage, isOpen, literalTableName]);

  useEffect(() => {
    if (!isOpen) {
      targetFingerprintRef.current = targetFingerprint;
      return;
    }

    const previousTargetFingerprint = targetFingerprintRef.current;
    if (previousTargetFingerprint === null) {
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
        localInputData?.use_clickhouse_connect_driver != null);

    if (isInitialHydrationFromPersistedInput) {
      return;
    }

    setLocalInputData(prev => {
      const current = prev ?? {};
      if (
        current.write_mode == null &&
        current.upsert_config == null &&
        current.create_table_sql == null &&
        current.table_create_spec == null &&
        current.use_clickhouse_connect_driver == null
      ) {
        return prev;
      }
      return {
        ...current,
        write_mode: null,
        upsert_config: null,
        create_table_sql: null,
        table_create_spec: null,
        use_clickhouse_connect_driver: null,
      };
    });

    setSharedState(prev => ({
      ...(prev ?? {}),
      selectedCreationMode: 'raw',
      typedSpecDraft: createDefaultTypedSpecDraft(),
      createSqlError: null,
      createTableError: null,
      createTableSuccess: null,
      createTableSuccessAt: null,
      lastCreateSqlKey: null,
      typedPreviewSql: null,
      isCreateSqlLoading: false,
      isCreateTableLoading: false,
      lastCreateTableKey: null,
    }));
  }, [
    isOpen,
    localInputData?.create_table_sql,
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
    if (selectTableMode !== 'select') return;
    setIsSelectTableBrowserOpen(
      !hasConfiguredSelectorValue(localInputData?.table_name)
    );
  }, [localInputData?.table_name, selectTableMode]);

  useEffect(() => {
    if (!isOpen) return;
    if (isSchemaRequired) return;
    if (!localInputData?.schema_name) return;

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

  useEffect(() => {
    if (!isOpen || !literalTableName) return;
    if (writeModeOptions.length === 0) return;
    if (localInputData?.write_mode != null) return;
    if (selectedWriteMode) return;

    const fallback = normalizeWriteMode('truncate') ?? writeModeOptions[0];
    if (!fallback) return;

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      write_mode: fallback,
      create_table_sql: null,
    }));
  }, [
    isOpen,
    literalTableName,
    localInputData?.write_mode,
    normalizeWriteMode,
    selectedWriteMode,
    setLocalInputData,
    writeModeOptions,
  ]);

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(section => section !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  const isSectionOpen = useCallback(
    (sectionId: string) => openSections.includes(sectionId),
    [openSections]
  );
  const handleToggleConnectionSection = useCallback(() => {
    toggleSection('connection');
  }, [toggleSection]);
  const handleToggleDatabaseSection = useCallback(() => {
    toggleSection('database');
  }, [toggleSection]);
  const handleToggleSchemaSection = useCallback(() => {
    toggleSection('schema');
  }, [toggleSection]);
  const handleToggleTableSection = useCallback(() => {
    toggleSection('table');
  }, [toggleSection]);
  const handleToggleSchemaStrategySection = useCallback(() => {
    toggleSection('schema-strategy');
  }, [toggleSection]);

  const scrollCreateSqlIntoViewIfNeeded = useCallback(() => {
    const container = scrollContainerRef.current;
    const editor = createSqlEditorRef.current;
    if (!container || !editor) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    const padding = 12;

    const fitsTop = editorRect.top >= containerRect.top + padding;
    const fitsBottom = editorRect.bottom <= containerRect.bottom - padding;
    if (fitsTop && fitsBottom) {
      return;
    }

    let targetScrollTop = container.scrollTop;

    if (editorRect.bottom > containerRect.bottom - padding) {
      targetScrollTop += editorRect.bottom - (containerRect.bottom - padding);
    }

    if (editorRect.top < containerRect.top + padding) {
      targetScrollTop += editorRect.top - (containerRect.top + padding);
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const nextScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

    if (Math.abs(nextScrollTop - container.scrollTop) > 1) {
      container.scrollTo({ top: nextScrollTop, behavior: 'smooth' });
    }
  }, []);

  const scrollSchemaStrategyToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    if (maxScrollTop <= 0) {
      return;
    }

    container.scrollTo({ top: maxScrollTop, behavior: 'smooth' });
  }, []);

  const ensureCreateSqlSectionOpen = useCallback(() => {
    setOpenSections(prev => {
      if (prev.includes('schema-strategy')) {
        return prev;
      }
      return [...prev, 'schema-strategy'];
    });
  }, []);

  const resetTargetWriteConfig = useCallback(
    (current: WriteDataFrameToDBValues) => ({
      ...current,
      write_mode: null,
      upsert_config: null,
      create_table_sql: null,
      table_create_spec: null,
      use_clickhouse_connect_driver: null,
    }),
    []
  );

  const handleDatabaseValueChange = useCallback(
    (nextValue: unknown) => {
      setLocalInputData(prev => {
        const current = (prev ?? {}) as WriteDataFrameToDBValues;
        const shouldPreserveCreateTableName = selectTableMode === 'create';

        return resetTargetWriteConfig(
          buildWriteTargetAfterDatabaseChange(
            current,
            nextValue as WriteDataFrameToDBValues['database_name'],
            shouldPreserveCreateTableName
          )
        );
      });
      setNotice(null);
      resetCreateSqlState();
    },
    [
      resetCreateSqlState,
      resetTargetWriteConfig,
      selectTableMode,
      setLocalInputData,
    ]
  );
  const handleClearDatabaseSelection = useCallback(() => {
    handleDatabaseValueChange(null);
    setIsDatabaseNew(false);
  }, [handleDatabaseValueChange]);
  const handleDatabaseSelectModeChange = useCallback(
    (mode: UIDatabaseSelectMode) => {
      setSelectDatabaseMode(mode);
      setIsDatabaseNew(mode === 'create');
    },
    []
  );

  const handleSchemaValueChange = useCallback(
    (nextValue: unknown) => {
      setLocalInputData(prev => {
        const current = (prev ?? {}) as WriteDataFrameToDBValues;

        return resetTargetWriteConfig({
          ...current,
          schema_name: nextValue as WriteDataFrameToDBValues['schema_name'],
          table_name: null,
        });
      });
      setNotice(null);
      resetCreateSqlState();
    },
    [resetCreateSqlState, resetTargetWriteConfig, setLocalInputData]
  );
  const handleClearSchemaSelection = useCallback(() => {
    handleSchemaValueChange(null);
    setIsSchemaNew(false);
  }, [handleSchemaValueChange]);
  const handleSchemaSelectModeChange = useCallback(
    (mode: UISchemaSelectMode) => {
      setSelectSchemaMode(mode);
      setIsSchemaNew(mode === 'create');
    },
    []
  );

  const handleTableValueChange = useCallback(
    (nextValue: unknown) => {
      setLocalInputData(prev => {
        const current = (prev ?? {}) as WriteDataFrameToDBValues;

        return resetTargetWriteConfig({
          ...current,
          table_name: nextValue as WriteDataFrameToDBValues['table_name'],
        });
      });
      setNotice(null);
      resetCreateSqlState();
    },
    [resetCreateSqlState, resetTargetWriteConfig, setLocalInputData]
  );

  const handleResetTable = useCallback(() => {
    setLocalInputData(prev =>
      resetTargetWriteConfig({
        ...((prev ?? {}) as WriteDataFrameToDBValues),
        table_name: null,
      })
    );
    setSelectTableMode('select');
    setSelectDatabaseMode('select');
    setSelectSchemaMode('select');
    setNewDatabaseName('');
    setIsDatabaseNew(false);
    setNewTableName('');
    setIsCreateTableNameEditorOpen(true);
    setNewSchemaName('');
    setIsSchemaNew(false);
    setIsSelectTableBrowserOpen(true);
    setNotice(null);
    resetCreateSqlState();
  }, [resetCreateSqlState, resetTargetWriteConfig, setLocalInputData]);

  const handleTableSelect = useCallback(
    (table: DBTable) => {
      setLocalInputData(prev =>
        resetTargetWriteConfig({
          ...((prev ?? {}) as WriteDataFrameToDBValues),
          database_name: table.database_name,
          table_name: table.name,
          schema_name: table.schema_name,
        })
      );

      setSelectTableMode('select');
      setSelectDatabaseMode('select');
      setSelectSchemaMode('select');
      setNewDatabaseName('');
      setIsDatabaseNew(false);
      setNewTableName('');
      setIsCreateTableNameEditorOpen(false);
      setNewSchemaName('');
      setIsSchemaNew(false);
      setIsSelectTableBrowserOpen(false);
      setNotice(null);
      resetCreateSqlState();
    },
    [resetCreateSqlState, resetTargetWriteConfig, setLocalInputData]
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
          table_name: table.name,
          schema_name: table.schemaName,
        })
      );
      setSelectTableMode('select');
      setSelectDatabaseMode('select');
      setSelectSchemaMode('select');
      setNewDatabaseName('');
      setIsDatabaseNew(false);
      setNewTableName('');
      setIsCreateTableNameEditorOpen(false);
      setNewSchemaName('');
      setIsSchemaNew(false);
      setIsSelectTableBrowserOpen(false);
      setNotice(null);
      resetCreateSqlState();
    },
    [resetCreateSqlState, resetTargetWriteConfig, setLocalInputData]
  );

  const handleCreateTableSave = useCallback(() => {
    const name = newTableName.trim();
    if (!name) return;

    setLocalInputData(prev =>
      resetTargetWriteConfig({
        ...((prev ?? {}) as WriteDataFrameToDBValues),
        table_name: name,
      })
    );
    setIsCreateTableNameEditorOpen(false);
    resetCreateSqlState();
  }, [
    newTableName,
    resetCreateSqlState,
    resetTargetWriteConfig,
    setLocalInputData,
  ]);

  const handleTableModeChange = useCallback(
    (mode: UITableSelectMode) => {
      if (mode === selectTableMode) {
        return;
      }

      setSelectTableMode(mode);
      setLocalInputData(prev =>
        resetTargetWriteConfig(
          buildWriteTargetAfterTableModeChange(
            (prev ?? {}) as WriteDataFrameToDBValues
          )
        )
      );
      setSelectDatabaseMode('select');
      setNewDatabaseName('');
      setIsDatabaseNew(false);
      setNewTableName('');
      setIsCreateTableNameEditorOpen(mode === 'create');
      setIsSelectTableBrowserOpen(mode === 'select');
      setNotice(null);
      resetCreateSqlState();
    },
    [
      resetCreateSqlState,
      resetTargetWriteConfig,
      selectTableMode,
      setLocalInputData,
    ]
  );

  const handleCreateTableInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleCreateTableSave();
      }
    },
    [handleCreateTableSave]
  );

  const clearSelectedTable = useCallback(() => {
    setLocalInputData(prev =>
      resetTargetWriteConfig({
        ...((prev ?? {}) as WriteDataFrameToDBValues),
        table_name: null,
      })
    );
    setNotice(null);
    resetCreateSqlState();
  }, [resetCreateSqlState, resetTargetWriteConfig, setLocalInputData]);

  const handleDatabaseSelect = useCallback(
    (databaseName: string) => {
      setLocalInputData(prev => {
        const current = (prev ?? {}) as WriteDataFrameToDBValues;
        const shouldPreserveCreateTableName = selectTableMode === 'create';

        return resetTargetWriteConfig(
          buildWriteTargetAfterDatabaseChange(
            current,
            databaseName || null,
            shouldPreserveCreateTableName
          )
        );
      });
      setSelectDatabaseMode('select');
      setIsDatabaseNew(false);
      setNotice(null);
      resetCreateSqlState();
    },
    [
      resetCreateSqlState,
      resetTargetWriteConfig,
      selectTableMode,
      setLocalInputData,
    ]
  );

  const handleDatabaseCreateSave = useCallback(async () => {
    const databaseName = newDatabaseName.trim();
    if (!databaseName) {
      return;
    }

    if (!inputConnectionMetadata) {
      setNotice({
        severity: 'warning',
        message: 'Нельзя создать базу данных без connection metadata.',
      });
      return;
    }

    setCreatingEntity('database');
    setNotice(null);
    try {
      await createDatabase({
        connection_id: requireDbConnectionId(inputConnectionMetadata),
        database_name: databaseName,
      });
      dispatch(
        invalidateDbCatalog(requireDbConnectionId(inputConnectionMetadata))
      );
      setSharedState(prev => registerCreatedDatabase(prev, databaseName));
      setNewDatabaseName('');
      handleDatabaseSelect(databaseName);
      setNotice({
        severity: 'success',
        message: `База данных "${databaseName}" создана.`,
      });
    } catch (error: unknown) {
      setNotice({
        severity: 'error',
        message: extractApiErrorMessage(
          error,
          `Не удалось создать базу данных "${databaseName}".`
        ),
      });
    } finally {
      setCreatingEntity(null);
    }
  }, [
    createDatabase,
    dispatch,
    handleDatabaseSelect,
    inputConnectionMetadata,
    newDatabaseName,
    setSharedState,
  ]);

  const handleEditSelectedTable = useCallback(() => {
    clearSelectedTable();
    setIsSelectTableBrowserOpen(true);
  }, [clearSelectedTable]);

  const handleEditCreatedTableName = useCallback(() => {
    const currentTableName = literalTableName ?? '';
    clearSelectedTable();
    setNewTableName(currentTableName);
    setIsCreateTableNameEditorOpen(true);
  }, [clearSelectedTable, literalTableName]);

  const handleSchemaSelect = useCallback(
    (schemaName: string) => {
      setLocalInputData(prev =>
        resetTargetWriteConfig({
          ...((prev ?? {}) as WriteDataFrameToDBValues),
          schema_name: schemaName,
          table_name: null,
        })
      );
      setSelectSchemaMode('select');
      setIsSchemaNew(false);
      setNotice(null);
      resetCreateSqlState();
    },
    [resetCreateSqlState, resetTargetWriteConfig, setLocalInputData]
  );

  const handleSchemaCreateSave = useCallback(async () => {
    const name = newSchemaName.trim();
    if (!name) return;

    if (!inputConnectionMetadata) {
      setNotice({
        severity: 'warning',
        message: 'Нельзя создать схему без connection metadata.',
      });
      return;
    }

    setCreatingEntity('schema');
    setNotice(null);
    try {
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
      resetCreateSqlState();
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
    resetCreateSqlState,
    resetTargetWriteConfig,
    setLocalInputData,
    setSharedState,
  ]);

  const handleWriteModeChange = useCallback(
    (mode: string) => {
      if (
        !mode ||
        !writeModeOptions.includes(mode) ||
        isWriteModeDisabled(mode)
      ) {
        return;
      }

      setLocalInputData(prev => ({
        ...(prev ?? {}),
        write_mode: mode,
        upsert_config:
          mode.toLowerCase() === 'upsert'
            ? (prev?.upsert_config ?? null)
            : null,
      }));

      setSharedState(prev => ({
        ...(prev ?? {}),
        createSqlError: null,
        createTableError: null,
        createTableSuccess: null,
        lastCreateSqlKey: prev?.lastCreateSqlKey ?? null,
      }));
    },
    [isWriteModeDisabled, setLocalInputData, setSharedState, writeModeOptions]
  );

  const handleUpsertKeyChange = useCallback(
    (keyColumn: string) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        upsert_config: keyColumn.trim()
          ? { key_column: keyColumn.trim() }
          : null,
      }));
    },
    [setLocalInputData]
  );

  const updateTypedSpecDraft = useCallback(
    (updater: (current: TypedSpecDraft) => TypedSpecDraft) => {
      setSharedState(prev => {
        const currentDraft =
          prev?.typedSpecDraft ?? createDefaultTypedSpecDraft();
        return {
          ...(prev ?? {}),
          typedSpecDraft: updater(currentDraft),
        };
      });
    },
    [setSharedState]
  );

  const updateIndexDraft = useCallback(
    (id: string, updater: (current: DraftIndexSpec) => DraftIndexSpec) => {
      updateTypedSpecDraft(current => ({
        ...current,
        indexes: current.indexes.map(index =>
          index.id === id ? updater(index) : index
        ),
      }));
    },
    [updateTypedSpecDraft]
  );

  const updateForeignKeyDraft = useCallback(
    (
      id: string,
      updater: (current: DraftForeignKeySpec) => DraftForeignKeySpec
    ) => {
      updateTypedSpecDraft(current => ({
        ...current,
        foreignKeys: current.foreignKeys.map(foreignKey =>
          foreignKey.id === id ? updater(foreignKey) : foreignKey
        ),
      }));
    },
    [updateTypedSpecDraft]
  );

  const handleCreationModeChange = useCallback(
    (mode: CreationMode) => {
      setSharedState(prev => ({
        ...(prev ?? {}),
        selectedCreationMode: mode,
        typedSpecDraft: prev?.typedSpecDraft ?? createDefaultTypedSpecDraft(),
        ...(mode === 'typed' && prev?.selectedCreationMode !== 'typed'
          ? {
              typedPreviewSql: null,
              lastCreateSqlKey: null,
              createSqlError: null,
            }
          : {}),
      }));
      ensureCreateSqlSectionOpen();

      if (mode === 'typed') {
        window.setTimeout(() => {
          scrollSchemaStrategyToBottom();
        }, 260);
      }
    },
    [ensureCreateSqlSectionOpen, scrollSchemaStrategyToBottom, setSharedState]
  );

  const shouldShowSqlEditor = shouldShowCreateTableSql(
    localInputData,
    isTableNew,
    selectedCreationMode
  );

  const serializedTypedSpec = useMemo(() => {
    return serializeTypedSpecDraft(typedSpecDraft);
  }, [typedSpecDraft]);

  const normalizedTypedSpecForDialect = useMemo(() => {
    if (!serializedTypedSpec) {
      return null;
    }

    if (isClickHouse) {
      return serializedTypedSpec;
    }

    return {
      ...serializedTypedSpec,
      clickhouse: null,
    };
  }, [isClickHouse, serializedTypedSpec]);

  useEffect(() => {
    setLocalInputData(prev => {
      const current = prev ?? {};

      if (!isTableNew || selectedCreationMode !== 'typed') {
        if (current.table_create_spec == null) {
          return prev;
        }
        return {
          ...current,
          table_create_spec: null,
        };
      }

      const nextSpec = normalizedTypedSpecForDialect as any;
      const currentSpec = current.table_create_spec ?? null;
      if (JSON.stringify(currentSpec) === JSON.stringify(nextSpec)) {
        return prev;
      }

      return {
        ...current,
        table_create_spec: nextSpec,
      };
    });
  }, [
    isTableNew,
    normalizedTypedSpecForDialect,
    selectedCreationMode,
    setLocalInputData,
  ]);

  const rawCreateSqlCacheKey = useMemo(() => {
    return buildCreateSqlCacheKey(
      localInputData,
      inputDataframeMetadata,
      inputConnectionMetadata
    );
  }, [inputConnectionMetadata, inputDataframeMetadata, localInputData]);

  const typedCreateSqlCacheKey = useMemo(() => {
    return [
      rawCreateSqlCacheKey,
      'typed',
      JSON.stringify(normalizedTypedSpecForDialect ?? null),
    ].join('::');
  }, [normalizedTypedSpecForDialect, rawCreateSqlCacheKey]);

  const canFetchRawCreateSql = Boolean(
    shouldShowSqlEditor &&
    literalTableName &&
    isCreateDatabaseSelected &&
    isCreateSchemaSelected &&
    inputConnectionMetadata &&
    inputDataframeMetadata
  );

  const canFetchTypedPreviewSql = Boolean(
    selectedCreationMode === 'typed' &&
    isTableNew &&
    literalTableName &&
    isCreateDatabaseSelected &&
    isCreateSchemaSelected &&
    inputConnectionMetadata &&
    inputDataframeMetadata
  );

  const typedPreviewSql = sharedState?.typedPreviewSql ?? '';

  const fetchCreateTableSql = useCallback(
    async ({
      forceRefresh = false,
      mode,
    }: {
      forceRefresh?: boolean;
      mode: 'raw' | 'typed';
    }) => {
      if (!literalTableName) {
        return;
      }
      if (!isCreateDatabaseSelected || !isCreateSchemaSelected) {
        return;
      }
      if (!inputConnectionMetadata || !inputDataframeMetadata) {
        return;
      }

      const requestKey =
        mode === 'typed' ? typedCreateSqlCacheKey : rawCreateSqlCacheKey;
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

      ensureCreateSqlSectionOpen();

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
              dataframe_metadata: inputDataframeMetadata,
              connection_id: requireDbConnectionId(inputConnectionMetadata),
              table_name: literalTableName,
              database_name: literalDatabaseName,
              schema_name: literalSchemaName,
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
          lastCreateSqlKey: requestKey,
          createSqlError: extractApiErrorMessage(
            error,
            'Не удалось получить SQL для создания таблицы.'
          ),
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
      rawCreateSqlCacheKey,
      typedCreateSqlCacheKey,
      typedPreviewSql,
      literalDatabaseName,
      literalSchemaName,
      literalTableName,
      localInputData?.create_table_sql,
      setLocalInputData,
      setSharedState,
      isCreateDatabaseSelected,
      isCreateSchemaSelected,
      normalizedTypedSpecForDialect,
      sharedState?.lastCreateSqlKey,
      ensureCreateSqlSectionOpen,
    ]
  );

  const isCreateTableSqlSectionOpen = isSectionOpen('schema-strategy');

  const copySqlToClipboard = useCallback(async (sql: string) => {
    if (!sql.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(sql);
      setIsSqlCopied(true);

      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }

      copyFeedbackTimeoutRef.current = window.setTimeout(() => {
        setIsSqlCopied(false);
        copyFeedbackTimeoutRef.current = null;
      }, 2000);
    } catch {
      setIsSqlCopied(false);
    }
  }, []);

  const handleCopyCreateSql = useCallback(async () => {
    await copySqlToClipboard(localInputData?.create_table_sql ?? '');
  }, [copySqlToClipboard, localInputData?.create_table_sql]);

  const handleCopyTypedPreviewSql = useCallback(async () => {
    await copySqlToClipboard(typedPreviewSql);
  }, [copySqlToClipboard, typedPreviewSql]);

  const handleToggleCreateSqlError = useCallback(() => {
    setIsCreateSqlErrorExpanded(prev => !prev);
  }, []);

  const handleDismissCreateSqlError = useCallback(() => {
    setIsCreateSqlErrorDismissed(true);
    setIsCreateSqlErrorExpanded(false);
    setIsCreateSqlErrorCopied(false);
  }, []);

  const handleCopyCreateSqlError = useCallback(async () => {
    if (!createSqlErrorMessage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createSqlErrorMessage);
      setIsCreateSqlErrorCopied(true);

      if (copyCreateSqlErrorTimeoutRef.current !== null) {
        window.clearTimeout(copyCreateSqlErrorTimeoutRef.current);
      }

      copyCreateSqlErrorTimeoutRef.current = window.setTimeout(() => {
        setIsCreateSqlErrorCopied(false);
        copyCreateSqlErrorTimeoutRef.current = null;
      }, 2000);
    } catch {
      setIsCreateSqlErrorCopied(false);
    }
  }, [createSqlErrorMessage]);

  const handleToggleCreateTableError = useCallback(() => {
    setIsCreateTableErrorExpanded(prev => !prev);
  }, []);

  const handleDismissCreateTableError = useCallback(() => {
    setIsCreateTableErrorDismissed(true);
    setIsCreateTableErrorExpanded(false);
    setIsCreateTableErrorCopied(false);
  }, []);

  const handleCopyCreateTableError = useCallback(async () => {
    if (!createTableErrorMessage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createTableErrorMessage);
      setIsCreateTableErrorCopied(true);

      if (copyCreateTableErrorTimeoutRef.current !== null) {
        window.clearTimeout(copyCreateTableErrorTimeoutRef.current);
      }

      copyCreateTableErrorTimeoutRef.current = window.setTimeout(() => {
        setIsCreateTableErrorCopied(false);
        copyCreateTableErrorTimeoutRef.current = null;
      }, 2000);
    } catch {
      setIsCreateTableErrorCopied(false);
    }
  }, [createTableErrorMessage]);

  useEffect(() => {
    if (!isOpen || !canFetchRawCreateSql) return;
    if (sharedState?.isCreateSqlLoading) return;
    if (sharedState?.lastCreateSqlKey === rawCreateSqlCacheKey) return;

    void fetchCreateTableSql({ mode: 'raw', forceRefresh: false });
  }, [
    canFetchRawCreateSql,
    rawCreateSqlCacheKey,
    fetchCreateTableSql,
    isOpen,
    sharedState?.isCreateSqlLoading,
    sharedState?.lastCreateSqlKey,
  ]);

  useEffect(() => {
    if (!isCreateTableSqlSectionOpen) {
      return;
    }
    if (!shouldShowSqlEditor) {
      return;
    }

    const timer = window.setTimeout(() => {
      scrollCreateSqlIntoViewIfNeeded();
    }, 260);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    isCreateTableSqlSectionOpen,
    shouldShowSqlEditor,
    localInputData?.create_table_sql,
    scrollCreateSqlIntoViewIfNeeded,
  ]);

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarGutter: 'stable',
      }}
    >
      <AccordionContainer>
        <ConnectionSection
          connectionId={inputConnectionMetadata?.connection_id}
          dialect={inputConnectionMetadata?.dialect}
          isOpen={isSectionOpen('connection')}
          onToggle={handleToggleConnectionSection}
        />

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
            onClear={handleClearDatabaseSelection}
            onCreateModeSelect={handleDatabaseSelectModeChange}
            onDatabaseSelect={handleDatabaseSelect}
            onNewDatabaseNameChange={setNewDatabaseName}
            onSave={() => void handleDatabaseCreateSave()}
            onToggle={handleToggleDatabaseSection}
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
            onClear={handleClearSchemaSelection}
            onCreateModeSelect={handleSchemaSelectModeChange}
            onNewSchemaNameChange={setNewSchemaName}
            onSave={() => void handleSchemaCreateSave()}
            onSchemaSelect={handleSchemaSelect}
            onToggle={handleToggleSchemaSection}
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
                }
              : {})}
          />
        ) : null}

        <TableSection
          blockedMessage={
            hasSelectedDatabase ? null : DATABASE_SELECTION_REQUIRED_MESSAGE
          }
          dataframeColumns={dataframeColumns}
          inputConnectionMetadata={inputConnectionMetadata}
          inputDefinition={tableInputDef}
          isCreateTableNameEditorOpen={isCreateTableNameEditorOpen}
          isOpen={isSectionOpen('table')}
          isSelectTableBrowserOpen={isSelectTableBrowserOpen}
          isWriteModeDisabled={isWriteModeDisabled}
          localizedWriteModeDescription={localizedWriteModeDescription}
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
          onToggle={handleToggleTableSection}
          onUpsertKeyChange={handleUpsertKeyChange}
          onWriteModeChange={handleWriteModeChange}
          selectedTable={
            isLazyCatalog ? catalog.selectedTableItem : selectedTable
          }
          selectedTableLabel={selectedTableLabel}
          selectedWriteMode={selectedWriteMode}
          selectTableMode={selectTableMode}
          tables={isLazyCatalog ? catalog.tableItems : filteredTables}
          upsertKeyColumn={localInputData?.upsert_config?.key_column ?? ''}
          value={localInputData?.table_name}
          variables={variables}
          writeModeDisplayOptions={writeModeDisplayOptions}
          writeModeOptions={writeModeOptions}
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
              }
            : {})}
        />

        <SchemaStrategySection
          blockedMessage={
            hasSelectedDatabase ? null : DATABASE_SELECTION_REQUIRED_MESSAGE
          }
          creationMode={selectedCreationMode}
          isOpen={isSectionOpen('schema-strategy')}
          isTableNew={isTableNew}
          onToggle={handleToggleSchemaStrategySection}
          shouldShowSqlEditor={shouldShowSqlEditor}
        >
          <Stack gap={1.5}>
            {isTableNew && (
              <SchemaSegmentedControl>
                <SchemaSegmentButton
                  type='button'
                  selected={selectedCreationMode === 'raw'}
                  aria-pressed={selectedCreationMode === 'raw'}
                  onClick={() => handleCreationModeChange('raw')}
                >
                  Raw DDL SQL
                </SchemaSegmentButton>
                <SchemaSegmentButton
                  type='button'
                  selected={selectedCreationMode === 'typed'}
                  aria-pressed={selectedCreationMode === 'typed'}
                  onClick={() => handleCreationModeChange('typed')}
                >
                  Typed Table spec
                </SchemaSegmentButton>
              </SchemaSegmentedControl>
            )}

            {selectedCreationMode === 'typed' ? (
              isTableNew ? (
                <>
                  {(!isClickHouse ||
                    SHOW_TYPED_PRIMARY_KEY_COLUMNS_FOR_CLICKHOUSE) && (
                    <FieldGroup sx={{ mb: 0 }}>
                      <FieldLabel>Primary key columns</FieldLabel>
                      <MultiSelectColumnPicker
                        columns={typedPickerColumns}
                        selectedColumns={typedSpecDraft.primaryKeyColumns}
                        onChange={selectedColumns => {
                          updateTypedSpecDraft(current => ({
                            ...current,
                            primaryKeyColumns: selectedColumns,
                          }));
                        }}
                        placeholder='Добавьте колонку в primary key...'
                      />
                    </FieldGroup>
                  )}

                  {!isClickHouse && (
                    <>
                      <FieldGroup sx={{ mb: 0 }}>
                        <AccSection>
                          <AccSectionHeader>
                            <AccSectionTitle>Indexes</AccSectionTitle>
                            <AccAddButton
                              type='button'
                              onClick={() => {
                                updateTypedSpecDraft(current => ({
                                  ...current,
                                  indexes: [
                                    ...current.indexes,
                                    {
                                      id: makeDraftId('idx'),
                                      name: '',
                                      columns: [],
                                      unique: false,
                                    },
                                  ],
                                }));
                              }}
                            >
                              <svg
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M12 4v16m8-8H4'
                                />
                              </svg>
                              Добавить индекс
                            </AccAddButton>
                          </AccSectionHeader>

                          {typedSpecDraft.indexes.length === 0 ? (
                            <AccEmptyState>
                              <AccEmptyIcon variant='index'>
                                <svg
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={1.5}
                                    d='M4 6h16M4 10h16M4 14h16M4 18h16'
                                  />
                                </svg>
                              </AccEmptyIcon>
                              <AccEmptyText>Нет индексов</AccEmptyText>
                            </AccEmptyState>
                          ) : (
                            <AccCardsContainer>
                              {typedSpecDraft.indexes.map(index => {
                                const isExpanded = expandedIndexCards.includes(
                                  index.id
                                );
                                const title =
                                  index.name.trim() || 'Новый индекс';
                                const subtitle = `${getColumnsCountLabel(index.columns.length)} • ${
                                  index.unique ? 'Unique' : 'Non-unique'
                                }`;

                                return (
                                  <AccCard
                                    key={index.id}
                                    isExpanded={isExpanded}
                                  >
                                    <AccCardHeader
                                      onClick={() => toggleIndexCard(index.id)}
                                      role='button'
                                      tabIndex={0}
                                      onKeyDown={event => {
                                        if (
                                          event.key === 'Enter' ||
                                          event.key === ' '
                                        ) {
                                          event.preventDefault();
                                          toggleIndexCard(index.id);
                                        }
                                      }}
                                    >
                                      <AccCardIcon
                                        variant='index'
                                        isExpanded={isExpanded}
                                      >
                                        <svg
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M4 6h16M4 10h16M4 14h16M4 18h16'
                                          />
                                        </svg>
                                      </AccCardIcon>

                                      <AccCardHeaderContent>
                                        <AccCardTitle>{title}</AccCardTitle>
                                        <AccCardSubtitle>
                                          {subtitle}
                                        </AccCardSubtitle>
                                      </AccCardHeaderContent>

                                      <AccCardBadge
                                        variant={
                                          index.unique ? 'unique' : 'non-unique'
                                        }
                                      >
                                        {index.unique ? 'Unique' : 'Non-unique'}
                                      </AccCardBadge>

                                      <AccHeaderDeleteButton
                                        className='delete-button'
                                        type='button'
                                        onClick={event => {
                                          event.stopPropagation();
                                          updateTypedSpecDraft(current => ({
                                            ...current,
                                            indexes: current.indexes.filter(
                                              item => item.id !== index.id
                                            ),
                                          }));
                                        }}
                                      >
                                        <svg
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                          />
                                        </svg>
                                      </AccHeaderDeleteButton>

                                      <AccExpandIcon
                                        isExpanded={isExpanded}
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                      >
                                        <path
                                          strokeLinecap='round'
                                          strokeLinejoin='round'
                                          strokeWidth={2}
                                          d='M19 9l-7 7-7-7'
                                        />
                                      </AccExpandIcon>
                                    </AccCardHeader>

                                    <Collapse in={isExpanded}>
                                      <AccCardBody>
                                        <AccFormField>
                                          <AccFormLabel>
                                            Имя индекса (опционально)
                                          </AccFormLabel>
                                          <AccFieldInput
                                            type='text'
                                            placeholder='idx_...'
                                            value={index.name}
                                            onChange={event => {
                                              updateIndexDraft(
                                                index.id,
                                                current => ({
                                                  ...current,
                                                  name: event.target.value,
                                                })
                                              );
                                            }}
                                          />
                                        </AccFormField>

                                        <AccFormField>
                                          <AccFormLabel>Колонки</AccFormLabel>
                                          <MultiSelectColumnPicker
                                            columns={typedPickerColumns}
                                            selectedColumns={index.columns}
                                            onChange={selectedColumns => {
                                              updateIndexDraft(
                                                index.id,
                                                current => ({
                                                  ...current,
                                                  columns: selectedColumns,
                                                })
                                              );
                                            }}
                                            placeholder='Выберите колонки...'
                                          />
                                        </AccFormField>

                                        <AccFormField>
                                          <AccFormLabel>Тип</AccFormLabel>
                                          <AccToggleContainer>
                                            <AccToggleOption
                                              type='button'
                                              isActive={!index.unique}
                                              onClick={() => {
                                                updateIndexDraft(
                                                  index.id,
                                                  current => ({
                                                    ...current,
                                                    unique: false,
                                                  })
                                                );
                                              }}
                                            >
                                              Non-unique
                                            </AccToggleOption>
                                            <AccToggleOption
                                              type='button'
                                              isActive={index.unique}
                                              onClick={() => {
                                                updateIndexDraft(
                                                  index.id,
                                                  current => ({
                                                    ...current,
                                                    unique: true,
                                                  })
                                                );
                                              }}
                                            >
                                              Unique
                                            </AccToggleOption>
                                          </AccToggleContainer>
                                        </AccFormField>
                                      </AccCardBody>
                                    </Collapse>
                                  </AccCard>
                                );
                              })}
                            </AccCardsContainer>
                          )}
                        </AccSection>
                      </FieldGroup>
                      {SHOW_FOREIGN_KEYS_SECTION && (
                        <FieldGroup sx={{ mb: 0 }}>
                          <AccSection sx={{ mb: 0 }}>
                            <AccSectionHeader>
                              <AccSectionTitle>Foreign Keys</AccSectionTitle>
                              <AccAddButton
                                type='button'
                                onClick={() => {
                                  updateTypedSpecDraft(current => ({
                                    ...current,
                                    foreignKeys: [
                                      ...current.foreignKeys,
                                      {
                                        id: makeDraftId('fk'),
                                        name: '',
                                        columns: [],
                                        ref_table: '',
                                        ref_schema: '',
                                        ref_columns: [],
                                      },
                                    ],
                                  }));
                                }}
                              >
                                <svg
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 4v16m8-8H4'
                                  />
                                </svg>
                                Добавить FK
                              </AccAddButton>
                            </AccSectionHeader>

                            {typedSpecDraft.foreignKeys.length === 0 ? (
                              <AccEmptyState>
                                <AccEmptyIcon variant='fk'>
                                  <svg
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={1.5}
                                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                                    />
                                  </svg>
                                </AccEmptyIcon>
                                <AccEmptyText>Нет внешних ключей</AccEmptyText>
                              </AccEmptyState>
                            ) : (
                              <AccCardsContainer>
                                {typedSpecDraft.foreignKeys.map(foreignKey => {
                                  const isExpanded =
                                    expandedForeignKeyCards.includes(
                                      foreignKey.id
                                    );
                                  const title =
                                    foreignKey.name.trim() ||
                                    'Новый Foreign Key';
                                  const subtitle =
                                    foreignKey.columns.length === 0 ||
                                    !foreignKey.ref_table.trim()
                                      ? 'Не настроен'
                                      : `${foreignKey.columns.join(', ')} → ${
                                          foreignKey.ref_table
                                        }.${
                                          foreignKey.ref_columns.join(', ') ||
                                          '...'
                                        }`;
                                  const hasCurrentSchemaInOptions =
                                    !foreignKey.ref_schema.trim() ||
                                    foreignKeySchemaOptions.some(option => {
                                      return (
                                        normalizeName(option.name) ===
                                        normalizeName(foreignKey.ref_schema)
                                      );
                                    });
                                  const foreignKeySchemaSelectorOptions =
                                    hasCurrentSchemaInOptions
                                      ? foreignKeySchemaOptions
                                      : [
                                          ...foreignKeySchemaOptions,
                                          {
                                            name: foreignKey.ref_schema.trim(),
                                            type: 'custom',
                                          },
                                        ];
                                  const shouldRequireSchemaSelection =
                                    foreignKeySchemaSelectorOptions.length > 0;
                                  const canSelectReferencedTable =
                                    !shouldRequireSchemaSelection ||
                                    Boolean(foreignKey.ref_schema.trim());
                                  const foreignKeyTableOptions =
                                    canSelectReferencedTable
                                      ? getForeignKeyTableOptions(
                                          foreignKey.ref_schema
                                        )
                                      : [];
                                  const hasCurrentTableInOptions =
                                    !foreignKey.ref_table.trim() ||
                                    foreignKeyTableOptions.some(option => {
                                      return (
                                        normalizeName(option.name) ===
                                        normalizeName(foreignKey.ref_table)
                                      );
                                    });
                                  const foreignKeyTableSelectorOptions =
                                    hasCurrentTableInOptions
                                      ? foreignKeyTableOptions
                                      : [
                                          ...foreignKeyTableOptions,
                                          {
                                            name: foreignKey.ref_table.trim(),
                                            type: 'custom',
                                          },
                                        ];
                                  const referencedColumnOptions =
                                    getForeignKeyReferencedColumns(
                                      foreignKey.ref_schema,
                                      foreignKey.ref_table
                                    );
                                  const referencedColumnNames = new Set(
                                    referencedColumnOptions.map(column =>
                                      normalizeName(column.name)
                                    )
                                  );

                                  return (
                                    <AccCard
                                      key={foreignKey.id}
                                      isExpanded={isExpanded}
                                    >
                                      <AccCardHeader
                                        onClick={() =>
                                          toggleForeignKeyCard(foreignKey.id)
                                        }
                                        role='button'
                                        tabIndex={0}
                                        onKeyDown={event => {
                                          if (
                                            event.key === 'Enter' ||
                                            event.key === ' '
                                          ) {
                                            event.preventDefault();
                                            toggleForeignKeyCard(foreignKey.id);
                                          }
                                        }}
                                      >
                                        <AccCardIcon
                                          variant='fk'
                                          isExpanded={isExpanded}
                                        >
                                          <svg
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                          >
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth={2}
                                              d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                                            />
                                          </svg>
                                        </AccCardIcon>

                                        <AccCardHeaderContent>
                                          <AccCardTitle>{title}</AccCardTitle>
                                          <AccCardSubtitle>
                                            {subtitle}
                                          </AccCardSubtitle>
                                        </AccCardHeaderContent>

                                        <AccHeaderDeleteButton
                                          className='delete-button'
                                          type='button'
                                          onClick={event => {
                                            event.stopPropagation();
                                            updateTypedSpecDraft(current => ({
                                              ...current,
                                              foreignKeys:
                                                current.foreignKeys.filter(
                                                  item =>
                                                    item.id !== foreignKey.id
                                                ),
                                            }));
                                          }}
                                        >
                                          <svg
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                          >
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth={2}
                                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                            />
                                          </svg>
                                        </AccHeaderDeleteButton>

                                        <AccExpandIcon
                                          isExpanded={isExpanded}
                                          viewBox='0 0 24 24'
                                          fill='none'
                                          stroke='currentColor'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 9l-7 7-7-7'
                                          />
                                        </AccExpandIcon>
                                      </AccCardHeader>

                                      <Collapse in={isExpanded}>
                                        <AccCardBody>
                                          <AccFormField>
                                            <AccFormLabel>
                                              Имя ограничения (опционально)
                                            </AccFormLabel>
                                            <AccFieldInput
                                              type='text'
                                              placeholder='fk_...'
                                              value={foreignKey.name}
                                              onChange={event => {
                                                updateForeignKeyDraft(
                                                  foreignKey.id,
                                                  current => ({
                                                    ...current,
                                                    name: event.target.value,
                                                  })
                                                );
                                              }}
                                            />
                                          </AccFormField>

                                          <AccFormField>
                                            <AccFormLabel>
                                              Колонки внешнего ключа
                                            </AccFormLabel>
                                            <MultiSelectColumnPicker
                                              columns={typedPickerColumns}
                                              selectedColumns={
                                                foreignKey.columns
                                              }
                                              onChange={selectedColumns => {
                                                updateForeignKeyDraft(
                                                  foreignKey.id,
                                                  current => ({
                                                    ...current,
                                                    columns: selectedColumns,
                                                  })
                                                );
                                              }}
                                              placeholder='Выберите колонки...'
                                            />
                                          </AccFormField>

                                          <AccFormField>
                                            <AccFormLabel>
                                              Referenced schema (optional)
                                            </AccFormLabel>
                                            <ColumnDropdownSelect
                                              value={foreignKey.ref_schema}
                                              onChange={value => {
                                                updateForeignKeyDraft(
                                                  foreignKey.id,
                                                  current => {
                                                    const nextTableOptions =
                                                      getForeignKeyTableOptions(
                                                        value
                                                      );
                                                    const canKeepCurrentTable =
                                                      nextTableOptions.some(
                                                        option => {
                                                          return (
                                                            normalizeName(
                                                              option.name
                                                            ) ===
                                                            normalizeName(
                                                              current.ref_table
                                                            )
                                                          );
                                                        }
                                                      );
                                                    const nextTable =
                                                      canKeepCurrentTable
                                                        ? current.ref_table
                                                        : '';
                                                    const allowedRefColumns =
                                                      new Set(
                                                        getForeignKeyReferencedColumns(
                                                          value,
                                                          nextTable
                                                        ).map(column =>
                                                          normalizeName(
                                                            column.name
                                                          )
                                                        )
                                                      );
                                                    return {
                                                      ...current,
                                                      ref_schema: value,
                                                      ref_table: nextTable,
                                                      ref_columns:
                                                        current.ref_columns.filter(
                                                          refColumn => {
                                                            return allowedRefColumns.has(
                                                              normalizeName(
                                                                refColumn
                                                              )
                                                            );
                                                          }
                                                        ),
                                                    };
                                                  }
                                                );
                                              }}
                                              columns={toColumnSelectorOptions(
                                                foreignKeySchemaSelectorOptions
                                              )}
                                              placeholder={
                                                foreignKeySchemaSelectorOptions.length ===
                                                0
                                                  ? 'Нет схем в metadata'
                                                  : 'Выберите схему...'
                                              }
                                              disabled={
                                                foreignKeySchemaSelectorOptions.length ===
                                                0
                                              }
                                            />
                                          </AccFormField>

                                          <AccFormField>
                                            <AccFormLabel>
                                              Referenced table
                                            </AccFormLabel>
                                            <ColumnDropdownSelect
                                              value={foreignKey.ref_table}
                                              onChange={value => {
                                                updateForeignKeyDraft(
                                                  foreignKey.id,
                                                  current => {
                                                    const allowedRefColumns =
                                                      new Set(
                                                        getForeignKeyReferencedColumns(
                                                          current.ref_schema,
                                                          value
                                                        ).map(column =>
                                                          normalizeName(
                                                            column.name
                                                          )
                                                        )
                                                      );
                                                    return {
                                                      ...current,
                                                      ref_table: value,
                                                      ref_columns:
                                                        current.ref_columns.filter(
                                                          refColumn => {
                                                            return allowedRefColumns.has(
                                                              normalizeName(
                                                                refColumn
                                                              )
                                                            );
                                                          }
                                                        ),
                                                    };
                                                  }
                                                );
                                              }}
                                              columns={toColumnSelectorOptions(
                                                foreignKeyTableSelectorOptions
                                              )}
                                              placeholder={
                                                canSelectReferencedTable
                                                  ? foreignKeyTableSelectorOptions.length ===
                                                    0
                                                    ? 'Нет таблиц в выбранной схеме'
                                                    : 'Выберите таблицу...'
                                                  : 'Сначала выберите схему'
                                              }
                                              disabled={
                                                !canSelectReferencedTable ||
                                                foreignKeyTableSelectorOptions.length ===
                                                  0
                                              }
                                            />
                                          </AccFormField>

                                          <AccFormField>
                                            <AccFormLabel>
                                              Referenced columns
                                            </AccFormLabel>
                                            <MultiSelectColumnPicker
                                              columns={referencedColumnOptions}
                                              selectedColumns={foreignKey.ref_columns.filter(
                                                refColumn => {
                                                  return referencedColumnNames.has(
                                                    normalizeName(refColumn)
                                                  );
                                                }
                                              )}
                                              onChange={selectedColumns => {
                                                updateForeignKeyDraft(
                                                  foreignKey.id,
                                                  current => ({
                                                    ...current,
                                                    ref_columns:
                                                      selectedColumns,
                                                  })
                                                );
                                              }}
                                              placeholder='Выберите колонки...'
                                            />
                                          </AccFormField>
                                        </AccCardBody>
                                      </Collapse>
                                    </AccCard>
                                  );
                                })}
                              </AccCardsContainer>
                            )}
                          </AccSection>
                        </FieldGroup>
                      )}
                    </>
                  )}

                  {isClickHouse && (
                    <FieldGroup sx={{ mb: 0 }}>
                      <Stack gap={1.5}>
                        <Box>
                          <FieldLabel>Engine</FieldLabel>
                          <ColumnDropdownSelect
                            value={typedSpecDraft.clickhouse.engineName}
                            onChange={nextEngine => {
                              updateTypedSpecDraft(current => ({
                                ...current,
                                clickhouse: {
                                  ...current.clickhouse,
                                  engineName: nextEngine,
                                },
                              }));
                            }}
                            columns={clickhouseEngineColumns}
                            placeholder='Выберите ClickHouse engine...'
                          />
                        </Box>

                        <Box>
                          <FieldLabel>Order by</FieldLabel>
                          <MultiSelectColumnPicker
                            columns={typedPickerColumns}
                            selectedColumns={typedSpecDraft.clickhouse.orderBy}
                            onChange={selectedColumns => {
                              updateTypedSpecDraft(current => ({
                                ...current,
                                clickhouse: {
                                  ...current.clickhouse,
                                  orderBy: selectedColumns,
                                },
                              }));
                            }}
                            placeholder='Добавьте колонку в order_by...'
                          />
                        </Box>

                        <Box>
                          <FieldLabel>Partition by</FieldLabel>
                          <MultiSelectColumnPicker
                            columns={typedPickerColumns}
                            selectedColumns={
                              typedSpecDraft.clickhouse.partitionBy
                            }
                            onChange={selectedColumns => {
                              updateTypedSpecDraft(current => ({
                                ...current,
                                clickhouse: {
                                  ...current.clickhouse,
                                  partitionBy: selectedColumns,
                                },
                              }));
                            }}
                            placeholder='Добавьте колонку в partition_by...'
                          />
                        </Box>

                        <Box>
                          <FieldLabel>Primary key</FieldLabel>
                          <MultiSelectColumnPicker
                            columns={typedPickerColumns}
                            selectedColumns={
                              typedSpecDraft.clickhouse.primaryKey
                            }
                            onChange={selectedColumns => {
                              updateTypedSpecDraft(current => ({
                                ...current,
                                clickhouse: {
                                  ...current.clickhouse,
                                  primaryKey: selectedColumns,
                                },
                              }));
                            }}
                            placeholder='Добавьте колонку в primary_key...'
                          />
                        </Box>
                      </Stack>
                    </FieldGroup>
                  )}

                  {typedSpecValidationError ? (
                    <Alert severity='warning'>{typedSpecValidationError}</Alert>
                  ) : null}

                  <FieldGroup sx={{ mb: 0 }}>
                    <Stack
                      direction='row'
                      alignItems='center'
                      justifyContent='space-between'
                      sx={{ mb: 0.75 }}
                    >
                      <FieldLabel style={{ marginBottom: 0 }}>
                        DDL preview
                      </FieldLabel>
                      <Stack direction='row' alignItems='center' gap={0.5}>
                        <ToolbarButton
                          type='button'
                          onClick={() =>
                            void fetchCreateTableSql({
                              mode: 'typed',
                              forceRefresh: true,
                            })
                          }
                          className={
                            sharedState?.isCreateSqlLoading ? 'refreshing' : ''
                          }
                          disabled={
                            !canFetchTypedPreviewSql ||
                            !!sharedState?.isCreateSqlLoading
                          }
                          title={
                            typedPreviewSql.trim()
                              ? 'Обновить preview'
                              : 'Сгенерировать preview'
                          }
                        >
                          <RefreshIcon />
                          {typedPreviewSql.trim()
                            ? 'Обновить'
                            : 'Сгенерировать'}
                        </ToolbarButton>
                        <ToolbarButton
                          type='button'
                          onClick={() => void handleCopyTypedPreviewSql()}
                          disabled={!typedPreviewSql.trim()}
                          title='Копировать'
                        >
                          <ContentCopyIcon />
                          {isSqlCopied ? 'Скопировано!' : 'Копировать'}
                        </ToolbarButton>
                      </Stack>
                    </Stack>

                    {!inputConnectionMetadata && (
                      <Alert severity='warning'>
                        Подключите вход `connection`, чтобы получить preview
                        DDL.
                      </Alert>
                    )}
                    {!inputDataframeMetadata && (
                      <Alert severity='warning'>
                        Подключите вход `df`, чтобы получить preview DDL.
                      </Alert>
                    )}
                    {createSqlErrorMessage && !isCreateSqlErrorDismissed && (
                      <Box sx={{ mb: 1 }}>
                        <SqlErrorBlockContainer>
                          <SqlErrorBanner>
                            <SqlErrorBannerContent>
                              <SqlErrorIconContainer>
                                <ErrorOutlineIcon />
                              </SqlErrorIconContainer>

                              <SqlErrorBannerTextContainer>
                                <SqlErrorTitle>
                                  Ошибка генерации DDL preview
                                </SqlErrorTitle>
                                {createSqlErrorSummary && (
                                  <SqlErrorSummary>
                                    {createSqlErrorSummary}
                                  </SqlErrorSummary>
                                )}

                                <SqlErrorActionsRow>
                                  <SqlErrorToggleDetailsButton
                                    onClick={handleToggleCreateSqlError}
                                    className={
                                      isCreateSqlErrorExpanded ? 'expanded' : ''
                                    }
                                    aria-label={
                                      isCreateSqlErrorExpanded
                                        ? 'Скрыть детали ошибки генерации DDL preview'
                                        : 'Показать детали ошибки генерации DDL preview'
                                    }
                                  >
                                    {isCreateSqlErrorExpanded
                                      ? 'Скрыть детали'
                                      : 'Показать детали'}
                                    <ExpandMoreIcon className='toggle-icon' />
                                  </SqlErrorToggleDetailsButton>
                                </SqlErrorActionsRow>
                              </SqlErrorBannerTextContainer>

                              <SqlErrorBannerActions>
                                <SqlErrorCloseButton
                                  type='button'
                                  onClick={handleDismissCreateSqlError}
                                  aria-label='Скрыть ошибку генерации DDL preview'
                                >
                                  <CloseIcon />
                                </SqlErrorCloseButton>
                              </SqlErrorBannerActions>
                            </SqlErrorBannerContent>
                          </SqlErrorBanner>

                          <Collapse in={isCreateSqlErrorExpanded}>
                            <SqlErrorDetailsContainer>
                              <SqlErrorDetailsHeader>
                                <SqlErrorDetailsHeaderTitle>
                                  Детали ошибки
                                </SqlErrorDetailsHeaderTitle>
                                <Tooltip
                                  title={
                                    isCreateSqlErrorCopied
                                      ? 'Скопировано'
                                      : 'Копировать ошибку'
                                  }
                                  arrow
                                  placement='top'
                                >
                                  <SqlErrorDetailsCopyButton
                                    type='button'
                                    onClick={() =>
                                      void handleCopyCreateSqlError()
                                    }
                                    aria-label='Копировать ошибку генерации DDL preview'
                                  >
                                    <ContentCopyIcon
                                      sx={{
                                        color: isCreateSqlErrorCopied
                                          ? 'success.main'
                                          : 'inherit',
                                      }}
                                    />
                                  </SqlErrorDetailsCopyButton>
                                </Tooltip>
                              </SqlErrorDetailsHeader>
                              <SqlErrorDetailsContent>
                                <SqlErrorMessageText>
                                  {createSqlErrorMessage}
                                </SqlErrorMessageText>
                              </SqlErrorDetailsContent>
                            </SqlErrorDetailsContainer>
                          </Collapse>
                        </SqlErrorBlockContainer>
                      </Box>
                    )}

                    {typedPreviewSql.trim() ? (
                      <TextField
                        fullWidth
                        multiline
                        minRows={6}
                        maxRows={16}
                        size='small'
                        value={typedPreviewSql}
                        slotProps={{
                          input: {
                            readOnly: true,
                            sx: {
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontSize: '0.85rem',
                              backgroundColor: '#fafafa',
                            },
                          },
                        }}
                      />
                    ) : (
                      <Alert severity='info' sx={{ borderRadius: 2 }}>
                        Нажмите «Сгенерировать», чтобы получить preview DDL.
                      </Alert>
                    )}
                  </FieldGroup>
                </>
              ) : (
                <Alert severity='info' sx={{ borderRadius: 2 }}>
                  Typed schema strategy доступна только для режима создания
                  новой таблицы.
                </Alert>
              )
            ) : shouldShowSqlEditor ? (
              <>
                <SQLToolbar>
                  <ToolbarHint>
                    Запрос можно отредактировать вручную перед выполнением.
                  </ToolbarHint>
                  <ToolbarActions>
                    <ToolbarButton
                      type='button'
                      onClick={() =>
                        void fetchCreateTableSql({
                          mode: 'raw',
                          forceRefresh: true,
                        })
                      }
                      className={
                        sharedState?.isCreateSqlLoading ? 'refreshing' : ''
                      }
                      disabled={
                        !canFetchRawCreateSql ||
                        !!sharedState?.isCreateSqlLoading
                      }
                      title='Обновить'
                    >
                      <RefreshIcon />
                      Обновить
                    </ToolbarButton>
                    <ToolbarButton
                      type='button'
                      onClick={() => void handleCopyCreateSql()}
                      disabled={!localInputData?.create_table_sql?.trim()}
                      title='Копировать'
                    >
                      <ContentCopyIcon />
                      {isSqlCopied ? 'Скопировано!' : 'Копировать'}
                    </ToolbarButton>
                  </ToolbarActions>
                </SQLToolbar>

                {!inputConnectionMetadata && (
                  <Alert severity='warning'>
                    Подключите вход `connection`, чтобы получить SQL для
                    создания таблицы.
                  </Alert>
                )}
                {!inputDataframeMetadata && (
                  <Alert severity='warning'>
                    Подключите вход `df`, чтобы получить SQL для создания
                    таблицы.
                  </Alert>
                )}
                {sharedState?.createSqlError && (
                  <Alert severity='error'>{sharedState.createSqlError}</Alert>
                )}
                {createTableErrorMessage && !isCreateTableErrorDismissed && (
                  <SqlErrorBlockContainer>
                    <SqlErrorBanner>
                      <SqlErrorBannerContent>
                        <SqlErrorIconContainer>
                          <ErrorOutlineIcon />
                        </SqlErrorIconContainer>

                        <SqlErrorBannerTextContainer>
                          <SqlErrorTitle>
                            Ошибка выполнения CREATE TABLE
                          </SqlErrorTitle>
                          {createTableErrorSummary && (
                            <SqlErrorSummary>
                              {createTableErrorSummary}
                            </SqlErrorSummary>
                          )}

                          <SqlErrorActionsRow>
                            <SqlErrorToggleDetailsButton
                              onClick={handleToggleCreateTableError}
                              className={
                                isCreateTableErrorExpanded ? 'expanded' : ''
                              }
                              aria-label={
                                isCreateTableErrorExpanded
                                  ? 'Скрыть детали ошибки создания таблицы'
                                  : 'Показать детали ошибки создания таблицы'
                              }
                            >
                              {isCreateTableErrorExpanded
                                ? 'Скрыть детали'
                                : 'Показать детали'}
                              <ExpandMoreIcon className='toggle-icon' />
                            </SqlErrorToggleDetailsButton>
                          </SqlErrorActionsRow>
                        </SqlErrorBannerTextContainer>

                        <SqlErrorBannerActions>
                          <SqlErrorCloseButton
                            type='button'
                            onClick={handleDismissCreateTableError}
                            aria-label='Скрыть ошибку создания таблицы'
                          >
                            <CloseIcon />
                          </SqlErrorCloseButton>
                        </SqlErrorBannerActions>
                      </SqlErrorBannerContent>
                    </SqlErrorBanner>

                    <Collapse in={isCreateTableErrorExpanded}>
                      <SqlErrorDetailsContainer>
                        <SqlErrorDetailsHeader>
                          <SqlErrorDetailsHeaderTitle>
                            Детали ошибки
                          </SqlErrorDetailsHeaderTitle>
                          <Tooltip
                            title={
                              isCreateTableErrorCopied
                                ? 'Скопировано'
                                : 'Копировать ошибку'
                            }
                            arrow
                            placement='top'
                          >
                            <SqlErrorDetailsCopyButton
                              type='button'
                              onClick={() => void handleCopyCreateTableError()}
                              aria-label='Копировать ошибку создания таблицы'
                            >
                              <ContentCopyIcon
                                sx={{
                                  color: isCreateTableErrorCopied
                                    ? 'success.main'
                                    : 'inherit',
                                }}
                              />
                            </SqlErrorDetailsCopyButton>
                          </Tooltip>
                        </SqlErrorDetailsHeader>
                        <SqlErrorDetailsContent>
                          <SqlErrorMessageText>
                            {createTableErrorMessage}
                          </SqlErrorMessageText>
                        </SqlErrorDetailsContent>
                      </SqlErrorDetailsContainer>
                    </Collapse>
                  </SqlErrorBlockContainer>
                )}
                {sharedState?.createTableSuccess && (
                  <Alert severity='success'>
                    {sharedState.createTableSuccess}
                  </Alert>
                )}

                <Box ref={createSqlEditorRef}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    maxRows={16}
                    size='small'
                    placeholder='CREATE TABLE ...'
                    value={localInputData?.create_table_sql ?? ''}
                    onChange={event => {
                      const value = event.target.value;
                      setLocalInputData(prev => ({
                        ...(prev ?? {}),
                        create_table_sql: value,
                      }));
                      setSharedState(prev => ({
                        ...(prev ?? {}),
                        createTableError: null,
                        createTableSuccess: null,
                      }));
                    }}
                    slotProps={{
                      input: {
                        sx: {
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.85rem',
                          backgroundColor: '#fafafa',
                        },
                      },
                    }}
                  />
                </Box>
              </>
            ) : (
              <Alert severity='info' sx={{ borderRadius: 2 }}>
                В текущем режиме SQL создания таблицы не требуется.
              </Alert>
            )}
          </Stack>
        </SchemaStrategySection>
      </AccordionContainer>
    </Box>
  );
};
