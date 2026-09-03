import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions';
import { useAppDispatch } from '@/app/providers/store';

import { DbCatalogBrowserPanel } from '@/features/node/db-target-selector';
import { useNodeConnections } from '@/features/node/get-node-connections';

import { TablesViewsListV2 } from '@/entities/data/database';
import { ColumnDropdownSelect } from '@/entities/data/dataframe';
import {
  invalidateDbCatalog,
  requireDbConnectionId,
  resolveDbCatalogMode,
} from '@/entities/data/db-connection';
import { useDbCatalogTable } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import {
  client,
  type DataFrameMetadata,
  type DataType,
  type DbMetadata as DBMetadata,
  type DbTable as DBTable,
  type InputDefinitionModel,
} from '@/shared/gatewayClient';
import { SchemaIcon } from '@/shared/icons';
import {
  findDbMetadataTable,
  flattenDbMetadataTables,
  isDialectSupportsSchemas,
} from '@/shared/lib/db-metadata';

import {
  buildCreateSqlCacheKey,
  type ExtensionState,
  extractApiErrorMessage,
  shouldShowCreateTableSql,
  type WriteDataFrameToDBValues,
} from '../lib/helpers';

import {
  AccordionChevron,
  AccordionContainer,
  AccordionContent,
  AccordionHeader,
  AccordionHeaderLeft,
  AccordionIcon,
  AccordionItem,
  AccordionTitle,
  CollapsedValue,
  ConnectionInput,
  CreateTableInput,
  CreateTableRow,
  FieldGroup,
  FieldLabel,
  RadioCard,
  RadioCardDescription,
  RadioCardHeader,
  RadioCardsContainer,
  RadioCardTitle,
  RadioIndicator,
  SaveButton,
  SchemaCreateInput,
  SchemaCreateInputRow,
  SchemaCreateSaveButton,
  SchemaItem,
  SchemaItemIcon,
  SchemaItemLeft,
  SchemaItemName,
  SchemaItemRight,
  SchemaLabel,
  SchemaList,
  SchemaListContainer,
  SchemaRowIndicator,
  SchemaSearchContainer,
  SchemaSearchIcon,
  SchemaSearchInput,
  SchemaSearchInputWrapper,
  SchemaSegmentButton,
  SchemaSegmentedControl,
  SchemaTableCount,
  SegmentButton,
  SegmentedControl,
  SelectedTableBox,
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
  StatusBadge,
  StyledInput,
  TableBrowserContainer,
  ToolbarActions,
  ToolbarButton,
  ToolbarHint,
  WriteModeLabel,
  WriteModeTitle,
  WriteModeTooltipIcon,
} from './styles';

