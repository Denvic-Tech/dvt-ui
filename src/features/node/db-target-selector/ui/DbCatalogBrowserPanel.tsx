import { useEffect, useState } from 'react';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import StorageIcon from '@mui/icons-material/Storage';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import { TablesViewsListV2 } from '@/entities/data/database';
import { ColumnListSelect } from '@/entities/data/dataframe';
import type {
  DbCatalogTableDetail,
  DbCatalogTableRef,
} from '@/entities/data/db-connection/model/catalogTypes';

import type { Column, DbMetadata } from '@/shared/gatewayClient';

import { useDbTargetCatalogController } from '../model/useDbTargetCatalogController';

import { MetadataOptionList } from './MetadataOptionList';

type DbCatalogBrowserPanelProps = {
  metadata: DbMetadata;
  databaseName?: string | null;
  schemaName?: string | null;
  tableName?: string | null;
  onDatabaseChange?: (value: string | null) => void;
  onSchemaChange?: (value: string | null) => void;
  onTableChange?: (value: DbCatalogTableRef) => void;
  onTableDetail?: (value: DbCatalogTableDetail) => void;
  onInsertTable?: (value: DbCatalogTableRef) => void;
  onInsertColumn?: (value: string) => void;
  readOnly?: boolean;
  showRefresh?: boolean;
};

