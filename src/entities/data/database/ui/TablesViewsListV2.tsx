import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  styled,
  Tooltip,
  Typography,
} from '@mui/material';
import { Virtuoso } from 'react-virtuoso';

import type { DbCatalogState } from '@/entities/data/db-connection/model/catalogTypes';

import type { DbTable as DBTable } from '@/shared/gatewayClient';
import { getIconForDBTableType } from '@/shared/icons';

export type DatabaseObjectListItem = {
  database_name?: string | null;
  name: string;
  schema_name?: string | null;
  type?: string | null;
};

type TableMap<T extends DatabaseObjectListItem> = {
  [databaseName: string]: {
    [schemaName: string]: T[];
  };
};

type VisibleTreeRow<T extends DatabaseObjectListItem> =
  | {
      key: string;
      type: 'database';
      database: string;
      isOpen: boolean;
      tableCount: number;
    }
  | {
      key: string;
      type: 'schema';
      database: string;
      isOpen: boolean;
      schema: string;
      tableCount: number;
    }
  | {
      key: string;
      type: 'table';
      table: T;
      selected: boolean;
    };

const TREE_VIRTUALIZATION_THRESHOLD = 80;
const TREE_OVERSCAN_PX = 80;
const TREE_ITEM_HEIGHT = 33;
const ROW_ITEM_HEIGHT = 47;
const SKELETON_ROWS = [0, 1, 2, 3, 4];

type TablesViewsListAppearance = 'tree' | 'rows';

