import React from 'react';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { FiTable } from 'react-icons/fi';
import { GoDatabase } from 'react-icons/go';
import { HiOutlineViewColumns } from 'react-icons/hi2';

import type { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { NodeModalWorkspace } from '@/features/node/modal-workspace';

import { useDbCatalogTablePreview } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import {
  getReadTableDataPreviewState,
  getReadTablePreviewState,
} from '../lib/helpers';
import type {
  ReadTableFromDBV3SectionId,
  ReadTableFromDBV3Values,
} from '../lib/types';
import { useReadTableFromDBV3Form } from '../model/useReadTableFromDBV3Form';

import { ColumnsSection } from './sections/ColumnsSection';
import { DatabaseSection } from './sections/DatabaseSection';
import { OptionsSection } from './sections/OptionsSection';
import { SchemaSection } from './sections/SchemaSection';
import { TableSection } from './sections/TableSection';
import { ReadTableDataPreview } from './ReadTableDataPreview';
import { ReadTableDataPreviewSkeleton } from './ReadTableDataPreviewSkeleton';
import { ReadTableMetadataPreview } from './ReadTableMetadataPreview';

const NOOP = () => undefined;

const PreviewMessage = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Stack alignItems='center' justifyContent='center' sx={{ minHeight: 240 }}>
    <Typography sx={{ fontSize: 13.5, fontWeight: 650 }}>{title}</Typography>
    <Typography
      color='text.secondary'
      textAlign='center'
      sx={{ mt: 0.75, maxWidth: 280, fontSize: 12.5 }}
    >
      {description}
    </Typography>
  </Stack>
);

const PreviewErrorMessage = ({ description }: { description: string }) => (
  <Stack
    alignItems='center'
    justifyContent='center'
    sx={{ minHeight: 280, px: 2, textAlign: 'center' }}
  >
    <Box sx={{ position: 'relative' }}>
      <Box
        sx={theme => ({
          width: 46,
          height: 46,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.secondary,
        })}
      >
        <GoDatabase size={18} />
      </Box>
      <Box
        sx={theme => ({
          position: 'absolute',
          right: -4,
          bottom: -4,
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.secondary,
        })}
      >
        <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />
      </Box>
    </Box>

    <Typography sx={{ mt: 1.75, fontSize: 14.5, fontWeight: 650 }}>
      Предпросмотр не загрузился
    </Typography>
    <Typography
      color='text.secondary'
      sx={{ mt: 0.75, maxWidth: 320, fontSize: 12.5, lineHeight: 1.55 }}
    >
      {description}
    </Typography>
  </Stack>
);

export const ReadTableFromDBV3: React.FC<
  NodeModalExtensionProps<ReadTableFromDBV3Values>