export const DbCatalogBrowserPanel = ({
  metadata,
  databaseName,
  schemaName,
  tableName,
  onDatabaseChange,
  onSchemaChange,
  onTableChange,
  onTableDetail,
  onInsertTable,
  onInsertColumn,
  readOnly = false,
  showRefresh = true,
}: DbCatalogBrowserPanelProps) => {
  const [localDatabaseName, setLocalDatabaseName] = useState<string | null>(
    databaseName ?? null
  );
  const [localSchemaName, setLocalSchemaName] = useState<string | null>(
    schemaName ?? null
  );
  const [localTableName, setLocalTableName] = useState<string | null>(
    tableName ?? null
  );
  const selectedDatabaseName = databaseName ?? localDatabaseName;
  const selectedSchemaName = schemaName ?? localSchemaName;
  const selectedTableName = tableName ?? localTableName;
  const catalog = useDbTargetCatalogController(metadata, {
    databaseName: selectedDatabaseName,
    schemaName: selectedSchemaName,
    tableName: selectedTableName,
  });
  const refresh = catalog.refresh;

  useEffect(() => {
    if (catalog.table.item) {
      onTableDetail?.(catalog.table.item);
    }
  }, [catalog.table.item, onTableDetail]);

  const selectDatabase = (value: string) => {
    if (readOnly) return;
    setLocalDatabaseName(value);
    setLocalSchemaName(null);
    setLocalTableName(null);
    onDatabaseChange?.(value);
    onSchemaChange?.(null);
  };
  const selectSchema = (value: string) => {
    if (readOnly) return;
    setLocalSchemaName(value);
    setLocalTableName(null);
    onSchemaChange?.(value);
  };
  const selectTable = (table: (typeof catalog.tableItems)[number]) => {
    if (readOnly && !onInsertTable) return;
    setLocalDatabaseName(table.catalogRef.databaseName);
    setLocalSchemaName(table.catalogRef.schemaName);
    setLocalTableName(table.catalogRef.name);
    onTableChange?.(table.catalogRef);
    onInsertTable?.(table.catalogRef);
  };
  const columns: Column[] =
    catalog.table.item?.columns.map(column => ({
      name: column.name,
      dtype: column.dtype as Column['dtype'],
      nullable: column.nullable,
      index: column.indexed,
      primary_key: column.primaryKey,
      indexes: column.indexes,
    })) ?? [];

  return (
    <Stack spacing={2}>
      {showRefresh && catalog.mode === 'lazy' ? (
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size='small'
              startIcon={<RefreshRoundedIcon />}
              disabled={refresh.isLoading}
              onClick={() => void refresh.refresh()}
            >
              {refresh.isLoading ? 'Обновление...' : 'Обновить'}
            </Button>
          </Box>
          {refresh.isError ? (
            <Alert
              severity='warning'
              action={
                <Button
                  color='inherit'
                  size='small'
                  disabled={refresh.isLoading}
                  onClick={() => void refresh.refresh()}
                >
                  Повторить
                </Button>
              }
            >
              Не удалось обновить каталог.
            </Alert>
          ) : null}
        </Stack>
      ) : null}

      {catalog.capabilities.supportsDatabases ? (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            Базы данных
          </Typography>
          <MetadataOptionList
            emptyText='Базы данных не найдены'
            icon={<StorageIcon sx={{ fontSize: 16 }} />}
            options={catalog.databaseOptions}
            searchPlaceholder='Поиск базы...'
            selectedValue={selectedDatabaseName}
            onSelect={selectDatabase}
            query={catalog.databaseSearch}
            onQueryChange={catalog.setDatabaseSearch}
            state={catalog.databases.state}
            hasNextPage={catalog.databases.hasNextPage}
            isFetchingNextPage={catalog.databases.isFetchingNextPage}
            loadMoreError={catalog.databases.loadMoreError}
            onLoadNextPage={() => void catalog.databases.loadNextPage()}
            onRetry={() => catalog.databases.retry()}
          />
        </Stack>
      ) : null}

      {catalog.capabilities.supportsSchemas ? (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Схемы</Typography>
          <MetadataOptionList
            emptyText={
              selectedDatabaseName
                ? 'Схемы не найдены'
                : 'Сначала выберите базу данных'
            }
            icon={<FolderOutlinedIcon sx={{ fontSize: 16 }} />}
            options={catalog.schemaOptions}
            searchPlaceholder='Поиск схемы...'
            selectedValue={selectedSchemaName}
            onSelect={selectSchema}
            query={catalog.schemaSearch}
            onQueryChange={catalog.setSchemaSearch}
            state={catalog.schemas.state}
            hasNextPage={catalog.schemas.hasNextPage}
            isFetchingNextPage={catalog.schemas.isFetchingNextPage}
            loadMoreError={catalog.schemas.loadMoreError}
            onLoadNextPage={() => void catalog.schemas.loadNextPage()}
            onRetry={() => catalog.schemas.retry()}
          />
        </Stack>
      ) : null}

      <Stack spacing={1}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          Таблицы и представления
        </Typography>
        <Box sx={{ height: 340, minHeight: 0 }}>
          <TablesViewsListV2
            tables={catalog.tableItems}
            selectedItem={catalog.selectedTableItem ?? undefined}
            onItemClick={selectTable}
            showHierarchy={false}
            searchQuery={catalog.tableSearch}
            onSearchQueryChange={catalog.setTableSearch}
            state={catalog.tables.state}
            hasNextPage={catalog.tables.hasNextPage}
            isFetchingNextPage={catalog.tables.isFetchingNextPage}
            loadMoreError={catalog.tables.loadMoreError}
            onLoadNextPage={() => void catalog.tables.loadNextPage()}
            onRetry={() => catalog.tables.retry()}
          />
        </Box>
      </Stack>

      {selectedTableName ? (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            Колонки
          </Typography>
          {catalog.table.state === 'notFound' ? (
            <Alert severity='warning'>
              Выбранная таблица больше не существует.
            </Alert>
          ) : catalog.table.state === 'badGateway' ||
            catalog.table.state === 'gatewayTimeout' ||
            catalog.table.state === 'error' ? (
            <Alert
              severity='warning'
              action={
                <Button
                  color='inherit'
                  size='small'
                  onClick={() => void catalog.table.retry()}
                >
                  Повторить
                </Button>
              }
            >
              Не удалось загрузить колонки таблицы.
            </Alert>
          ) : (
            <Box sx={{ height: 300, minHeight: 0 }}>
              <ColumnListSelect
                mode='action'
                value={[]}
                onChange={() => undefined}
                columns={columns}
                loading={catalog.table.state === 'loading'}
                onItemClick={column => onInsertColumn?.(column.name)}
                noOptionText='Колонки не найдены'
              />
            </Box>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
};