const groupTablesByDBAndSchema = <T extends DatabaseObjectListItem>(
  tables: T[]
): TableMap<T> => {
  const result: TableMap<T> = {};

  for (const table of tables) {
    const db = table.database_name ?? 'default_db';
    const schema = table.schema_name ?? 'default_schema';

    if (!result[db]) result[db] = {};
    if (!result[db][schema]) result[db][schema] = [];

    result[db][schema].push(table);
  }

  for (const db of Object.keys(result)) {
    for (const schema of Object.keys(result[db])) {
      result[db][schema].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return result;
};

// ============================================
// Styled Components
// ============================================

const Container = styled(Box, {
  shouldForwardProp: prop => prop !== 'appearance',
})<{ appearance?: TablesViewsListAppearance }>(({ appearance }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  gap: appearance === 'rows' ? 10 : 0,
}));

const SearchBox = styled(Box, {
  shouldForwardProp: prop => prop !== 'appearance',
})<{ appearance?: TablesViewsListAppearance }>(({ theme, appearance }) => ({
  padding: appearance === 'rows' ? 0 : 12,
  borderBottom:
    appearance === 'rows' ? 'none' : `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
}));

const SearchInputWrapper = styled(Box)({
  position: 'relative',
  flex: 1,
  '& svg': {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18,
  },
});

const SearchInput = styled('input', {
  shouldForwardProp: prop => prop !== 'appearance',
})<{ appearance?: TablesViewsListAppearance }>(({ theme, appearance }) => ({
  width: '100%',
  height: appearance === 'rows' ? 36 : undefined,
  padding: appearance === 'rows' ? '0 12px 0 34px' : '8px 12px 8px 36px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: appearance === 'rows' ? 8 : 6,
  fontSize: appearance === 'rows' ? 13 : '0.8125rem',
  backgroundColor:
    appearance === 'rows'
      ? alpha(theme.palette.common.black, 0.035)
      : theme.palette.background.paper,
  color: theme.palette.text.primary,
  outline: 'none',
  transition: 'border-color 0.15s ease',
  '&::placeholder': {
    color: theme.palette.text.secondary,
    opacity: 0.6,
  },
  '&:focus': {
    borderColor:
      appearance === 'rows'
        ? theme.palette.divider
        : theme.palette.primary.main,
    boxShadow:
      appearance === 'rows'
        ? 'none'
        : `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const TreeContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'appearance',
})<{ appearance?: TablesViewsListAppearance }>(({ theme, appearance }) => ({
  flex: 1,
  overflow: 'auto',
  minHeight: 0,
  border: appearance === 'rows' ? `1px solid ${theme.palette.divider}` : 'none',
  borderRadius: appearance === 'rows' ? 12 : 0,
  backgroundColor:
    appearance === 'rows' ? theme.palette.background.paper : 'transparent',
}));

const TreeItem = styled('button', {
  shouldForwardProp: prop =>
    prop !== 'level' && prop !== 'isSelected' && prop !== 'appearance',
})<{
  appearance?: TablesViewsListAppearance;
  level?: number;
  isSelected?: boolean;
}>(({ theme, appearance, level = 0, isSelected }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: appearance === 'rows' ? '9px 12px' : '8px 12px',
  paddingLeft: 12 + level * 16,
  border: 'none',
  backgroundColor: isSelected
    ? appearance === 'rows'
      ? alpha(theme.palette.primary.main, 0.06)
      : theme.palette.primary.main
    : 'transparent',
  color: isSelected
    ? appearance === 'rows'
      ? theme.palette.primary.main
      : theme.palette.primary.contrastText
    : theme.palette.text.primary,
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background-color 0.15s ease',
  borderBottom:
    level === 0 || appearance === 'rows'
      ? `1px solid ${theme.palette.divider}`
      : 'none',
  '&:hover': {
    backgroundColor: isSelected
      ? appearance === 'rows'
        ? alpha(theme.palette.primary.main, 0.08)
        : theme.palette.primary.dark
      : appearance === 'rows'
        ? alpha(theme.palette.common.black, 0.025)
        : theme.palette.action.hover,
  },
}));

const TreeIcon = styled(Box, {
  shouldForwardProp: prop => prop !== 'isSelected' && prop !== 'appearance',
})<{
  appearance?: TablesViewsListAppearance;
  isSelected?: boolean;
}>(({ theme, appearance, isSelected }) => ({
  width: appearance === 'rows' ? 28 : 'auto',
  height: appearance === 'rows' ? 28 : 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: appearance === 'rows' ? 8 : 0,
  color:
    appearance === 'rows' && isSelected
      ? theme.palette.primary.main
      : isSelected
        ? 'inherit'
        : theme.palette.text.secondary,
  backgroundColor:
    appearance === 'rows'
      ? isSelected
        ? alpha(theme.palette.primary.main, 0.12)
        : alpha(theme.palette.common.black, 0.04)
      : 'transparent',
  flexShrink: 0,
  '& svg': {
    fontSize: 16,
  },
}));

const TreeLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== 'isSelected' && prop !== 'appearance',
})<{
  appearance?: TablesViewsListAppearance;
  isSelected?: boolean;
}>(({ appearance, isSelected }) => ({
  flex: appearance === 'rows' ? '0 1 auto' : 1,
  minWidth: 0,
  fontSize: appearance === 'rows' ? 12 : '0.8125rem',
  fontWeight: appearance === 'rows' ? 500 : isSelected ? 500 : 400,
  fontFamily:
    appearance === 'rows'
      ? '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      : 'inherit',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const CountChip = styled('span')(({ theme }) => ({
  padding: '1px 6px',
  borderRadius: 10,
  backgroundColor: alpha(theme.palette.text.secondary, 0.1),
  color: theme.palette.text.secondary,
  fontSize: '0.6875rem',
  fontWeight: 500,
  marginLeft: 'auto',
  flexShrink: 0,
}));

const ChevronIcon = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOpen',
})<{ isOpen?: boolean }>(({ theme, isOpen }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  transition: 'transform 0.2s ease',
  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
  '& svg': {
    fontSize: 16,
  },
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 32,
  color: theme.palette.text.secondary,
  fontSize: '0.8125rem',
}));

const SchemaContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
}));

// ============================================
// Props Interface
// ============================================

