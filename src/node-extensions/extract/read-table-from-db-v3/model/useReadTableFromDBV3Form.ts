import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { type PartitionGrouping } from '@/features/node/db-partitioning-grouping-input';
import { useConnectedNodeMetadata } from '@/features/node/get-node-metadata';

import {
  normalizeDbCatalogParentNames,
  resolveDbCatalogMode,
} from '@/entities/data/db-connection/model/catalogNormalizers';
import type {
  DbCatalogTableDetail,
  DbCatalogTableRef,
} from '@/entities/data/db-connection/model/catalogTypes';
import {
  getDbCatalogCapabilities,
  useDbCatalogTable,
} from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type {
  DataType,
  DbMetadata as DBMetadata,
  DbTable as DBTable,
} from '@/shared/gatewayClient';
import { findDbMetadataTable } from '@/shared/lib/db-metadata';
import { isExpressionValue } from '@/shared/lib/node-input-values';

import {
  findSelectedTable,
  getLiteralStringValue,
  getPartitionColumnType,
  getSectionErrors,
  getSelectedColumnsCount,
  hasConfiguredSelectorValue,
  hasSelectorExpression,
  hasSinglePrimaryKeyColumn,
  isPartitionGroupingModeCompatible,
  parseOptionalInteger,
  sanitizeTTLCache,
  toggleColumnSelection,
  toSelectorExpression,
} from '../lib/helpers';
import type { PartitioningSettings } from '../lib/partitioningAdvice';
import type {
  ReadTableFromDBV3Errors,
  ReadTableFromDBV3PaneTab,
  ReadTableFromDBV3SelectorField,
  ReadTableFromDBV3SelectorValue,
  ReadTableFromDBV3Values,
} from '../lib/types';
import { validateReadTableFromDBV3 } from '../lib/validation';

type UseReadTableFromDBV3FormArgs = {
  nodeID: string;
  localInputData: ReadTableFromDBV3Values | undefined;
  setLocalInputData: NodeModalExtensionProps<ReadTableFromDBV3Values>['setLocalInputData'];
  setValidationCallback?: NodeModalExtensionProps<ReadTableFromDBV3Values>['setValidationCallback'];
};

type SelectorSnapshot = Pick<
  ReadTableFromDBV3Values,
  'database_name' | 'schema_name' | 'table_name' | 'columns'
>;

const TABLE_DEPENDENT_ERRORS: Array<keyof ReadTableFromDBV3Errors> = [
  'table_name',
  'partition_col',
  'partition_grouping',
  'npartitions',
  'max_rows_per_partition',
];

const pickSelectorSnapshot = (
  values: ReadTableFromDBV3Values
): SelectorSnapshot => ({
  database_name: values.database_name,
  schema_name: values.schema_name,
  table_name: values.table_name,
  columns: values.columns ?? null,
});

const hasAnySelectorValue = (
  values: ReadTableFromDBV3Values | null | undefined
) =>
  hasConfiguredSelectorValue(values?.database_name) ||
  hasConfiguredSelectorValue(values?.schema_name) ||
  hasConfiguredSelectorValue(values?.table_name);

