import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { type PartitionGrouping } from '@/features/node/db-partitioning-grouping-input';
import { useDbTargetCatalogController } from '@/features/node/db-target-selector/model/useDbTargetCatalogController';
import { useConnectedNodeMetadata } from '@/features/node/get-node-metadata';

import { resolveDbCatalogMode } from '@/entities/data/db-connection/model/catalogNormalizers';
import type { DbCatalogTableDetail } from '@/entities/data/db-connection/model/catalogTypes';
import { getDbCatalogCapabilities } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type {
  DataType,
  DbMetadata as DBMetadata,
  DbTable as DBTable,
} from '@/shared/gatewayClient';
import { isExpressionValue } from '@/shared/lib/node-input-values';

import {
  buildSelectedTableLabel,
  findSelectedTable,
  getDatabaseOptions,
  getFilteredColumns,
  getFilteredTables,
  getFirstErrorSection,
  getInitialActiveSection,
  getLiteralStringValue,
  getPartitionColumnType,
  getSchemaOptions,
  getSectionErrors,
  getSelectedColumnsCount,
  getSelectorCollapsedValue,
  hasSinglePrimaryKeyColumn,
  isPartitionGroupingModeCompatible,
  parseOptionalInteger,
  sanitizeTTLCache,
  toggleColumnSelection,
} from '../lib/helpers';
import type {
  ReadTableFromDBV3Errors,
  ReadTableFromDBV3SectionId,
  ReadTableFromDBV3Values,
} from '../lib/types';
import { validateReadTableFromDBV3 } from '../lib/validation';

