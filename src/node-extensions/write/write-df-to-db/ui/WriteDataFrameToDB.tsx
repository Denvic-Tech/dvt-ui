import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAlert } from '@/app/notifications';
import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { DbCatalogBrowserPanel } from '@/features/node/db-target-selector';
import { useNodeConnections } from '@/features/node/get-node-connections';

import { TablesViewsList } from '@/entities/data/database';
import { ColumnDropdownSelect } from '@/entities/data/dataframe';
import { resolveDbCatalogMode } from '@/entities/data/db-connection/model/catalogNormalizers';
import { useDbCatalogTable } from '@/entities/data/db-connection/model/hooks/useDbCatalog';
import { useProjectCache } from '@/entities/project/project-cache';
import { useCurrentProject } from '@/entities/project/projects';

import type {
  Column,
  DataFrameMetadata,
  DataType,
  DbMetadata as DBMetadata,
  DbTable as DBTable,
  NodeInputExpressionValue,
} from '@/shared/gatewayClient';
import { SchemaIcon } from '@/shared/icons';
import {
  findDbMetadataTable,
  flattenDbMetadataTables,
  isDialectSupportsSchemas,
} from '@/shared/lib/db-metadata';
import { isExpressionValue } from '@/shared/lib/node-input-values';
import { Panel } from '@/shared/ui';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { isSafeCast, normalizeType } from '@/helpers/dtypes';

type WriteDataFrameToDBSelectorValue =
  | string
  | NodeInputExpressionValue
  | null
  | undefined;

type WriteDataFrameToDBValues = {
  table_name?: WriteDataFrameToDBSelectorValue;
  database_name?: WriteDataFrameToDBSelectorValue;
  schema_name?: WriteDataFrameToDBSelectorValue;
  chunksize?: number | null;
  min_batch_rows?: number | null;
  index_col?: string | null;
  write_mode?: string | null;
  use_clickhouse_connect_driver?: boolean | null;
  create_table_sql?: string | null;
};

type UITableSelectMode = 'idle' | 'select' | 'create';
type UISchemaSelectMode = 'idle' | 'select' | 'create';
type UIIndexSelectMode = 'idle' | 'select';

type ColumnDiffStatus =
  | 'match'
  | 'soft_cast'
  | 'missing_in_db'
  | 'missing_in_df'
  | 'type_mismatch';
type ColumnDiffRow = {
  dfName: string | null;
  dfType: string | null;
  dbName: string | null;
  dbType: string | null;
  status: ColumnDiffStatus;
};

function normalizeName(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase();
}

function getLiteralSelectorValue(
  value: WriteDataFrameToDBSelectorValue
): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function hasConfiguredSelectorValue(
  value: WriteDataFrameToDBSelectorValue
): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return isExpressionValue(value) && value.value.trim().length > 0;
}

function getSelectorDisplayValue(
  value: WriteDataFrameToDBSelectorValue,
  fallback: string
): string {
  const literalValue = getLiteralSelectorValue(value);
  if (literalValue) {
    return literalValue;
  }

  return isExpressionValue(value) ? 'Expression' : fallback;
}

function getSelectorKeyPart(value: WriteDataFrameToDBSelectorValue): string {
  const literalValue = getLiteralSelectorValue(value);
  if (literalValue) {
    return `literal:${literalValue}`;
  }

  if (isExpressionValue(value)) {
    return `expr:${value.expression_kind}:${value.value}`;
  }

  return 'empty';
}

function statusLabel(s: ColumnDiffStatus): {
  text: string;
  color: 'default' | 'success' | 'warning' | 'error' | 'info';
} {
  switch (s) {
    case 'match':
      return { text: 'OK', color: 'success' };
    case 'soft_cast':
      return { text: 'Soft-cast', color: 'info' };
    case 'missing_in_db':
      return { text: 'Нет в БД', color: 'error' };
    case 'missing_in_df':
      return { text: 'Нет в DF', color: 'warning' };
    case 'type_mismatch':
      return { text: 'Типы различаются', color: 'warning' };
  }
}

const mapDtypeToSqlType = (
  dtype: string | null,
  dialect: string = 'common'
): string => {
  if (!dtype) return dialect === 'clickhouse' ? 'String' : 'TEXT';
  const t = dtype.toLowerCase();

  // Логика для ClickHouse
  if (dialect === 'clickhouse') {
    if (t.includes('int')) return 'Int64';
    if (t.includes('float') || t.includes('double')) return 'Float64';
    if (t.includes('bool')) return 'UInt8';
    if (t.includes('datetime')) return 'DateTime';
    return 'String';
  }

  if (dialect === 'oracle') {
    if (t.includes('int')) return 'NUMBER(19)';
    if (t.includes('float') || t.includes('double')) return 'NUMBER';
    if (t.includes('bool')) return 'NUMBER(1)'; // В Oracle нет Boolean
    if (t.includes('datetime')) return 'TIMESTAMP';
    return 'NCLOB'; // Или VARCHAR2(4000)
  }

  // Логика для стандартных SQL (Postgres, SQLite)
  if (t.includes('int')) return 'BIGINT';
  if (t.includes('float') || t.includes('double')) return 'DOUBLE PRECISION';
  if (t.includes('bool')) return 'BOOLEAN';
  if (t.includes('datetime')) return 'TIMESTAMP';
  return 'TEXT';
};

export const WriteDataFrameToDB: React.FC<
  NodeModalExtensionProps<WriteDataFrameToDBValues>
