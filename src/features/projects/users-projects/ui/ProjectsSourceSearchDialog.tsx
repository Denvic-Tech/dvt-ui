import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dialog } from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';

import {
  type DatasetSummary,
  type DatasetUsageEntry,
  getDatasetDialect,
  getDatasetHostLabel,
  getDatasetName,
  getDatasetNamespace,
  normalizeDatasetDialect,
  useGetDatasetUsageQuery,
  useSearchDatasetsInfiniteQuery,
} from '@/entities/data/data-catalog';
import { getConnectionTypeLabel } from '@/entities/data/db-connection';

import {
  Column,
  ColumnLabel,
  ColumnsGrid,
  CountPill,
  DatasetIconBox,
  DatasetName,
  DatasetRowButton,
  DialogHeader,
  DialogLayout,
  DialogTitleRow,
  DialogTitleText,
  EmptyState,
  EmptyStateIconBox,
  EmptyStateText,
  EmptyStateTitle,
  IconButtonPlain,
  LeftColumn,
  ListMessage,
  LoadMoreButton,
  ProjectIconBox,
  ProjectMeta,
  ProjectRowButton,
  ProjectTitle,
  RightColumn,
  RowContent,
  RowMeta,
  SearchClearButton,
  SearchField,
  SearchFieldInput,
  SearchStatus,
  SkeletonBlock,
  SkeletonRow,
  Spinner,
} from './ProjectsSourceSearchDialog.styles';

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_PAGE_SIZE = 50;
const DATASET_SKELETON_WIDTHS = [62, 78, 54, 70];
const PROJECT_SKELETON_WIDTHS = [70, 55, 82, 62];

type ProjectsSourceSearchDialogProps = {
  open: boolean;
  initialQuery: string;
  onClose: () => void;
  onOpenProject: (projectId: string) => void;
};

type UsageProject = {
  id: string;
  name: string;
  nodeIds: Set<string>;
};

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const TableSvg: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} strokeWidth='1.8' {...svgProps}>
    <rect x='3.5' y='4' width='17' height='16' rx='2.5' />
    <path d='M3.5 9.5h17M3.5 14.8h17M10 9.5V20' />
  </svg>
);

const ProjectSvg = () => (
  <svg width='16' height='16' strokeWidth='1.8' {...svgProps}>
    <rect x='3' y='3' width='18' height='18' rx='3' />
    <path d='M3 10h18M10 3v18' />
  </svg>
);

const SearchSvg = () => (
  <svg width='16' height='16' strokeWidth='2' {...svgProps}>
    <circle cx='11' cy='11' r='7' />
    <path d='m20 20-3.5-3.5' />
  </svg>
);

const CloseSvg: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} strokeWidth='2.2' {...svgProps}>
    <path d='M6 6l12 12M18 6 6 18' />
  </svg>
);

const ChevronRightSvg = () => (
  <svg width='14' height='14' strokeWidth='2.2' {...svgProps}>
    <path d='m9 6 6 6-6 6' />
  </svg>
);

const HighlightedText: React.FC<{ text: string; query: string }> = ({
  text,
  query,
}) => {
  const needle = query.trim().toLowerCase();
  const index = needle ? text.toLowerCase().indexOf(needle) : -1;
  if (index < 0) {
    return <>{text}</>;
  }

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
};

// Одна нода может и читать, и писать таблицу — считаем уникальные node_id.
const groupUsageByProject = (entries: DatasetUsageEntry[]): UsageProject[] => {
  const projects = new Map<string, UsageProject>();
  entries.forEach(entry => {
    const existing = projects.get(entry.project_id);
    const name = entry.project_name?.trim();
    if (!existing) {
      projects.set(entry.project_id, {
        id: entry.project_id,
        name: name || 'Проект без названия',
        nodeIds: new Set([entry.node_id]),
      });
      return;
    }

    existing.nodeIds.add(entry.node_id);
    if (name && existing.name === 'Проект без названия') {
      existing.name = name;
    }
  });
  return [...projects.values()];
};

const formatNodeUsage = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? 'ноде' : 'нодах';
  return `Используется в ${count} ${word}`;
};

const getDatasetSourceLabel = (dataset: DatasetSummary): string =>
  [
    getConnectionTypeLabel(
      normalizeDatasetDialect(getDatasetDialect(dataset.locator))
    ),
    getDatasetHostLabel(dataset.locator),
  ]
    .filter(Boolean)
    .join(' · ');

const DatasetRow: React.FC<{
  dataset: DatasetSummary;
  query: string;
  isActive: boolean;
  onSelect: (datasetId: string) => void;
}> = ({ dataset, query, isActive, onSelect }) => {
  const namespace = getDatasetNamespace(dataset.locator);
  return (
    <DatasetRowButton
      type='button'
      isActive={isActive}
      aria-pressed={isActive}
      onClick={() => onSelect(dataset.id)}
    >
      <DatasetIconBox isActive={isActive}>
        <TableSvg />
      </DatasetIconBox>
      <RowContent>
        <DatasetName>
          {namespace ? (
            <span className='dataset-namespace'>{namespace}.</span>
          ) : null}
          <span className='dataset-table'>
            <HighlightedText
              text={getDatasetName(dataset.locator)}
              query={query}
            />
          </span>
        </DatasetName>
        <RowMeta>{getDatasetSourceLabel(dataset)}</RowMeta>
      </RowContent>
    </DatasetRowButton>
  );
};

