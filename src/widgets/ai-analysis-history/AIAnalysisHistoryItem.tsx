import { useEffect, useRef, useState } from 'react';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';

import type { AIAnalysisRequest } from '@/entities/ai-analysis';

import { Button } from '@/shared/ui';

import { AIAnalysisStatusBadge } from './AIAnalysisStatusBadge';

const slide = keyframes`
  0% { left: -40%; }
  100% { left: 100%; }
`;

const ItemContainer = styled('div')<{ active: boolean }>(({ active }) => ({
  padding: '10px 12px',
  marginBottom: 6,
  borderRadius: 8,
  cursor: 'default',
  backgroundColor: '#ffffff',
  border: active ? '1px solid #eef2ff' : '1px solid transparent',
  boxShadow: active ? '0 0 0 3px rgba(99, 102, 241, 0.06)' : 'none',
  transition: 'all 150ms ease',

  '&[role="button"]': {
    cursor: 'pointer',
  },

  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
}));

const TopRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 8,
});

const TimeText = styled('div')({
  fontSize: 10,
  color: '#9ca3af',
  whiteSpace: 'nowrap',
});

const ElapsedText = styled('span')({
  color: '#6366f1',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontWeight: 700,
});

const TaskTitle = styled('div')({
  fontSize: 12,
  fontWeight: 600,
  color: '#111827',
  lineHeight: 1.35,
  overflowWrap: 'anywhere',
});

const NodeRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  marginTop: 4,
  fontSize: 11,
  color: '#6b7280',
});

const Footer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 8,
  paddingTop: 8,
  borderTop: '1px solid #f3f4f6',
});

const StatsRow = styled('div')({
  fontSize: 10,
  color: '#4b5563',
  display: 'flex',
  gap: 8,
});

const ErrorFooter = styled('div')({
  marginTop: 8,
  paddingTop: 8,
  borderTop: '1px solid #f3f4f6',
  fontSize: 10,
  color: '#991b1b',
  lineHeight: 1.4,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  overflowWrap: 'anywhere',
});

const ProgressBar = styled('div')({
  marginTop: 8,
  height: 3,
  backgroundColor: '#f3f4f6',
  borderRadius: 2,
  overflow: 'hidden',
  position: 'relative',
});

const ProgressGlow = styled('div')({
  position: 'absolute',
  height: '100%',
  width: '35%',
  background:
    'linear-gradient(90deg, transparent 0%, #6366f1 50%, transparent 100%)',
  animation: `${slide} 1.5s ease-in-out infinite`,
});

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diff < 60) {
    return 'только что';
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)} мин назад`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} ч назад`;
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const useElapsedTime = (startedAt: string | null, active: boolean) => {
  const [elapsed, setElapsed] = useState('0:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || !startedAt) {
      setElapsed('0:00');
      return undefined;
    }

    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
      );
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;

      setElapsed(`${minutes}:${String(seconds).padStart(2, '0')}`);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [active, startedAt]);

  return elapsed;
};

interface AIAnalysisHistoryItemProps {
  item: AIAnalysisRequest;
  onOpen: () => void;
}

export const AIAnalysisHistoryItem = ({
  item,
  onOpen,
}: AIAnalysisHistoryItemProps) => {
  const active = item.status === 'queued' || item.status === 'running';
  const elapsed = useElapsedTime(item.started_at ?? item.created_at, active);
  const findingsCount = item.result?.content?.findings?.length ?? 0;
  const recommendationsCount =
    item.result?.content?.recommendations?.length ?? 0;
  const firstTargetNode = item.result?.context?.target_nodes?.[0];

  const handleClick = () => {
    if (item.status === 'success') {
      onOpen();
    }
  };

  return (
    <ItemContainer
      active={active}
      onClick={handleClick}
      role={item.status === 'success' ? 'button' : undefined}
      tabIndex={item.status === 'success' ? 0 : undefined}
    >
      <TopRow>
        <AIAnalysisStatusBadge status={item.status} />
        <TimeText>
          {active ? (
            <ElapsedText>{elapsed}</ElapsedText>
          ) : (
            formatRelativeTime(item.created_at)
          )}
        </TimeText>
      </TopRow>

      <TaskTitle>{item.task_id ?? item.request_id}</TaskTitle>
      {firstTargetNode ? (
        <NodeRow>
          <AccountTreeIcon sx={{ fontSize: 12 }} />
          {firstTargetNode}
        </NodeRow>
      ) : null}

      {item.status === 'success' ? (
        <Footer>
          <StatsRow>
            <span>
              <strong>{findingsCount}</strong> находок
            </span>
            <span>
              <strong>{recommendationsCount}</strong> рекомендаций
            </span>
          </StatsRow>
          <Box sx={{ ml: 'auto' }}>
            <Button
              size='xs'
              variant='subtle'
              onClick={event => {
                event.stopPropagation();
                onOpen();
              }}
            >
              Открыть
              <ChevronRightIcon sx={{ fontSize: 14 }} />
            </Button>
          </Box>
        </Footer>
      ) : null}

      {item.status === 'error' && item.error ? (
        <ErrorFooter>{item.error}</ErrorFooter>
      ) : null}

      {item.status === 'running' ? (
        <ProgressBar>
          <ProgressGlow />
        </ProgressBar>
      ) : null}
    </ItemContainer>
  );
};
