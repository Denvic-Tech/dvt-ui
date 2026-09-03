import { useEffect, useMemo, useState } from 'react';
import { keyframes, styled } from '@mui/material/styles';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';

import { useAlert } from '@/app/notifications';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  type AIAnalysisRequest,
  type AIAnalysisStatus,
  loadAIAnalysisHistory,
  openAIAnalysisResultModal,
  selectAIAnalysisItems,
  selectHasActiveAIAnalysis,
  selectLatestErrorAIAnalysis,
  startAIAnalysis,
} from '@/entities/ai-analysis';

import { Button, IconButton, Skeleton, Tooltip } from '@/shared/ui';

import {
  AI_RUNNING_PHRASES,
  formatAnalysisRelativeTime,
  getAnalysisNode,
  getAnalysisTitle,
} from './helpers';
import { useElapsedTime } from './useElapsedTime';
import { useRotatingPhrase } from './useRotatingPhrase';

const Container = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  backgroundColor: '#ffffff',
});

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const aiPulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.85);
  }
`;

const aiPulseDot = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
`;

const aiFadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const HeaderBlock = styled('div')({
  padding: '14px 16px',
  borderBottom: '1px solid #f3f4f6',
  backgroundColor: '#ffffff',
});

const HeaderRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const HeaderTitle = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
});

const HeaderActions = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

const PollingPill = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 10,
  color: '#4f46e5',
  fontWeight: 600,
  padding: '3px 8px',
  background: '#eef2ff',
  borderRadius: 6,
});

const PollingDot = styled('span')({
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: '#6366f1',
  animation: `${aiPulse} 2s ease-in-out infinite`,
});

const SummaryRow = styled('div')({
  fontSize: 11,
  color: '#6b7280',
  marginTop: 4,
});

const FiltersRow = styled('div')({
  padding: '10px 16px',
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  borderBottom: '1px solid #f3f4f6',
  backgroundColor: '#ffffff',
});

const TimelineRoot = styled('div')({
  padding: '16px 14px 20px',
});

const TimelineRow = styled('div')<{ $isLast: boolean }>(({ $isLast }) => ({
  display: 'flex',
  gap: 12,
  position: 'relative',
  paddingBottom: $isLast ? 0 : 12,
}));

const TimelineColumn = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flexShrink: 0,
  paddingTop: 4,
});

const TimelineLine = styled('div')({
  width: 2,
  flex: 1,
  background: '#e5e7eb',
  marginTop: 2,
  minHeight: 30,
});

