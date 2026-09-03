import React, {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import CircularProgress from '@mui/material/CircularProgress';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

import type { LogEntrySchema } from '@/shared/gatewayClient';

import {
  buildDisplayLog,
  copyTextToClipboard,
  type DisplayLogEntry,
  downloadTextFile,
  filterLogsBySearchTerm,
  formatLogEntry,
  formatLogTime,
  LOG_LEVELS,
  type LogLevelFilter,
  normalizeLevel,
  serializeLogs,
} from './lib';
import { SelectionActionBar } from './SelectionActionBar';
import {
  ActionButton,
  ActionDivider,
  DetailButton,
  DetailItem,
  DetailLabel,
  DetailsActions,
  DetailsGrid,
  DetailValue,
  EmptyIcon,
  EmptyState,
  EmptySubtitle,
  EmptyTitle,
  ExpandIcon,
  FilePathLink,
  FilterCount,
  FilterDot,
  FilterLabel,
  FilterTab,
  FilterTabs,
  FloatingScrollButton,
  HeaderActions,
  HeaderSpacer,
  LastEntry,
  LastEntryTime,
  LoadMoreFooter,
  LogCounter,
  LogDetails,
  LogLevel,
  LogMessage,
  LogRow,
  LogsContainer,
  LogsWrapper,
  LogTime,
  MessageBox,
  MessageText,
  RowCopyButton,
  SearchAdornmentIcon,
  SearchClear,
  SearchInput,
  SearchWrapper,
  TitleGroup,
  ViewerBody,
  ViewerContainer,
  ViewerHeader,
  ViewerTitle,
} from './styles';
import { useLogDragSelect } from './useLogDragSelect';

const FILE_PATH_RE = /File "(.*?)", line (\d+)/g;
const COMPACT_FILTER_BREAKPOINT = 900;
const HIDE_LAST_ENTRY_BREAKPOINT = 720;
const HEADER_WIDTH_FALLBACK = 1200;

const LEVEL_FILTERS: Array<{
  countKey: LogLevelFilter;
  dotLevel: string;
  label: string;
}> = [
  { countKey: 'all', dotLevel: 'all', label: 'All' },
  ...LOG_LEVELS.map(level => ({
    countKey: level,
    dotLevel: level,
    label: level,
  })),
];

const TerminalIcon: React.FC = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    aria-hidden='true'
  >
    <path
      d='M2 4l3 3-3 3M7 11h6'
      stroke='#1e293b'
      strokeWidth='1.7'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

function highlightFilePaths(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = FILE_PATH_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const filePath = match[1];
    const lineNum = match[2];

    parts.push(
      <React.Fragment key={match.index}>
        {'File "'}
        <FilePathLink>{filePath}</FilePathLink>
        {'", line ' + lineNum}
      </React.Fragment>
    );

    lastIndex = match.index + match[0].length;
  }

  if (parts.length === 0) {
    return text;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

interface LogListProps {
  copiedDetail: 'message' | 'full' | null;
  copiedFeedback: boolean;
  copiedRowIndex: number | null;
  emptySubtitle: string;
  emptyTitle: string;
  expandedRow: number | null;
  filteredLogs: DisplayLogEntry[];
  getRowHandlers: (index: number) => Record<string, unknown>;
  handleCopyFullLog: (log: LogEntrySchema) => Promise<void>;
  handleCopyMessage: (message: string) => Promise<void>;
  handleCopyRow: (log: LogEntrySchema, index: number) => Promise<void>;
  handleScrollToEnd: () => void;
  hasMore: boolean;
  hasSelection: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  logsContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  onClearSelection: () => void;
  onCopySelection: () => Promise<void>;
  onLoadMore: (() => void) | undefined;
  selectionCount: number;
  selectedIndices: Set<number>;
  setStickToBottom: React.Dispatch<React.SetStateAction<boolean>>;
  stickToBottom: boolean;
  virtuosoRef: React.MutableRefObject<VirtuosoHandle | null>;
}

const LogList = memo<LogListProps>(
  ({
    copiedDetail,
    copiedFeedback,
    copiedRowIndex,
    emptySubtitle,
    emptyTitle,
    expandedRow,
    filteredLogs,
    getRowHandlers,
    handleCopyFullLog,
    handleCopyMessage,
    handleCopyRow,
    handleScrollToEnd,
    hasMore,
    hasSelection,
    isLoading,
    isLoadingMore,
    logsContainerRef,
    onClearSelection,
    onCopySelection,
    onLoadMore,
    selectionCount,
    selectedIndices,
    setStickToBottom,
    stickToBottom,
    virtuosoRef,
  }) => {
    if (isLoading && filteredLogs.length === 0) {
      return (
        <LogsWrapper>
          <LogsContainer>
            <EmptyState>
              <CircularProgress size={24} />
            </EmptyState>
          </LogsContainer>
        </LogsWrapper>
      );
    }

    if (filteredLogs.length === 0) {
      return (
        <LogsWrapper>
          <LogsContainer>
            <EmptyState>
              <EmptyIcon>
                <SearchIcon />
              </EmptyIcon>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptySubtitle>{emptySubtitle}</EmptySubtitle>
            </EmptyState>
          </LogsContainer>
        </LogsWrapper>
      );
    }

    return (
      <LogsWrapper>
        <Virtuoso
          ref={virtuosoRef}
          style={{ flex: 1, minHeight: 0 }}
          totalCount={filteredLogs.length}
          overscan={200}
          endReached={() => {
            if (!hasMore || isLoadingMore || !onLoadMore) {
              return;
            }

            onLoadMore();
          }}
          followOutput={(isAtBottom: boolean) => (isAtBottom ? 'auto' : false)}
          atBottomThreshold={8}
          atBottomStateChange={setStickToBottom}
          scrollerRef={ref => {
            if (ref instanceof HTMLElement) {
              logsContainerRef.current = ref as HTMLDivElement;
            }
          }}
          components={{
            Scroller: LogsContainer,
            Footer: () =>
              hasMore || isLoadingMore ? (
                <LoadMoreFooter>
                  {isLoadingMore ? (
                    <>
                      <CircularProgress size={12} />
                      <span>Загрузка следующей страницы...</span>
                    </>
                  ) : (
                    <span>Прокрутите вниз, чтобы загрузить больше</span>
                  )}
                </LoadMoreFooter>
              ) : null,
          }}
          itemContent={index => {
            const log = filteredLogs[index];
            const isExpanded = expandedRow === index;

            return (
              <div {...getRowHandlers(index)}>
                <LogRow
                  expanded={isExpanded}
                  selected={selectedIndices.has(index)}
                >
                  <ExpandIcon expanded={isExpanded}>
                    <ChevronRightIcon />
                  </ExpandIcon>
                  <LogTime>{log.formattedTime}</LogTime>
                  <LogLevel level={log.normalizedLevel}>
                    {log.normalizedLevel}
                  </LogLevel>
                  <LogMessage>{log.message}</LogMessage>
                  <RowCopyButton
                    className='log-row-copy-btn'
                    type='button'
                    title='Copy log'
                    style={
                      copiedRowIndex === index
                        ? { opacity: 1, color: '#16a34a' }
                        : undefined
                    }
                    onMouseDown={event => event.stopPropagation()}
                    onClick={event => {
                      event.stopPropagation();
                      void handleCopyRow(log, index);
                    }}
                  >
                    {copiedRowIndex === index ? (
                      <CheckIcon />
                    ) : (
                      <ContentCopyIcon />
                    )}
                  </RowCopyButton>
                </LogRow>

                {isExpanded ? (
                  <LogDetails
                    onMouseDown={event => event.stopPropagation()}
                    onMouseUp={event => event.stopPropagation()}
                  >
                    <DetailsGrid>
                      <DetailItem>
                        <DetailLabel>Module</DetailLabel>
                        <DetailValue variant='code'>
                          {log.module || '—'}
                        </DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Location</DetailLabel>
                        <DetailValue variant='code'>
                          {log.locationLabel}
                        </DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Service</DetailLabel>
                        <DetailValue>{log.service_name || '—'}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Logger</DetailLabel>
                        <DetailValue>{log.logger_name || '—'}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Level</DetailLabel>
                        <DetailValue>{log.normalizedLevel}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Timestamp</DetailLabel>
                        <DetailValue>{log.formattedTimestamp}</DetailValue>
                      </DetailItem>
                    </DetailsGrid>
                    <MessageBox>
                      <MessageText level={log.normalizedLevel}>
                        {highlightFilePaths(log.combinedMessage)}
                      </MessageText>
                    </MessageBox>
                    <DetailsActions>
                      <DetailButton
                        type='button'
                        onClick={() => void handleCopyMessage(log.message)}
                        style={
                          copiedDetail === 'message'
                            ? { color: '#16a34a' }
                            : undefined
                        }
                      >
                        {copiedDetail === 'message' ? (
                          <>
                            <CheckIcon
                              style={{
                                width: 12,
                                height: 12,
                                marginRight: 4,
                                verticalAlign: 'middle',
                              }}
                            />
                            Copied!
                          </>
                        ) : (
                          'Copy message'
                        )}
                      </DetailButton>
                      <DetailButton
                        type='button'
                        onClick={() => void handleCopyFullLog(log)}
                        style={
                          copiedDetail === 'full'
                            ? { color: '#16a34a' }
                            : undefined
                        }
                      >
                        {copiedDetail === 'full' ? (
                          <>
                            <CheckIcon
                              style={{
                                width: 12,
                                height: 12,
                                marginRight: 4,
                                verticalAlign: 'middle',
                              }}
                            />
                            Copied!
                          </>
                        ) : (
                          'Copy full log'
                        )}
                      </DetailButton>
                    </DetailsActions>
                  </LogDetails>
                ) : null}
              </div>
            );
          }}
        />
        {!stickToBottom ? (
          <FloatingScrollButton
            type='button'
            onClick={handleScrollToEnd}
            aria-label='Прокрутить вниз'
            title='Прокрутить вниз'
          >
            <VerticalAlignBottomIcon />
          </FloatingScrollButton>
        ) : null}
        {hasSelection ? (
          <SelectionActionBar
            count={selectionCount}
            copied={copiedFeedback}
            onCopy={() => void onCopySelection()}
            onClear={onClearSelection}
          />
        ) : null}
      </LogsWrapper>
    );
  }
);

LogList.displayName = 'LogList';

interface LogViewerFilterProps {
  compact: boolean;
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
}

const LogViewerFilter = memo<LogViewerFilterProps>(
  ({ compact, isOpen, value, onChange, onOpen, onClose }) => {
    const showInput = !compact || isOpen || Boolean(value);

    if (!showInput) {
      return (
        <ActionButton title='Filter logs' onClick={onOpen} type='button'>
          <SearchIcon />
        </ActionButton>
      );
    }

    return (
      <SearchWrapper compact={compact}>
        <SearchAdornmentIcon />
        <SearchInput
          autoFocus={compact && isOpen}
          type='text'
          placeholder='Search logs...'
          value={value}
          onBlur={() => {
            if (compact && !value.trim()) {
              onClose();
            }
          }}
          onChange={event => onChange(event.target.value)}
        />
        {value ? (
          <SearchClear
            type='button'
            title='Очистить фильтр'
            onMouseDown={event => event.preventDefault()}
            onClick={() => onChange('')}
          >
            <CloseIcon />
          </SearchClear>
        ) : null}
      </SearchWrapper>
    );
  }
);

LogViewerFilter.displayName = 'LogViewerFilter';

export interface LogViewerProps {
  logs: LogEntrySchema[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  height?: number | string;
  totalCount?: number;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onClose?: () => void;
  onClear?: () => void;
  closeTitle?: string;
  clearTitle?: string;
  downloadFileNamePrefix?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  title,
  subtitle,
  height = '100%',
  totalCount,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onClose,
  onClear,
  closeTitle = 'Закрыть',
  clearTitle = 'Очистить',
  downloadFileNamePrefix = 'logs',
  emptyTitle,
  emptySubtitle,
}) => {
  const [filter, setFilter] = useState<LogLevelFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);
  const [copiedDetail, setCopiedDetail] = useState<'message' | 'full' | null>(
    null
  );
  const [stickToBottom, setStickToBottom] = useState(true);
  const [headerWidth, setHeaderWidth] = useState(HEADER_WIDTH_FALLBACK);
  const [isCompactFilterOpen, setIsCompactFilterOpen] = useState(false);

  const searchTerm = searchQuery.trim() || null;

  const copiedFeedbackTimer = useRef<ReturnType<typeof setTimeout>>();
  const copiedRowTimer = useRef<ReturnType<typeof setTimeout>>();
  const copiedDetailTimer = useRef<ReturnType<typeof setTimeout>>();
  const headerRef = useRef<HTMLDivElement | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useLayoutEffect(() => {
    const headerElement = headerRef.current;

    if (!headerElement) {
      return undefined;
    }

    const updateWidth = () => {
      setHeaderWidth(headerElement.clientWidth || HEADER_WIDTH_FALLBACK);
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(headerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const baseFilteredLogs = useMemo(
    () => filterLogsBySearchTerm(logs, searchTerm),
    [logs, searchTerm]
  );
  const displayLogs = useMemo(
    () => baseFilteredLogs.map(buildDisplayLog),
    [baseFilteredLogs]
  );
  const logsToRender = useDeferredValue(displayLogs);

  const handleExpandRow = useCallback((index: number | null) => {
    setExpandedRow(prevValue =>
      index === null ? null : prevValue === index ? null : index
    );
  }, []);

  const levelCounts = useMemo(
    () =>
      logs.reduce(
        (acc, log) => {
          const level = normalizeLevel(log.level);
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    if (filter === 'all') {
      return logsToRender;
    }

    return logsToRender.filter(log => log.normalizedLevel === filter);
  }, [filter, logsToRender]);

  const logsText = useMemo(() => serializeLogs(filteredLogs), [filteredLogs]);
  const hasLogs = filteredLogs.length > 0;

  const {
    selectedIndices,
    hasSelection,
    selectionCount,
    clearSelection,
    getRowHandlers,
  } = useLogDragSelect({
    rowCount: filteredLogs.length,
    containerRef: logsContainerRef,
    onExpandRow: handleExpandRow,
  });

  const triggerCopiedFeedback = useCallback(() => {
    setCopiedFeedback(true);
    clearTimeout(copiedFeedbackTimer.current);
    copiedFeedbackTimer.current = setTimeout(
      () => setCopiedFeedback(false),
      1500
    );
  }, []);

  const handleCopySelectedLogs = useCallback(async () => {
    if (!hasSelection) {
      return;
    }

    const selected = filteredLogs.filter((_log, index) =>
      selectedIndices.has(index)
    );
    const text = serializeLogs(selected);

    try {
      await copyTextToClipboard(text);
      triggerCopiedFeedback();
    } catch (error) {
      console.error('[LogViewer] Copy selected logs failed', error);
    }
  }, [filteredLogs, hasSelection, selectedIndices, triggerCopiedFeedback]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.code === 'KeyC' &&
        hasSelection
      ) {
        event.preventDefault();
        void handleCopySelectedLogs();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopySelectedLogs, hasSelection]);

  const handleCopyRow = useCallback(
    async (log: LogEntrySchema, index: number) => {
      try {
        await copyTextToClipboard(formatLogEntry(log));
        setCopiedRowIndex(index);
        clearTimeout(copiedRowTimer.current);
        copiedRowTimer.current = setTimeout(
          () => setCopiedRowIndex(null),
          1500
        );
      } catch (error) {
        console.error('[LogViewer] Copy row failed', error);
      }
    },
    []
  );

  useEffect(() => {
    setExpandedRow(null);
    clearSelection();
  }, [clearSelection, filter, searchQuery]);

  useEffect(() => {
    if (headerWidth >= COMPACT_FILTER_BREAKPOINT) {
      setIsCompactFilterOpen(false);
    }
  }, [headerWidth]);

  const handleCopyLogs = useCallback(async () => {
    if (!hasLogs) {
      return;
    }

    try {
      await copyTextToClipboard(logsText);
    } catch (error) {
      console.error('[LogViewer] Copy logs handler failed', error);
    }
  }, [hasLogs, logsText]);

  const handleDownloadLogs = useCallback(() => {
    if (!hasLogs) {
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadTextFile(logsText, `${downloadFileNamePrefix}-${timestamp}.txt`);
    } catch (error) {
      console.error('[LogViewer] Download logs handler failed', error);
    }
  }, [downloadFileNamePrefix, hasLogs, logsText]);

  const triggerDetailFeedback = useCallback((type: 'message' | 'full') => {
    setCopiedDetail(type);
    clearTimeout(copiedDetailTimer.current);
    copiedDetailTimer.current = setTimeout(() => setCopiedDetail(null), 1500);
  }, []);

  const handleCopyMessage = useCallback(
    async (message: string) => {
      if (!message) {
        return;
      }

      try {
        await copyTextToClipboard(message);
        triggerDetailFeedback('message');
      } catch (error) {
        console.error('[LogViewer] Copy message handler failed', error);
      }
    },
    [triggerDetailFeedback]
  );

  const handleCopyFullLog = useCallback(
    async (log: LogEntrySchema) => {
      try {
        await copyTextToClipboard(formatLogEntry(log));
        triggerDetailFeedback('full');
      } catch (error) {
        console.error('[LogViewer] Copy full log handler failed', error);
      }
    },
    [triggerDetailFeedback]
  );

  const handleScrollToEnd = useCallback(() => {
    setStickToBottom(true);
    virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(copiedFeedbackTimer.current);
      clearTimeout(copiedRowTimer.current);
      clearTimeout(copiedDetailTimer.current);
    };
  }, []);

  const lastEntry = logs[logs.length - 1];
  const lastEntryTime = lastEntry ? formatLogTime(lastEntry.created_at) : '—';
  const visibleTotal = totalCount ?? logs.length;
  const isCompactFilter = headerWidth < COMPACT_FILTER_BREAKPOINT;
  const showLastEntry = headerWidth >= HIDE_LAST_ENTRY_BREAKPOINT;
  const titleHint =
    typeof subtitle === 'string' || typeof subtitle === 'number'
      ? String(subtitle)
      : undefined;

  return (
    <ViewerContainer style={{ height }}>
      <ViewerHeader ref={headerRef}>
        <TitleGroup title={titleHint}>
          <TerminalIcon />
          <ViewerTitle>{title}</ViewerTitle>
          <LogCounter>
            {filteredLogs.length} / {visibleTotal}
          </LogCounter>
        </TitleGroup>

        <ActionDivider />

        <FilterTabs>
          {LEVEL_FILTERS.map(level => (
            <FilterTab
              key={level.countKey}
              type='button'
              active={filter === level.countKey}
              onClick={() => setFilter(level.countKey)}
            >
              <FilterDot level={level.dotLevel} />
              <FilterLabel>{level.label}</FilterLabel>
              <FilterCount>
                {level.countKey === 'all'
                  ? logs.length
                  : levelCounts[level.countKey] || 0}
              </FilterCount>
            </FilterTab>
          ))}
        </FilterTabs>

        <HeaderSpacer />

        {showLastEntry ? (
          <LastEntry>
            Last entry
            <LastEntryTime>{lastEntryTime}</LastEntryTime>
          </LastEntry>
        ) : null}

        <LogViewerFilter
          compact={isCompactFilter}
          isOpen={isCompactFilterOpen}
          value={searchQuery}
          onChange={setSearchQuery}
          onOpen={() => setIsCompactFilterOpen(true)}
          onClose={() => setIsCompactFilterOpen(false)}
        />

        <ActionDivider />

        <HeaderActions>
          <ActionButton
            onClick={handleCopyLogs}
            title='Скопировать логи'
            disabled={!hasLogs}
            type='button'
          >
            <ContentCopyIcon />
          </ActionButton>
          <ActionButton
            onClick={handleDownloadLogs}
            title='Скачать логи'
            disabled={!hasLogs}
            type='button'
          >
            <FileDownloadIcon />
          </ActionButton>
          {onClear ? (
            <ActionButton onClick={onClear} title={clearTitle} type='button'>
              <DeleteOutlineIcon />
            </ActionButton>
          ) : null}
          {onClose ? (
            <ActionButton onClick={onClose} title={closeTitle} type='button'>
              <CloseIcon />
            </ActionButton>
          ) : null}
        </HeaderActions>
      </ViewerHeader>

      <ViewerBody>
        <LogList
          copiedDetail={copiedDetail}
          copiedFeedback={copiedFeedback}
          copiedRowIndex={copiedRowIndex}
          emptySubtitle={emptySubtitle ?? 'Попробуйте изменить фильтры'}
          emptyTitle={emptyTitle ?? 'Логи не найдены'}
          expandedRow={expandedRow}
          filteredLogs={filteredLogs}
          getRowHandlers={getRowHandlers}
          handleCopyFullLog={handleCopyFullLog}
          handleCopyMessage={handleCopyMessage}
          handleCopyRow={handleCopyRow}
          handleScrollToEnd={handleScrollToEnd}
          hasMore={hasMore}
          hasSelection={hasSelection}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          logsContainerRef={logsContainerRef}
          onClearSelection={clearSelection}
          onCopySelection={handleCopySelectedLogs}
          onLoadMore={onLoadMore}
          selectionCount={selectionCount}
          selectedIndices={selectedIndices}
          setStickToBottom={setStickToBottom}
          stickToBottom={stickToBottom}
          virtuosoRef={virtuosoRef}
        />
      </ViewerBody>
    </ViewerContainer>
  );
};
