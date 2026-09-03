import { useCallback, useEffect, useMemo, useState } from 'react';
import DataObjectRoundedIcon from '@mui/icons-material/DataObjectRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import StorageIcon from '@mui/icons-material/Storage';
import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import {
  DatabaseSection,
  hasConfiguredSelectorValue,
  SchemaSection,
  TableSection,
  useDbTargetCatalogController,
} from '@/features/node/db-target-selector';
import { AccordionContainer } from '@/features/node/db-target-selector/ui/styles';
import { useConnectedNodeMetadata } from '@/features/node/get-node-metadata';
import { TableCreateSpecEditor } from '@/features/node/table-create-spec-editor';

import { DataFrameMetadataInputEditor } from '@/entities/data/dataframe';

import { StaticAccordionSection } from '@/shared/ui/node-input';

import {
  buildCreateTableCollapsedValues,
  buildCreateTableDerivedState,
  buildInitialOpenSections,
  type CreateTableFieldErrors,
  type CreateTableSectionId,
  type CreateTableValues,
  getCreateTableSchemaOptions,
  isExpressionLikeValue,
} from '../lib/helpers';

const SectionActions = ({
  options,
  value,
  onChange,
}: {
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) => {
  return (
    <Stack direction='row' flexWrap='wrap' gap={1}>
      {options.map(option => {
        const selected = value === option;

        return (
          <Button
            key={option}
            size='small'
            variant={selected ? 'contained' : 'outlined'}
            onClick={() => onChange(option)}
            sx={{ textTransform: 'none' }}
          >
            {option}
          </Button>
        );
      })}
    </Stack>
  );
};

export const CreateTableEditor = ({
  id: nodeID,
  localInputData,
  nodeDefinition,
  setLocalInputData,
  setValidationCallback,
  variables,
}: NodeModalExtensionProps<CreateTableValues>) => {
  const { connectedNodeMetadataByInput } = useConnectedNodeMetadata(nodeID);

  const connectionMetadata = useMemo(() => {
    return (connectedNodeMetadataByInput?.['connection'] as any) ?? null;
  }, [connectedNodeMetadataByInput]);
  const derivedState = useMemo(() => {
    return buildCreateTableDerivedState(localInputData, connectionMetadata);
  }, [connectionMetadata, localInputData]);
  const collapsedValues = useMemo(() => {
    return buildCreateTableCollapsedValues(localInputData);
  }, [localInputData]);
  const schemaOptions = useMemo(() => {
    return getCreateTableSchemaOptions(
      connectionMetadata,
      localInputData?.database_name
    );
  }, [connectionMetadata, localInputData?.database_name]);

  const [openSections, setOpenSections] = useState<CreateTableSectionId[]>(
    () => {
      return buildInitialOpenSections(localInputData, connectionMetadata);
    }
  );
  const [fieldErrors, setFieldErrors] = useState<CreateTableFieldErrors>({});
  const [dataFrameErrors, setDataFrameErrors] = useState<string[]>([]);
  const [tableCreateSpecErrors, setTableCreateSpecErrors] = useState<string[]>(
    []
  );
  const catalog = useDbTargetCatalogController(connectionMetadata, {
    databaseName: derivedState.literalDatabaseName,
    schemaName: derivedState.literalSchemaName,
    tableName:
      typeof localInputData?.table_name === 'string'
        ? localInputData.table_name
        : null,
    databasesEnabled: openSections.includes('database'),
    schemasEnabled: openSections.includes('schema'),
    tablesEnabled: openSections.includes('table'),
    detailEnabled: openSections.includes('table'),
  });
  const isLazyCatalog = catalog.mode === 'lazy';

  useEffect(() => {
    setOpenSections(current =>
      current.length > 0
        ? current
        : buildInitialOpenSections(localInputData, connectionMetadata)
    );
  }, [connectionMetadata, localInputData]);

  const getInputDefinition = useCallback(
    (attrName: string) => {
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

  const updateInputData = useCallback(
    (updater: (current: CreateTableValues) => CreateTableValues) => {
      setLocalInputData(prev => updater((prev ?? {}) as CreateTableValues));
    },
    [setLocalInputData]
  );

  const toggleSection = useCallback((sectionId: CreateTableSectionId) => {
    setOpenSections(current =>
      current.includes(sectionId)
        ? current.filter(section => section !== sectionId)
        : [...current, sectionId]
    );
  }, []);

  const isSectionOpen = useCallback(
    (sectionId: CreateTableSectionId) => {
      return openSections.includes(sectionId);
    },
    [openSections]
  );

  const clearFieldError = useCallback((field: keyof CreateTableFieldErrors) => {
    setFieldErrors(current => ({
      ...current,
      [field]: '',
    }));
  }, []);

  const validateInputData = useCallback(() => {
    const nextErrors: CreateTableFieldErrors = {};

    if (!hasConfiguredSelectorValue(localInputData?.table_name)) {
      nextErrors.table_name = 'Выберите таблицу или задайте expression.';
    }

    if (isExpressionLikeValue(localInputData?.dataframe_metadata)) {
      nextErrors.dataframe_metadata =
        'Expression mode для dataframe_metadata пока не поддержан в CreateTable editor.';
    } else if (dataFrameErrors.length > 0) {
      nextErrors.dataframe_metadata = dataFrameErrors[0];
    } else if (!localInputData?.dataframe_metadata?.columns?.length) {
      nextErrors.dataframe_metadata = 'Добавьте хотя бы одну колонку.';
    }

    if (tableCreateSpecErrors.length > 0) {
      nextErrors.table_create_spec = tableCreateSpecErrors[0];
    }

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).every(error => !error);
  }, [dataFrameErrors, localInputData, tableCreateSpecErrors]);

  useEffect(() => {
    setValidationCallback?.(() => validateInputData);
  }, [setValidationCallback, validateInputData]);

  const onExistsInputDefinition = getInputDefinition('on_exists');
  const onExistsOptions = Array.isArray(onExistsInputDefinition?.options)
    ? onExistsInputDefinition.options.filter(
        (option): option is string => typeof option === 'string'
      )
    : ['ignore', 'recreate', 'error'];
  const selectedOnExists =
    localInputData?.on_exists ??
    (typeof onExistsInputDefinition?.default === 'string'
      ? onExistsInputDefinition.default
      : 'error');

  useEffect(() => {
    if (localInputData?.on_exists != null) {
      return;
    }

    updateInputData(current => ({
      ...current,
      on_exists: selectedOnExists,
    }));
  }, [localInputData?.on_exists, selectedOnExists, updateInputData]);

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <AccordionContainer>
        {derivedState.isDatabaseSelectionSupported ? (
          <DatabaseSection
            collapsedValue={collapsedValues.database}
            inputDefinition={getInputDefinition('database_name')}
            isOpen={isSectionOpen('database')}
            onChange={nextValue => {
              updateInputData(current => ({
                ...current,
                database_name: nextValue as CreateTableValues['database_name'],
                schema_name: undefined,
                table_name: undefined,
              }));
              clearFieldError('table_name');
            }}
            onDatabaseSelect={databaseName => {
              updateInputData(current => ({
                ...current,
                database_name: databaseName,
                schema_name: undefined,
                table_name: undefined,
              }));
              clearFieldError('table_name');
            }}
            onToggle={() => toggleSection('database')}
            options={
              isLazyCatalog
                ? catalog.databaseOptions
                : derivedState.databaseOptions
            }
            selectedValue={derivedState.literalDatabaseName}
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
                  isRefreshing: catalog.refresh.isLoading,
                }
              : {})}
          />
        ) : null}

        {derivedState.isSchemaSupported ? (
          <SchemaSection
            collapsedValue={collapsedValues.schema}
            inputDefinition={getInputDefinition('schema_name')}
            isOpen={isSectionOpen('schema')}
            onChange={nextValue => {
              updateInputData(current => ({
                ...current,
                schema_name: nextValue as CreateTableValues['schema_name'],
                table_name: undefined,
              }));
              clearFieldError('table_name');
            }}
            onSchemaSelect={schemaName => {
              updateInputData(current => ({
                ...current,
                schema_name: schemaName,
                table_name: undefined,
              }));
              clearFieldError('table_name');
            }}
            onToggle={() => toggleSection('schema')}
            options={isLazyCatalog ? catalog.schemaOptions : schemaOptions}
            selectedValue={derivedState.literalSchemaName}
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
                  isRefreshing: catalog.refresh.isLoading,
                }
              : {})}
          />
        ) : null}

        {isLazyCatalog ? (
          <TableSection
            allowNew
            collapsedValue={collapsedValues.table}
            error={fieldErrors.table_name}
            hasError={Boolean(fieldErrors.table_name)}
            inputDefinition={getInputDefinition('table_name')}
            isOpen={isSectionOpen('table')}
            onChange={nextValue => {
              updateInputData(current => ({
                ...current,
                table_name: nextValue as CreateTableValues['table_name'],
              }));
              clearFieldError('table_name');
            }}
            onTableSelect={table => {
              updateInputData(current => ({
                ...current,
                database_name: table.catalogRef.databaseName,
                schema_name: table.catalogRef.schemaName,
                table_name: table.catalogRef.name,
              }));
              clearFieldError('table_name');
            }}
            onToggle={() => toggleSection('table')}
            selectedTable={catalog.selectedTableItem}
            selectedTableLabel={derivedState.selectedTableLabel}
            tables={catalog.tableItems}
            value={localInputData?.table_name}
            variables={variables}
            query={catalog.tableSearch}
            onQueryChange={catalog.setTableSearch}
            state={catalog.tables.state}
            hasNextPage={catalog.tables.hasNextPage}
            isFetchingNextPage={catalog.tables.isFetchingNextPage}
            loadMoreError={catalog.tables.loadMoreError}
            onLoadNextPage={() => void catalog.tables.loadNextPage()}
            onRetry={() => catalog.tables.retry()}
            onRefresh={() => catalog.refresh.refresh()}
            isRefreshing={catalog.refresh.isLoading}
          />
        ) : (
          <TableSection
            allowNew
            collapsedValue={collapsedValues.table}
            error={fieldErrors.table_name}
            hasError={Boolean(fieldErrors.table_name)}
            inputDefinition={getInputDefinition('table_name')}
            isOpen={isSectionOpen('table')}
            onChange={nextValue => {
              updateInputData(current => ({
                ...current,
                table_name: nextValue as CreateTableValues['table_name'],
              }));
              clearFieldError('table_name');
            }}
            onTableSelect={table => {
              updateInputData(current => ({
                ...current,
                database_name: table.database_name,
                schema_name: table.schema_name,
                table_name: table.name,
              }));
              clearFieldError('table_name');
            }}
            onToggle={() => toggleSection('table')}
            selectedTable={derivedState.selectedTable}
            selectedTableLabel={derivedState.selectedTableLabel}
            tables={derivedState.filteredTables}
            value={localInputData?.table_name}
            variables={variables}
          />
        )}

        <StaticAccordionSection
          isOpen={isSectionOpen('dataframe_metadata')}
          onToggle={() => toggleSection('dataframe_metadata')}
          icon={<DataObjectRoundedIcon sx={{ fontSize: 18 }} />}
          title='dataframe_metadata'
          collapsedValue={
            localInputData?.dataframe_metadata?.columns?.length
              ? `${localInputData.dataframe_metadata.columns.length} columns`
              : 'Не задано'
          }
          badge={
            fieldErrors.dataframe_metadata ? (
              <Typography
                sx={theme => ({
                  px: 1,
                  py: 0.25,
                  borderRadius: '999px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                })}
              >
                Error
              </Typography>
            ) : undefined
          }
        >
          <DataFrameMetadataInputEditor
            value={localInputData?.dataframe_metadata}
            onChange={value => {
              updateInputData(current => ({
                ...current,
                dataframe_metadata: value,
              }));
              clearFieldError('dataframe_metadata');
            }}
            onValidationChange={setDataFrameErrors}
          />
        </StaticAccordionSection>

        <StaticAccordionSection
          isOpen={isSectionOpen('table_create_spec')}
          onToggle={() => toggleSection('table_create_spec')}
          icon={<SettingsRoundedIcon sx={{ fontSize: 18 }} />}
          title='table_create_spec'
          collapsedValue={
            localInputData?.table_create_spec ? 'Configured' : 'Optional'
          }
          badge={
            fieldErrors.table_create_spec ? (
              <Typography
                sx={theme => ({
                  px: 1,
                  py: 0.25,
                  borderRadius: '999px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                })}
              >
                Error
              </Typography>
            ) : undefined
          }
        >
          <TableCreateSpecEditor
            value={localInputData?.table_create_spec ?? null}
            columns={derivedState.tableColumns}
            isClickHouse={derivedState.isClickHouse}
            onChange={value => {
              updateInputData(current => ({
                ...current,
                table_create_spec: value,
              }));
              clearFieldError('table_create_spec');
            }}
            onValidationChange={setTableCreateSpecErrors}
          />
        </StaticAccordionSection>

        <StaticAccordionSection
          isOpen={isSectionOpen('on_exists')}
          onToggle={() => toggleSection('on_exists')}
          icon={<StorageIcon sx={{ fontSize: 18 }} />}
          title='on_exists'
          collapsedValue={selectedOnExists}
        >
          <Stack spacing={1}>
            <Typography color='text.secondary' sx={{ fontSize: 13 }}>
              Поведение при существующей таблице.
            </Typography>
            <SectionActions
              options={onExistsOptions}
              value={selectedOnExists}
              onChange={value => {
                updateInputData(current => ({
                  ...current,
                  on_exists: value,
                }));
              }}
            />
          </Stack>
        </StaticAccordionSection>
      </AccordionContainer>
    </Box>
  );
};
