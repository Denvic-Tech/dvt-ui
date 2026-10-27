import { memo, useEffect, useMemo, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Box from '@mui/material/Box';

import {
  DATASET_FRESHNESS_APPEARANCE,
  type DatasetSummary,
  getDatasetDialect,
  getDatasetHostLabel,
  getDatasetName,
  getDatasetNamespace,
  normalizeDatasetDialect,
  useSearchDatasetsInfiniteQuery,
} from '@/entities/data/data-catalog';
import { ConnectionLogo } from '@/entities/data/db-connection';

import { Button, Spinner, Tooltip } from '@/shared/ui/primitives';

import {
  CenteredState,
  DetailPane,
  ListMessage,
  ListPane,
  ListRow,
  ListScroll,
  RowIcon,
  RowMeta,
  RowSubtitle,
  RowText,
  RowTitle,
  SearchField,
  SearchInput,
} from './DataCatalogModal.styles';
import { DatasetFieldsPanel } from './DatasetFieldsPanel';

const SEARCH_DEBOUNCE_MS = 300;

const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};

const FRESHNESS_DOT_COLOR = {
  default: 'text.disabled',
  primary: 'primary.main',
  success: 'success.main',
  warning: 'warning.main',
  destructive: 'error.main',
} as const;

interface DatasetRowProps {
  dataset: DatasetSummary;
  active: boolean;
  onSelect: (datasetId: string) => void;
}

const DatasetRow = memo(({ dataset, active, onSelect }: DatasetRowProps) => {
  const { locator } = dataset;
  const dialect = getDatasetDialect(locator);
  const freshness = DATASET_FRESHNESS_APPEARANCE[dataset.freshness];
  const subtitle = [getDatasetNamespace(locator), getDatasetHostLabel(locator)]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListRow
      type='button'
      active={active}
      aria-current={active ? 'true' : undefined}
      title={dataset.physical_key}
      data-testid='widgets/data-catalog/dataset-row'
      onClick={() => onSelect(dataset.id)}
    >
      <RowIcon>
        <ConnectionLogo
          type={normalizeDatasetDialect(dialect)}
          label={dialect ?? locator.kind}
        />
      </RowIcon>
      <RowText>
        <RowTitle active={active}>{getDatasetName(locator)}</RowTitle>
        {subtitle ? <RowSubtitle>{subtitle}</RowSubtitle> : null}
      </RowText>
      <RowMeta>{dataset.field_count}</RowMeta>
      <Tooltip placement='right' title={freshness.label}>
        <Box
          component='span'
          aria-label={freshness.label}
          data-freshness={dataset.freshness}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flexShrink: 0,
            bgcolor: FRESHNESS_DOT_COLOR[freshness.variant],
          }}
        />
      </Tooltip>
    </ListRow>
  );
});
DatasetRow.displayName = 'DatasetRow';

interface DatasetsViewProps {
  projectId: string | null;
}

export const DatasetsView = ({ projectId }: DatasetsViewProps) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const query = useSearchDatasetsInfiniteQuery(
    { projectId, query: debouncedSearch || null },
    { skip: !projectId }
  );

  const datasets = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data]
  );
  const errorMessage = query.error
    ? 'message' in query.error
      ? query.error.message
      : 'Не удалось загрузить каталог данных.'
    : null;

  const renderList = () => {
    if (!projectId) {
      return (
        <ListMessage>Откройте проект, чтобы увидеть датасеты.</ListMessage>
      );
    }

    if (query.isLoading) {
      return (
        <ListMessage>
          <Spinner size={18} />
        </ListMessage>
      );
    }

    if (errorMessage) {
      return (
        <ListMessage>
          <div>{errorMessage}</div>
          <Button
            size='xs'
            variant='outline'
            sx={{ mt: 1 }}
            onClick={() => void query.refetch()}
          >
            Повторить
          </Button>
        </ListMessage>
      );
    }

    if (!datasets.length) {
      return (
        <ListMessage>
          {debouncedSearch
            ? `Ничего не найдено по «${debouncedSearch}»`
            : 'В проекте нет датасетов. Они появляются после сохранения нод, читающих или записывающих таблицы.'}
        </ListMessage>
      );
    }

    return (
      <>
        {datasets.map(dataset => (
          <DatasetRow
            key={dataset.id}
            dataset={dataset}
            active={dataset.id === selectedId}
            onSelect={setSelectedId}
          />
        ))}
        {query.hasNextPage ? (
          <Button
            size='xs'
            variant='ghost'
            sx={{ alignSelf: 'center', mt: 1 }}
            disabled={query.isFetchingNextPage}
            startIcon={
              query.isFetchingNextPage ? <Spinner size={12} /> : undefined
            }
            onClick={() => void query.fetchNextPage()}
          >
            Показать ещё
          </Button>
        ) : null}
      </>
    );
  };

  return (
    <>
      <ListPane data-testid='widgets/data-catalog/datasets-list'>
        <SearchField>
          <SearchRoundedIcon sx={{ fontSize: 16 }} />
          <SearchInput
            value={search}
            placeholder='Поиск датасетов'
            aria-label='Поиск датасетов'
            onChange={event => setSearch(event.target.value)}
          />
        </SearchField>
        <ListScroll>{renderList()}</ListScroll>
      </ListPane>
      <DetailPane>
        {selectedId ? (
          <DatasetFieldsPanel key={selectedId} datasetId={selectedId} />
        ) : (
          <CenteredState>
            <strong>Выберите датасет</strong>
            <p>Слева — датасеты проекта. Справа появятся их поля.</p>
          </CenteredState>
        )}
      </DetailPane>
    </>
  );
};