const DatasetListSkeleton = () => (
  <>
    {DATASET_SKELETON_WIDTHS.map(width => (
      <SkeletonRow key={width}>
        <SkeletonBlock sx={{ width: 32, height: 32, borderRadius: '8px' }} />
        <RowContent sx={{ gap: '7px' }}>
          <SkeletonBlock
            sx={{ width: `${width}%`, height: 11, borderRadius: '5px' }}
          />
          <SkeletonBlock
            sx={{ width: '36%', height: 9, borderRadius: '5px' }}
          />
        </RowContent>
      </SkeletonRow>
    ))}
  </>
);

const ProjectListSkeleton = () => (
  <>
    {PROJECT_SKELETON_WIDTHS.map(width => (
      <SkeletonRow key={width}>
        <SkeletonBlock sx={{ width: 32, height: 32, borderRadius: '7px' }} />
        <RowContent>
          <SkeletonBlock
            sx={{ width: `${width}%`, height: 12, borderRadius: '5px' }}
          />
        </RowContent>
      </SkeletonRow>
    ))}
  </>
);

const PanelEmpty: React.FC<{ title: string; text: string }> = ({
  title,
  text,
}) => (
  <EmptyState>
    <EmptyStateIconBox>
      <TableSvg size={20} />
    </EmptyStateIconBox>
    <EmptyStateTitle>{title}</EmptyStateTitle>
    <EmptyStateText>{text}</EmptyStateText>
  </EmptyState>
);

const CountSkeleton = () => (
  <SkeletonBlock sx={{ width: 22, height: 16, borderRadius: '999px' }} />
);

const UsagePanel: React.FC<{
  datasetId: string;
  onOpenProject: (projectId: string) => void;
}> = ({ datasetId, onOpenProject }) => {
  const { currentData, isFetching, isError, refetch } = useGetDatasetUsageQuery(
    { datasetId }
  );

  const projects = useMemo(
    () => (currentData ? groupUsageByProject(currentData) : []),
    [currentData]
  );

  const isLoading = isFetching && !currentData;

  return (
    <Column sx={{ flex: 1 }}>
      <ColumnLabel>
        <span>Используется в проектах</span>
        {isLoading ? (
          <CountSkeleton />
        ) : isError ? null : (
          <CountPill>{projects.length}</CountPill>
        )}
      </ColumnLabel>
      {isLoading ? (
        <ProjectListSkeleton />
      ) : isError ? (
        <ListMessage>
          Не удалось загрузить использование таблицы.
          <LoadMoreButton
            type='button'
            sx={{ mt: 1.5, px: 1.5, width: '100%' }}
            onClick={() => refetch()}
          >
            Повторить
          </LoadMoreButton>
        </ListMessage>
      ) : projects.length ? (
        projects.map(project => (
          <ProjectRowButton
            key={project.id}
            type='button'
            title={project.name}
            onClick={() => onOpenProject(project.id)}
          >
            <ProjectIconBox>
              <ProjectSvg />
            </ProjectIconBox>
            <RowContent>
              <ProjectTitle>{project.name}</ProjectTitle>
              <ProjectMeta>{formatNodeUsage(project.nodeIds.size)}</ProjectMeta>
            </RowContent>
            <span className='chevron'>
              <ChevronRightSvg />
            </span>
          </ProjectRowButton>
        ))
      ) : (
        <PanelEmpty
          title='Не используется'
          text='Таблица не используется ни в одном из доступных вам проектов'
        />
      )}
    </Column>
  );
};

const ProjectsSourceSearchContent: React.FC<
  Omit<ProjectsSourceSearchDialogProps, 'open'>