interface DatabaseObjectListProps<T extends DatabaseObjectListItem> {
  appearance?: TablesViewsListAppearance;
  tables: T[];
  selectedItem?: T | null | undefined;
  onItemClick: (item: T) => void;
  collapseAfterSelect?: boolean;
  headerAction?: React.ReactNode;
  showHierarchy?: boolean;
  searchQuery?: string | undefined;
  onSearchQueryChange?: ((value: string) => void) | undefined;
  searchPlaceholder?: string | undefined;
  state?: DbCatalogState | undefined;
  hasNextPage?: boolean | undefined;
  isFetchingNextPage?: boolean | undefined;
  loadMoreError?: unknown;
  onLoadNextPage?: (() => void) | undefined;
  onRetry?: (() => void | Promise<unknown>) | undefined;
  onRefresh?: (() => boolean | void | Promise<boolean | void>) | undefined;
  isRefreshing?: boolean | undefined;
  testIds?: {
    root?: string;
    searchInput?: string;
    tableOption?: string;
    databaseOption?: string;
    schemaOption?: string;
  };
}

type TableRowButtonProps<T extends DatabaseObjectListItem> = {
  appearance: TablesViewsListAppearance;
  onClick: (table: T) => void;
  selected: boolean;
  table: T;
  testId?: string | undefined;
};

const TableRowButton = <T extends DatabaseObjectListItem>({
  appearance,
  onClick,
  selected,
  table,
  testId,
}: TableRowButtonProps<T>) => {
  const TableTypeIcon = getIconForDBTableType(table.type as DBTable['type']);
  const tableKey = `${table.database_name}.${table.schema_name}.${table.name}`;

  return (
    <TreeItem
      appearance={appearance}
      key={tableKey}
      data-testid={testId ?? 'entities/data/database/database-table-option'}
      data-database-name={table.database_name ?? 'default_db'}
      data-schema-name={table.schema_name ?? 'default_schema'}
      data-table-name={table.name}
      data-table-type={table.type ?? ''}
      level={2}
      isSelected={selected}
      onClick={() => onClick(table)}
    >
      <TreeIcon appearance={appearance} isSelected={selected}>
        <TableTypeIcon />
      </TreeIcon>
      <TreeLabel appearance={appearance} isSelected={selected}>
        {table.name}
      </TreeLabel>
    </TreeItem>
  );
};

// ============================================
// Main Component
// ============================================