type UseReadTableFromDBV3FormArgs = {
  nodeID: string;
  localInputData: ReadTableFromDBV3Values | undefined;
  setLocalInputData: NodeModalExtensionProps<ReadTableFromDBV3Values>['setLocalInputData'];
  setValidationCallback?: NodeModalExtensionProps<ReadTableFromDBV3Values>['setValidationCallback'];
};

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
  const [activeSectionId, setActiveSectionId] =
    useState<ReadTableFromDBV3SectionId>(() =>
      getInitialActiveSection(localInputData, inputMetadata)
    );
  const wasConnectionMetadataLoadingRef = useRef(isConnectionMetadataLoading);
  const pendingLazyTableSelectionRef = useRef(false);

  useEffect(() => {
    if (
      wasConnectionMetadataLoadingRef.current &&
      !isConnectionMetadataLoading
    ) {
      setActiveSectionId(
        getInitialActiveSection(localInputData, inputMetadata)
      );
    }
    wasConnectionMetadataLoadingRef.current = isConnectionMetadataLoading;
  }, [inputMetadata, isConnectionMetadataLoading, localInputData]);

  const literalDatabaseName = useMemo(() => {
    return getLiteralStringValue(localInputData?.database_name);
  }, [localInputData?.database_name]);

  const literalSchemaName = useMemo(() => {
    return getLiteralStringValue(localInputData?.schema_name);
  }, [localInputData?.schema_name]);

  const literalTableName = useMemo(() => {
    return getLiteralStringValue(localInputData?.table_name);
  }, [localInputData?.table_name]);
  const catalog = useDbTargetCatalogController(inputMetadata, {
    databaseName: literalDatabaseName,
    schemaName: literalSchemaName,
    tableName: literalTableName,
    databasesEnabled: activeSectionId === 'database',
    schemasEnabled: activeSectionId === 'schema',
    tablesEnabled: activeSectionId === 'table',
    detailEnabled: Boolean(literalTableName),
  });
  const lazyTable = catalog.table;
  const lazyTableItems = catalog.tableItems;
  const lazySelectedTableItem = catalog.selectedTableItem;
  const lazyDatabaseOptions = catalog.databaseOptions;
  const lazySchemaOptions = catalog.schemaOptions;
  const lazyDatabases = catalog.databases;
  const lazySchemas = catalog.schemas;
  const lazyTables = catalog.tables;
  const lazyCatalogRefresh = catalog.refresh;
  const {
    databaseSearch: lazyDatabaseSearch,
    setDatabaseSearch: setLazyDatabaseSearch,
    schemaSearch: lazySchemaSearch,
    setSchemaSearch: setLazySchemaSearch,
    tableSearch: lazyTableSearch,
    setTableSearch: setLazyTableSearch,
  } = catalog;
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
        dtype: column.dtype as DataType,
        nullable: column.nullable,
        index: column.indexed,
        primary_key: column.primaryKey,
        indexes: column.indexes,
      })),
    };
  }, [catalogMode, inputMetadata, lazyTable.item, localInputData]);

  const selectedTableLabel = useMemo(() => {
    return buildSelectedTableLabel(localInputData);
  }, [localInputData]);

  const databaseCollapsedValue = useMemo(() => {
    return getSelectorCollapsedValue(
      localInputData?.database_name,
      'Не выбрана'
    );
  }, [localInputData?.database_name]);

  const schemaCollapsedValue = useMemo(() => {
    return getSelectorCollapsedValue(localInputData?.schema_name, 'Не выбрана');
  }, [localInputData?.schema_name]);

  const tableCollapsedValue = useMemo(() => {
    return getSelectorCollapsedValue(localInputData?.table_name, 'Не выбрана');
  }, [localInputData?.table_name]);

  const databaseOptions = useMemo(() => {
    return getDatabaseOptions(inputMetadata);
  }, [inputMetadata]);

  const schemaOptions = useMemo(() => {
    return getSchemaOptions(inputMetadata, localInputData?.database_name);
  }, [inputMetadata, localInputData?.database_name]);

  const filteredTables = useMemo(() => {
    return getFilteredTables(
      inputMetadata,
      localInputData?.database_name,
      localInputData?.schema_name
    );
  }, [
    inputMetadata,
    localInputData?.database_name,
    localInputData?.schema_name,
  ]);

  const availableColumns = useMemo(() => {
    return selectedTable?.columns ?? [];
  }, [selectedTable]);

  const filteredSelectedColumns = useMemo(() => {
    return getFilteredColumns(selectedTable, localInputData?.columns);
  }, [selectedTable, localInputData?.columns]);

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
      filteredSelectedColumns
    );
  }, [filteredSelectedColumns, localInputData?.partition_col]);

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
        setActiveSectionId('columns');
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

      clearErrors([
        'table_name',
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
      setActiveSectionId('columns');
    },
    [
      clearErrors,
      localInputData?.database_name,
      localInputData?.schema_name,
      localInputData?.table_name,
      updateInputData,
    ]
  );

  const handleLazyTableSelect = useCallback(
    (table: (typeof lazyTableItems)[number]) => {
      const ref = table.catalogRef;
      if (
        lazyTable.item &&
        ref.name === literalTableName &&
        ref.databaseName === literalDatabaseName &&
        ref.schemaName === literalSchemaName
      ) {
        setActiveSectionId('columns');
        return;
      }

      pendingLazyTableSelectionRef.current = true;
      setActiveSectionId('columns');
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
      clearErrors([
        'table_name',
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
    },
    [
      clearErrors,
      lazyTable.item,
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
    setActiveSectionId('columns');
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

  const handleDatabaseValueChange = useCallback(
    (nextValue: unknown) => {
      if (nextValue === localInputData?.database_name) {
        return;
      }

      updateInputData(current => {
        return {
          ...current,
          database_name: nextValue as ReadTableFromDBV3Values['database_name'],
          schema_name: undefined,
          table_name: undefined,
          columns: null,
          partition_col: undefined,
          npartitions: undefined,
          max_rows_per_partition: undefined,
          partition_grouping: undefined,
        };
      });

      clearErrors([
        'table_name',
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
    },
    [clearErrors, localInputData?.database_name, updateInputData]
  );

  const handleSchemaValueChange = useCallback(
    (nextValue: unknown) => {
      if (nextValue === localInputData?.schema_name) {
        return;
      }

      updateInputData(current => {
        return {
          ...current,
          schema_name: nextValue as ReadTableFromDBV3Values['schema_name'],
          table_name: undefined,
          columns: null,
          partition_col: undefined,
          npartitions: undefined,
          max_rows_per_partition: undefined,
          partition_grouping: undefined,
        };
      });

      clearErrors([
        'table_name',
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
    },
    [clearErrors, localInputData?.schema_name, updateInputData]
  );

  const handleTableValueChange = useCallback(
    (nextValue: unknown) => {
      if (nextValue === localInputData?.table_name) {
        return;
      }

      updateInputData(current => {
        return {
          ...current,
          table_name: nextValue as ReadTableFromDBV3Values['table_name'],
          columns: null,
          partition_col: undefined,
          npartitions: undefined,
          max_rows_per_partition: undefined,
          partition_grouping: undefined,
        };
      });

      clearErrors([
        'table_name',
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
    },
    [clearErrors, localInputData?.table_name, updateInputData]
  );

  const handleDatabaseSelect = useCallback(
    (databaseName: string) => {
      if (databaseName === literalDatabaseName) {
        setActiveSectionId(isSchemaSupported ? 'schema' : 'table');
        return;
      }

      updateInputData(current => {
        return {
          ...current,
          database_name: databaseName,
          schema_name: undefined,
          table_name: undefined,
          columns: null,
          partition_col: undefined,
          npartitions: undefined,
          max_rows_per_partition: undefined,
          partition_grouping: undefined,
        };
      });

      clearErrors([
        'table_name',
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
      setActiveSectionId(isSchemaSupported ? 'schema' : 'table');
    },
    [clearErrors, isSchemaSupported, literalDatabaseName, updateInputData]
  );

  const handleSchemaSelect = useCallback(
    (schemaName: string) => {
      if (schemaName === literalSchemaName) {
        setActiveSectionId('table');
        return;
      }

      updateInputData(current => {
        return {
          ...current,
          schema_name: schemaName,
          table_name: undefined,
          columns: null,
          partition_col: undefined,
          npartitions: undefined,
          max_rows_per_partition: undefined,
          partition_grouping: undefined,
        };
      });

      clearErrors([
        'table_name',
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
      setActiveSectionId('table');
    },
    [clearErrors, literalSchemaName, updateInputData]
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

        return {
          ...current,
          partition_col: columnName,
        };
      });

      clearErrors([
        'partition_col',
        'partition_grouping',
        'npartitions',
        'max_rows_per_partition',
      ]);
    },
    [clearErrors, localInputData?.partition_col, updateInputData]
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

  const handleColumnSelect = useCallback(
    (columnName: string) => {
      updateInputData(current => {
        return {
          ...current,
          columns: toggleColumnSelection(current.columns, columnName),
        };
      });
    },
    [updateInputData]
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
    updateInputData(current => {
      if (
        !current.partition_grouping ||
        isPartitionGroupingModeCompatible(
          current.partition_grouping,
          partitionColumnType
        )
      ) {
        return current;
      }

      return {
        ...current,
        partition_grouping: undefined,
      };
    });
  }, [partitionColumnType, updateInputData]);

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

  useEffect(() => {
    if (!localInputData?.partition_col) {
      return;
    }

    const allowedColumns = new Set(
      filteredSelectedColumns.map(column => column.name)
    );

    updateInputData(current => {
      if (!current.partition_col || allowedColumns.has(current.partition_col)) {
        return current;
      }

      return {
        ...current,
        partition_col: undefined,
        partition_grouping: undefined,
        npartitions: undefined,
        max_rows_per_partition: undefined,
      };
    });
  }, [filteredSelectedColumns, localInputData?.partition_col, updateInputData]);

  const validateInputData = useCallback(() => {
    const validationResult = validateReadTableFromDBV3({
      inputData: localInputData,
      isPartitionColumnRequired,
      partitionColumnType,
    });

    setErrors(validationResult.errors);
    setPartitionGroupingErrors(validationResult.partitionGroupingErrors);

    if (!validationResult.isValid) {
      const firstErrorSection = getFirstErrorSection(validationResult.errors);
      if (firstErrorSection) setActiveSectionId(firstErrorSection);
    }

    return validationResult.isValid;
  }, [isPartitionColumnRequired, localInputData, partitionColumnType]);

  useEffect(() => {
    setValidationCallback?.(() => validateInputData);
  }, [setValidationCallback, validateInputData]);

  return {
    activeSectionId,
    availableColumns,
    catalogMode,
    databaseCollapsedValue,
    databaseOptions,
    errors,
    filteredColumns: filteredSelectedColumns,
    filteredTables,
    handleDatabaseSelect,
    handleDatabaseValueChange,
    handleColumnSelect,
    handleLimitChange,
    handleMaxRowsPerPartitionChange,
    handleNPartitionsChange,
    handlePartitionColumnSelect,
    handlePartitionGroupingChange,
    handleSchemaSelect,
    handleSchemaValueChange,
    handleTTLCacheChange,
    handleTableSelect,
    handleLazyTableDetail,
    handleLazyTableSelect,
    handleTableValueChange,
    inputMetadata,
    isConnectionMetadataLoading,
    isDatabaseSelectionSupported,
    isPartitionColumnRequired,
    isSchemaSupported,
    isTableMetadataLoading,
    literalDatabaseName,
    literalSchemaName,
    literalTableName,
    lazyDatabaseOptions,
    lazyDatabaseSearch,
    lazyDatabases,
    lazyCatalogRefresh,
    lazySchemaOptions,
    lazySchemaSearch,
    lazySchemas,
    lazySelectedTableItem,
    lazyTableItems,
    lazyTableSearch,
    lazyTables,
    setLazyDatabaseSearch,
    setLazySchemaSearch,
    setLazyTableSearch,
    isDatabaseExpression: isExpressionValue(localInputData?.database_name),
    isSchemaExpression: isExpressionValue(localInputData?.schema_name),
    isTableExpression: isExpressionValue(localInputData?.table_name),
    partitionColumnType,
    partitionGroupingErrors,
    schemaCollapsedValue,
    schemaOptions,
    sectionErrors,
    selectedColumnsCount,
    selectedTable,
    tableCollapsedValue,
    selectedTableLabel,
    setSelectedColumns,
    setActiveSectionId,
    tableMetadataError: lazyTable.error,
    tableMetadataState: lazyTable.state,
    retryTableMetadata: lazyTable.retry,
  };
};
