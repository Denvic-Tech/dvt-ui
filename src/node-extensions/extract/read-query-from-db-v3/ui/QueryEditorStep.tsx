import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { OnMount } from '@monaco-editor/react';
import { Alert, Box, Button, Stack } from '@mui/material';
import type * as monacoTypes from 'monaco-editor';

import { NodeModalStepperExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { PartitionGrouping } from '@/features/node/db-partitioning-grouping-input';
import { DbCatalogBrowserPanel } from '@/features/node/db-target-selector';
import { useNodeConnections } from '@/features/node/get-node-connections';
import { useNodeData } from '@/features/node/manage-node-data';

import { resolveDbCatalogMode } from '@/entities/data/db-connection/model/catalogNormalizers';
import type { DbCatalogTableDetail } from '@/entities/data/db-connection/model/catalogTypes';

import type { DbMetadata as DBMetadata } from '@/shared/gatewayClient';
import { flattenDbMetadataTables } from '@/shared/lib/db-metadata';
import {
  getConstValue,
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';
import { sanitizeSqlForBackend } from '@/shared/lib/sql';
import { isNonEmpty } from '@/shared/lib/string';
import {
  createSqlCompletionProvider,
  type SqlCompletionCatalog,
  type SqlCompletionColumn,
} from '@/shared/ui/code-editor';
import { TemplateMonacoInput } from '@/shared/ui/node-input';

import { buildDefaultQuery } from '../lib/metadata';
import type { ExtensionState } from '../lib/types';

type QueryParams = Record<string, string>;

type KeyValueRow = {
  id: string;
  key: string;
  value: string;
};

const createRowId = () =>
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildRowsFromObject = (value: unknown): KeyValueRow[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).map(([key, val]) => ({
    id: createRowId(),
    key: String(key),
    value: val === undefined || val === null ? '' : String(val),
  }));
};

const buildObjectFromRows = (rows: KeyValueRow[]) => {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim();
    if (!key) return acc;
    acc[key] = row.value ?? '';
    return acc;
  }, {});
};

const ensureTrailingEmptyRow = (rows: KeyValueRow[]) => {
  if (rows.length === 0) {
    return [{ id: createRowId(), key: '', value: '' }];
  }

  const hasEmptyRow = rows.some(row => !row.key && !row.value);
  return hasEmptyRow
    ? rows
    : [...rows, { id: createRowId(), key: '', value: '' }];
};

const normalizeParams = (value: unknown): QueryParams => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<QueryParams>(
    (acc, [key, val]) => {
      if (!key.trim()) return acc;
      acc[key] = val === undefined || val === null ? '' : String(val);
      return acc;
    },
    {}
  );
};

const normalizeTimeZoneOptions = (options: unknown): string[] => {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.filter((item): item is string => typeof item === 'string');
};

export type DBQueryV3Values = {
  sql_code?: unknown;
  params?: QueryParams | null | undefined;
  parameters?: QueryParams | null | undefined;
  time_zone?: string | null | undefined;
  partition_col?: string | undefined;
  partition_grouping?: PartitionGrouping | null | undefined;
  npartitions?: number | undefined;
  max_rows_per_partition?: number | undefined;
};

export const QueryEditorStep: React.FC<
  NodeModalStepperExtensionProps<DBQueryV3Values, ExtensionState>