export const TablesViewsListV2 = <T extends DatabaseObjectListItem>({
  appearance = 'tree',
  tables,
  selectedItem,
  onItemClick,
  collapseAfterSelect = false,
  headerAction,
  showHierarchy = true,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange,
  searchPlaceholder = 'Поиск таблиц...',
  state,
  hasNextPage = false,
  isFetchingNextPage = false,
  loadMoreError,
  onLoadNextPage,
  onRetry,
  onRefresh,
  isRefreshing = false,
  testIds,
}: DatabaseObjectListProps<T>) => {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRetryingNextPage, setIsRetryingNextPage] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const isRowsAppearance = appearance === 'rows';
  const searchQuery = isRowsAppearance
    ? localSearchQuery
    : (controlledSearchQuery ?? localSearchQuery);
  const setSearchQuery = isRowsAppearance
    ? setLocalSearchQuery
    : (onSearchQueryChange ?? setLocalSearchQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const canSearchOnServer =
    isRowsAppearance &&
    Boolean(onSearchQueryChange) &&
    searchQuery.trim().length > 0;

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) {
      return;
    }

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, onRetry]);

  const handleLoadMoreRetry = useCallback(async () => {
    if (!onRetry || isRetryingNextPage) {
      return;
    }

    setIsRetryingNextPage(true);
    try {
      await onRetry();
    } finally {
      setIsRetryingNextPage(false);
    }
  }, [isRetryingNextPage, onRetry]);

  const handleSearchQueryChange = (nextQuery: string) => {
    setSearchQuery(nextQuery);
    if (isRowsAppearance && nextQuery.trim() === '') {
      onSearchQueryChange?.('');
    }
  };

  const handleRefresh = async () => {
    if (isRowsAppearance) {
      setLocalSearchQuery('');
      onSearchQueryChange?.('');
    }

    if (!onRefresh) {
      return;
    }

    setRefreshFailed(false);
    try {
      const succeeded = await onRefresh();
      setRefreshFailed(succeeded === false);
    } catch {
      setRefreshFailed(true);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      setOpenStates(prev => ({
        ...prev,
        [`db-${selectedItem.database_name || 'default_db'}`]: true,
        [`schema-${selectedItem.database_name}-${selectedItem.schema_name || 'default_schema'}`]: true,
      }));
    }
  }, [selectedItem]);

  const searchableTables = useMemo(() => {
    return tables.map(table => ({
      table,
      searchText: [
        table.name,
        table.database_name ?? 'default_db',
        table.schema_name ?? 'default_schema',
        table.type ?? '',
      ]
        .join(' ')
        .toLowerCase(),
    }));
  }, [tables]);

  const filteredTables = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return tables;
    }

    return searchableTables
      .filter(({ searchText }) => searchText.includes(normalizedQuery))
      .map(({ table }) => table);
  }, [deferredSearchQuery, searchableTables, tables]);
  const isSearching = deferredSearchQuery.trim().length > 0;

  const groupedTables = useMemo(
    () => groupTablesByDBAndSchema(filteredTables),
    [filteredTables]
  );

  const selectedTableKey = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    return `${selectedItem.database_name}.${selectedItem.schema_name}.${selectedItem.name}`;
  }, [selectedItem]);

  const toggle = useCallback((key: string) => {
    setOpenStates(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleTableClick = useCallback(
    (table: T) => {
      onItemClick(table);
      if (collapseAfterSelect) {
        setOpenStates({});
      }
    },
    [collapseAfterSelect, onItemClick]
  );

  const visibleRows = useMemo<VisibleTreeRow<T>[]>(() => {
    if (!showHierarchy) {
      return filteredTables.map(table => ({
        key: `${table.database_name}.${table.schema_name}.${table.name}`,
        type: 'table',
        table,
        selected:
          `${table.database_name}.${table.schema_name}.${table.name}` ===
          selectedTableKey,
      }));
    }

    const rows: VisibleTreeRow<T>[] = [];

    for (const [database, schemas] of Object.entries(groupedTables)) {
      const dbKey = `db-${database}`;
      const isDbOpen = isSearching || Boolean(openStates[dbKey]);
      const tableCount = Object.values(schemas).flat().length;

      rows.push({
        key: dbKey,
        type: 'database',
        database,
        isOpen: isDbOpen,
        tableCount,
      });

      if (!isDbOpen) {
        continue;
      }

      for (const [schema, schemaTables] of Object.entries(schemas)) {
        const schemaKey = `schema-${database}-${schema}`;
        const isSchemaOpen = isSearching || Boolean(openStates[schemaKey]);

        rows.push({
          key: schemaKey,
          type: 'schema',
          database,
          isOpen: isSchemaOpen,
          schema,
          tableCount: schemaTables.length,
        });

        if (!isSchemaOpen) {
          continue;
        }

        for (const table of schemaTables) {
          rows.push({
            key: `${table.database_name}.${table.schema_name}.${table.name}`,
            type: 'table',
            table,
            selected:
              `${table.database_name}.${table.schema_name}.${table.name}` ===
              selectedTableKey,
          });
        }
      }
    }

    return rows;
  }, [
    filteredTables,
    groupedTables,
    isSearching,
    openStates,
    selectedTableKey,
    showHierarchy,
  ]);

  const shouldVirtualize = visibleRows.length >= TREE_VIRTUALIZATION_THRESHOLD;
  const showSkeleton =
    isRowsAppearance && (state === 'loading' || isRefreshing || isRetrying);

  const renderVisibleRow = useCallback(
    (row: VisibleTreeRow<T>) => {
      if (row.type === 'database') {
        return (
          <TreeItem
            level={0}
            data-testid={
              testIds?.databaseOption ??
              'entities/data/database/database-option'
            }
            data-database-name={row.database}
            onClick={() => toggle(row.key)}
          >
            <ChevronIcon isOpen={row.isOpen}>
              <ChevronRightIcon />
            </ChevronIcon>
            <TreeIcon>
              <StorageIcon />
            </TreeIcon>
            <TreeLabel>{row.database}</TreeLabel>
            <CountChip>{row.tableCount}</CountChip>
          </TreeItem>
        );
      }

      if (row.type === 'schema') {
        return (
          <SchemaContainer>
            <TreeItem
              level={1}
              data-testid={
                testIds?.schemaOption ?? 'entities/data/database/schema-option'
              }
              data-database-name={row.database}
              data-schema-name={row.schema}
              onClick={() => toggle(row.key)}
            >
              <ChevronIcon isOpen={row.isOpen}>
                <ChevronRightIcon />
              </ChevronIcon>
              <TreeIcon>
                <FolderOutlinedIcon />
              </TreeIcon>
              <TreeLabel sx={{ color: 'text.secondary' }}>
                {row.schema}
              </TreeLabel>
              <CountChip>{row.tableCount}</CountChip>
            </TreeItem>
          </SchemaContainer>
        );
      }

      if (showHierarchy) {
        return (
          <SchemaContainer>
            <TableRowButton
              appearance={appearance}
              onClick={handleTableClick}
              selected={row.selected}
              table={row.table}
              testId={testIds?.tableOption}
            />
          </SchemaContainer>
        );
      }

      const FlatTableTypeIcon = getIconForDBTableType(
        row.table.type as DBTable['type']
      );

      return (
        <TreeItem
          appearance={appearance}
          data-testid={
            testIds?.tableOption ??
            'entities/data/database/database-table-option'
          }
          data-database-name={row.table.database_name ?? 'default_db'}
          data-schema-name={row.table.schema_name ?? 'default_schema'}
          data-table-name={row.table.name}
          data-table-type={row.table.type ?? ''}
          isSelected={row.selected}
          onClick={() => handleTableClick(row.table)}
        >
          <TreeIcon appearance={appearance} isSelected={row.selected}>
            <FlatTableTypeIcon />
          </TreeIcon>
          <TreeLabel appearance={appearance} isSelected={row.selected}>
            {row.table.name}
          </TreeLabel>
        </TreeItem>
      );
    },
    [appearance, handleTableClick, showHierarchy, testIds, toggle]
  );

  return (
    <Container
      appearance={appearance}
      data-testid={
        testIds?.root ?? 'entities/data/database/database-tables-list'
      }
    >
      <SearchBox appearance={appearance}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: isRowsAppearance ? 0.75 : 1,
          }}
        >
          <SearchInputWrapper>
            <SearchIcon
              sx={{
                color: 'text.secondary',
                fontSize: isRowsAppearance ? '17px !important' : undefined,
              }}
            />
            <SearchInput
              appearance={appearance}
              type='text'
              data-testid={
                testIds?.searchInput ??
                'entities/data/database/database-table-search-input'
              }
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={event => handleSearchQueryChange(event.target.value)}
            />
          </SearchInputWrapper>
          {isRowsAppearance && onSearchQueryChange ? (
            <Button
              variant='outlined'
              color='inherit'
              startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
              disabled={
                !canSearchOnServer || state === 'loading' || isRefreshing
              }
              onClick={() => onSearchQueryChange(searchQuery.trim())}
              sx={theme => ({
                height: 36,
                minHeight: 36,
                minWidth: 114,
                px: 1.25,
                py: 0,
                flexShrink: 0,
                borderRadius: '8px',
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.secondary,
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  borderColor: theme.palette.grey[400],
                  backgroundColor: alpha(theme.palette.common.black, 0.025),
                },
              })}
            >
              На сервере
            </Button>
          ) : null}
          {onRefresh ? (
            <Tooltip title='Обновить каталог'>
              <span>
                <IconButton
                  aria-label='Обновить каталог'
                  disabled={isRefreshing}
                  onClick={() => void handleRefresh()}
                  size='small'
                  {...(isRowsAppearance
                    ? {
                        sx: theme => ({
                          width: 36,
                          height: 36,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '8px',
                          backgroundColor: theme.palette.background.paper,
                          '&:hover': {
                            backgroundColor: alpha(
                              theme.palette.common.black,
                              0.025
                            ),
                          },
                        }),
                      }
                    : {})}
                >
                  {isRefreshing ? (
                    <CircularProgress size={isRowsAppearance ? 16 : 18} />
                  ) : (
                    <RefreshRoundedIcon
                      sx={{ fontSize: isRowsAppearance ? 18 : 20 }}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Box>
      </SearchBox>

      {refreshFailed ? (
        <Box
          sx={theme => ({
            mx: isRowsAppearance ? 0 : 1.5,
            mb: 1,
            px: 2,
            py: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
            flexShrink: 0,
          })}
        >
          <Typography color='text.secondary' sx={{ fontSize: 13 }}>
            Не удалось обновить каталог
          </Typography>
          <Button
            variant='contained'
            size='small'
            sx={{
              mt: 1.25,
              minWidth: 0,
              px: 1.75,
              borderRadius: '8px',
              boxShadow: 'none',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
            disabled={isRefreshing}
            onClick={() => void handleRefresh()}
          >
            Повторить
          </Button>
        </Box>
      ) : null}

      {headerAction ? (
        <Box
          sx={theme => ({
            px: 1.5,
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          })}
        >
          {headerAction}
        </Box>
      ) : null}

      <TreeContainer
        appearance={appearance}
        onScroll={event => {
          const target = event.currentTarget;
          if (
            hasNextPage &&
            !isFetchingNextPage &&
            target.scrollHeight - target.scrollTop - target.clientHeight < 80
          ) {
            onLoadNextPage?.();
          }
        }}
      >
        {!showSkeleton && visibleRows.length > 0 ? (
          shouldVirtualize ? (
            <Virtuoso
              data={visibleRows}
              style={{ height: '100%' }}
              overscan={TREE_OVERSCAN_PX}
              fixedItemHeight={
                isRowsAppearance ? ROW_ITEM_HEIGHT : TREE_ITEM_HEIGHT
              }
              computeItemKey={(_, row) => row.key}
              itemContent={(_, row) => renderVisibleRow(row)}
              endReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  onLoadNextPage?.();
                }
              }}
            />
          ) : (
            visibleRows.map(renderVisibleRow)
          )
        ) : null}

        {state === 'loading' || isRefreshing || isRetrying ? (
          isRowsAppearance ? (
            <Stack sx={{ px: 1.5, py: 1.25 }} spacing={1.5}>
              {SKELETON_ROWS.map(row => (
                <Stack
                  key={row}
                  direction='row'
                  alignItems='center'
                  spacing={1.25}
                >
                  <Skeleton
                    animation='wave'
                    variant='rounded'
                    width={28}
                    height={28}
                    sx={{ borderRadius: '8px', flexShrink: 0 }}
                  />
                  <Skeleton
                    animation='wave'
                    variant='rounded'
                    width='32%'
                    height={12}
                  />
                </Stack>
              ))}
            </Stack>
          ) : (
            <EmptyState>
              <CircularProgress size={20} />
            </EmptyState>
          )
        ) : filteredTables.length === 0 ? (
          <EmptyState>
            {state === 'unsupported'
              ? 'Этот уровень каталога не поддерживается'
              : state === 'notFound'
                ? 'Выбранная таблица больше не существует'
                : state === 'badGateway'
                  ? 'Gateway не смог загрузить каталог (502)'
                  : state === 'gatewayTimeout'
                    ? 'Истекло время загрузки каталога (504)'
                    : state === 'error'
                      ? 'Не удалось загрузить каталог'
                      : searchQuery
                        ? 'Таблицы не найдены'
                        : 'Нет доступных таблиц'}
          </EmptyState>
        ) : null}
        {isFetchingNextPage || isRetryingNextPage ? (
          <EmptyState sx={{ padding: 12 }}>
            <CircularProgress size={18} />
          </EmptyState>
        ) : null}
        {!isRetrying &&
        !isRetryingNextPage &&
        (loadMoreError ||
          ['notFound', 'badGateway', 'gatewayTimeout', 'error'].includes(
            state ?? ''
          )) ? (
          <EmptyState sx={{ padding: 12, justifyContent: 'flex-start' }}>
            <Button
              variant='contained'
              size='small'
              onClick={() =>
                void (loadMoreError ? handleLoadMoreRetry() : handleRetry())
              }
              sx={{
                minWidth: 0,
                px: 1.75,
                borderRadius: '8px',
                boxShadow: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { boxShadow: 'none' },
              }}
            >
              Повторить
            </Button>
          </EmptyState>
        ) : null}
      </TreeContainer>
    </Container>
  );
};

export default TablesViewsListV2;
