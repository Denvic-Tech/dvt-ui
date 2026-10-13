import { useCallback, useEffect, useMemo, useState } from 'react';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, List, ListItem, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import {
  DatasetCard,
  type DatasetSummary,
  getDatasetDialect,
  normalizeDatasetDialect,
  useSearchDatasetsInfiniteQuery,
} from '@/entities/data/data-catalog';
import { ConnectionLogo } from '@/entities/data/db-connection';

import {
  Alert,
  Button,
  IconButton,
  Spinner,
  Tooltip,
} from '@/shared/ui/primitives';

import { DatasetDetailsModal } from './DatasetDetailsModal';

const SEARCH_DEBOUNCE_MS = 300;

interface DataCatalogSectionProps {
  projectId: string | null | undefined;
  searchTerm?: string;
}

const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};

const EmptyState = ({ title, hint }: { title: string; hint: string }) => (
  <Box
    sx={theme => ({
      border: `1px dashed ${alpha(theme.palette.text.primary, 0.14)}`,
      borderRadius: '12px',
      px: 2,
      py: 3,
      textAlign: 'center',
      color: 'text.secondary',
    })}
  >
    <Typography variant='body2' sx={{ fontWeight: 600, mb: 0.25 }}>
      {title}
    </Typography>
    <Typography variant='caption' color='text.secondary'>
      {hint}
    </Typography>
  </Box>
);

export const DataCatalogSection = ({
  projectId,
  searchTerm = '',
}: DataCatalogSectionProps) => {
  const debouncedSearch = useDebouncedValue(
    searchTerm.trim(),
    SEARCH_DEBOUNCE_MS
  );
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const query = useSearchDatasetsInfiniteQuery(
    { projectId: projectId ?? null, query: debouncedSearch || null },
    { skip: !projectId }
  );

  const datasets = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data]
  );

  const handleOpenDataset = useCallback((dataset: DatasetSummary) => {
    setSelectedDatasetId(dataset.id);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
  const handleModalExited = useCallback(() => setSelectedDatasetId(null), []);

  const { refetch, fetchNextPage } = query;
  const handleRefresh = useCallback(() => void refetch(), [refetch]);
  const handleLoadMore = useCallback(
    () => void fetchNextPage(),
    [fetchNextPage]
  );

  const isInitialLoading = query.isLoading;
  const isRefreshing =
    query.isFetching && !query.isLoading && !query.isFetchingNextPage;
  const errorMessage = query.error
    ? 'message' in query.error
      ? query.error.message
      : 'Не удалось загрузить каталог данных.'
    : null;

  return (
    <Box
      sx={{ px: 1.5, py: 1.25 }}
      data-testid='widgets/project-editor/sidebar/data-catalog'
    >
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        spacing={1}
        sx={{ mb: 1.25 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
            Каталог данных
          </Typography>
          {datasets.length > 0 ? (
            <Typography variant='caption' color='text.secondary'>
              {query.hasNextPage
                ? `Загружено: ${datasets.length}`
                : `Датасетов: ${datasets.length}`}
            </Typography>
          ) : null}
        </Box>

        <Tooltip title='Обновить список'>
          <span>
            <IconButton
              variant='outline'
              aria-label='Обновить список датасетов'
              onClick={handleRefresh}
              disabled={!projectId || query.isFetching}
            >
              {isRefreshing ? (
                <Spinner size={14} />
              ) : (
                <RefreshRoundedIcon fontSize='small' />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {!projectId ? (
        <EmptyState
          title='Проект не выбран'
          hint='Откройте проект, чтобы увидеть его датасеты.'
        />
      ) : null}

      {errorMessage ? (
        <Alert
          variant='destructive'
          sx={{ mb: 1.25 }}
          action={
            <Button size='xs' variant='ghost' onClick={handleRefresh}>
              Повторить
            </Button>
          }
        >
          {errorMessage}
        </Alert>
      ) : null}

      {projectId && isInitialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <Spinner size={22} />
        </Box>
      ) : null}

      {projectId &&
      !isInitialLoading &&
      !errorMessage &&
      datasets.length === 0 ? (
        <EmptyState
          title={
            debouncedSearch ? 'Датасеты не найдены' : 'В проекте нет датасетов'
          }
          hint={
            debouncedSearch
              ? 'Попробуйте изменить поисковый запрос.'
              : 'Датасеты появляются после сохранения нод, читающих или записывающих таблицы.'
          }
        />
      ) : null}

      {datasets.length > 0 ? (
        <List sx={{ p: 0, display: 'grid', gap: 0.75, minWidth: 0 }}>
          {datasets.map(dataset => (
            <ListItem key={dataset.id} disablePadding sx={{ minWidth: 0 }}>
              <DatasetCard
                dataset={dataset}
                selected={isModalOpen && selectedDatasetId === dataset.id}
                onOpen={handleOpenDataset}
                icon={
                  <ConnectionLogo
                    type={normalizeDatasetDialect(
                      getDatasetDialect(dataset.locator)
                    )}
                    label={
                      getDatasetDialect(dataset.locator) ?? dataset.locator.kind
                    }
                  />
                }
              />
            </ListItem>
          ))}
        </List>
      ) : null}

      {query.hasNextPage ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.25 }}>
          <Button
            size='sm'
            variant='outline'
            onClick={handleLoadMore}
            disabled={query.isFetchingNextPage}
            startIcon={
              query.isFetchingNextPage ? <Spinner size={14} /> : undefined
            }
          >
            Показать ещё
          </Button>
        </Box>
      ) : null}

      <DatasetDetailsModal
        datasetId={selectedDatasetId}
        open={isModalOpen && selectedDatasetId !== null}
        currentProjectId={projectId ?? null}
        onClose={handleCloseModal}
        onExited={handleModalExited}
      />
    </Box>
  );
};