> = ({
  isOpen,
  id: nodeID,
  nodeDefinition,
  sharedState,
  setSharedState,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  variables,
  inputVariables,
  projectVariables,
}) => {
  const { getConnectedInputMetadata, getConnectedInputNodeID } =
    useNodeConnections(nodeID);

  const connectedNodeID = useMemo(
    () => getConnectedInputNodeID('connection'),
    [getConnectedInputNodeID]
  );
  const { nodeData: connectedNodeData } = useNodeData(connectedNodeID);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const connectionIDRaw = getConstValue<string>(
      connectedNodeData?.inputValues?.['connection_id']
    );
    const connectionID =
      typeof connectionIDRaw === 'string' && connectionIDRaw.trim()
        ? connectionIDRaw
        : null;

    setSharedState(prev => {
      if (prev?.connectionID === connectionID) {
        return prev;
      }

      return {
        ...prev,
        connectionID,
      };
    });
  }, [connectedNodeData, isOpen, setSharedState]);

  const inputMetadata = useMemo(() => {
    return getConnectedInputMetadata('connection') as DBMetadata | null;
  }, [getConnectedInputMetadata]);
  const catalogMode = resolveDbCatalogMode(inputMetadata);
  const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(
    null
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogDatabase, setCatalogDatabase] = useState<string | null>(
    inputMetadata?.database_name ?? null
  );
  const [catalogSchema, setCatalogSchema] = useState<string | null>(null);
  const [catalogTable, setCatalogTable] = useState<string | null>(null);
  const [sessionTableDetails, setSessionTableDetails] = useState<
    DbCatalogTableDetail[]
  >([]);

  const handleEditorMount = useCallback<OnMount>(editor => {
    editorRef.current = editor;
  }, []);

  const insertAtSelection = useCallback((text: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const selection = editor.getSelection();
    if (!selection) return;
    editor.executeEdits('db-catalog', [{ range: selection, text }]);
    editor.focus();
  }, []);

  const defaultQuery = useMemo(
    () => buildDefaultQuery(inputMetadata ?? null),
    [inputMetadata]
  );

  const rawQueryValue = localInputData.sql_code ?? defaultQuery;
  const queryValue =
    isExpressionValue(rawQueryValue) &&
    rawQueryValue.expression_kind === 'template'
      ? rawQueryValue.value
      : String(rawQueryValue ?? '');

  const paramsFromInputData = useMemo(() => {
    if (localInputData.params) {
      return normalizeParams(localInputData.params);
    }

    return normalizeParams(localInputData.parameters);
  }, [localInputData.params, localInputData.parameters]);

  const [paramRows, setParamRows] = useState<KeyValueRow[]>(() =>
    ensureTrailingEmptyRow(buildRowsFromObject(paramsFromInputData))
  );

  const paramsSyncRef = useRef(false);

  useEffect(() => {
    if (paramsSyncRef.current) {
      paramsSyncRef.current = false;
      return;
    }

    setParamRows(
      ensureTrailingEmptyRow(buildRowsFromObject(paramsFromInputData))
    );
  }, [paramsFromInputData]);

  const duplicateParamKeys = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of paramRows) {
      const key = row.key.trim();
      if (!key) continue;

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([key]) => key);
  }, [paramRows]);

  const syncParamRows = useCallback(
    (nextRows: KeyValueRow[]) => {
      const rowsWithEmptyTail = ensureTrailingEmptyRow(nextRows);
      const paramsObject = buildObjectFromRows(rowsWithEmptyTail);

      paramsSyncRef.current = true;
      setParamRows(rowsWithEmptyTail);

      setLocalInputData(prev => ({
        ...(prev ?? {}),
        params: Object.keys(paramsObject).length > 0 ? paramsObject : undefined,
        parameters: undefined,
      }));
    },
    [setLocalInputData]
  );

  const handleQueryChange = useCallback(
    (value: unknown) => {
      setLocalInputData(prev => ({ ...(prev ?? {}), sql_code: value }));
    },
    [setLocalInputData]
  );

  useEffect(() => {
    setValidationCallback?.(() => {
      return () => {
        const cleanQuery = sanitizeSqlForBackend(queryValue);
        const paramsObject = buildObjectFromRows(paramRows);
        const nextQueryValue =
          isExpressionValue(rawQueryValue) &&
          rawQueryValue.expression_kind === 'template'
            ? makeExpressionValue(cleanQuery, 'template')
            : cleanQuery;

        setLocalInputData(prev => ({
          ...(prev ?? {}),
          sql_code: nextQueryValue,
          params:
            Object.keys(paramsObject).length > 0 ? paramsObject : undefined,
          parameters: undefined,
        }));

        return isNonEmpty(cleanQuery) && duplicateParamKeys.length === 0;
      };
    });
  }, [
    duplicateParamKeys,
    paramRows,
    queryValue,
    rawQueryValue,
    setLocalInputData,
    setValidationCallback,
  ]);

  const dialect =
    (inputMetadata as any)?.dialect || (inputMetadata as any)?.driver || 'SQL';

  const sqlCompletionCatalog = useMemo<SqlCompletionCatalog>(() => {
    const catalog: SqlCompletionCatalog = {
      dialect: String(dialect),
      tables: [],
    };

    const completionTables =
      catalogMode === 'lazy'
        ? sessionTableDetails.map(table => ({
            name: table.name,
            database_name: table.databaseName,
            schema_name: table.schemaName,
            type:
              table.kind === 'view'
                ? ('VIEW' as const)
                : ('BASE_TABLE' as const),
            columns: table.columns.map(column => ({
              name: column.name,
              dtype: column.dtype,
            })),
          }))
        : flattenDbMetadataTables(inputMetadata);

    for (const table of completionTables) {
      const fullName = table.schema_name
        ? `${table.schema_name}.${table.name}`
        : table.database_name
          ? `${table.database_name}.${table.name}`
          : table.name;
      catalog.tables?.push({
        name: fullName,
        detail: 'table',
        columns: table.columns
          .map((column): SqlCompletionColumn | null => {
            if (!column?.name) {
              return null;
            }
            return {
              name: column.name,
              tableName: fullName,
              ...(column.dtype ? { type: String(column.dtype) } : {}),
            };
          })
          .filter((column): column is SqlCompletionColumn => Boolean(column)),
      });
    }

    return catalog;
  }, [catalogMode, dialect, inputMetadata, sessionTableDetails]);

  const sqlCompletionProviders = useMemo(
    () => [createSqlCompletionProvider(() => sqlCompletionCatalog)],
    [sqlCompletionCatalog]
  );

  const queryIsValid = isNonEmpty(queryValue);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: '100%',
        minHeight: 0,
      }}
    >
      {!sharedState?.connectionID && (
        <Alert severity='warning' sx={{ py: 0.5 }}>
          Для продолжения подключите вход connection к ноде с идентификатором
          подключения.
        </Alert>
      )}

      <Stack direction='row' justifyContent='flex-end'>
        <Button size='small' onClick={() => setCatalogOpen(value => !value)}>
          Каталог
        </Button>
      </Stack>

      <Box sx={{ display: 'flex', gap: 1.5, minHeight: 0, flex: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <TemplateMonacoInput
            value={rawQueryValue}
            onChange={handleQueryChange}
            onMount={handleEditorMount}
            variables={variables}
            inputVariables={inputVariables}
            projectVariables={projectVariables}
            allowExpressions={Boolean(
              nodeDefinition.input_definitions['sql_code']?.allow_expressions
            )}
            expressionPolicyName={
              nodeDefinition.input_definitions['sql_code']?.expression_policy
            }
            language='sql'
            height='100%'
            helperText='В шаблонах используйте {{ input_variables.name }} для входящих переменных и {{ project_variables.name }} для переменных проекта. Вне {{ ... }} остаются SQL-подсказки.'
            completionProviders={sqlCompletionProviders}
          />
        </Box>
        {catalogOpen && inputMetadata ? (
          <Box
            sx={{
              width: { xs: '100%', lg: 440 },
              minWidth: { lg: 360 },
              overflow: 'auto',
              borderLeft: { lg: 1 },
              borderColor: 'divider',
              pl: { lg: 1.5 },
            }}
          >
            <DbCatalogBrowserPanel
              metadata={inputMetadata}
              databaseName={catalogDatabase}
              schemaName={catalogSchema}
              tableName={catalogTable}
              onDatabaseChange={value => {
                setCatalogDatabase(value);
                setCatalogSchema(null);
                setCatalogTable(null);
              }}
              onSchemaChange={value => {
                setCatalogSchema(value);
                setCatalogTable(null);
              }}
              onTableChange={table => {
                setCatalogDatabase(table.databaseName ?? catalogDatabase);
                setCatalogSchema(table.schemaName ?? catalogSchema);
                setCatalogTable(table.name);
              }}
              onTableDetail={table => {
                setSessionTableDetails(current => [
                  ...current.filter(
                    item =>
                      item.name !== table.name ||
                      item.databaseName !== table.databaseName ||
                      item.schemaName !== table.schemaName
                  ),
                  table,
                ]);
              }}
              onInsertTable={table =>
                insertAtSelection(
                  [table.databaseName, table.schemaName, table.name]
                    .filter(Boolean)
                    .join('.')
                )
              }
              onInsertColumn={insertAtSelection}
            />
          </Box>
        ) : null}
      </Box>

      {!queryIsValid && (
        <Alert severity='info' sx={{ py: 0.5 }}>
          Введите SQL-запрос для продолжения. На следующем шаге будет выполнен
          запрос метаданных.
        </Alert>
      )}
    </Box>
  );
};