export const useReadTableFromDBV3Form = ({
  nodeID,
  localInputData,
  setLocalInputData,
  setValidationCallback,
}: UseReadTableFromDBV3FormArgs) => {
  const {
    actualConnectedNodeMetadataByInput,
    connectedNodeMetadataActualityByInput,
  } = useConnectedNodeMetadata(nodeID);
  const isConnectionMetadataLoading =
    connectedNodeMetadataActualityByInput?.['connection'] === false;

  const inputMetadata = useMemo<DBMetadata | null>(() => {
    if (isConnectionMetadataLoading) {
      return null;
    }

    return (
      (actualConnectedNodeMetadataByInput?.['connection'] as
        | DBMetadata
        | undefined) ?? null
    );
  }, [actualConnectedNodeMetadataByInput, isConnectionMetadataLoading]);

  const catalogMode = resolveDbCatalogMode(inputMetadata);
  const catalogCapabilities = getDbCatalogCapabilities(inputMetadata);
  const isSchemaSupported = catalogCapabilities.supportsSchemas;
  const isDatabaseSelectionSupported = catalogCapabilities.supportsDatabases;

  const [errors, setErrors] = useState<ReadTableFromDBV3Errors>({});
  const [partitionGroupingErrors, setPartitionGroupingErrors] = useState<
    Record<string, string> | undefined
  >(undefined);
  const [activeTab, setActiveTab] =
    useState<ReadTableFromDBV3PaneTab>('params');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isExpressionMode, setIsExpressionMode] = useState(() =>
    hasSelectorExpression(localInputData)
  );
  const expressionModeResolvedRef = useRef(hasAnySelectorValue(localInputData));
  const literalSnapshotRef = useRef<SelectorSnapshot | null>(null);
  const expressionSnapshotRef = useRef<SelectorSnapshot | null>(null);
  const pendingLazyTableSelectionRef = useRef(false);

  // Черновик гидрируется после первого рендера: режим выражений
  // определяем по первым непустым значениям селекторов.
  useEffect(() => {
    if (
      expressionModeResolvedRef.current ||
      !hasAnySelectorValue(localInputData)
    ) {
      return;
    }

    expressionModeResolvedRef.current = true;
    setIsExpressionMode(hasSelectorExpression(localInputData));
  }, [localInputData]);

  const literalDatabaseName = useMemo(() => {
    return getLiteralStringValue(localInputData?.database_name);
  }, [localInputData?.database_name]);

  const literalSchemaName = useMemo(() => {
    return getLiteralStringValue(localInputData?.schema_name);
  }, [localInputData?.schema_name]);

  const literalTableName = useMemo(() => {
    return getLiteralStringValue(localInputData?.table_name);
  }, [localInputData?.table_name]);

  const lazyTable = useDbCatalogTable(
    inputMetadata,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    { enabled: Boolean(literalTableName) }
  );

  const selectedTable = useMemo<DBTable | null>(() => {
    if (catalogMode !== 'lazy') {
      return findSelectedTable(inputMetadata, localInputData);
    }
    if (!lazyTable.item) {
      return null;
    }
    return {
      name: lazyTable.item.name,
      type: lazyTable.item.kind === 'view' ? 'VIEW' : 'BASE_TABLE',
      database_name: lazyTable.item.databaseName,
      schema_name: lazyTable.item.schemaName,
      columns: lazyTable.item.columns.map(column => ({
        name: column.name,
        comment: column.comment ?? null,
        dtype: column.dtype as DataType,
        nullable: column.nullable,
        index: column.indexed,
        primary_key: column.primaryKey,
        indexes: column.indexes,
      })),
    };
  }, [catalogMode, inputMetadata, lazyTable.item, localInputData]);

  const availableColumns = useMemo(() => {
    return selectedTable?.columns ?? [];
  }, [selectedTable]);

  const availableColumnNames = useMemo(() => {
    return availableColumns.map(column => column.name);
  }, [availableColumns]);

  const selectedColumnsCount = useMemo(() => {
    return getSelectedColumnsCount(localInputData?.columns);
  }, [localInputData?.columns]);

  const hasSinglePrimaryKey = useMemo(() => {
    return hasSinglePrimaryKeyColumn(selectedTable);
  }, [selectedTable]);

  const isPartitionColumnRequired = useMemo(() => {
    return Boolean(localInputData?.table_name) && !hasSinglePrimaryKey;
  }, [hasSinglePrimaryKey, localInputData?.table_name]);

  const partitionColumnType = useMemo(() => {
    return getPartitionColumnType(
      localInputData?.partition_col,
      availableColumns
    );
  }, [availableColumns, localInputData?.partition_col]);

  const sectionErrors = useMemo(() => {
    return getSectionErrors(errors);
  }, [errors]);

  const updateInputData = useCallback(
    (
      updater: (current: ReadTableFromDBV3Values) => ReadTableFromDBV3Values
    ) => {
      setLocalInputData(prev => {
        return updater((prev ?? {}) as ReadTableFromDBV3Values);
      });
    },
    [setLocalInputData]
  );

  const clearErrors = useCallback(
    (keys: Array<keyof ReadTableFromDBV3Errors>) => {
      setErrors(prev => {
        const next = { ...prev };

        keys.forEach(key => {
          next[key] = '';
        });

        return next;
      });
    },
    []
  );

  const handleTableSelect = useCallback(
    (table: DBTable) => {
      if (
        table.name === localInputData?.table_name &&
        table.database_name === localInputData?.database_name &&
        table.schema_name === localInputData?.schema_name
      ) {
        return;
      }

      updateInputData(current => {
        return {
          ...current,
          table_name: table.name,
          database_name: table.database_name,
          schema_name: table.schema_name,
          columns: table.columns.map(column => column.name),
          partition_col: undefined,
          npartitions: undefined,
          max_rows_per_partition: undefined,
          partition_grouping: undefined,
        };
      });

      clearErrors(TABLE_DEPENDENT_ERRORS);
      setActiveTab('params');
    },
    [
      clearErrors,
      localInputData?.database_name,
      localInputData?.schema_name,
      localInputData?.table_name,
      updateInputData,
    ]
  );

  const handleCatalogTableSelect = useCallback(
    (ref: DbCatalogTableRef) => {
      if (catalogMode !== 'lazy') {
        const table = findDbMetadataTable(inputMetadata, {
          databaseName: ref.databaseName,
          schemaName: ref.schemaName,
          tableName: ref.name,
        });
        if (table) {
          handleTableSelect(table);
        }
        return;
      }

      const current = normalizeDbCatalogParentNames(
        catalogCapabilities,
        literalDatabaseName,
        literalSchemaName
      );
      const next = normalizeDbCatalogParentNames(
        catalogCapabilities,
        ref.databaseName,
        ref.schemaName
      );
      if (
        ref.name === literalTableName &&
        next.databaseName === current.databaseName &&
        next.schemaName === current.schemaName
      ) {
        return;
      }

      pendingLazyTableSelectionRef.current = true;
      setActiveTab('params');
      updateInputData(current => ({
        ...current,
        database_name: ref.databaseName,
        schema_name: ref.schemaName,
        table_name: ref.name,
        columns: null,
        partition_col: undefined,
        npartitions: undefined,
        max_rows_per_partition: undefined,
        partition_grouping: undefined,
      }));
      clearErrors(TABLE_DEPENDENT_ERRORS);
    },
    [
      catalogCapabilities,
      catalogMode,
      clearErrors,
      handleTableSelect,
      inputMetadata,
      literalDatabaseName,
      literalSchemaName,
      literalTableName,
      updateInputData,
    ]
  );

  const handleLazyTableDetail = useCallback(
    (table: DbCatalogTableDetail) => {
      updateInputData(current => {
        if (
          getLiteralStringValue(current.table_name) !== table.name ||
          getLiteralStringValue(current.database_name) !== table.databaseName ||
          getLiteralStringValue(current.schema_name) !== table.schemaName
        ) {
          return current;
        }
        return {
          ...current,
          columns: table.columns.map(column => column.name),
        };
      });
    },
    [updateInputData]
  );

  useEffect(() => {
    if (catalogMode !== 'lazy' || !lazyTable.item) {
      return;
    }
    if (
      lazyTable.item.name !== literalTableName ||
      lazyTable.item.databaseName !== literalDatabaseName ||
      lazyTable.item.schemaName !== literalSchemaName
    ) {
      return;
    }

    if (!pendingLazyTableSelectionRef.current) {
      return;
    }

    pendingLazyTableSelectionRef.current = false;
    handleLazyTableDetail(lazyTable.item);
  }, [
    catalogMode,
    handleLazyTableDetail,
    lazyTable.item,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
  ]);

  const isTableMetadataLoading =
    catalogMode === 'lazy' &&
    Boolean(literalTableName) &&
    !lazyTable.item &&
    (lazyTable.state === 'loading' || lazyTable.isRefreshing);

  const selectorFields = useMemo<ReadTableFromDBV3SelectorField[]>(
    () => [
      ...(isDatabaseSelectionSupported ? (['database_name'] as const) : []),
      ...(isSchemaSupported ? (['schema_name'] as const) : []),
      'table_name',
    ],
    [isDatabaseSelectionSupported, isSchemaSupported]
  );

  const enterExpressionMode = useCallback(() => {
    const current = localInputData ?? {};
    const restored = expressionSnapshotRef.current;
    const patch: Partial<ReadTableFromDBV3Values> = { columns: null };

    selectorFields.forEach(field => {
      const restoredValue = restored?.[field];
      patch[field] =
        restoredValue !== undefined
          ? restoredValue
          : toSelectorExpression(current[field]);
    });

    literalSnapshotRef.current = pickSelectorSnapshot(current);
    expressionModeResolvedRef.current = true;
    updateInputData(prev => ({ ...prev, ...patch }));
    clearErrors(['table_name']);
    setIsExpressionMode(true);
  }, [clearErrors, localInputData, selectorFields, updateInputData]);

  const exitExpressionMode = useCallback(() => {
    const current = localInputData ?? {};
    const restored = literalSnapshotRef.current;
    const patch: Partial<ReadTableFromDBV3Values> = {};

    selectorFields.forEach(field => {
      if (isExpressionValue(current[field])) {
        patch[field] = restored?.[field] ?? undefined;
      }
    });
    if (isExpressionValue(current.table_name)) {
      patch.columns = restored?.columns ?? null;
    }

    expressionSnapshotRef.current = pickSelectorSnapshot(current);
    updateInputData(prev => ({ ...prev, ...patch }));
    clearErrors(['table_name']);
    setIsExpressionMode(false);
  }, [clearErrors, localInputData, selectorFields, updateInputData]);

  const handleSelectorExpressionChange = useCallback(
    (field: ReadTableFromDBV3SelectorField, value: unknown) => {
      updateInputData(current => ({
        ...current,
        [field]: value as ReadTableFromDBV3SelectorValue,
      }));
      if (field === 'table_name') {
        clearErrors(['table_name']);
      }
    },
    [clearErrors, updateInputData]
  );

  const handlePartitionColumnSelect = useCallback(
    (columnName: string) => {
      if (columnName === localInputData?.partition_col) {
        return;
      }

      updateInputData(current => {
        if (columnName === '') {
          return {
            ...current,
            partition_col: undefined,
            partition_grouping: undefined,
            npartitions: undefined,
            max_rows_per_partition: undefined,
          };
        }

        const nextPartitionColumnType = getPartitionColumnType(
          columnName,
          availableColumns
        );

        return {
          ...current,
          partition_col: columnName,
          partition_grouping:
            current.partition_grouping &&
            !isPartitionGroupingModeCompatible(
              current.partition_grouping,
              nextPartitionColumnType
            )
              ? undefined
              : current.partition_grouping,
        };
      });

      clearErrors([
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
    },
    [
      availableColumns,
      clearErrors,
      localInputData?.partition_col,
      updateInputData,
    ]
  );

  const handlePartitionGroupingChange = useCallback(
    (grouping: PartitionGrouping | null) => {
      const currentGrouping = localInputData?.partition_grouping ?? null;

      clearErrors(['partition_grouping']);
      setPartitionGroupingErrors(prevErrors => {
        if (!prevErrors) {
          return prevErrors;
        }
        if (
          !grouping ||
          !currentGrouping ||
          currentGrouping.mode !== grouping.mode
        ) {
          return undefined;
        }

        const nextErrors = { ...prevErrors };
        const keys = new Set([
          ...Object.keys(currentGrouping),
          ...Object.keys(grouping),
        ]);

        keys.forEach(key => {
          if (currentGrouping[key] !== grouping[key]) {
            delete nextErrors[key];
          }
        });

        return Object.keys(nextErrors).length > 0 ? nextErrors : undefined;
      });

      updateInputData(current => {
        return {
          ...current,
          partition_grouping: grouping ?? undefined,
        };
      });
    },
    [clearErrors, localInputData?.partition_grouping, updateInputData]
  );

  /** Колонка и группировка одним обновлением: подбор настроек и его отмена. */
  const applyPartitioningSettings = useCallback(
    (settings: PartitioningSettings) => {
      updateInputData(current => ({
        ...current,
        partition_col: settings.partition_col ?? undefined,
        partition_grouping: settings.partition_grouping ?? undefined,
      }));
      clearErrors(['partition_col', 'partition_grouping']);
      setPartitionGroupingErrors(undefined);
    },
    [clearErrors, updateInputData]
  );

  const handleColumnToggle = useCallback(
    (columnName: string) => {
      updateInputData(current => {
        return {
          ...current,
          columns: toggleColumnSelection(
            availableColumnNames,
            current.columns,
            columnName
          ),
        };
      });
    },
    [availableColumnNames, updateInputData]
  );

  const setSelectedColumns = useCallback(
    (columns: string[]) => {
      updateInputData(current => {
        return {
          ...current,
          columns: columns.length > 0 ? columns : null,
        };
      });
    },
    [updateInputData]
  );

  const handleOptionalIntegerChange = useCallback(
    (
      field: 'npartitions' | 'max_rows_per_partition' | 'limit',
      value: string,
      options: { min: number; max?: number }
    ) => {
      updateInputData(current => {
        return {
          ...current,
          [field]: parseOptionalInteger(value, options),
        };
      });

      clearErrors([field]);
    },
    [clearErrors, updateInputData]
  );

  const handleNPartitionsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleOptionalIntegerChange('npartitions', event.target.value, {
        min: 1,
      });
    },
    [handleOptionalIntegerChange]
  );

  const handleMaxRowsPerPartitionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleOptionalIntegerChange(
        'max_rows_per_partition',
        event.target.value,
        {
          min: 1,
        }
      );
    },
    [handleOptionalIntegerChange]
  );

  const handleLimitChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleOptionalIntegerChange('limit', event.target.value, {
        min: 1,
        max: 1_000_000,
      });
    },
    [handleOptionalIntegerChange]
  );

  const handleTTLCacheChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateInputData(current => {
        return {
          ...current,
          TTL_CACHE: sanitizeTTLCache(event.target.value),
        };
      });
    },
    [updateInputData]
  );

  useEffect(() => {
    updateInputData(current => {
      const nextTtlCache = sanitizeTTLCache(current.TTL_CACHE);

      if (current.TTL_CACHE === nextTtlCache) {
        return current;
      }

      return {
        ...current,
        TTL_CACHE: nextTtlCache,
      };
    });
  }, [updateInputData]);

  useEffect(() => {
    if (localInputData?.partition_grouping) {
      return;
    }

    setPartitionGroupingErrors(undefined);
    setErrors(prev => {
      return prev.partition_grouping
        ? {
            ...prev,
            partition_grouping: '',
          }
        : prev;
    });
  }, [localInputData?.partition_grouping]);

  const validateInputData = useCallback(() => {
    const validationResult = validateReadTableFromDBV3({
      inputData: localInputData,
      isPartitionColumnRequired,
      partitionColumnType,
      availablePartitionColumns:
        selectedTable?.columns.map(column => column.name) ?? null,
    });

    setErrors(validationResult.errors);
    setPartitionGroupingErrors(validationResult.partitionGroupingErrors);

    if (!validationResult.isValid) {
      const nextSectionErrors = getSectionErrors(validationResult.errors);
      if (nextSectionErrors.options) setActiveTab('params');
      if (nextSectionErrors.advanced) setIsAdvancedOpen(true);
    }

    return validationResult.isValid;
  }, [
    isPartitionColumnRequired,
    localInputData,
    partitionColumnType,
    selectedTable,
  ]);

  useEffect(() => {
    setValidationCallback?.(() => validateInputData);
  }, [setValidationCallback, validateInputData]);

  const isDatabaseExpression = isExpressionValue(localInputData?.database_name);
  const isSchemaExpression = isExpressionValue(localInputData?.schema_name);
  const isTableExpression = isExpressionValue(localInputData?.table_name);

  return {
    activeTab,
    applyPartitioningSettings,
    availableColumns,
    catalogCapabilities,
    catalogMode,
    enterExpressionMode,
    errors,
    exitExpressionMode,
    handleCatalogTableSelect,
    handleColumnToggle,
    handleLazyTableDetail,
    handleLimitChange,
    handleMaxRowsPerPartitionChange,
    handleNPartitionsChange,
    handlePartitionColumnSelect,
    handlePartitionGroupingChange,
    handleSelectorExpressionChange,
    handleTTLCacheChange,
    handleTableSelect,
    hasMetadataExpression:
      isDatabaseExpression || isSchemaExpression || isTableExpression,
    inputMetadata,
    isAdvancedOpen,
    isConnectionMetadataLoading,
    isDatabaseExpression,
    isDatabaseSelectionSupported,
    isExpressionMode,
    isPartitionColumnRequired,
    isSchemaExpression,
    isSchemaSupported,
    isTableExpression,
    isTableMetadataLoading,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    partitionColumnType,
    partitionGroupingErrors,
    retryTableMetadata: lazyTable.retry,
    sectionErrors,
    selectedColumnsCount,
    selectedTable,
    selectorFields,
    setActiveTab,
    setIsAdvancedOpen,
    setSelectedColumns,
    tableMetadataError: lazyTable.error,
    tableMetadataState: lazyTable.state,
  };
};

export type ReadTableFromDBV3Form = ReturnType<typeof useReadTableFromDBV3Form>;