> = ({ initialQuery, onClose, onOpenProject }) => {
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery.trim());
  const [isFocused, setIsFocused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const clearDebounce = () => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  useEffect(() => clearDebounce, []);

  const commitQuery = useCallback((value: string) => {
    clearDebounce();
    setQuery(value.trim());
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInput(nextValue);
    clearDebounce();
    debounceRef.current = window.setTimeout(
      () => commitQuery(nextValue),
      SEARCH_DEBOUNCE_MS
    );
  };

  const handleClear = () => {
    setInput('');
    commitQuery('');
    inputRef.current?.focus();
  };

  const searchArg = useMemo(
    () => (query ? { query, limit: SEARCH_PAGE_SIZE } : skipToken),
    [query]
  );
  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useSearchDatasetsInfiniteQuery(searchArg);

  const datasets = useMemo(
    () => (query ? (data?.pages ?? []).flatMap(page => page.items) : []),
    [data, query]
  );

  const isPending = input.trim() !== query;
  const isSearching = Boolean(query) && isFetching && !isFetchingNextPage;
  const selectedDataset =
    datasets.find(dataset => dataset.id === selectedId) ?? null;

  // Новый поиск может не содержать выбранную таблицу — сбрасываем выбор.
  useEffect(() => {
    if (!isSearching && selectedId && !selectedDataset) {
      setSelectedId(null);
    }
  }, [isSearching, selectedDataset, selectedId]);

  const datasetsCountLabel = hasNextPage
    ? `${datasets.length}+`
    : String(datasets.length);

  return (
    <DialogLayout>
      <DialogHeader>
        <DialogTitleRow>
          <DialogTitleText id='projects-source-search-title'>
            Поиск проектов по источнику
          </DialogTitleText>
          <IconButtonPlain type='button' aria-label='Закрыть' onClick={onClose}>
            <CloseSvg size={16} />
          </IconButtonPlain>
        </DialogTitleRow>
        <SearchField isFocused={isFocused}>
          <SearchSvg />
          <SearchFieldInput
            ref={inputRef}
            autoFocus
            value={input}
            placeholder='Название таблицы, например orders'
            aria-label='Название таблицы'
            data-testid='features/projects/users-projects/source-search-input'
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              commitQuery(input);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitQuery(input);
              }
            }}
          />
          {isSearching ? (
            <SearchStatus>
              <Spinner />
              Ищем…
            </SearchStatus>
          ) : isPending ? (
            <SearchStatus>Ввод…</SearchStatus>
          ) : null}
          {input ? (
            <SearchClearButton
              type='button'
              title='Очистить'
              aria-label='Очистить'
              onMouseDown={event => event.preventDefault()}
              onClick={handleClear}
            >
              <CloseSvg size={13} />
            </SearchClearButton>
          ) : null}
        </SearchField>
      </DialogHeader>

      <ColumnsGrid>
        <LeftColumn>
          <ColumnLabel>
            <span>Таблицы</span>
            {isSearching ? (
              <CountSkeleton />
            ) : (
              <CountPill>{datasetsCountLabel}</CountPill>
            )}
          </ColumnLabel>
          {isSearching ? (
            <DatasetListSkeleton />
          ) : isError && !datasets.length ? (
            <ListMessage>
              Не удалось загрузить каталог данных.
              <LoadMoreButton
                type='button'
                sx={{ mt: 1.5, width: '100%' }}
                onClick={() => refetch()}
              >
                Повторить
              </LoadMoreButton>
            </ListMessage>
          ) : (
            <>
              {datasets.map(dataset => (
                <DatasetRow
                  key={dataset.id}
                  dataset={dataset}
                  query={query}
                  isActive={dataset.id === selectedId}
                  onSelect={setSelectedId}
                />
              ))}
              {!datasets.length ? (
                <ListMessage>
                  {query
                    ? `Таблиц по запросу «${query}» не найдено`
                    : 'Введите название таблицы'}
                </ListMessage>
              ) : null}
              {hasNextPage ? (
                <LoadMoreButton
                  type='button'
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? <Spinner /> : null}
                  {isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
                </LoadMoreButton>
              ) : null}
            </>
          )}
        </LeftColumn>

        <RightColumn>
          {selectedDataset ? (
            <UsagePanel
              key={selectedDataset.id}
              datasetId={selectedDataset.id}
              onOpenProject={onOpenProject}
            />
          ) : (
            <PanelEmpty
              title='Выберите таблицу'
              text='Выберите таблицу в списке слева, чтобы увидеть проекты, в которых она используется'
            />
          )}
        </RightColumn>
      </ColumnsGrid>
    </DialogLayout>
  );
};

export const ProjectsSourceSearchDialog: React.FC<
  ProjectsSourceSearchDialogProps
> = ({ open, initialQuery, onClose, onOpenProject }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    aria-labelledby='projects-source-search-title'
    data-testid='features/projects/users-projects/source-search-dialog'
    sx={{
      '& .MuiDialog-container': { alignItems: 'flex-start' },
    }}
    slotProps={{
      backdrop: {
        sx: {
          backgroundColor: 'rgba(24,28,44,.32)',
          backdropFilter: 'blur(2px)',
        },
      },
    }}
    PaperProps={{
      sx: {
        mt: 7,
        width: 980,
        maxWidth: 'calc(100vw - 32px)',
        height: 630,
        maxHeight: 'calc(100vh - 80px)',
        borderRadius: '16px',
        boxShadow: '0 40px 80px -30px rgba(20,24,40,.45)',
        overflow: 'hidden',
      },
    }}
  >
    <ProjectsSourceSearchContent
      initialQuery={initialQuery}
      onClose={onClose}
      onOpenProject={onOpenProject}
    />
  </Dialog>
);