type UITableSelectMode = 'select' | 'create';
type UISchemaSelectMode = 'select' | 'create';

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
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);
  const dispatch = useAppDispatch();

  const [selectTableMode, setSelectTableMode] =
    useState<UITableSelectMode>('select');
  const [newTableName, setNewTableName] = useState('');
  const [isCreateTableNameEditorOpen, setIsCreateTableNameEditorOpen] =
    useState(true);
  const [selectSchemaMode, setSelectSchemaMode] =
    useState<UISchemaSelectMode>('select');
  const [newSchemaName, setNewSchemaName] = useState('');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [isSchemaNew, setIsSchemaNew] = useState(false);
  const [isSelectTableBrowserOpen, setIsSelectTableBrowserOpen] = useState(
    !localInputData?.table_name
  );
  const [openSections, setOpenSections] = useState<string[]>([
    'table',
    'schema',
    'create-table-sql',
  ]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const createSqlEditorRef = useRef<HTMLDivElement>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);
  const copyCreateTableErrorTimeoutRef = useRef<number | null>(null);
  const createSqlAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => createSqlAbortControllerRef.current?.abort(), []);
  const [isSqlCopied, setIsSqlCopied] = useState(false);
  const [isCreateTableErrorCopied, setIsCreateTableErrorCopied] =
    useState(false);
  const [isCreateTableErrorExpanded, setIsCreateTableErrorExpanded] =
    useState(false);
  const [isCreateTableErrorDismissed, setIsCreateTableErrorDismissed] =
    useState(false);
  const lastCreateTableErrorRef = useRef<string | null>(null);
  const recoveredCreateModeErrorRef = useRef<string | null>(null);

  const inputDataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );
  const dataframeColumns = useMemo(() => {
    return inputDataframeMetadata?.columns ?? [];
  }, [inputDataframeMetadata?.columns]);
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

  const isClickHouse =
    inputConnectionMetadata?.dialect?.toLowerCase() === 'clickhouse';
  const isSchemaRequired =
    inputConnectionMetadata &&
    isDialectSupportsSchemas(inputConnectionMetadata.dialect);
  const flatConnectionTables = useMemo(() => {
    return flattenDbMetadataTables(inputConnectionMetadata);
  }, [inputConnectionMetadata]);

  const literalDatabaseName =
    typeof localInputData?.database_name === 'string'
      ? localInputData.database_name
      : null;
  const literalSchemaName =
    typeof localInputData?.schema_name === 'string'
      ? localInputData.schema_name
      : null;
  const literalTableName =
    typeof localInputData?.table_name === 'string'
      ? localInputData.table_name
      : null;
  const lazySelectedTable = useDbCatalogTable(
    inputConnectionMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    { enabled: selectTableMode === 'select' }
  );

  const selectedTable: DBTable | null = useMemo(() => {
    if (!inputConnectionMetadata || !localInputData?.table_name) return null;

    const embedded = findDbMetadataTable(inputConnectionMetadata, {
      databaseName: localInputData.database_name,
      schemaName: localInputData.schema_name,
      tableName: localInputData.table_name,
    });
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
  }, [
    inputConnectionMetadata,
    lazySelectedTable.item,
    localInputData?.database_name,
    localInputData?.schema_name,
    localInputData?.table_name,
  ]);

  const isTableNew = useMemo(() => {
    if (!localInputData?.table_name) {
      return false;
    }

    if (selectTableMode === 'select') {
      return false;
    }

    return !selectedTable;
  }, [localInputData?.table_name, selectTableMode, selectedTable]);

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

  const writeModeOptions = useMemo(() => {
    const options = writeModeInputDef?.options;
    if (!Array.isArray(options)) {
      return [] as string[];
    }
    return options
      .filter((option): option is string => typeof option === 'string')
      .filter(option => {
        const normalizedOption = option.toLowerCase();
        return normalizedOption !== 'recreate' && normalizedOption !== 'upsert';
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
      return "Режим записи в таблицу: 'truncate' очищает таблицу, 'append' добавляет данные, 'upsert' будет добавлен в будущем.";
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

  const isSelectedExistingTable = useMemo(() => {
    return (
      selectTableMode === 'select' &&
      Boolean(localInputData?.table_name) &&
      !isTableNew
    );
  }, [isTableNew, localInputData?.table_name, selectTableMode]);

  const selectedWriteMode = useMemo(() => {
    return normalizeWriteMode(localInputData?.write_mode ?? null);
  }, [localInputData?.write_mode, normalizeWriteMode]);

  const isWriteModeDisabled = useCallback((mode: string) => {
    return mode.toLowerCase() === 'upsert';
  }, []);

  const selectedTableLabel = useMemo(() => {
    const tableName = localInputData?.table_name?.trim();
    if (!tableName) return '';

    const parts = [
      localInputData?.database_name,
      localInputData?.schema_name,
      localInputData?.table_name,
    ]
      .map(value => (value ?? '').toString().trim())
      .filter(Boolean);

    return parts.join('.');
  }, [
    localInputData?.database_name,
    localInputData?.schema_name,
    localInputData?.table_name,
  ]);

  const createTableErrorMessage = useMemo(() => {
    return (sharedState?.createTableError ?? '').trim();
  }, [sharedState?.createTableError]);

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
    const hasTable = Boolean(localInputData?.table_name?.trim());
    const hasIndexColumn = Boolean(localInputData?.index_col?.trim());

    if (!hasTable) {
      return 'Таблица не выбрана';
    }
    if (!hasIndexColumn) {
      return 'Индекс-колонка не выбрана';
    }

    return selectedTableLabel;
  }, [
    localInputData?.index_col,
    localInputData?.table_name,
    selectTableMode,
    selectedTableLabel,
  ]);

  const tableSectionCollapsedTone = useMemo<'info' | 'warning'>(() => {
    const hasTable = Boolean(localInputData?.table_name?.trim());
    const hasIndexColumn = Boolean(localInputData?.index_col?.trim());

    return hasTable && hasIndexColumn ? 'info' : 'warning';
  }, [localInputData?.index_col, localInputData?.table_name]);

  useEffect(() => {
    setSharedState(prev => {
      if (
        prev?.inputConnectionMetadata === inputConnectionMetadata &&
        prev?.inputDataframeMetadata === inputDataframeMetadata &&
        prev?.isTableNew === isTableNew
      ) {
        return prev;
      }

      return {
        ...(prev ?? {}),
        inputConnectionMetadata,
        inputDataframeMetadata,
        isTableNew,
      };
    });
  }, [
    inputConnectionMetadata,
    inputDataframeMetadata,
    isTableNew,
    setSharedState,
  ]);

  const schemaStats = useMemo((): Array<[string, number]> => {
    const grouped = new Map<string, number>();

    for (const table of flatConnectionTables) {
      const schemaName = table.schema_name ?? 'default_schema';
      grouped.set(schemaName, (grouped.get(schemaName) ?? 0) + 1);
    }

    return Array.from(grouped.entries()).sort(([left], [right]) =>
      left.localeCompare(right)
    );
  }, [flatConnectionTables]);

  const filteredSchemaStats = useMemo(() => {
    const query = schemaSearch.trim().toLowerCase();
    if (!query) return schemaStats;

    return schemaStats.filter(([schemaName]) =>
      schemaName.toLowerCase().includes(query)
    );
  }, [schemaSearch, schemaStats]);

  const resetCreateSqlState = useCallback(() => {
    setSharedState(prev => ({
      ...(prev ?? {}),
      createSqlError: null,
      createTableError: null,
      createTableSuccess: null,
      lastCreateSqlKey: null,
      isCreateSqlLoading: false,
      isCreateTableLoading: false,
    }));
  }, [setSharedState]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
      if (copyCreateTableErrorTimeoutRef.current !== null) {
        window.clearTimeout(copyCreateTableErrorTimeoutRef.current);
      }
    };
  }, []);

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
    if (!localInputData?.table_name?.trim()) return;
    if (localInputData?.write_mode) return;
    if (recoveredCreateModeErrorRef.current === createTableErrorMessage) return;

    recoveredCreateModeErrorRef.current = createTableErrorMessage;
    setSelectTableMode('create');
    setIsCreateTableNameEditorOpen(false);
    setIsSelectTableBrowserOpen(false);
  }, [
    createTableErrorMessage,
    isOpen,
    localInputData?.table_name,
    localInputData?.write_mode,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    setOpenSections(prev =>
      prev.includes('connection')
        ? prev.filter(section => section !== 'connection')
        : prev
    );
  }, [isOpen]);

  useEffect(() => {
    if (selectTableMode !== 'select') return;
    setIsSelectTableBrowserOpen(!localInputData?.table_name);
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
    if (!isOpen || !isSelectedExistingTable) return;
    if (writeModeOptions.length === 0) return;
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
    isSelectedExistingTable,
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

  const ensureCreateSqlSectionOpen = useCallback(() => {
    setOpenSections(prev => {
      if (prev.includes('create-table-sql')) {
        return prev;
      }
      return [...prev, 'create-table-sql'];
    });
  }, []);

  const handleResetTable = useCallback(() => {
    setLocalInputData(prev => ({
      ...(prev ?? {}),
      table_name: null,
      schema_name: null,
      index_col: null,
      write_mode: null,
      create_table_sql: null,
      use_clickhouse_connect_driver: null,
    }));
    setSelectTableMode('select');
    setSelectSchemaMode('select');
    setNewTableName('');
    setIsCreateTableNameEditorOpen(true);
    setNewSchemaName('');
    setSchemaSearch('');
    setIsSchemaNew(false);
    setIsSelectTableBrowserOpen(true);
    resetCreateSqlState();
  }, [resetCreateSqlState, setLocalInputData]);

  const handleTableSelect = useCallback(
    (table: DBTable) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        database_name: table.database_name,
        table_name: table.name,
        schema_name: table.schema_name,
        index_col: null,
        write_mode: null,
        create_table_sql: null,
      }));

      setSelectTableMode('select');
      setSelectSchemaMode('select');
      setNewTableName('');
      setIsCreateTableNameEditorOpen(false);
      setNewSchemaName('');
      setSchemaSearch('');
      setIsSchemaNew(false);
      setIsSelectTableBrowserOpen(false);
      resetCreateSqlState();
    },
    [resetCreateSqlState, setLocalInputData]
  );

  const handleLazyTableSelect = useCallback(
    (table: {
      name: string;
      databaseName: string | null;
      schemaName: string | null;
    }) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        database_name: table.databaseName,
        table_name: table.name,
        schema_name: table.schemaName,
        index_col: null,
        write_mode: null,
        create_table_sql: null,
      }));
      setSelectTableMode('select');
      setSelectSchemaMode('select');
      setNewTableName('');
      setIsCreateTableNameEditorOpen(false);
      setNewSchemaName('');
      setSchemaSearch('');
      setIsSchemaNew(false);
      setIsSelectTableBrowserOpen(false);
      resetCreateSqlState();
    },
    [resetCreateSqlState, setLocalInputData]
  );

  const handleLazyDatabaseChange = useCallback(
    (databaseName: string | null) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        database_name: databaseName,
        schema_name: null,
        table_name: null,
        index_col: null,
        write_mode: null,
        create_table_sql: null,
      }));
      resetCreateSqlState();
    },
    [resetCreateSqlState, setLocalInputData]
  );

  const handleLazySchemaChange = useCallback(
    (schemaName: string | null) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        schema_name: schemaName,
        table_name: null,
        index_col: null,
        write_mode: null,
        create_table_sql: null,
      }));
      resetCreateSqlState();
    },
    [resetCreateSqlState, setLocalInputData]
  );

  const handleCreateTableSave = useCallback(() => {
    const name = newTableName.trim();
    if (!name) return;

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      database_name: null,
      table_name: name,
      schema_name: prev?.schema_name ?? null,
      index_col: null,
      write_mode: null,
      create_table_sql: null,
    }));
    setIsCreateTableNameEditorOpen(false);
    resetCreateSqlState();
  }, [newTableName, resetCreateSqlState, setLocalInputData]);

  const handleTableModeChange = useCallback(
    (mode: UITableSelectMode) => {
      if (mode === selectTableMode) {
        return;
      }

      setSelectTableMode(mode);
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        database_name: null,
        table_name: null,
        index_col: null,
        write_mode: null,
        create_table_sql: null,
      }));
      setNewTableName('');
      setIsCreateTableNameEditorOpen(mode === 'create');
      setIsSelectTableBrowserOpen(mode === 'select');
      resetCreateSqlState();
    },
    [resetCreateSqlState, selectTableMode, setLocalInputData]
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
    setLocalInputData(prev => ({
      ...(prev ?? {}),
      database_name: null,
      table_name: null,
      index_col: null,
      write_mode: null,
      create_table_sql: null,
    }));
    resetCreateSqlState();
  }, [resetCreateSqlState, setLocalInputData]);

  const handleEditSelectedTable = useCallback(() => {
    clearSelectedTable();
    setIsSelectTableBrowserOpen(true);
  }, [clearSelectedTable]);

  const handleEditCreatedTableName = useCallback(() => {
    const currentTableName = localInputData?.table_name ?? '';
    clearSelectedTable();
    setNewTableName(currentTableName);
    setIsCreateTableNameEditorOpen(true);
  }, [clearSelectedTable, localInputData?.table_name]);

  const handleSchemaSelect = useCallback(
    (schemaName: string) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        schema_name: schemaName,
      }));
      setSelectSchemaMode('select');
      setIsSchemaNew(false);
      resetCreateSqlState();
    },
    [resetCreateSqlState, setLocalInputData]
  );

  const handleSchemaCreateSave = useCallback(() => {
    const name = newSchemaName.trim();
    if (!name) return;

    setLocalInputData(prev => ({
      ...(prev ?? {}),
      schema_name: name,
    }));
    setSelectSchemaMode('select');
    setIsSchemaNew(true);
    resetCreateSqlState();
  }, [newSchemaName, resetCreateSqlState, setLocalInputData]);

  const handleIndexColumnChange = useCallback(
    (indexColumnName: string) => {
      setLocalInputData(prev => ({
        ...(prev ?? {}),
        index_col: indexColumnName || null,
      }));
      setSharedState(prev => ({
        ...(prev ?? {}),
        createSqlError: null,
        createTableError: null,
        createTableSuccess: null,
        lastCreateSqlKey: null,
      }));
    },
    [setLocalInputData, setSharedState]
  );

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
        create_table_sql: null,
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

  const shouldShowSqlEditor = shouldShowCreateTableSql(
    localInputData,
    isTableNew
  );

  const createSqlCacheKey = useMemo(() => {
    return buildCreateSqlCacheKey(
      localInputData,
      inputDataframeMetadata,
      inputConnectionMetadata
    );
  }, [inputConnectionMetadata, inputDataframeMetadata, localInputData]);

  const hasIndexColumnSelected = Boolean(localInputData?.index_col?.trim());

  const canFetchCreateSql = Boolean(
    shouldShowSqlEditor &&
    localInputData?.table_name &&
    hasIndexColumnSelected &&
    inputConnectionMetadata &&
    inputDataframeMetadata
  );

  const fetchCreateTableSql = useCallback(
    async (forceRefresh = false) => {
      if (!localInputData?.table_name) {
        return;
      }
      if (!localInputData?.index_col?.trim()) {
        return;
      }
      if (!inputConnectionMetadata || !inputDataframeMetadata) {
        return;
      }
      if (
        !forceRefresh &&
        sharedState?.lastCreateSqlKey === createSqlCacheKey &&
        localInputData?.create_table_sql
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
              table_name: localInputData.table_name,
              database_name: localInputData.database_name ?? null,
              schema_name: localInputData.schema_name ?? null,
              index_col: localInputData.index_col ?? null,
            },
          },
          { silent: true, signal: abortController.signal }
        );

        if (createSqlAbortControllerRef.current !== abortController) {
          return;
        }

        setLocalInputData(prev => ({
          ...(prev ?? {}),
          create_table_sql: response.data.sql,
        }));

        setSharedState(prev => ({
          ...(prev ?? {}),
          isCreateSqlLoading: false,
          createSqlError: null,
          lastCreateSqlKey: createSqlCacheKey,
        }));
      } catch (error: unknown) {
        if (abortController.signal.aborted) {
          return;
        }
        setSharedState(prev => ({
          ...(prev ?? {}),
          isCreateSqlLoading: false,
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
      createSqlCacheKey,
      inputConnectionMetadata,
      inputDataframeMetadata,
      localInputData,
      setLocalInputData,
      setSharedState,
      hasIndexColumnSelected,
      sharedState?.lastCreateSqlKey,
      ensureCreateSqlSectionOpen,
    ]
  );

  const isCreateTableSqlSectionOpen = isSectionOpen('create-table-sql');

  const handleCopyCreateSql = useCallback(async () => {
    const sql = localInputData?.create_table_sql ?? '';
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
  }, [localInputData?.create_table_sql]);

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
    if (!isOpen || !canFetchCreateSql) return;
    if (sharedState?.isCreateSqlLoading) return;
    if (sharedState?.lastCreateSqlKey === createSqlCacheKey) return;

    void fetchCreateTableSql(false);
  }, [
    canFetchCreateSql,
    createSqlCacheKey,
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
        <AccordionItem>
          <AccordionHeader
            isOpen={isSectionOpen('connection')}
            onClick={() => toggleSection('connection')}
          >
            <AccordionHeaderLeft>
              <AccordionIcon isOpen={isSectionOpen('connection')}>
                <LinkIcon sx={{ fontSize: 18 }} />
              </AccordionIcon>
              <AccordionTitle isOpen={isSectionOpen('connection')}>
                Соединение
              </AccordionTitle>
            </AccordionHeaderLeft>
            <AccordionChevron isOpen={isSectionOpen('connection')} />
          </AccordionHeader>

          <Collapse in={isSectionOpen('connection')}>
            <AccordionContent>
              <FieldGroup sx={{ mb: 0 }}>
                <FieldLabel>
                  <Stack direction='row' alignItems='center' gap={0.5}>
                    <LinkIcon sx={{ fontSize: 14 }} />
                    Connection ID
                  </Stack>
                </FieldLabel>
                <ConnectionInput>
                  <StyledInput
                    type='text'
                    value={
                      inputConnectionMetadata?.connection_id ||
                      'Нет metadata...'
                    }
                    disabled
                  />
                </ConnectionInput>
                <StatusBadge
                  connected={!!inputConnectionMetadata?.connection_id}
                  sx={{ mt: 1 }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 16,
                      color: inputConnectionMetadata?.connection_id
                        ? 'success.main'
                        : 'warning.main',
                    }}
                  />
                  <Typography
                    variant='body2'
                    sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
                  >
                    {inputConnectionMetadata?.connection_id
                      ? `Connected · ${inputConnectionMetadata.dialect}`
                      : 'Not connected'}
                  </Typography>
                </StatusBadge>
              </FieldGroup>
            </AccordionContent>
          </Collapse>
        </AccordionItem>

        <AccordionItem>
          <AccordionHeader
            isOpen={isSectionOpen('table')}
            onClick={() => toggleSection('table')}
          >
            <AccordionHeaderLeft>
              <AccordionIcon isOpen={isSectionOpen('table')}>
                <TableChartIcon sx={{ fontSize: 18 }} />
              </AccordionIcon>
              <AccordionTitle isOpen={isSectionOpen('table')}>
                Таблица назначения
              </AccordionTitle>
            </AccordionHeaderLeft>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isSectionOpen('table') && tableSectionCollapsedValue && (
                <CollapsedValue
                  tone={tableSectionCollapsedTone}
                  title={tableSectionCollapsedValue}
                >
                  {tableSectionCollapsedValue}
                </CollapsedValue>
              )}
              <AccordionChevron isOpen={isSectionOpen('table')} />
            </Box>
          </AccordionHeader>

          <Collapse in={isSectionOpen('table')}>
            <AccordionContent>
              <Box>
                <RadioCardsContainer>
                  <RadioCard
                    type='button'
                    selected={selectTableMode === 'select'}
                    onClick={() => handleTableModeChange('select')}
                  >
                    <RadioCardHeader>
                      <RadioIndicator selected={selectTableMode === 'select'} />
                      <RadioCardTitle selected={selectTableMode === 'select'}>
                        Выбрать
                      </RadioCardTitle>
                    </RadioCardHeader>
                    <RadioCardDescription>
                      Существующую таблицу
                    </RadioCardDescription>
                  </RadioCard>

                  <RadioCard
                    type='button'
                    selected={selectTableMode === 'create'}
                    onClick={() => handleTableModeChange('create')}
                  >
                    <RadioCardHeader>
                      <RadioIndicator selected={selectTableMode === 'create'} />
                      <RadioCardTitle selected={selectTableMode === 'create'}>
                        Создать
                      </RadioCardTitle>
                    </RadioCardHeader>
                    <RadioCardDescription>Новую таблицу</RadioCardDescription>
                  </RadioCard>
                </RadioCardsContainer>

                {selectTableMode === 'select' && selectedTableLabel && (
                  <Box sx={{ mb: 1.5 }}>
                    <FieldLabel>Выбранная таблица</FieldLabel>
                    <SelectedTableBox>
                      <Stack
                        direction='row'
                        alignItems='center'
                        justifyContent='space-between'
                        gap={1}
                        width='100%'
                        flexWrap='nowrap'
                      >
                        <Stack
                          direction='row'
                          alignItems='center'
                          gap={1}
                          sx={{ minWidth: 0 }}
                        >
                          <TableChartIcon
                            sx={{ fontSize: 16, color: 'primary.main' }}
                          />
                          <Typography
                            noWrap
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'primary.main',
                            }}
                          >
                            {selectedTableLabel}
                          </Typography>
                        </Stack>

                        <Stack direction='row' alignItems='center' gap={0.5}>
                          {!isSelectTableBrowserOpen && (
                            <Button
                              size='small'
                              variant='text'
                              onClick={handleEditSelectedTable}
                            >
                              Изменить
                            </Button>
                          )}
                          <IconButton
                            size='small'
                            onClick={handleResetTable}
                            aria-label='Очистить выбор таблицы'
                          >
                            <CloseIcon fontSize='small' />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </SelectedTableBox>
                  </Box>
                )}

                {selectTableMode === 'select' ? (
                  inputConnectionMetadata ? (
                    <Collapse
                      in={isSelectTableBrowserOpen && !selectedTableLabel}
                      timeout={{ enter: 225, exit: 0 }}
                      unmountOnExit
                    >
                      <TableBrowserContainer>
                        {resolveDbCatalogMode(inputConnectionMetadata) ===
                        'lazy' ? (
                          <DbCatalogBrowserPanel
                            metadata={inputConnectionMetadata}
                            databaseName={literalDatabaseName}
                            schemaName={literalSchemaName}
                            tableName={literalTableName}
                            onDatabaseChange={handleLazyDatabaseChange}
                            onSchemaChange={handleLazySchemaChange}
                            onTableChange={handleLazyTableSelect}
                          />
                        ) : (
                          <TablesViewsListV2
                            tables={flatConnectionTables}
                            selectedItem={selectedTable ?? undefined}
                            onItemClick={handleTableSelect}
                            collapseAfterSelect={true}
                          />
                        )}
                      </TableBrowserContainer>
                    </Collapse>
                  ) : (
                    <Alert severity='warning'>
                      Подключите вход `connection`, чтобы выбрать таблицу.
                    </Alert>
                  )
                ) : (
                  <Stack sx={{ mt: 0.5, mb: 1 }}>
                    <FieldLabel>Название новой таблицы</FieldLabel>

                    {localInputData?.table_name &&
                    !isCreateTableNameEditorOpen ? (
                      <SelectedTableBox>
                        <Stack
                          direction='row'
                          alignItems='center'
                          justifyContent='space-between'
                          gap={1}
                          width='100%'
                          flexWrap='nowrap'
                        >
                          <Stack
                            direction='row'
                            alignItems='center'
                            gap={1}
                            sx={{ minWidth: 0 }}
                          >
                            <TableChartIcon
                              sx={{ fontSize: 16, color: 'primary.main' }}
                            />
                            <Typography
                              noWrap
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'primary.main',
                              }}
                            >
                              {selectedTableLabel}
                            </Typography>
                          </Stack>
                          <Button
                            size='small'
                            variant='text'
                            onClick={handleEditCreatedTableName}
                          >
                            Изменить
                          </Button>
                        </Stack>
                      </SelectedTableBox>
                    ) : (
                      <CreateTableRow>
                        <CreateTableInput
                          type='text'
                          placeholder='Название новой таблицы'
                          value={newTableName}
                          onChange={event =>
                            setNewTableName(event.target.value)
                          }
                          onKeyDown={handleCreateTableInputKeyDown}
                        />
                        <SaveButton
                          type='button'
                          onClick={handleCreateTableSave}
                          disabled={!newTableName.trim()}
                        >
                          Сохранить
                        </SaveButton>
                      </CreateTableRow>
                    )}
                  </Stack>
                )}
              </Box>

              {isSchemaRequired && selectTableMode === 'create' && (
                <Stack gap={1} sx={{ mb: 1.5 }}>
                  <Box>
                    <SchemaLabel>Схема</SchemaLabel>

                    {localInputData?.schema_name ? (
                      <SelectedTableBox>
                        <Stack
                          direction='row'
                          alignItems='center'
                          justifyContent='space-between'
                          gap={1}
                          width='100%'
                          flexWrap='nowrap'
                        >
                          <Stack
                            direction='row'
                            alignItems='center'
                            gap={1}
                            sx={{ minWidth: 0 }}
                          >
                            <SchemaIcon style={{ fontSize: '1rem' }} />
                            <Typography
                              noWrap
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'primary.main',
                              }}
                            >
                              {localInputData.schema_name}
                            </Typography>
                            {isSchemaNew && (
                              <Chip
                                size='small'
                                color='primary'
                                variant='outlined'
                                label='NEW'
                                sx={{
                                  height: 18,
                                  '& .MuiChip-label': {
                                    px: 0.75,
                                    fontSize: '0.625rem',
                                    fontWeight: 700,
                                  },
                                }}
                              />
                            )}
                          </Stack>

                          <IconButton
                            size='small'
                            onClick={() => {
                              setLocalInputData(prev => ({
                                ...(prev ?? {}),
                                schema_name: null,
                              }));
                              setIsSchemaNew(false);
                              resetCreateSqlState();
                            }}
                            aria-label='Очистить выбор схемы'
                          >
                            <CloseIcon fontSize='small' />
                          </IconButton>
                        </Stack>
                      </SelectedTableBox>
                    ) : (
                      <>
                        <SchemaSegmentedControl>
                          <SchemaSegmentButton
                            type='button'
                            selected={selectSchemaMode === 'select'}
                            aria-pressed={selectSchemaMode === 'select'}
                            onClick={() => {
                              setSelectSchemaMode('select');
                              setIsSchemaNew(false);
                            }}
                          >
                            <StorageIcon />
                            Выбрать существующую
                          </SchemaSegmentButton>
                          <SchemaSegmentButton
                            type='button'
                            selected={selectSchemaMode === 'create'}
                            aria-pressed={selectSchemaMode === 'create'}
                            onClick={() => {
                              setSelectSchemaMode('create');
                              setIsSchemaNew(true);
                            }}
                          >
                            <AddIcon />
                            Создать новую
                          </SchemaSegmentButton>
                        </SchemaSegmentedControl>

                        {selectSchemaMode === 'select' && (
                          <SchemaListContainer>
                            <SchemaSearchContainer>
                              <SchemaSearchInputWrapper>
                                <SchemaSearchIcon>
                                  <SearchIcon />
                                </SchemaSearchIcon>
                                <SchemaSearchInput
                                  type='text'
                                  placeholder='Поиск схемы...'
                                  value={schemaSearch}
                                  onChange={event =>
                                    setSchemaSearch(event.target.value)
                                  }
                                />
                              </SchemaSearchInputWrapper>
                            </SchemaSearchContainer>

                            <SchemaList>
                              {filteredSchemaStats.length === 0 ? (
                                <Box sx={{ p: 2 }}>
                                  <Typography color='text.secondary'>
                                    Ничего не найдено
                                  </Typography>
                                </Box>
                              ) : (
                                filteredSchemaStats.map(
                                  ([schemaName, count]) => {
                                    const selected =
                                      localInputData?.schema_name ===
                                      schemaName;
                                    return (
                                      <SchemaItem
                                        key={schemaName}
                                        selected={selected}
                                        onClick={() =>
                                          handleSchemaSelect(schemaName)
                                        }
                                      >
                                        <SchemaItemLeft>
                                          <SchemaItemIcon selected={selected}>
                                            <StorageIcon />
                                          </SchemaItemIcon>
                                          <SchemaItemName selected={selected}>
                                            {schemaName}
                                          </SchemaItemName>
                                        </SchemaItemLeft>
                                        <SchemaItemRight>
                                          <SchemaTableCount>
                                            {count} таблиц
                                          </SchemaTableCount>
                                          <SchemaRowIndicator
                                            selected={selected}
                                          />
                                        </SchemaItemRight>
                                      </SchemaItem>
                                    );
                                  }
                                )
                              )}
                            </SchemaList>
                          </SchemaListContainer>
                        )}

                        {selectSchemaMode === 'create' && (
                          <SchemaCreateInputRow>
                            <SchemaCreateInput
                              type='text'
                              placeholder='Название новой схемы'
                              value={newSchemaName}
                              onChange={event =>
                                setNewSchemaName(event.target.value)
                              }
                            />
                            <SchemaCreateSaveButton
                              type='button'
                              onClick={handleSchemaCreateSave}
                              disabled={!newSchemaName.trim()}
                            >
                              Сохранить
                            </SchemaCreateSaveButton>
                          </SchemaCreateInputRow>
                        )}
                      </>
                    )}
                  </Box>
                </Stack>
              )}

              {Boolean(localInputData?.table_name?.trim()) && (
                <FieldGroup
                  sx={{ mt: selectTableMode === 'create' ? 0 : 1, mb: 0 }}
                >
                  <Stack direction='row' alignItems='center' sx={{ mb: 0.75 }}>
                    <FieldLabel style={{ marginBottom: 0 }}>
                      Индекс-колонка
                    </FieldLabel>
                  </Stack>

                  <ColumnDropdownSelect
                    value={localInputData?.index_col ?? ''}
                    onChange={handleIndexColumnChange}
                    columns={dataframeColumns}
                    placeholder='Выберите индекс-колонку...'
                    disabled={dataframeColumns.length === 0}
                  />
                </FieldGroup>
              )}

              {isSelectedExistingTable && writeModeOptions.length > 0 && (
                <FieldGroup sx={{ mt: 1.5, mb: 0 }}>
                  <WriteModeLabel>
                    <WriteModeTitle>Режим записи</WriteModeTitle>
                    <Tooltip
                      title={
                        <Typography
                          sx={{ whiteSpace: 'pre-line', fontSize: 12 }}
                        >
                          {localizedWriteModeDescription ||
                            'append — добавить к существующим данным\ntruncate — очистить таблицу и записать\nupsert — режим будет добавлен в будущем'}
                        </Typography>
                      }
                      arrow
                      placement='top'
                    >
                      <WriteModeTooltipIcon>
                        <span>?</span>
                      </WriteModeTooltipIcon>
                    </Tooltip>
                  </WriteModeLabel>

                  <SegmentedControl>
                    {writeModeDisplayOptions.map(option => {
                      const isSelected = selectedWriteMode === option;
                      const isDisabled = isWriteModeDisabled(option);
                      const optionButton = (
                        <SegmentButton
                          key={option}
                          type='button'
                          selected={isSelected}
                          aria-pressed={isSelected}
                          disabled={isDisabled}
                          onClick={() => handleWriteModeChange(option)}
                        >
                          {option}
                        </SegmentButton>
                      );

                      if (!isDisabled) {
                        return optionButton;
                      }

                      return (
                        <Tooltip
                          key={`${option}-disabled`}
                          title='Режим будет добавлен в будущем.'
                          arrow
                          placement='top'
                        >
                          <span style={{ display: 'flex', flex: 1 }}>
                            {optionButton}
                          </span>
                        </Tooltip>
                      );
                    })}
                  </SegmentedControl>
                </FieldGroup>
              )}
            </AccordionContent>
          </Collapse>
        </AccordionItem>

        <AccordionItem>
          <AccordionHeader
            isOpen={isSectionOpen('create-table-sql')}
            onClick={() => toggleSection('create-table-sql')}
          >
            <AccordionHeaderLeft>
              <AccordionIcon isOpen={isSectionOpen('create-table-sql')}>
                <SettingsIcon sx={{ fontSize: 18 }} />
              </AccordionIcon>
              <AccordionTitle isOpen={isSectionOpen('create-table-sql')}>
                CREATE TABLE SQL
              </AccordionTitle>
            </AccordionHeaderLeft>
            <AccordionChevron isOpen={isSectionOpen('create-table-sql')} />
          </AccordionHeader>

          <Collapse
            in={isSectionOpen('create-table-sql')}
            onEntered={() => {
              if (shouldShowSqlEditor) {
                scrollCreateSqlIntoViewIfNeeded();
              }
            }}
          >
            <AccordionContent>
              <Stack gap={1.5}>
                {shouldShowSqlEditor ? (
                  <>
                    <SQLToolbar>
                      <ToolbarHint>
                        Запрос можно отредактировать вручную перед выполнением.
                      </ToolbarHint>
                      <ToolbarActions>
                        <ToolbarButton
                          type='button'
                          onClick={() => void fetchCreateTableSql(true)}
                          className={
                            sharedState?.isCreateSqlLoading ? 'refreshing' : ''
                          }
                          disabled={
                            !canFetchCreateSql ||
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
                      <Alert severity='error'>
                        {sharedState.createSqlError}
                      </Alert>
                    )}
                    {createTableErrorMessage &&
                      !isCreateTableErrorDismissed && (
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
                                      isCreateTableErrorExpanded
                                        ? 'expanded'
                                        : ''
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
                                    onClick={() =>
                                      void handleCopyCreateTableError()
                                    }
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
            </AccordionContent>
          </Collapse>
        </AccordionItem>
      </AccordionContainer>
    </Box>
  );
};