const TimelineDot = styled('div')<{ $bg: string; $border: string }>(
  ({ $bg, $border }) => ({
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: $bg,
    border: `2px solid ${$border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    position: 'relative',
    flexShrink: 0,
  })
);

const RunningInnerDot = styled('span')({
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#6366f1',
  animation: `${aiPulseDot} 1.2s ease-in-out infinite`,
});

const ErrorInnerDot = styled('span')({
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: '#ef4444',
});

const ActiveBar = styled('div')<{ $variant: 'running' | 'queued' }>(
  ({ $variant }) => ({
    flex: 1,
    padding: '12px 14px',
    background: $variant === 'running' ? '#eef2ff' : '#f9fafb',
    border: $variant === 'running' ? '1px solid #c7d2fe' : '1px dashed #d1d5db',
    borderRadius: 10,
    marginTop: -2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    overflow: 'hidden',
    minWidth: 0,
  })
);

const ActiveLeft = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  flex: 1,
});

const RunningSpinner = styled('span')({
  width: 10,
  height: 10,
  border: '2px solid #6366f1',
  borderTopColor: 'transparent',
  borderRadius: '50%',
  animation: `${spin} 0.8s linear infinite`,
  display: 'inline-block',
  flexShrink: 0,
});

const QueuedDot = styled('span')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#9ca3af',
  animation: `${aiPulseDot} 1.5s ease-in-out infinite`,
  display: 'inline-block',
  flexShrink: 0,
});

const ActivePhrase = styled('span')<{ $variant: 'running' | 'queued' }>(
  ({ $variant }) => ({
    fontSize: 12,
    fontWeight: 600,
    color: $variant === 'running' ? '#4f46e5' : '#374151',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    animation: `${aiFadeIn} 600ms ease`,
  })
);

const ActiveTime = styled('span')<{ $variant: 'running' | 'queued' }>(
  ({ $variant }) => ({
    fontSize: 12,
    fontWeight: 600,
    color: $variant === 'running' ? '#4f46e5' : '#6b7280',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    flexShrink: 0,
  })
);

const CompletedCard = styled('div')<{ $clickable: boolean; $hover: boolean }>(
  ({ $clickable, $hover }) => ({
    flex: 1,
    padding: '10px 12px',
    background: '#ffffff',
    border: `1px solid ${$hover && $clickable ? '#6366f1' : '#ececef'}`,
    borderRadius: 10,
    marginTop: -2,
    cursor: $clickable ? 'pointer' : 'default',
    transition: 'all 150ms ease',
    boxShadow:
      $hover && $clickable ? '0 4px 12px rgba(99, 102, 241, 0.12)' : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  })
);

const CompletedContent = styled('div')({
  flex: 1,
  minWidth: 0,
});

const CompletedTitle = styled('div')({
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  marginBottom: 3,
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const CompletedSubtitle = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  color: '#6b7280',
  minWidth: 0,
});

const SubtitleNode = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const SubtitleNodeText = styled('span')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const SubtitleSeparator = styled('span')({
  color: '#d1d5db',
  flexShrink: 0,
});

const SubtitleTime = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  flexShrink: 0,
});

const SkeletonRow = styled('div')({
  display: 'flex',
  gap: 12,
  paddingBottom: 12,
});

const EmptyStateBlock = styled('div')({
  padding: '32px 16px',
  textAlign: 'center',
  color: '#9ca3af',
  fontSize: 12,
});

const QUEUED_PHRASES = ['В очереди'];

type FilterValue = 'all' | 'active' | 'success' | 'error';

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'success', label: 'Готовы' },
  { value: 'error', label: 'Ошибки' },
];

interface AIAnalysisHistoryListProps {
  projectId?: string | null | undefined;
}

interface IconProps {
  color?: string;
  size?: number;
  style?: CSSProperties;
}

const IconHistory = ({
  color = 'currentColor',
  size = 14,
  style,
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={style}
    aria-hidden='true'
  >
    <path d='M3 3v5h5' />
    <path d='M3.05 13A9 9 0 106 5.3L3 8' />
    <path d='M12 7v5l4 2' />
  </svg>
);

const IconNode = ({ color = 'currentColor', size = 11, style }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={style}
    aria-hidden='true'
  >
    <rect x='3' y='3' width='7' height='7' rx='1' />
    <rect x='14' y='14' width='7' height='7' rx='1' />
    <path d='M10 6.5h4M14 17.5h-4M6.5 10v4M17.5 14v-4' />
  </svg>
);

const IconClock = ({ color = 'currentColor', size = 10, style }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={style}
    aria-hidden='true'
  >
    <circle cx='12' cy='12' r='10' />
    <polyline points='12 6 12 12 16 14' />
  </svg>
);

const IconRefresh = ({
  color = 'currentColor',
  size = 13,
  style,
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={style}
    aria-hidden='true'
  >
    <polyline points='23 4 23 10 17 10' />
    <polyline points='1 20 1 14 7 14' />
    <path d='M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15' />
  </svg>
);

const IconChevron = ({
  color = 'currentColor',
  size = 13,
  style,
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={style}
    aria-hidden='true'
  >
    <polyline points='9 18 15 12 9 6' />
  </svg>
);

const IconCheck = ({ color = 'currentColor', size = 8, style }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    style={style}
    aria-hidden='true'
  >
    <polyline points='20 6 9 17 4 12' />
  </svg>
);

const getDotColors = (status: AIAnalysisStatus) => {
  switch (status) {
    case 'queued':
      return { bg: '#d1d5db', border: '#9ca3af' };
    case 'running':
      return { bg: '#eef2ff', border: '#6366f1' };
    case 'success':
      return { bg: '#d1fae5', border: '#10b981' };
    case 'error':
      return { bg: '#fee2e2', border: '#ef4444' };
    default:
      return { bg: '#d1d5db', border: '#9ca3af' };
  }
};

const ActiveItem = ({ item }: { item: AIAnalysisRequest }) => {
  const isRunning = item.status === 'running';
  const phrase = useRotatingPhrase(
    isRunning ? AI_RUNNING_PHRASES : QUEUED_PHRASES,
    2500
  );
  const elapsed = useElapsedTime(item.started_at ?? item.created_at, true);

  return (
    <ActiveBar
      $variant={isRunning ? 'running' : 'queued'}
      aria-live='polite'
      role='status'
    >
      <ActiveLeft>
        {isRunning ? <RunningSpinner /> : <QueuedDot />}
        <ActivePhrase key={phrase} $variant={isRunning ? 'running' : 'queued'}>
          {phrase}
          {isRunning ? '…' : ''}
        </ActivePhrase>
      </ActiveLeft>
      <ActiveTime $variant={isRunning ? 'running' : 'queued'}>
        {elapsed}
      </ActiveTime>
    </ActiveBar>
  );
};

interface CompletedItemProps {
  canRetry: boolean;
  hasActiveAnalysis: boolean;
  item: AIAnalysisRequest;
  onOpen: (requestId: string) => void;
  onRetry: (item: AIAnalysisRequest) => Promise<void>;
}

const CompletedItem = ({
  canRetry,
  hasActiveAnalysis,
  item,
  onOpen,
  onRetry,
}: CompletedItemProps) => {
  const [hover, setHover] = useState(false);
  const isSuccess = item.status === 'success';
  const isError = item.status === 'error';
  const node = getAnalysisNode(item);
  const timeText = formatAnalysisRelativeTime(
    item.finished_at ?? item.created_at
  );

  const handleOpen = () => {
    if (isSuccess) {
      onOpen(item.request_id);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isSuccess) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  const handleRetryClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!item.task_id || hasActiveAnalysis || !canRetry) {
      return;
    }

    await onRetry(item);
  };

  return (
    <CompletedCard
      $clickable={isSuccess}
      $hover={hover}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role={isSuccess ? 'button' : undefined}
      tabIndex={isSuccess ? 0 : undefined}
    >
      <CompletedContent>
        <CompletedTitle>{getAnalysisTitle(item)}</CompletedTitle>
        <CompletedSubtitle>
          {node ? (
            <>
              <SubtitleNode>
                <IconNode size={11} />
                <SubtitleNodeText>{node}</SubtitleNodeText>
              </SubtitleNode>
              <SubtitleSeparator>·</SubtitleSeparator>
            </>
          ) : null}
          <SubtitleTime>
            <IconClock size={10} />
            {timeText}
          </SubtitleTime>
        </CompletedSubtitle>
      </CompletedContent>

      {isSuccess ? (
        <Tooltip title='Открыть отчёт'>
          <IconButton
            size='xs'
            variant='ghost'
            aria-label='Открыть отчёт'
            onClick={event => {
              event.stopPropagation();
              onOpen(item.request_id);
            }}
            sx={{
              minWidth: 28,
              minHeight: 28,
              width: 28,
              height: 28,
              borderRadius: '8px',
              backgroundColor: hover ? '#6366f1' : '#eef2ff',
              color: hover ? '#ffffff' : '#6366f1',
              transition: 'all 150ms ease',
              '&:hover': {
                backgroundColor: '#6366f1',
                color: '#ffffff',
              },
            }}
          >
            <IconChevron size={13} />
          </IconButton>
        </Tooltip>
      ) : null}

      {isError && item.task_id && canRetry ? (
        <Tooltip
          title={
            hasActiveAnalysis
              ? 'Дождитесь завершения текущего анализа'
              : 'Запустить заново'
          }
        >
          <span>
            <IconButton
              size='xs'
              variant='ghost'
              aria-label='Запустить заново'
              disabled={hasActiveAnalysis}
              onClick={event => {
                void handleRetryClick(event);
              }}
              sx={{
                minWidth: 28,
                minHeight: 28,
                width: 28,
                height: 28,
                borderRadius: '8px',
                backgroundColor: hover ? '#ef4444' : '#fee2e2',
                color: hover ? '#ffffff' : '#ef4444',
                transition: 'all 150ms ease',
                '&:hover': {
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                },
                '&.Mui-disabled': {
                  opacity: 0.4,
                  color: '#ef4444',
                  backgroundColor: '#fee2e2',
                },
              }}
            >
              <IconRefresh size={13} />
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
    </CompletedCard>
  );
};

export const AIAnalysisHistoryList = ({
  projectId,
}: AIAnalysisHistoryListProps) => {
  const dispatch = useAppDispatch();
  const { showNotification } = useAlert();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const items = useAppSelector(state =>
    selectAIAnalysisItems(state, projectId ?? undefined)
  );
  const isLoading = useAppSelector(state =>
    projectId
      ? (state.aiAnalysis.isLoadingByProject[projectId] ?? false)
      : false
  );
  const hasActiveAnalysis = useAppSelector(state =>
    selectHasActiveAIAnalysis(state, projectId ?? undefined)
  );
  const latestErrorRequestId = useAppSelector(
    state =>
      selectLatestErrorAIAnalysis(state, projectId ?? undefined)?.request_id ??
      null
  );

  useEffect(() => {
    if (projectId) {
      void dispatch(loadAIAnalysisHistory({ projectId }));
    }
  }, [dispatch, projectId]);

  const { activeCount, completedCount, filteredItems } = useMemo(() => {
    const active = items.filter(
      item => item.status === 'queued' || item.status === 'running'
    );
    const completed = items.filter(
      item => item.status === 'success' || item.status === 'error'
    );

    let filtered: AIAnalysisRequest[] = items;

    if (filter === 'active') {
      filtered = active;
    } else if (filter === 'success') {
      filtered = items.filter(item => item.status === 'success');
    } else if (filter === 'error') {
      filtered = items.filter(item => item.status === 'error');
    }

    return {
      activeCount: active.length,
      completedCount: completed.length,
      filteredItems: filtered,
    };
  }, [filter, items]);

  const handleRefresh = async () => {
    if (!projectId || isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      await dispatch(loadAIAnalysisHistory({ projectId }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenResult = (requestId: string) => {
    dispatch(openAIAnalysisResultModal(requestId));
  };

  const handleRetry = async (item: AIAnalysisRequest) => {
    if (!projectId || !item.task_id || hasActiveAnalysis) {
      return;
    }

    try {
      await dispatch(
        startAIAnalysis({
          projectId,
          task_id: item.task_id,
        })
      ).unwrap();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'AI-анализ не запущен',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось запустить повторный анализ',
      });
    }
  };

  if (!projectId) {
    return null;
  }

  return (
    <Container>
      <HeaderBlock>
        <HeaderRow>
          <HeaderTitle>
            <IconHistory size={14} />
            История AI-анализов
          </HeaderTitle>
          <HeaderActions>
            {hasActiveAnalysis ? (
              <PollingPill>
                <PollingDot />
                Обновляется
              </PollingPill>
            ) : null}
            <Tooltip title='Обновить список'>
              <span>
                <IconButton
                  size='xs'
                  variant='ghost'
                  onClick={() => {
                    void handleRefresh();
                  }}
                  disabled={isRefreshing}
                  aria-label='Обновить список'
                  title='Обновить список'
                  sx={{
                    minWidth: 26,
                    minHeight: 26,
                    width: 26,
                    height: 26,
                    borderRadius: '7px',
                    color: '#6b7280',
                    opacity: isRefreshing ? 0.7 : 1,
                    cursor: isRefreshing ? 'wait' : 'pointer',
                    transition: 'all 150ms ease',
                    '&:hover': {
                      backgroundColor: '#f3f4f6',
                      color: '#1f2937',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.7,
                      color: '#6b7280',
                    },
                  }}
                >
                  <IconRefresh
                    size={13}
                    {...(isRefreshing
                      ? {
                          style: {
                            animation: `${spin} 1s linear infinite`,
                          } satisfies CSSProperties,
                        }
                      : {})}
                  />
                </IconButton>
              </span>
            </Tooltip>
          </HeaderActions>
        </HeaderRow>
        <SummaryRow>
          {activeCount} активных · {completedCount} завершено
        </SummaryRow>
      </HeaderBlock>

      <FiltersRow>
        {FILTER_OPTIONS.map(option => {
          const active = filter === option.value;

          return (
            <Button
              key={option.value}
              size='xs'
              variant='ghost'
              onClick={() => setFilter(option.value)}
              sx={{
                minHeight: 24,
                px: '10px',
                borderRadius: '6px',
                border: active ? 'none' : '1px solid #e5e7eb',
                backgroundColor: active ? '#1f2937' : '#ffffff',
                color: active ? '#ffffff' : '#4b5563',
                fontSize: 11,
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: active ? '#1f2937' : '#f9fafb',
                  boxShadow: 'none',
                },
              }}
            >
              {option.label}
            </Button>
          );
        })}
      </FiltersRow>

      <TimelineRoot>
        {isLoading && items.length === 0 ? (
          <>
            {[0, 1, 2].map(index => (
              <SkeletonRow key={index}>
                <Skeleton variant='circular' width={14} height={14} />
                <Skeleton
                  height={52}
                  sx={{
                    flex: 1,
                    transform: 'none',
                    transformOrigin: 'left center',
                    borderRadius: '10px',
                  }}
                />
              </SkeletonRow>
            ))}
          </>
        ) : null}

        {!isLoading && filteredItems.length === 0 ? (
          <EmptyStateBlock>
            {filter === 'all'
              ? 'Анализов пока нет. Запустите анализ упавшей задачи через баннер внизу.'
              : 'По выбранному фильтру записей нет'}
          </EmptyStateBlock>
        ) : null}

        {!isLoading
          ? filteredItems.map((item, index) => {
              const isLast = index === filteredItems.length - 1;
              const isActive =
                item.status === 'queued' || item.status === 'running';
              const dotColors = getDotColors(item.status);

              return (
                <TimelineRow key={item.request_id} $isLast={isLast}>
                  <TimelineColumn>
                    <TimelineDot $bg={dotColors.bg} $border={dotColors.border}>
                      {item.status === 'running' ? <RunningInnerDot /> : null}
                      {item.status === 'success' ? (
                        <IconCheck size={6} color='#10b981' />
                      ) : null}
                      {item.status === 'error' ? <ErrorInnerDot /> : null}
                    </TimelineDot>
                    {!isLast ? <TimelineLine /> : null}
                  </TimelineColumn>

                  {isActive ? (
                    <ActiveItem item={item} />
                  ) : (
                    <CompletedItem
                      canRetry={item.request_id === latestErrorRequestId}
                      item={item}
                      hasActiveAnalysis={hasActiveAnalysis}
                      onOpen={handleOpenResult}
                      onRetry={handleRetry}
                    />
                  )}
                </TimelineRow>
              );
            })
          : null}
      </TimelineRoot>
    </Container>
  );
};