> = ({
  id: nodeID,
  nodeDefinition,
  isOpen,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  setValidationErrors,
}) => {
  const { currentProject } = useCurrentProject();

  const { clearMetadataCache } = useProjectCache(currentProject?.id);

  const { getConnectedInputMetadata, getConnectedInputNodeID } =
    useNodeConnections(nodeID);

  const { showNotification } = useAlert();
  const { confirm } = useConfirmDialog();

  const [useMappingValidation, setUseMappingValidation] =
    useState<boolean>(false);

  const [autoIndexApplied, setAutoIndexApplied] = useState(false);

  const writeModeInputDef = useMemo(() => {
    return nodeDefinition?.input_definitions?.['write_mode'];
  }, [nodeDefinition]);

  const chunkSizeInputDef = useMemo(() => {
    return nodeDefinition?.input_definitions?.['chunksize'];
  }, [nodeDefinition]);

  const minBatchRowsInputDef = useMemo(() => {
    return nodeDefinition?.input_definitions?.['min_batch_rows'];
  }, [nodeDefinition]);

  const writeModeOptions: string[] = useMemo(() => {
    const opts = writeModeInputDef?.options;
    return Array.isArray(opts)
      ? opts.filter((o: any): o is string => typeof o === 'string')
      : [];
  }, [writeModeInputDef]);

  const writeModeDescription: string | null = useMemo(() => {
    const d = (writeModeInputDef as any)?.description;
    return typeof d === 'string' && d.trim() ? d : null;
  }, [writeModeInputDef]);

  const normalizeWriteMode = useCallback(
    (mode?: string | null) => {
      if (!mode) return null;
      const m = String(mode).toLowerCase();
      return writeModeOptions.find(o => o.toLowerCase() === m) ?? null;
    },
    [writeModeOptions]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!hasConfiguredSelectorValue(localInputData?.table_name)) return;
    if (
      localInputData?.write_mode &&
      normalizeWriteMode(localInputData?.write_mode)
    )
      return;

    const saved = normalizeWriteMode(localInputData?.write_mode);
    const fallback = normalizeWriteMode('truncate');
    const desired = saved ?? fallback ?? null;

    if (!desired) return;
    if (localInputData?.write_mode === desired) return;

    setLocalInputData(prev => ({
      ...((prev ?? {}) as WriteDataFrameToDBValues),
      write_mode: desired,
    }));
  }, [
    isOpen,
    localInputData?.table_name,
    localInputData?.write_mode,
    normalizeWriteMode,
    setLocalInputData,
  ]);

  const chunkSizeBounds = useMemo(() => {
    const toNum = (v: any): number | undefined =>
      typeof v === 'number'
        ? v
        : typeof v === 'string'
          ? Number.parseInt(v, 10)
          : undefined;

    const min = toNum(chunkSizeInputDef?.min_value) ?? 1;
    const max = toNum(chunkSizeInputDef?.max_value) ?? 1_000_000;
    let def = toNum(chunkSizeInputDef?.default) ?? 1000;
    if (def < min) def = min;
    if (def > max) def = max;
    return { min, max, def };
  }, [chunkSizeInputDef]);

  const minBatchRowsBounds = useMemo(() => {
    const toNum = (v: any): number | undefined =>
      typeof v === 'number'
        ? v
        : typeof v === 'string'
          ? Number.parseInt(v, 10)
          : undefined;

    const min = toNum(minBatchRowsInputDef?.min_value) ?? 1;
    const max = toNum(minBatchRowsInputDef?.max_value) ?? 100_000;
    let def = toNum(minBatchRowsInputDef?.default) ?? 5_000;
    if (def < min) def = min;
    if (def > max) def = max;
    return { min, max, def };
  }, [minBatchRowsInputDef]);

  // --- Подключенные ноды ---
  const connectedConnectionNodeID = useMemo(
    () => getConnectedInputNodeID('connection'),
    [getConnectedInputNodeID]
  );

  // --- Метаданные входов ---
  const inputDataframeMetadata = useMemo(
    () => getConnectedInputMetadata('df') as DataFrameMetadata | null,
    [getConnectedInputMetadata]
  );
  const inputConnectionMetadata = useMemo(
    () => getConnectedInputMetadata('connection') as DBMetadata | null,
    [getConnectedInputMetadata]
  );

  const dialect = inputConnectionMetadata?.dialect?.toLowerCase() ?? '';
  const dataframeColumns: Column[] = useMemo(
    () => inputDataframeMetadata?.columns ?? [],
    [inputDataframeMetadata?.columns]
  );

  const literalTableName = useMemo(
    () => getLiteralSelectorValue(localInputData?.table_name),
    [localInputData?.table_name]
  );
  const literalDatabaseName = useMemo(
    () => getLiteralSelectorValue(localInputData?.database_name),
    [localInputData?.database_name]
  );
  const literalSchemaName = useMemo(
    () => getLiteralSelectorValue(localInputData?.schema_name),
    [localInputData?.schema_name]
  );

  const hasConfiguredTableName = useMemo(
    () => hasConfiguredSelectorValue(localInputData?.table_name),
    [localInputData?.table_name]
  );
  const hasConfiguredSchemaName = useMemo(
    () => hasConfiguredSelectorValue(localInputData?.schema_name),
    [localInputData?.schema_name]
  );

  const selectedTableLabel = useMemo(
    () =>
      getSelectorDisplayValue(localInputData?.table_name, 'Таблица не выбрана'),
    [localInputData?.table_name]
  );
  const selectedSchemaLabel = useMemo(
    () =>
      getSelectorDisplayValue(localInputData?.schema_name, 'Схема не выбрана'),
    [localInputData?.schema_name]
  );

  const tableSelectorKeyPart = useMemo(
    () => getSelectorKeyPart(localInputData?.table_name),
    [localInputData?.table_name]
  );
  const schemaSelectorKeyPart = useMemo(
    () => getSelectorKeyPart(localInputData?.schema_name),
    [localInputData?.schema_name]
  );

  const lastAutoGeneratedSqlRef = useRef<string>('');

  useEffect(() => {
    // Базовые проверки
    if (!literalTableName || !dataframeColumns.length) return;

    const dbDialect = dialect.toLowerCase();
    const isClickHouse = dbDialect.includes('clickhouse');
    const isOracle = dbDialect.includes('oracle');

    const mappingType = isClickHouse
      ? 'clickhouse'
      : isOracle
        ? 'oracle'
        : 'common';

    const schemaPart = literalSchemaName ? `"${literalSchemaName}".` : '';
    const fullTableName = `${schemaPart}"${literalTableName}"`;

    const columnDefinitions = dataframeColumns.map(col => {
      const sqlType = mapDtypeToSqlType(col.dtype, mappingType);
      return `    "${col.name}" ${sqlType}`;
    });

    let generatedSql = `CREATE TABLE ${fullTableName} (\n${columnDefinitions.join(',\n')}\n)`;

    if (isClickHouse) {
      generatedSql += `\nENGINE = MergeTree()\nORDER BY tuple();`;
    } else if (isOracle) {
      generatedSql += ``;
    } else {
      generatedSql += `;`;
    }

    const currentSql = localInputData.create_table_sql || '';

    const shouldUpdate =
      currentSql.trim() === '' ||
      currentSql === lastAutoGeneratedSqlRef.current;

    if (shouldUpdate) {
      if (currentSql !== generatedSql) {
        lastAutoGeneratedSqlRef.current = generatedSql;

        setLocalInputData(
          prev =>
            ({
              ...prev,
              create_table_sql: generatedSql,
            }) as any
        );
      }
    }
  }, [
    literalTableName,
    literalSchemaName,
    dataframeColumns,
    dialect, // Триггер сработает при смене БД
    setLocalInputData,
  ]);

  const isClickHouse = useMemo(() => {
    return inputConnectionMetadata?.dialect?.toLowerCase() === 'clickhouse';
  }, [inputConnectionMetadata]);

  const isOracle = useMemo(() => {
    return inputConnectionMetadata?.dialect?.toLowerCase() === 'oracle';
  }, [inputConnectionMetadata]);
  const isSchemaRequired =
    inputConnectionMetadata &&
    isDialectSupportsSchemas(inputConnectionMetadata.dialect);

  const flatConnectionTables = useMemo(() => {
    return flattenDbMetadataTables(inputConnectionMetadata);
  }, [inputConnectionMetadata]);
  const lazySelectedTable = useDbCatalogTable(
    inputConnectionMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName
  );

  const useClickhouseConnectDriver = useMemo(() => {
    if (!isClickHouse) return false;
    const raw = (localInputData as WriteDataFrameToDBValues | null)
      ?.use_clickhouse_connect_driver;
    return raw ?? true;
  }, [isClickHouse, localInputData]);

  useEffect(() => {
    if (!isOpen) return;
    if (!isClickHouse) return;

    setLocalInputData(prev => {
      const base = (prev ?? {}) as WriteDataFrameToDBValues;
      if (
        base.use_clickhouse_connect_driver === undefined ||
        base.use_clickhouse_connect_driver === null
      ) {
        return { ...base, use_clickhouse_connect_driver: true };
      }
      return prev as any;
    });
  }, [isOpen, isClickHouse, setLocalInputData]);

  // Устойчивый матч таблицы
  const selectedTable: DBTable | null = useMemo(() => {
    if (!inputConnectionMetadata || !literalTableName) return null;
    const embedded = findDbMetadataTable(inputConnectionMetadata, {
      databaseName: literalDatabaseName,
      schemaName: literalSchemaName,
      tableName: literalTableName,
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
    literalTableName,
    literalDatabaseName,
    literalSchemaName,
  ]);

  // Уникальные схемы + счётчик таблиц
  const schemaStats = useMemo((): Array<[string, number]> => {
    const map = new Map<string, number>();
    for (const t of flatConnectionTables) {
      const s = t.schema_name ?? 'default_schema';
      map.set(s, (map.get(s) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [flatConnectionTables]);

  // --- Состояния ---
  const [selectTableMode, setSelectTableMode] =
    useState<UITableSelectMode>('idle');
  const [newTableName, setNewTableName] = useState('');

  const [selectSchemaMode, setSelectSchemaMode] =
    useState<UISchemaSelectMode>('idle');
  const [newSchemaName, setNewSchemaName] = useState('');
  const [schemaSearch, setSchemaSearch] = useState('');

  const [selectIndexMode, setSelectIndexMode] =
    useState<UIIndexSelectMode>('idle');

  const [isTableNew, setIsTableNew] = useState<boolean>(false);
  const [isSchemaNew, setIsSchemaNew] = useState<boolean>(false);

  const filteredSchemaStats = useMemo(() => {
    const q = schemaSearch.trim().toLowerCase();
    if (!q) return schemaStats;
    return schemaStats.filter(([name]) => name.toLowerCase().includes(q));
  }, [schemaStats, schemaSearch]);

  // Текущее имя индекс-колонки
  const selectedIndexName = localInputData?.index_col ?? null;

  // Инвалидация кэша метаданных коннекта при открытии
  const handleMetaCacheInvalidation = useCallback(async () => {
    if (!connectedConnectionNodeID) return;
    const response = await clearMetadataCache({
      nodeIDs: [connectedConnectionNodeID],
    });
    if (!response.success) {
      showNotification({
        type: 'error',
        title: 'Failed to reload metadata',
      });
    }
  }, [connectedConnectionNodeID, clearMetadataCache, showNotification]);

  useEffect(() => {
    if (!isOpen) return;
    void handleMetaCacheInvalidation();
  }, [isOpen, handleMetaCacheInvalidation]);

  // сбрасываем флаг автопроставления при закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setAutoIndexApplied(false);
    }
  }, [isOpen]);

  // Инициализация min_batch_rows дефолтом из схемы (один раз)
  useEffect(() => {
    if (!isOpen) return;
    setLocalInputData(prev => {
      const base = (prev ?? {}) as WriteDataFrameToDBValues;
      if (base.min_batch_rows === undefined) {
        return { ...base, min_batch_rows: minBatchRowsBounds.def };
      }
      return prev as any;
    });
  }, [isOpen, minBatchRowsBounds.def, setLocalInputData]);

  // Автоподстановка индекса, но не переставляем после ручного сброса
  useEffect(() => {
    if (!isOpen) return;
    if (autoIndexApplied) return;

    // если индекс уже есть (подтянулся из пайплайна) — просто помечаем, что всё ок
    if (localInputData?.index_col) {
      setAutoIndexApplied(true);
      return;
    }

    const suitableIndexCol = (dataframeColumns ?? []).find(col => col.index);
    if (!suitableIndexCol) return;

    setLocalInputData(prev => ({
      ...prev,
      index_col: suitableIndexCol.name,
    }));
    setAutoIndexApplied(true);
  }, [
    isOpen,
    dataframeColumns,
    localInputData?.index_col,
    autoIndexApplied,
    setLocalInputData,
  ]);

  // ---- Таблицы: действия ----
  const handleOpenSelectTable = useCallback(() => {
    setSelectTableMode('select');
    setIsTableNew(false);
  }, []);
  const handleOpenCreateTable = useCallback(() => {
    setSelectTableMode('create');
    setIsTableNew(true);
  }, []);

  const handleResetTable = useCallback(() => {
    setLocalInputData(prev => ({
      ...prev,
      table_name: null,
      schema_name: null,
      index_col: null,
      write_mode: null,
      use_clickhouse_connect_driver: null,
    }));
    setSelectTableMode('idle');
    setSelectSchemaMode('idle');
    setSelectIndexMode('idle');
    setNewTableName('');
    setNewSchemaName('');
    setSchemaSearch('');
    setIsTableNew(false);
  }, [setLocalInputData]);

  const handleTableSelect = useCallback(
    (table: DBTable) => {
      if (
        table.name === literalTableName &&
        table.database_name === literalDatabaseName &&
        table.schema_name === literalSchemaName &&
        !isTableNew
      ) {
        setSelectTableMode('idle');
        return;
      }
      setLocalInputData({
        database_name: table.database_name,
        table_name: table.name,
        schema_name: table.schema_name,
        index_col: null,
        write_mode: null,
        chunksize: localInputData?.chunksize ?? null,
        min_batch_rows: localInputData?.min_batch_rows ?? null,
        use_clickhouse_connect_driver:
          (localInputData as WriteDataFrameToDBValues | null)
            ?.use_clickhouse_connect_driver ?? null,
      });
      setSelectTableMode('idle');
      setSelectSchemaMode('idle');
      setSelectIndexMode('idle');
      setNewTableName('');
      setNewSchemaName('');
      setSchemaSearch('');
      setAutoIndexApplied(false);
    },
    [
      literalTableName,
      literalDatabaseName,
      literalSchemaName,
      localInputData?.chunksize,
      localInputData?.min_batch_rows,
      (localInputData as WriteDataFrameToDBValues | null)
        ?.use_clickhouse_connect_driver,
      isTableNew,
      setLocalInputData,
    ]
  );

  const handleLazyTableSelect = useCallback(
    (table: {
      name: string;
      databaseName: string | null;
      schemaName: string | null;
    }) => {
      setLocalInputData(prev => ({
        ...((prev ?? {}) as WriteDataFrameToDBValues),
        database_name: table.databaseName,
        schema_name: table.schemaName,
        table_name: table.name,
      }));
      setSelectTableMode('idle');
    },
    [setLocalInputData]
  );

  const handleLazyDatabaseChange = useCallback(
    (databaseName: string | null) => {
      setLocalInputData(prev => ({
        ...((prev ?? {}) as WriteDataFrameToDBValues),
        database_name: databaseName,
        schema_name: null,
        table_name: null,
      }));
    },
    [setLocalInputData]
  );

  const handleLazySchemaChange = useCallback(
    (schemaName: string | null) => {
      setLocalInputData(prev => ({
        ...((prev ?? {}) as WriteDataFrameToDBValues),
        schema_name: schemaName,
        table_name: null,
      }));
    },
    [setLocalInputData]
  );

  const handleCreateTableSave = useCallback(() => {
    const name = newTableName.trim();
    if (!name) return;
    setLocalInputData(prev => ({
      ...prev,
      database_name: null,
      table_name: name,
      schema_name: (prev as WriteDataFrameToDBValues).schema_name ?? null,
      index_col: null,
      write_mode: null,
      chunksize: (prev as WriteDataFrameToDBValues).chunksize ?? null,
    }));
    setSelectTableMode('idle');
    setAutoIndexApplied(false);
  }, [newTableName, setLocalInputData]);

  // ---- Схемы: действия ----
  const handleOpenSelectSchema = useCallback(() => {
    setSelectSchemaMode('select');
    setIsSchemaNew(false);
  }, []);
  const handleOpenCreateSchema = useCallback(() => {
    setSelectSchemaMode('create');
    setIsSchemaNew(true);
  }, []);

  const handleSchemaSelect = useCallback(
    (schemaName: string) => {
      setLocalInputData(prev => ({ ...prev, schema_name: schemaName }));
      setSelectSchemaMode('idle');
    },
    [setLocalInputData]
  );

  const handleSchemaCreateSave = useCallback(() => {
    const name = newSchemaName.trim();
    if (!name) return;
    setLocalInputData(prev => ({ ...prev, schema_name: name }));
    setSelectSchemaMode('idle');
  }, [newSchemaName, setLocalInputData]);

  // ---- Тип записи ----
  const handleWriteModeChange = useCallback(
    (_e: React.MouseEvent<HTMLElement>, mode: string | null) => {
      if (!mode) return;
      if (!writeModeOptions.length) return;
      if (!writeModeOptions.includes(mode)) return;
      setLocalInputData(prev => {
        const base = (prev ?? {}) as WriteDataFrameToDBValues;
        return { ...base, write_mode: mode };
      });
    },
    [setLocalInputData, writeModeOptions]
  );

  // ---- Индекс ----
  const handleOpenSelectIndex = () => setSelectIndexMode('select');

  const handleIndexSelect = useCallback(
    (colName: string) => {
      setLocalInputData(prev => {
        const base = (prev ?? {}) as WriteDataFrameToDBValues;
        return { ...base, index_col: colName };
      });
      setSelectIndexMode('idle');
      setAutoIndexApplied(true);
    },
    [setLocalInputData]
  );

  const handleIndexReset = useCallback(() => {
    setLocalInputData(prev => {
      const base = (prev ?? {}) as WriteDataFrameToDBValues;
      return { ...base, index_col: null };
    });
    setSelectIndexMode('idle');
    // помечаем, что пользователь сознательно убрал индекс — не ставим авто
    setAutoIndexApplied(true);
  }, [setLocalInputData]);

  // ---- Chunk size ----
  const handleChunkSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') {
        setLocalInputData(prev => {
          const base = (prev ?? {}) as WriteDataFrameToDBValues;
          return { ...base, chunksize: null };
        });
        return;
      }
      const n = Number.parseInt(raw, 10);
      const v = Number.isNaN(n)
        ? null
        : Math.min(Math.max(n, chunkSizeBounds.min), chunkSizeBounds.max);
      setLocalInputData(prev => {
        const base = (prev ?? {}) as WriteDataFrameToDBValues;
        return { ...base, chunksize: v };
      });
    },
    [setLocalInputData, chunkSizeBounds.min, chunkSizeBounds.max]
  );

  // ---- Min batch rows ----
  const handleMinBatchRowsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') {
        setLocalInputData(prev => {
          const base = (prev ?? {}) as WriteDataFrameToDBValues;
          return { ...base, min_batch_rows: null };
        });
        return;
      }
      const n = Number.parseInt(raw, 10);
      const v = Number.isNaN(n)
        ? null
        : Math.min(Math.max(n, minBatchRowsBounds.min), minBatchRowsBounds.max);
      setLocalInputData(prev => {
        const base = (prev ?? {}) as WriteDataFrameToDBValues;
        return { ...base, min_batch_rows: v };
      });
    },
    [setLocalInputData, minBatchRowsBounds.min, minBatchRowsBounds.max]
  );

  // Только clamp для существующего chunksize
  useEffect(() => {
    setLocalInputData(prev => {
      if (prev?.chunksize == null) return prev as any;
      const v = prev.chunksize!;
      const clamped = Math.min(
        Math.max(v, chunkSizeBounds.min),
        chunkSizeBounds.max
      );
      if (clamped === v) return prev as any;
      const base = (prev ?? {}) as WriteDataFrameToDBValues;
      return { ...base, chunksize: clamped };
    });
  }, [setLocalInputData, chunkSizeBounds.min, chunkSizeBounds.max]);

  // Clamp для min_batch_rows
  useEffect(() => {
    setLocalInputData(prev => {
      const current = (prev as any)?.min_batch_rows;
      if (current == null || typeof current !== 'number') return prev as any;
      if (Number.isNaN(current)) return prev as any;
      const clamped = Math.min(
        Math.max(current, minBatchRowsBounds.min),
        minBatchRowsBounds.max
      );
      if (clamped === current) return prev as any;
      const base = (prev ?? {}) as WriteDataFrameToDBValues;
      return { ...base, min_batch_rows: clamped };
    });
  }, [setLocalInputData, minBatchRowsBounds.min, minBatchRowsBounds.max]);

  // Выбранный режим записи — только из стейта
  const selectedWriteMode: string | null = useMemo(() => {
    const wm = localInputData?.write_mode ?? null;
    return wm && writeModeOptions.includes(wm) ? wm : null;
  }, [localInputData?.write_mode, writeModeOptions]);

  // Кандидаты индекса
  const indexCandidateColumns: Column[] = useMemo(() => {
    return dataframeColumns ?? [];
  }, [dataframeColumns]);

  const indexDisabled =
    !hasConfiguredTableName || indexCandidateColumns.length === 0;

  // Маппинг и визуальный дифф
  const selectedTableColumns = selectedTable?.columns ?? [];

  const columnDiff: ColumnDiffRow[] = useMemo(() => {
    const dfCols = dataframeColumns ?? [];
    const dbCols = selectedTable?.columns ?? [];

    const dbByNorm = new Map<string, { name: string; dtype: string | null }>();
    for (const c of dbCols) {
      dbByNorm.set(normalizeName(c.name), {
        name: c.name,
        dtype: c.dtype ?? null,
      });
    }

    const usedDb = new Set<string>();
    const rows: ColumnDiffRow[] = [];

    for (const df of dfCols) {
      const normName = normalizeName(df.name);
      const db = dbByNorm.get(normName);
      if (!db) {
        rows.push({
          dfName: df.name,
          dfType: df.dtype ?? null,
          dbName: null,
          dbType: null,
          status: 'missing_in_db',
        });
        continue;
      }
      usedDb.add(normName);

      const dfT = normalizeType(df.dtype ?? null);
      const dbT = normalizeType(db.dtype ?? null);

      let status: ColumnDiffStatus;
      if (dfT === dbT) status = 'match';
      else if (isSafeCast(dfT, dbT)) status = 'soft_cast';
      else status = 'type_mismatch';

      rows.push({
        dfName: df.name,
        dfType: df.dtype ?? null,
        dbName: db.name,
        dbType: db.dtype ?? null,
        status,
      });
    }

    for (const [k, db] of dbByNorm.entries()) {
      if (!usedDb.has(k)) {
        rows.push({
          dfName: null,
          dfType: null,
          dbName: db.name,
          dbType: db.dtype ?? null,
          status: 'missing_in_df',
        });
      }
    }

    const order: Record<ColumnDiffStatus, number> = {
      missing_in_db: 0,
      missing_in_df: 1,
      type_mismatch: 2,
      soft_cast: 3,
      match: 4,
    };

    return rows.sort((a, b) => {
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      const aName = normalizeName(a.dfName ?? a.dbName ?? '');
      const bName = normalizeName(b.dfName ?? b.dbName ?? '');
      return aName.localeCompare(bName);
    });
  }, [dataframeColumns, selectedTable]);

  const diffSummary = useMemo(() => {
    const dfCount = (dataframeColumns ?? []).length;
    const dbCount = selectedTableColumns.length;

    let missingInDb = 0;
    let missingInDf = 0;
    let typeMismatch = 0;
    let softCast = 0;
    let matches = 0;

    for (const r of columnDiff) {
      if (r.status === 'missing_in_db') missingInDb++;
      else if (r.status === 'missing_in_df') missingInDf++;
      else if (r.status === 'type_mismatch') typeMismatch++;
      else if (r.status === 'soft_cast') softCast++;
      else matches++;
    }

    return {
      dfCount,
      dbCount,
      missingInDb,
      missingInDf,
      typeMismatch,
      softCast,
      matches,
      countDelta: dfCount - dbCount,
    };
  }, [columnDiff, dataframeColumns, selectedTableColumns.length]);

  const showDiffTable = Boolean(literalTableName) && !isTableNew;

  const onlySoftAndMatch =
    diffSummary.missingInDb === 0 &&
    diffSummary.missingInDf === 0 &&
    diffSummary.typeMismatch === 0;

  const runValidation = useCallback(async (): Promise<boolean> => {
    const errors: Record<string, string[]> = {};

    // 1) Таблица
    if (!hasConfiguredTableName) {
      errors['table'] = ['Не выбрана таблица для записи.'];
    }

    // 2) Схема
    if (isSchemaRequired) {
      if (!hasConfiguredSchemaName) {
        errors['schema_name'] = ['Не выбрана или не создана схема.'];
      }
    }

    // 3) Chunk size
    const cs = localInputData?.chunksize;
    if (cs == null) {
      errors['chunksize'] = ['Chunk size не задан.'];
    } else if (Number.isNaN(cs)) {
      errors['chunksize'] = ['Chunk size имеет неверный формат.'];
    } else if (cs < chunkSizeBounds.min || cs > chunkSizeBounds.max) {
      errors['chunksize'] = [
        `Chunk size должен быть в диапазоне [${chunkSizeBounds.min}..${chunkSizeBounds.max}], текущее: ${cs}.`,
      ];
    }

    // 3.1) Min batch rows (опционально, но если задано — в пределах)
    const mbr = localInputData?.min_batch_rows;
    if (mbr != null) {
      if (Number.isNaN(mbr)) {
        errors['min_batch_rows'] = ['min_batch_rows имеет неверный формат.'];
      } else if (mbr < minBatchRowsBounds.min || mbr > minBatchRowsBounds.max) {
        errors['min_batch_rows'] = [
          `min_batch_rows должен быть в диапазоне [${minBatchRowsBounds.min}..${minBatchRowsBounds.max}], текущее: ${mbr}.`,
        ];
      }
    }

    // 4) Индекс — обязателен всегда и должен быть колонкой DF
    const idx = localInputData?.index_col ?? null;
    if (!idx) {
      errors['index_col'] = ['Индекс обязателен. Выберите индекс-колонку.'];
    } else {
      const existsInDf = (dataframeColumns ?? []).some(c => c.name === idx);
      if (!existsInDf) {
        errors['index_col'] = [`Колонка "${idx}" отсутствует в DataFrame.`];
      }
    }

    // 5) Требуем явный выбор write_mode (если есть опции)
    if (
      !isTableNew &&
      !localInputData?.write_mode &&
      writeModeOptions.length > 0
    ) {
      errors['write_mode'] = ['Выберите режим записи.'];
    }

    // 6) DF vs DB — условно по флагу useMappingValidation
    if (!isTableNew && useMappingValidation) {
      const missingInDb = columnDiff.filter(r => r.status === 'missing_in_db');
      const missingInDf = columnDiff.filter(r => r.status === 'missing_in_df');
      const typeMismatch = columnDiff.filter(r => r.status === 'type_mismatch');

      if (missingInDb.length) {
        errors['missing_in_db'] = missingInDb.map(
          r =>
            `В DF есть колонка "${r.dfName}" (${r.dfType ?? '—'}), которой нет в БД`
        );
      }
      if (missingInDf.length) {
        errors['missing_in_df'] = missingInDf.map(
          r =>
            `В БД есть колонка "${r.dbName}" (${r.dbType ?? '—'}), которой нет в DF`
        );
      }
      if (typeMismatch.length) {
        errors['type_mismatch'] = typeMismatch.map(
          r =>
            `Несовпадающий тип у "${r.dfName ?? r.dbName}": DF=${r.dfType ?? '—'} vs DB=${r.dbType ?? '—'}`
        );
      }
    }

    // 7) Подтверждение для опасных режимов
    const mode = (localInputData?.write_mode ?? '').toLowerCase();
    const needsConfirm =
      !isTableNew && (mode === 'truncate' || mode === 'recreate');
    if (needsConfirm) {
      const tname = getSelectorDisplayValue(
        localInputData?.table_name,
        'выбранной таблицы'
      );
      const confirmed = await confirm({
        title:
          mode === 'truncate'
            ? 'Подтвердить TRUNCATE?'
            : 'Подтвердить RECREATE?',
        message:
          mode === 'truncate'
            ? `Режим TRUNCATE выполнит TRUNCATE таблицы "${tname}" и перезапишет данные.\nПродолжить?`
            : `Режим RECREATE удалит и заново создаст таблицу "${tname}", затем запишет данные.\nПродолжить?`,
        confirmLabel: 'Продолжить',
        cancelLabel: 'Отмена',
        confirmColor: 'error',
      });
      if (!confirmed) return false;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors?.(errors);
      return false;
    }

    setValidationErrors?.({});
    return true;
  }, [
    chunkSizeBounds.max,
    chunkSizeBounds.min,
    confirm,
    minBatchRowsBounds.max,
    minBatchRowsBounds.min,
    columnDiff,
    dataframeColumns,
    hasConfiguredSchemaName,
    hasConfiguredTableName,
    isClickHouse,
    isTableNew,
    localInputData?.chunksize,
    localInputData?.min_batch_rows,
    localInputData?.index_col,
    localInputData?.write_mode,
    localInputData?.table_name,
    setValidationErrors,
    writeModeOptions.length,
    useMappingValidation,
  ]);

  // Установка колбэка валидации + сброс ошибок при открытии
  useEffect(() => {
    if (!setValidationCallback) return;
    if (!isOpen) return;

    setValidationCallback(() => runValidation);
    setValidationErrors?.({});
  }, [isOpen, runValidation, setValidationCallback, setValidationErrors]);

  return (
    <Box>
      {/* Таблица */}
      <Panel elevation={1}>
        <Grid container alignItems='center' justifyContent='space-between'>
          <Grid>
            <Typography>Выбранная таблица:</Typography>
          </Grid>

          <Grid>
            {localInputData?.table_name ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size='small'
                  onClick={handleResetTable}
                  aria-label='Очистить выбор таблицы'
                >
                  <CloseIcon fontSize='small' />
                </IconButton>

                <Typography sx={{ fontWeight: 500 }}>
                  {selectedTableLabel}
                </Typography>

                {isTableNew ? (
                  <Chip
                    label='NEW'
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                ) : null}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleOpenSelectTable}
                >
                  Выбрать
                </Button>
                <Button
                  variant='outlined'
                  color='secondary'
                  onClick={handleOpenCreateTable}
                >
                  Создать
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Panel>

      {/* Выбор существующих таблиц */}
      {!isTableNew && selectTableMode === 'select' && (
        <Box>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {inputConnectionMetadata && (
              <Grid size={5} sx={{ flex: 1, minHeight: 0 }}>
                <Panel elevation={1}>
                  {resolveDbCatalogMode(inputConnectionMetadata) === 'lazy' ? (
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
                    <TablesViewsList
                      tables={flatConnectionTables}
                      selectedItem={selectedTable ?? undefined}
                      onItemClick={handleTableSelect}
                      collapseAfterSelect={true}
                    />
                  )}
                </Panel>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Создание новой таблицы */}
      {selectTableMode === 'create' && (
        <Box>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={5} sx={{ flex: 1, minHeight: 0 }}>
              <Panel elevation={1}>
                <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size='small'
                    label='Название новой таблицы'
                    value={newTableName}
                    onChange={e => setNewTableName(e.target.value)}
                  />
                  <Button variant='contained' onClick={handleCreateTableSave}>
                    Сохранить
                  </Button>
                </Box>
              </Panel>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Схема */}
      {isSchemaRequired && (
        <Panel elevation={2} sx={{ mt: 2 }}>
          <Grid container alignItems='center' justifyContent='space-between'>
            <Grid>
              <Typography>Схема:</Typography>
            </Grid>

            <Grid>
              {localInputData?.schema_name ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    size='small'
                    onClick={() =>
                      setLocalInputData(prev => {
                        const base = (prev ?? {}) as WriteDataFrameToDBValues;
                        return {
                          ...base,
                          schema_name: null,
                          is_schema_new: false,
                        } as any;
                      })
                    }
                    aria-label='Очистить выбор схемы'
                  >
                    <CloseIcon fontSize='small' />
                  </IconButton>
                  <Typography sx={{ fontWeight: 500 }}>
                    {selectedSchemaLabel}
                  </Typography>
                  {isSchemaNew ? (
                    <Chip
                      label='NEW'
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  ) : null}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleOpenSelectSchema}
                  >
                    Выбрать
                  </Button>
                  <Button
                    variant='outlined'
                    color='secondary'
                    onClick={handleOpenCreateSchema}
                  >
                    Создать
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* Выбор существующей схемы */}
          {!isSchemaNew && selectSchemaMode === 'select' && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={5} sx={{ flex: 1, minHeight: 0 }}>
                  <Panel elevation={1}>
                    {/* Поиск */}
                    <Box
                      sx={{
                        p: 1.5,
                        borderBottom: t => `1px solid ${t.palette.divider}`,
                      }}
                    >
                      <TextField
                        fullWidth
                        size='small'
                        placeholder='Поиск схемы…'
                        value={schemaSearch}
                        onChange={e => setSchemaSearch(e.target.value)}
                      />
                    </Box>

                    {/* Список схем */}
                    <List
                      dense
                      disablePadding
                      sx={{ maxHeight: 320, overflow: 'auto' }}
                    >
                      {filteredSchemaStats.length === 0 ? (
                        <Box sx={{ p: 2 }}>
                          <Typography color='text.secondary'>
                            Ничего не найдено
                          </Typography>
                        </Box>
                      ) : (
                        filteredSchemaStats.map(([schemaName, count]) => {
                          const selected = literalSchemaName === schemaName;
                          return (
                            <ListItemButton
                              key={schemaName}
                              selected={selected}
                              onClick={() => handleSchemaSelect(schemaName)}
                              sx={{
                                '&.Mui-selected': {
                                  bgcolor: 'action.selected',
                                },
                                '&:not(:last-of-type)': {
                                  borderBottom: t =>
                                    `1px solid ${t.palette.divider}`,
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <SchemaIcon style={{ fontSize: '1.1rem' }} />
                              </ListItemIcon>

                              <ListItemText
                                primary={schemaName}
                                secondary={`${count} таблиц`}
                                slotProps={{
                                  primary: {
                                    sx: { fontWeight: selected ? 600 : 400 },
                                  },
                                }}
                              />

                              <Radio
                                edge='end'
                                checked={selected}
                                tabIndex={-1}
                              />
                            </ListItemButton>
                          );
                        })
                      )}
                    </List>
                  </Panel>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Создание новой схемы */}
          {selectSchemaMode === 'create' && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={5} sx={{ flex: 1, minHeight: 0 }}>
                  <Panel elevation={1}>
                    <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='Название новой схемы'
                        value={newSchemaName}
                        onChange={e => setNewSchemaName(e.target.value)}
                      />
                      <Button
                        variant='contained'
                        onClick={handleSchemaCreateSave}
                      >
                        Сохранить
                      </Button>
                    </Box>
                  </Panel>
                </Grid>
              </Grid>
            </Box>
          )}
        </Panel>
      )}

      {/* Индекс-колонка */}
      <Panel elevation={2} sx={{ mt: 2 }}>
        <Grid container alignItems='center' justifyContent='space-between'>
          <Grid>
            <Typography>Индекс:</Typography>
          </Grid>

          <Grid>
            {selectedIndexName ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size='small'
                  onClick={handleIndexReset}
                  aria-label='Очистить индекс'
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
                <Typography sx={{ fontWeight: 500 }}>
                  {selectedIndexName}
                </Typography>
              </Box>
            ) : (
              <Button
                variant='contained'
                size='small'
                onClick={handleOpenSelectIndex}
                disabled={indexDisabled}
              >
                Выбрать
              </Button>
            )}
          </Grid>
        </Grid>
      </Panel>

      {/* SQL Editor */}
      <Panel elevation={2} sx={{ mt: 2 }}>
        <Grid container direction='column' spacing={1}>
          <Grid>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>SQL для создания таблицы:</Typography>
              <Tooltip
                title='Этот запрос будет выполнен, если выбран режим RECREATE или если таблица создается впервые. Вы можете отредактировать типы данных или параметры вручную.'
                placement='top'
                arrow
              >
                <InfoOutlinedIcon
                  fontSize='small'
                  sx={{ color: 'text.secondary', cursor: 'help' }}
                />
              </Tooltip>
            </Box>
          </Grid>

          <Grid>
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={10}
              variant='outlined'
              size='small'
              placeholder='CREATE TABLE ...'
              value={localInputData?.create_table_sql ?? ''}
              onChange={e => {
                const newVal = e.target.value;
                setLocalInputData(
                  prev =>
                    ({
                      ...(prev ?? {}),
                      create_table_sql: newVal,
                    }) as WriteDataFrameToDBValues
                );
              }}
              slotProps={{
                input: {
                  sx: {
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    backgroundColor: '#fafafa',
                  },
                },
              }}
            />
          </Grid>
        </Grid>
      </Panel>

      {/* Панель выбора индекс-колонки */}
      {selectIndexMode === 'select' && !indexDisabled && (
        <Box>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={5} sx={{ flex: 1, minHeight: 0 }}>
              <Panel elevation={1}>
                <Box sx={{ p: 2 }}>
                  <ColumnDropdownSelect
                    key={`idxsel:${tableSelectorKeyPart}:${schemaSelectorKeyPart}:${dataframeColumns.length}`}
                    columns={indexCandidateColumns}
                    value={selectedIndexName ?? ''}
                    onChange={name => handleIndexSelect(name)}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      justifyContent: 'flex-end',
                      mt: 1,
                    }}
                  >
                    {selectedIndexName && (
                      <Button
                        size='small'
                        color='warning'
                        onClick={handleIndexReset}
                      >
                        Сбросить
                      </Button>
                    )}
                    <Button
                      size='small'
                      onClick={() => setSelectIndexMode('idle')}
                    >
                      Закрыть
                    </Button>
                  </Box>
                </Box>
              </Panel>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Chunk size */}
      <Panel elevation={2} sx={{ mt: 2 }}>
        <Grid container alignItems='center' justifyContent='space-between'>
          <Grid>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography>Chunk size:</Typography>
              <Tooltip
                title='Количество строк, отправляемых в одном батче при записи в базу. Например, если в Dask-партиции 10 000 строк, а здесь указано 5 000, запись будет выполнена в два запроса по 5 000 строк.'
                placement='top'
                arrow
              >
                <InfoOutlinedIcon
                  fontSize='small'
                  sx={{ color: 'text.secondary', cursor: 'help' }}
                />
              </Tooltip>
            </Box>
          </Grid>
          <Grid sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              type='number'
              size='small'
              label='Количество строк в батче'
              value={localInputData?.chunksize ?? ''}
              onChange={handleChunkSizeChange}
              slotProps={{
                input: {
                  inputProps: {
                    min: chunkSizeBounds.min,
                    max: chunkSizeBounds.max,
                    step: 1,
                  },
                },
              }}
              sx={{ width: 260 }}
            />
          </Grid>
        </Grid>
      </Panel>

      {/* Min batch rows */}
      <Panel elevation={2} sx={{ mt: 2 }}>
        <Grid container alignItems='center' justifyContent='space-between'>
          <Grid>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography>Min batch rows:</Typography>
              <Tooltip
                title='Минимальное количество строк в одной Dask-партиции, при котором она считается достаточно большой для записи в базу. Мелкие партиции могут объединяться, пока не будет достигнут этот порог.'
                placement='top'
                arrow
              >
                <InfoOutlinedIcon
                  fontSize='small'
                  sx={{ color: 'text.secondary', cursor: 'help' }}
                />
              </Tooltip>
            </Box>
          </Grid>
          <Grid sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              type='number'
              size='small'
              label='Мин. строк в партиции'
              value={localInputData?.min_batch_rows ?? ''}
              onChange={handleMinBatchRowsChange}
              slotProps={{
                input: {
                  inputProps: {
                    min: minBatchRowsBounds.min,
                    max: minBatchRowsBounds.max,
                    step: 1,
                  },
                },
              }}
              sx={{ width: 260 }}
            />
          </Grid>
        </Grid>
      </Panel>

      {/* Режим драйвера ClickHouse */}
      {isClickHouse && (
        <Panel elevation={2} sx={{ mt: 2 }}>
          <Grid container alignItems='center' justifyContent='space-between'>
            <Grid sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography>Режим записи в ClickHouse:</Typography>
              <Tooltip
                placement='top'
                arrow
                title={
                  <Box>
                    <Typography variant='body2'>
                      <b>Включено:</b> используется нативный драйвер{' '}
                      <code>clickhouse-connect</code>. Как правило, он даёт
                      более высокую скорость вставки, но пока считается
                      экспериментальным и может содержать невыявленные проблемы.
                    </Typography>
                    <Typography variant='body2' sx={{ mt: 1 }}>
                      <b>Выключено:</b> используется прежний путь через
                      SQLAlchemy. Он медленнее, но поведение уже хорошо обкатано
                      и предсказуемо.
                    </Typography>
                  </Box>
                }
              >
                <InfoOutlinedIcon
                  fontSize='small'
                  sx={{ color: 'text.secondary', cursor: 'help' }}
                  aria-label='Описание режимов записи в ClickHouse'
                />
              </Tooltip>
            </Grid>

            <Grid>
              <FormControlLabel
                control={
                  <Switch
                    size='small'
                    checked={useClickhouseConnectDriver}
                    onChange={(_, checked) =>
                      setLocalInputData(prev => {
                        const base = (prev ?? {}) as WriteDataFrameToDBValues;
                        return {
                          ...base,
                          use_clickhouse_connect_driver: checked,
                        };
                      })
                    }
                  />
                }
                label={
                  <Typography variant='body2' color='text.secondary'>
                    {useClickhouseConnectDriver
                      ? 'Быстрая запись (ClickHouse Connect)'
                      : 'Стабильный режим (SQLAlchemy)'}
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </Panel>
      )}

      {/* Тип записи */}
      {hasConfiguredTableName && !isTableNew && writeModeOptions.length > 0 && (
        <Panel elevation={2} sx={{ mt: 2 }}>
          <Grid container alignItems='center' justifyContent='space-between'>
            <Grid sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Тип записи</Typography>
              {writeModeDescription && (
                <Tooltip title={writeModeDescription} placement='top' arrow>
                  <InfoOutlinedIcon
                    fontSize='small'
                    sx={{ color: 'text.secondary', cursor: 'help' }}
                    aria-label='Описание поля "Тип записи"'
                  />
                </Tooltip>
              )}
            </Grid>

            <Grid>
              <ToggleButtonGroup
                exclusive
                size='small'
                value={selectedWriteMode}
                onChange={handleWriteModeChange}
              >
                {writeModeOptions.map(opt => (
                  <ToggleButton key={opt} value={opt}>
                    {opt}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </Panel>
      )}

      {/* Различия DF vs DB */}
      {showDiffTable && (
        <Panel
          key={`diff:${tableSelectorKeyPart}:${schemaSelectorKeyPart}:${selectedTableColumns.length}:${dataframeColumns.length}`}
          elevation={2}
          sx={{ mt: 2 }}
        >
          <Stack spacing={1.5} sx={{ p: 2 }}>
            <Stack
              direction='row'
              alignItems='center'
              justifyContent='space-between'
            >
              <Typography variant='h6'>
                Сопоставление и валидация столбцов
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    size='small'
                    checked={useMappingValidation}
                    onChange={(_, v) => setUseMappingValidation(v)}
                  />
                }
                label={
                  <Tooltip
                    title='Если включено: несоответствия DF↔DB (отсутствующие/разные типы) будут блокировать сохранение.'
                    placement='left'
                  >
                    <Typography variant='body2' color='text.secondary'>
                      Учитывать маппинг в валидации
                    </Typography>
                  </Tooltip>
                }
              />
            </Stack>

            <Stack direction='row' spacing={1} flexWrap='wrap'>
              <Chip
                label={`DF: ${diffSummary.dfCount}`}
                size='small'
                variant='outlined'
              />
              <Chip
                label={`DB: ${diffSummary.dbCount}`}
                size='small'
                variant='outlined'
              />
              <Chip
                label={`Δ: ${diffSummary.countDelta >= 0 ? '+' : ''}${diffSummary.countDelta}`}
                size='small'
                color={diffSummary.countDelta === 0 ? 'success' : 'warning'}
                variant='outlined'
              />
              <Chip
                label={`Нет в БД: ${diffSummary.missingInDb}`}
                size='small'
                color={diffSummary.missingInDb > 0 ? 'error' : 'default'}
                variant='outlined'
              />
              <Chip
                label={`Нет в DF: ${diffSummary.missingInDf}`}
                size='small'
                color={diffSummary.missingInDf > 0 ? 'warning' : 'default'}
                variant='outlined'
              />
              <Chip
                label={`Типы ≠ : ${diffSummary.typeMismatch}`}
                size='small'
                color={diffSummary.typeMismatch > 0 ? 'warning' : 'default'}
                variant='outlined'
              />
              <Chip
                label={`Soft-cast: ${diffSummary.softCast}`}
                size='small'
                color={diffSummary.softCast > 0 ? 'info' : 'default'}
                variant='outlined'
              />
              <Chip
                label={`Совпадения: ${diffSummary.matches}`}
                size='small'
                color='success'
                variant='outlined'
              />
            </Stack>

            <Tooltip
              title='Сравнение выполняется по семействам типов: STRING (TEXT/VARCHAR/CHAR/UUID), INT (INTEGER/BIGINT/SMALLINT), FLOAT (FLOAT/DOUBLE/DECIMAL/NUMERIC), BOOLEAN (BOOL), DATETIME (TIMESTAMP), DATE, TIME. Для soft-cast используется whitelist SAFE_CASTS.'
              placement='top-start'
              arrow
            >
              <Typography variant='body2' color='text.secondary'>
                Сравнение по семействам типов; мягкие преобразования помечены
                как Soft-cast.
              </Typography>
            </Tooltip>

            <Box
              sx={{
                borderRadius: 1,
                border: t => `1px solid ${t.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              <Table size='small' aria-label='df-db-diff-table'>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#edf3f7' }}>
                    <TableCell>Колонка DF</TableCell>
                    <TableCell>Тип DF</TableCell>
                    <TableCell>Колонка DB</TableCell>
                    <TableCell>Тип DB</TableCell>
                    <TableCell align='right'>Статус</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {columnDiff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color='text.secondary'>
                          Нет данных для сравнения
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    columnDiff.map((r, idx) => {
                      const label = statusLabel(r.status);
                      return (
                        <TableRow
                          key={idx}
                          sx={{
                            ...(r.status === 'match'
                              ? {}
                              : {
                                  backgroundColor: t =>
                                    r.status === 'type_mismatch'
                                      ? t.palette.action.hover
                                      : t.palette.action.selected,
                                }),
                          }}
                        >
                          <TableCell>{r.dfName ?? '—'}</TableCell>
                          <TableCell>{r.dfType ?? '—'}</TableCell>
                          <TableCell>{r.dbName ?? '—'}</TableCell>
                          <TableCell>{r.dbType ?? '—'}</TableCell>
                          <TableCell align='right'>
                            <Chip
                              size='small'
                              label={label.text}
                              color={label.color}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>

            {!onlySoftAndMatch ? (
              <Alert severity='warning' variant='outlined'>
                Обнаружены расхождения между DataFrame и таблицей базы данных.
                {useMappingValidation
                  ? ' Из-за включённого флага они будут учитываться при валидации.'
                  : ' Они носят информативный характер (валидацию не блокируют).'}
              </Alert>
            ) : diffSummary.softCast > 0 ? (
              <Alert severity='info' variant='outlined'>
                Структуры совместимы с мягким приведением типов (Soft-cast).
                {useMappingValidation
                  ? ' Эти различия не блокируют валидацию.'
                  : ' Информация носит справочный характер.'}
              </Alert>
            ) : (
              <Alert severity='success' variant='outlined'>
                Структуры согласованы.
              </Alert>
            )}
          </Stack>
        </Panel>
      )}
    </Box>
  );
};