> = ({
  id: nodeID,
  localInputData,
  setLocalInputData,
  setValidationCallback,
  nodeDefinition,
  variables,
}) => {
  const form = useReadTableFromDBV3Form({
    nodeID,
    localInputData,
    setLocalInputData,
    setValidationCallback,
  });
  const [activePreviewTabId, setActivePreviewTabId] = React.useState('data');
  const hasMetadataExpression =
    form.isDatabaseExpression ||
    form.isSchemaExpression ||
    form.isTableExpression;
  const tablePreview = useDbCatalogTablePreview(
    form.inputMetadata,
    form.literalDatabaseName,
    form.literalSchemaName,
    form.literalTableName,
    { enabled: !hasMetadataExpression }
  );

  if (form.isConnectionMetadataLoading) {
    return (
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={1.5} sx={{ maxWidth: 800, mx: 'auto' }}>
          {[0, 1, 2, 3].map(item => (
            <Skeleton
              key={item}
              animation='wave'
              variant='rounded'
              height={58}
              sx={{ borderRadius: '10px' }}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  const isDatabaseReady =
    !form.isDatabaseSelectionSupported ||
    Boolean(form.literalDatabaseName || form.isDatabaseExpression);
  const isSchemaReady =
    !form.isSchemaSupported ||
    Boolean(form.literalSchemaName || form.isSchemaExpression);
  const isTableStepDisabled = !isDatabaseReady || !isSchemaReady;
  const areMetadataSectionsDisabled = !form.selectedTable;
  const tableDisabledReason = !isDatabaseReady
    ? 'Сначала выберите базу данных.'
    : !isSchemaReady
      ? 'Сначала выберите схему.'
      : undefined;
  const columnsDisabledReason = form.isTableExpression
    ? 'Метаданные недоступны, пока таблица задана expression-значением.'
    : form.literalTableName
      ? form.isTableMetadataLoading
        ? 'Загрузка метаданных таблицы…'
        : 'Не удалось получить метаданные выбранной таблицы.'
      : 'Сначала выберите таблицу.';

  const getInputDefinition = (attrName: string) => {
    const inputDefinitions = nodeDefinition.input_definitions ?? {};

    return (
      inputDefinitions[attrName] ??
      Object.values(inputDefinitions).find(
        inputDefinition => inputDefinition.attr_name === attrName
      )
    );
  };

  const databaseSection = form.isDatabaseSelectionSupported ? (
    <DatabaseSection
      appearance='workspace'
      collapsedValue={form.databaseCollapsedValue}
      inputDefinition={getInputDefinition('database_name')}
      isOpen
      required
      onChange={form.handleDatabaseValueChange}
      onDatabaseSelect={form.handleDatabaseSelect}
      onToggle={NOOP}
      options={
        form.catalogMode === 'lazy'
          ? form.lazyDatabaseOptions
          : form.databaseOptions
      }
      selectedValue={form.literalDatabaseName}
      value={localInputData?.database_name}
      variables={variables}
      {...(form.catalogMode === 'lazy'
        ? {
            query: form.lazyDatabaseSearch,
            onQueryChange: form.setLazyDatabaseSearch,
            state: form.lazyDatabases.state,
            hasNextPage: form.lazyDatabases.hasNextPage,
            isFetchingNextPage: form.lazyDatabases.isFetchingNextPage,
            loadMoreError: form.lazyDatabases.loadMoreError,
            onLoadNextPage: () => void form.lazyDatabases.loadNextPage(),
            onRetry: () => form.lazyDatabases.retry(),
            onRefresh: () => form.lazyCatalogRefresh.refresh(),
            isRefreshing:
              form.lazyCatalogRefresh.isLoading ||
              form.lazyDatabases.isRefreshing,
          }
        : {})}
    />
  ) : null;

  const schemaSection = form.isSchemaSupported ? (
    <SchemaSection
      appearance='workspace'
      collapsedValue={form.schemaCollapsedValue}
      inputDefinition={getInputDefinition('schema_name')}
      isOpen
      required
      disabled={!isDatabaseReady}
      disabledReason={
        !isDatabaseReady ? 'Сначала выберите базу данных.' : undefined
      }
      onChange={form.handleSchemaValueChange}
      onSchemaSelect={form.handleSchemaSelect}
      onToggle={NOOP}
      options={
        form.catalogMode === 'lazy'
          ? form.lazySchemaOptions
          : form.schemaOptions
      }
      selectedValue={form.literalSchemaName}
      value={localInputData?.schema_name}
      variables={variables}
      {...(form.catalogMode === 'lazy'
        ? {
            query: form.lazySchemaSearch,
            onQueryChange: form.setLazySchemaSearch,
            state: form.lazySchemas.state,
            hasNextPage: form.lazySchemas.hasNextPage,
            isFetchingNextPage: form.lazySchemas.isFetchingNextPage,
            loadMoreError: form.lazySchemas.loadMoreError,
            onLoadNextPage: () => void form.lazySchemas.loadNextPage(),
            onRetry: () => form.lazySchemas.retry(),
            onRefresh: () => form.lazyCatalogRefresh.refresh(),
            isRefreshing: form.lazyCatalogRefresh.isLoading,
          }
        : {})}
    />
  ) : null;

  const tableSection =
    form.catalogMode === 'lazy' ? (
      <TableSection
        appearance='workspace'
        collapsedValue={form.tableCollapsedValue}
        error={form.errors.table_name}
        hasError={form.sectionErrors.table}
        inputDefinition={getInputDefinition('table_name')}
        isOpen
        disabled={isTableStepDisabled}
        disabledReason={tableDisabledReason}
        onChange={form.handleTableValueChange}
        onTableSelect={form.handleLazyTableSelect}
        onToggle={NOOP}
        selectedTable={form.lazySelectedTableItem}
        selectedTableLabel={form.selectedTableLabel}
        tables={form.lazyTableItems}
        value={localInputData?.table_name}
        variables={variables}
        query={form.lazyTableSearch}
        onQueryChange={form.setLazyTableSearch}
        state={form.lazyTables.state}
        hasNextPage={form.lazyTables.hasNextPage}
        isFetchingNextPage={form.lazyTables.isFetchingNextPage}
        loadMoreError={form.lazyTables.loadMoreError}
        onLoadNextPage={() => void form.lazyTables.loadNextPage()}
        onRetry={() => form.lazyTables.retry()}
        onRefresh={() => form.lazyCatalogRefresh.refresh()}
        isRefreshing={
          form.lazyCatalogRefresh.isLoading || form.lazyTables.isRefreshing
        }
      />
    ) : (
      <TableSection
        appearance='workspace'
        collapsedValue={form.tableCollapsedValue}
        error={form.errors.table_name}
        hasError={form.sectionErrors.table}
        inputDefinition={getInputDefinition('table_name')}
        isOpen
        disabled={isTableStepDisabled}
        disabledReason={tableDisabledReason}
        onChange={form.handleTableValueChange}
        onTableSelect={form.handleTableSelect}
        onToggle={NOOP}
        selectedTable={form.selectedTable}
        selectedTableLabel={form.selectedTableLabel}
        tables={form.filteredTables}
        value={localInputData?.table_name}
        variables={variables}
      />
    );

  const columnsSection = (
    <ColumnsSection
      appearance='workspace'
      disabled={areMetadataSectionsDisabled}
      disabledReason={columnsDisabledReason}
      loading={form.isTableMetadataLoading}
      isOpen
      onToggle={NOOP}
      selectedColumns={localInputData?.columns || []}
      selectedColumnsCount={form.selectedColumnsCount}
      selectedTable={form.selectedTable}
      setSelectedColumns={form.setSelectedColumns}
    />
  );

  const optionsSection = (
    <OptionsSection
      appearance='workspace'
      disabled={areMetadataSectionsDisabled}
      disabledReason={columnsDisabledReason}
      loading={form.isTableMetadataLoading}
      columns={form.filteredColumns}
      errors={form.errors}
      hasError={form.sectionErrors.options}
      isOpen
      isPartitionColumnRequired={form.isPartitionColumnRequired}
      onLimitChange={form.handleLimitChange}
      onMaxRowsPerPartitionChange={form.handleMaxRowsPerPartitionChange}
      onNPartitionsChange={form.handleNPartitionsChange}
      onPartitionColumnSelect={form.handlePartitionColumnSelect}
      onPartitionGroupingChange={form.handlePartitionGroupingChange}
      onTTLCacheChange={form.handleTTLCacheChange}
      onToggle={NOOP}
      partitionColumnType={form.partitionColumnType}
      partitionGroupingErrors={form.partitionGroupingErrors}
      selectedTableName={form.selectedTable?.name}
      values={localInputData}
    />
  );

  const sections = [
    ...(databaseSection
      ? [
          {
            id: 'database',
            label: 'База данных',
            icon: <GoDatabase />,
            summary: form.databaseCollapsedValue,
            required: true,
            complete: Boolean(
              form.literalDatabaseName || form.isDatabaseExpression
            ),
            content: databaseSection,
          },
        ]
      : []),
    ...(schemaSection
      ? [
          {
            id: 'schema',
            label: 'Схема',
            icon: <FolderOutlinedIcon />,
            summary: form.schemaCollapsedValue,
            required: true,
            complete: Boolean(
              form.literalSchemaName || form.isSchemaExpression
            ),
            disabled: !isDatabaseReady,
            disabledReason: !isDatabaseReady
              ? 'Сначала выберите базу данных.'
              : undefined,
            content: schemaSection,
          },
        ]
      : []),
    {
      id: 'table',
      label: 'Таблица',
      icon: <FiTable />,
      summary: form.tableCollapsedValue,
      required: true,
      complete: Boolean(form.literalTableName || form.isTableExpression),
      error: form.sectionErrors.table,
      disabled: isTableStepDisabled,
      disabledReason: tableDisabledReason,
      content: tableSection,
    },
    {
      id: 'columns',
      label: 'Колонки',
      icon: <HiOutlineViewColumns />,
      summary: form.selectedTable
        ? `${form.selectedColumnsCount}/${form.selectedTable.columns.length}`
        : 'Не выбраны',
      complete: Boolean(form.selectedTable && form.selectedColumnsCount > 0),
      disabled: areMetadataSectionsDisabled,
      disabledReason: columnsDisabledReason,
      content: columnsSection,
    },
    {
      id: 'options',
      label: 'Параметры',
      icon: <SettingsOutlinedIcon />,
      summary: localInputData?.limit
        ? `Лимит ${localInputData.limit}`
        : 'По умолчанию',
      complete: Boolean(form.selectedTable && !form.sectionErrors.options),
      error: form.sectionErrors.options,
      disabled: areMetadataSectionsDisabled,
      disabledReason: columnsDisabledReason,
      content: optionsSection,
    },
  ];

  const metadataPreviewState = getReadTablePreviewState({
    hasExpression: hasMetadataExpression,
    hasTableName: Boolean(form.literalTableName),
    loading: form.isTableMetadataLoading,
    hasSelectedTable: Boolean(form.selectedTable),
  });
  const dataPreviewState = getReadTableDataPreviewState({
    hasExpression: hasMetadataExpression,
    hasTableName: Boolean(form.literalTableName),
    state: tablePreview.state,
  });
  const isDataPreviewActive = activePreviewTabId === 'data';
  const isDataPreviewLoading =
    isDataPreviewActive &&
    (dataPreviewState === 'loading' || tablePreview.isRefreshing);
  const previewState = isDataPreviewLoading
    ? 'loading'
    : isDataPreviewActive
      ? dataPreviewState
      : metadataPreviewState;
  const previewEmptyState = hasMetadataExpression ? (
    <PreviewMessage
      title='Таблица задана выражением'
      description='Предпросмотр станет доступен во время выполнения ноды. Draft-preview для expression-значений не поддерживается.'
    />
  ) : !form.literalTableName ? (
    <PreviewMessage
      title='Таблица не выбрана'
      description='Выберите таблицу, чтобы увидеть данные и схему.'
    />
  ) : isDataPreviewActive ? (
    <PreviewMessage
      title='В таблице нет строк'
      description='Источник вернул пустой результат для предпросмотра.'
    />
  ) : (
    <PreviewMessage
      title='Схема недоступна'
      description='Не удалось получить метаданные выбранной таблицы.'
    />
  );

  return (
    <NodeModalWorkspace
      activeSectionId={form.activeSectionId}
      onSectionChange={sectionId =>
        form.setActiveSectionId(sectionId as ReadTableFromDBV3SectionId)
      }
      contentWidth='wide'
      sections={sections}
      preview={{
        title: 'Предпросмотр',
        activeTabId: activePreviewTabId,
        onTabChange: setActivePreviewTabId,
        tabs: [
          {
            id: 'data',
            label: 'Данные',
            content: tablePreview.data ? (
              <ReadTableDataPreview preview={tablePreview.data} />
            ) : null,
          },
          {
            id: 'schema',
            label: 'Схема',
            content: form.selectedTable ? (
              <ReadTableMetadataPreview
                databaseName={form.literalDatabaseName}
                schemaName={form.literalSchemaName}
                table={form.selectedTable}
              />
            ) : null,
          },
        ],
        state: previewState,
        ...(isDataPreviewActive
          ? {
              loadingState: (
                <ReadTableDataPreviewSkeleton
                  columnCount={
                    tablePreview.data?.columns.length ??
                    form.selectedTable?.columns.length
                  }
                />
              ),
            }
          : {}),
        refreshing: isDataPreviewActive
          ? tablePreview.state === 'loading' || tablePreview.isRefreshing
          : form.isTableMetadataLoading,
        ...(form.literalTableName && !hasMetadataExpression
          ? isDataPreviewActive
            ? { onRefresh: () => void tablePreview.retry() }
            : form.catalogMode === 'lazy'
              ? { onRefresh: () => void form.retryTableMetadata() }
              : {}
          : {}),
        emptyState: previewEmptyState,
        errorState: (
          <PreviewErrorMessage
            description={
              isDataPreviewActive
                ? 'Источник временно недоступен. Проверьте подключение и повторите обновление предпросмотра.'
                : 'Не удалось получить схему таблицы. Проверьте подключение и повторите обновление.'
            }
          />
        ),
      }}
    />
  );
};

export default ReadTableFromDBV3;
