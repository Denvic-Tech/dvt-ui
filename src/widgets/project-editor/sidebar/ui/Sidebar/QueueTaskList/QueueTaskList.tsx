import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SubjectIcon from '@mui/icons-material/Subject';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import { createPortal } from 'react-dom';

import { useAlert } from '@/app/notifications';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectHasActiveAIAnalysis,
  startAIAnalysis,
} from '@/entities/ai-analysis';
import { selectIsAIAnalysisEnabled } from '@/entities/config/runtime-config';
import { useQueue } from '@/entities/project/queue';
import { useTaskLogs } from '@/entities/project/task-logs';

import type {
  PipelineExecutionMode,
  QueueTask,
  TaskExecutionStatus,
} from '@/shared/gatewayClient';
import { LogViewer } from '@/shared/ui/log-viewer';
import { Dialog, DialogContent } from '@/shared/ui/primitives';

import { diffSec, formatDuration, formatTime } from './lib/time';

interface QueueTaskListProps {
  projectId?: string | null | undefined;
  searchTerm?: string;
  selectedTaskId?: string | null;
  onSelectTask?: (taskId: string) => void;
}

type SortDirection = 'asc' | 'desc';
type FilterMode = PipelineExecutionMode | 'ALL';

interface StatusAppearance {
  label: string;
  statusBg: string;
  statusBorder: string;
  statusColor: string;
  badgeBg: string;
  pulseDot: boolean;
}

const fadeSlide = keyframes`
  from {
    opacity: 0;
    transform: translateX(-4px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulseOpacity = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const Root = styled('div')(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  padding: '12px',
  boxSizing: 'border-box',
}));

const Header = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
}));

const HeaderMeta = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

const RefreshButton = styled('button')(() => ({
  padding: 6,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 150ms ease, transform 150ms ease',

  '&:hover:not(:disabled)': {
    backgroundColor: '#f9fafb',
  },

  '&:disabled': {
    opacity: 0.6,
    cursor: 'default',
  },
}));

const ToolbarRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
  margin: '0 0 10px',
}));

const SegmentedContainer = styled('div')(() => ({
  display: 'inline-flex',
  padding: 2,
  backgroundColor: '#f3f4f6',
  borderRadius: 8,
  gap: 0,
  minWidth: 0,
  flex: '0 1 auto',
  width: 'max-content',
  maxWidth: '100%',
}));

const SegmentedTab = styled('button')<{ active?: boolean }>(({ active }) => ({
  padding: '4px 7px',
  borderRadius: 6,
  border: 'none',
  fontSize: 11,
  fontWeight: active ? 600 : 400,
  color: active ? '#1f2937' : '#6b7280',
  backgroundColor: active ? '#ffffff' : 'transparent',
  boxShadow: active ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap',
  minWidth: 0,
  flex: '0 0 auto',
  letterSpacing: -0.1,

  '&:hover': {
    color: '#1f2937',
  },
}));

const SortButton = styled('button')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  fontSize: 11,
  color: '#6b7280',
  fontWeight: 500,
  transition: 'all 150ms ease',
  flexShrink: 0,

  '&:hover': {
    backgroundColor: '#f9fafb',
  },
}));

const ListScrollArea = styled('div')(() => ({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  paddingBottom: 4,
  paddingRight: 2,

  '&::-webkit-scrollbar': {
    width: 6,
  },

  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },

  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 3,
  },

  '&::-webkit-scrollbar-thumb:hover': {
    background: '#d1d5db',
  },
}));

const CardList = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}));

const TaskCardContainer = styled('div')<{
  statusBg: string;
  statusBorder: string;
}>(({ statusBg, statusBorder }) => ({
  padding: '12px 14px',
  borderRadius: 12,
  backgroundColor: statusBg,
  border: `1px solid ${statusBorder}`,
  transition: 'all 150ms ease',

  '&:hover': {
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  },
}));

const CardHeaderRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 10,
}));

const CardHeaderMeta = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
  flex: 1,
}));

const CardHeaderActions = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  flexWrap: 'nowrap',
}));

const StatusBadge = styled('span')<{
  statusColor: string;
  badgeBg: string;
  statusBorder: string;
}>(({ statusColor, badgeBg, statusBorder }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  color: statusColor,
  backgroundColor: badgeBg,
  border: `1px solid ${statusBorder}`,
  whiteSpace: 'nowrap',
}));

const StatusDot = styled('span')<{ color: string; pulse?: boolean }>(
  ({ color, pulse }) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
    animation: pulse ? `${pulseOpacity} 1.5s ease-in-out infinite` : 'none',
  })
);

const HeroMetric = styled('div')(() => ({
  textAlign: 'right',
  flexShrink: 0,
  minWidth: 72,
}));

const HeroLabelRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 4,
  marginBottom: 2,
}));

const HeroPulseDot = styled('span')(() => ({
  width: 5,
  height: 5,
  borderRadius: '50%',
  backgroundColor: '#3b82f6',
  flexShrink: 0,
  animation: `${pulseOpacity} 1.5s ease-in-out infinite`,
}));

const HeroLabel = styled('span')<{ color: string }>(({ color }) => ({
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color,
  whiteSpace: 'nowrap',
}));

const HeroValue = styled('div')<{ color: string }>(({ color }) => ({
  fontSize: 16,
  fontWeight: 700,
  color,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
}));

const CopyButton = styled('button')<{ copied?: boolean }>(({ copied }) => ({
  padding: 4,
  borderRadius: 6,
  border: `1px solid ${copied ? '#d1fae5' : 'transparent'}`,
  backgroundColor: copied ? '#ecfdf5' : 'transparent',
  color: copied ? '#10b981' : '#9ca3af',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,

  '&:hover': {
    backgroundColor: copied ? '#ecfdf5' : 'rgba(0, 0, 0, 0.04)',
  },
}));

const LogsButton = styled('button')(() => ({
  padding: 4,
  borderRadius: 6,
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: '#9ca3af',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,

  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },

  '&:disabled': {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
}));

const AIAnalysisButton = styled('button')(() => ({
  padding: 4,
  borderRadius: 6,
  border: '1px solid #c7d2fe',
  backgroundColor: '#eef2ff',
  color: '#4f46e5',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  flexShrink: 0,

  '&:hover:not(:disabled)': {
    backgroundColor: '#e0e7ff',
  },

  '&:disabled': {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
}));

const ModePill = styled('span')(() => ({
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 500,
  color: '#6b7280',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  whiteSpace: 'nowrap',
}));

const DataRow = styled('div')<{ mb?: number }>(({ mb = 5 }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  marginBottom: mb,
  minWidth: 0,
}));

const MonoPrimary = styled('span')(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const MonoSecondary = styled('span')(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 12,
  color: '#4b5563',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const WorkerText = styled('span')(() => ({
  fontSize: 11,
  color: '#9ca3af',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ErrorMessageBanner = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  padding: '7px 12px',
  marginTop: 10,
  borderRadius: 10,
  border: '1px solid #fecaca',
  backgroundColor: '#fef2f2',
}));

const ErrorMessageText = styled('span')(() => ({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.25,
  color: '#dc2626',
}));

const TimelineFooter = styled('div')(() => ({
  borderTop: '1px dashed #e5e7eb',
  paddingTop: 8,
  marginTop: 4,
}));

const TimelineRow = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minWidth: 0,
  fontSize: 10,
  color: '#9ca3af',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}));

const TimelineItem = styled('div')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  minWidth: 0,
  flexShrink: 0,
}));

const TimelineLabel = styled('span')(() => ({
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}));

const TimelineValue = styled('span')(() => ({
  color: '#374151',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
}));

const TimelineConnector = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flex: 1,
  minWidth: 10,
  margin: '0 8px',
  color: '#9ca3af',
}));

const TimelineConnectorLine = styled('span')(() => ({
  display: 'block',
  flex: 1,
  minWidth: 0,
  height: 1,
  backgroundColor: '#d1d5db',
}));

const TimelineArrow = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  flexShrink: 0,
}));

const TimelineIcon = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  flexShrink: 0,
}));

const TooltipContainer = styled('div')(() => ({
  position: 'fixed',
  width: 300,
  padding: 16,
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  zIndex: 1000,
  animation: `${fadeSlide} 150ms ease`,
  pointerEvents: 'none',
}));

const TooltipHeader = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 14,
}));

const TooltipFields = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}));

const TooltipFieldLabel = styled('div')(() => ({
  fontSize: 10,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  marginBottom: 2,
}));

const TooltipFieldValue = styled('span')(() => ({
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: 12,
  color: '#1f2937',
  wordBreak: 'break-all',
  lineHeight: 1.4,
}));

const CenterState = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '32px 0',
}));

const EmptyState = styled('div')(() => ({
  padding: '32px 0',
  textAlign: 'center',
}));

const IconBase = styled('svg')(() => ({
  width: 13,
  height: 13,
  display: 'block',
  flexShrink: 0,
  color: '#9ca3af',
}));

const ToolbarIcon = styled('svg')(() => ({
  display: 'block',
  flexShrink: 0,
  color: '#9ca3af',
}));

const FILTER_TABS: Array<{ label: string; value: FilterMode }> = [
  { label: 'all', value: 'ALL' },
  { label: 'full', value: 'full' },
  { label: 'metadata only', value: 'metadata_only' },
];

const formatStatusLabel = (status: TaskExecutionStatus | 'IDLE') =>
  status
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const isQueuedStatus = (status: TaskExecutionStatus) =>
  status === 'PENDING' || status === 'QUEUED' || status === 'ASSIGNED';

const isRunningStatus = (status: TaskExecutionStatus) =>
  status === 'RUNNING' || status === 'STARTED';

const isTerminalStatus = (status: TaskExecutionStatus | 'IDLE') =>
  status === 'SUCCESS' ||
  status === 'ERROR' ||
  status === 'CANCELLED' ||
  status === 'CANCEL_REQUESTED' ||
  status === 'IDLE';

const getStatusAppearance = (
  status: TaskExecutionStatus | 'IDLE'
): StatusAppearance => {
  switch (status) {
    case 'ERROR':
      return {
        label: 'Error',
        statusBg: '#fef2f2',
        statusBorder: '#fee2e2',
        statusColor: '#dc2626',
        badgeBg: '#fee2e2',
        pulseDot: false,
      };
    case 'CANCELLED':
    case 'CANCEL_REQUESTED':
    case 'IDLE':
      return {
        label: formatStatusLabel(status),
        statusBg: '#f3f4f6',
        statusBorder: '#e5e7eb',
        statusColor: '#6b7280',
        badgeBg: '#e5e7eb',
        pulseDot: false,
      };
    case 'SUCCESS':
      return {
        label: 'Success',
        statusBg: '#ecfdf5',
        statusBorder: '#d1fae5',
        statusColor: '#10b981',
        badgeBg: '#d1fae5',
        pulseDot: false,
      };
    case 'RUNNING':
    case 'STARTED':
      return {
        label: 'Running',
        statusBg: '#eff6ff',
        statusBorder: '#bfdbfe',
        statusColor: '#2563eb',
        badgeBg: '#dbeafe',
        pulseDot: true,
      };
    case 'ASSIGNED':
    case 'PENDING':
    case 'QUEUED':
    default:
      return {
        label: 'Queued',
        statusBg: '#f9fafb',
        statusBorder: '#e5e7eb',
        statusColor: '#6b7280',
        badgeBg: '#f3f4f6',
        pulseDot: true,
      };
  }
};

const shortenMiddle = (value: string, start = 6, end = 6) => {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
};

const parseTaskDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTooltipDate = (value: string) => {
  const date = parseTaskDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTaskMessage = (task: QueueTask) => {
  const value = task.message?.trim();
  return value && value.length > 0 ? value : null;
};

const getModeLabel = (mode: PipelineExecutionMode) =>
  mode === 'metadata_only' ? 'metadata only' : 'full';

interface HeroMetricConfig {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
  showPulse: boolean;
}

type TimelineItemKey = 'queued' | 'started' | 'finished';

interface TimelineEntry {
  key: TimelineItemKey;
  label: string;
  value: string;
}

const getHeroMetric = (task: QueueTask, nowMs: number): HeroMetricConfig => {
  if (isRunningStatus(task.status)) {
    return {
      label: 'выполняется',
      value: formatDuration(
        diffSec(task.started_at ?? null, new Date(nowMs).toISOString())
      ),
      labelColor: '#1d4ed8',
      valueColor: '#1d4ed8',
      showPulse: true,
    };
  }

  if (isQueuedStatus(task.status)) {
    return {
      label: 'в очереди',
      value: formatDuration(
        diffSec(task.queued_at, new Date(nowMs).toISOString())
      ),
      labelColor: '#9ca3af',
      valueColor: '#6b7280',
      showPulse: false,
    };
  }

  return {
    label: 'длительность',
    value: formatDuration(diffSec(task.started_at ?? null, task.finished_at)),
    labelColor: '#9ca3af',
    valueColor: task.status === 'ERROR' ? '#dc2626' : '#374151',
    showPulse: false,
  };
};

const getCompactTimelineThreshold = (itemCount: number) => {
  if (itemCount >= 3) {
    return 308;
  }

  if (itemCount === 2) {
    return 248;
  }

  return 0;
};

const TaskIcon = () => (
  <IconBase viewBox='0 0 14 14' fill='none' aria-hidden='true'>
    <rect
      x='1.5'
      y='1.5'
      width='11'
      height='11'
      rx='2.5'
      stroke='currentColor'
      strokeWidth='1.2'
    />
    <path
      d='M4.5 7h5'
      stroke='currentColor'
      strokeWidth='1.2'
      strokeLinecap='round'
    />
    <path
      d='M4.5 4.5h5'
      stroke='currentColor'
      strokeWidth='1.2'
      strokeLinecap='round'
    />
    <path
      d='M4.5 9.5h3'
      stroke='currentColor'
      strokeWidth='1.2'
      strokeLinecap='round'
    />
  </IconBase>
);

const FolderIcon = () => (
  <IconBase viewBox='0 0 14 14' fill='none' aria-hidden='true'>
    <path
      d='M1.5 4.5A1.5 1.5 0 013 3h3l1.2 1.5H11A1.5 1.5 0 0112.5 6v4.5a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 10.5V4.5z'
      stroke='currentColor'
      strokeWidth='1.2'
    />
  </IconBase>
);

const WorkerIcon = () => (
  <IconBase viewBox='0 0 14 14' fill='none' aria-hidden='true'>
    <rect
      x='1.5'
      y='4'
      width='11'
      height='7'
      rx='1.5'
      stroke='currentColor'
      strokeWidth='1.2'
    />
    <circle cx='5' cy='7.5' r='1' fill='currentColor' />
    <circle cx='9' cy='7.5' r='1' fill='currentColor' />
    <path
      d='M5 3h4'
      stroke='currentColor'
      strokeWidth='1.2'
      strokeLinecap='round'
    />
  </IconBase>
);

const CopyIcon = () => (
  <ToolbarIcon
    width='13'
    height='13'
    viewBox='0 0 14 14'
    fill='none'
    aria-hidden='true'
  >
    <rect
      x='4'
      y='4'
      width='8'
      height='8'
      rx='1.5'
      stroke='currentColor'
      strokeWidth='1.3'
    />
    <path
      d='M10 4V2.5A1.5 1.5 0 008.5 1H2.5A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4'
      stroke='currentColor'
      strokeWidth='1.3'
    />
  </ToolbarIcon>
);

const CopySuccessIcon = () => (
  <ToolbarIcon
    width='13'
    height='13'
    viewBox='0 0 14 14'
    fill='none'
    aria-hidden='true'
  >
    <path
      d='M3 7.5L6 10.5L11 4'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </ToolbarIcon>
);

const RefreshSvgIcon = () => (
  <ToolbarIcon
    width='15'
    height='15'
    viewBox='0 0 16 16'
    fill='none'
    aria-hidden='true'
  >
    <path
      d='M2 8a6 6 0 0110.89-3.48'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <path
      d='M14 8a6 6 0 01-10.89 3.48'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <path
      d='M14 2v4h-4'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M2 14v-4h4'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </ToolbarIcon>
);

const SortArrowIcon = ({ sortDirection }: { sortDirection: SortDirection }) => (
  <ToolbarIcon
    width='14'
    height='14'
    viewBox='0 0 14 14'
    fill='none'
    aria-hidden='true'
    style={{
      transform: sortDirection === 'asc' ? 'scaleY(-1)' : 'none',
      transition: 'transform 200ms ease',
    }}
  >
    <path
      d='M7 2v10M7 12l3-3M7 12l-3-3'
      stroke='currentColor'
      strokeWidth='1.3'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </ToolbarIcon>
);

const ArrowRightIcon = () => (
  <ToolbarIcon
    width='9'
    height='9'
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
  >
    <line
      x1='5'
      y1='12'
      x2='19'
      y2='12'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
    />
    <polyline
      points='12 5 19 12 12 19'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </ToolbarIcon>
);

const QueuedTimelineIcon = () => (
  <ToolbarIcon
    width='10'
    height='10'
    viewBox='0 0 14 14'
    fill='none'
    aria-hidden='true'
  >
    <circle cx='7' cy='7' r='4.5' stroke='currentColor' strokeWidth='1.2' />
    <path
      d='M7 4.5v2.8l1.9 1.1'
      stroke='currentColor'
      strokeWidth='1.2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </ToolbarIcon>
);

const StartedTimelineIcon = () => (
  <ToolbarIcon
    width='10'
    height='10'
    viewBox='0 0 14 14'
    fill='none'
    aria-hidden='true'
  >
    <path
      d='M5 4.2l4.8 2.8L5 9.8V4.2z'
      fill='currentColor'
      stroke='currentColor'
      strokeWidth='0.8'
      strokeLinejoin='round'
    />
  </ToolbarIcon>
);

const FinishedTimelineIcon = () => (
  <ToolbarIcon
    width='10'
    height='10'
    viewBox='0 0 14 14'
    fill='none'
    aria-hidden='true'
  >
    <path
      d='M3.2 7.1l2.1 2.2 5-5.1'
      stroke='currentColor'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </ToolbarIcon>
);

const renderTimelineIcon = (key: TimelineItemKey) => {
  switch (key) {
    case 'started':
      return <StartedTimelineIcon />;
    case 'finished':
      return <FinishedTimelineIcon />;
    case 'queued':
    default:
      return <QueuedTimelineIcon />;
  }
};

interface TaskHoverTooltipProps {
  task: QueueTask;
  rect: DOMRect;
  appearance: StatusAppearance;
}

const TaskHoverTooltip: React.FC<TaskHoverTooltipProps> = ({
  task,
  rect,
  appearance,
}) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const top = Math.max(12, Math.min(rect.top, window.innerHeight - 280));
  const left = Math.max(12, Math.min(rect.right + 12, window.innerWidth - 316));

  return createPortal(
    <TooltipContainer style={{ top, left }}>
      <TooltipHeader>
        <StatusBadge
          statusColor={appearance.statusColor}
          badgeBg={appearance.badgeBg}
          statusBorder={appearance.statusBorder}
        >
          <StatusDot
            color={appearance.statusColor}
            pulse={appearance.pulseDot}
          />
          {appearance.label}
        </StatusBadge>
        <Typography
          component='span'
          sx={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 11,
            color: '#9ca3af',
            flexShrink: 0,
          }}
        >
          {formatTooltipDate(task.queued_at)}
        </Typography>
      </TooltipHeader>

      <TooltipFields>
        <div>
          <TooltipFieldLabel>Task ID</TooltipFieldLabel>
          <TooltipFieldValue>{task.task_id}</TooltipFieldValue>
        </div>

        <div>
          <TooltipFieldLabel>Project ID</TooltipFieldLabel>
          <TooltipFieldValue>{task.project_id}</TooltipFieldValue>
        </div>

        <div>
          <TooltipFieldLabel>Worker</TooltipFieldLabel>
          <TooltipFieldValue>
            {task.assigned_worker_id || 'Worker is not assigned'}
          </TooltipFieldValue>
        </div>

        {getTaskMessage(task) ? (
          <div>
            <TooltipFieldLabel>Сообщение</TooltipFieldLabel>
            <TooltipFieldValue>{getTaskMessage(task)}</TooltipFieldValue>
          </div>
        ) : null}

        {task.termination_reason?.trim() ? (
          <div>
            <TooltipFieldLabel>Termination Reason</TooltipFieldLabel>
            <TooltipFieldValue>{task.termination_reason}</TooltipFieldValue>
          </div>
        ) : null}

        <div>
          <TooltipFieldLabel>Режим</TooltipFieldLabel>
          <TooltipFieldValue>{getModeLabel(task.mode)}</TooltipFieldValue>
        </div>
      </TooltipFields>
    </TooltipContainer>,
    document.body
  );
};

interface TaskLogsDialogProps {
  open: boolean;
  projectId: string | null | undefined;
  task: QueueTask | null;
  onClose: () => void;
}

const TaskLogsDialog: React.FC<TaskLogsDialogProps> = ({
  open,
  projectId,
  task,
  onClose,
}) => {
  const {
    error,
    hasMore,
    items,
    loadMoreStatus,
    openTaskLogs,
    resetTaskLogs,
    status,
    total,
    loadMoreTaskLogs,
  } = useTaskLogs();

  const resolvedProjectId = projectId ?? task?.project_id ?? null;

  useEffect(() => {
    if (!open || !task || !resolvedProjectId) {
      return;
    }

    let isActive = true;

    const loadLogs = async () => {
      try {
        await openTaskLogs({
          projectId: resolvedProjectId,
          taskId: task.task_id,
        });
      } catch {
        if (!isActive) {
          return;
        }
      }
    };

    void loadLogs();

    return () => {
      isActive = false;
    };
  }, [open, openTaskLogs, resolvedProjectId, task]);

  useEffect(() => {
    if (!open) {
      resetTaskLogs();
    }
  }, [open, resetTaskLogs]);

  const handleClose = useCallback(() => {
    resetTaskLogs();
    onClose();
  }, [onClose, resetTaskLogs]);

  const handleLoadMore = useCallback(async () => {
    try {
      await loadMoreTaskLogs();
    } catch {
      // Keep the current page rendered; error state is stored in Redux.
    }
  }, [loadMoreTaskLogs]);

  if (!task) {
    return null;
  }

  const hasInitialError =
    status === 'failed' && items.length === 0 && error != null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='lg'
      slotProps={{
        paper: {
          sx: {
            height: 'min(84vh, 960px)',
          },
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          minHeight: 0,
          height: 'min(78vh, 860px)',
          display: 'flex',
        }}
      >
        <LogViewer
          logs={items}
          title='Логи задачи'
          subtitle={`${shortenMiddle(task.task_id)} • ${shortenMiddle(
            resolvedProjectId ?? task.project_id
          )}`}
          totalCount={total || items.length}
          isLoading={status === 'loading'}
          isLoadingMore={loadMoreStatus === 'loading'}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onClose={handleClose}
          downloadFileNamePrefix={`task-${task.task_id}-logs`}
          emptyTitle={
            hasInitialError ? 'Не удалось загрузить логи' : 'Логи не найдены'
          }
          emptySubtitle={
            hasInitialError
              ? error.message
              : 'Попробуйте изменить фильтры или откройте задачу позже'
          }
        />
      </DialogContent>
    </Dialog>
  );
};

const QueueTaskCard: React.FC<{
  task: QueueTask;
  snapshotMs: number;
  onOpenLogs?: (task: QueueTask) => void;
  showAIAnalysisButton?: boolean;
  onStartAIAnalysis?: (task: QueueTask) => void;
}> = ({
  task,
  snapshotMs,
  onOpenLogs,
  showAIAnalysisButton,
  onStartAIAnalysis,
}) => {
  const appearance = getStatusAppearance(task.status);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const heroMetric = useMemo(
    () => getHeroMetric(task, snapshotMs),
    [snapshotMs, task]
  );
  const errorMessage = useMemo(
    () => (task.status === 'ERROR' ? getTaskMessage(task) : null),
    [task]
  );
  const timelineItems = useMemo<TimelineEntry[]>(() => {
    const items: TimelineEntry[] = [
      {
        key: 'queued',
        label: 'Queued',
        value: formatTime(task.queued_at),
      },
    ];

    if (task.started_at) {
      items.push({
        key: 'started',
        label: 'Started',
        value: formatTime(task.started_at),
      });
    }

    if (isTerminalStatus(task.status) && task.finished_at) {
      items.push({
        key: 'finished',
        label: 'Finished',
        value: formatTime(task.finished_at),
      });
    }

    return items;
  }, [task]);
  const isCompactTimeline = useMemo(
    () =>
      cardWidth > 0 &&
      cardWidth < getCompactTimelineThreshold(timelineItems.length),
    [cardWidth, timelineItems.length]
  );

  const updateRect = useCallback(() => {
    if (!cardRef.current) {
      return;
    }

    setRect(cardRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!isHovered) {
      return undefined;
    }

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isHovered, updateRect]);

  useEffect(() => {
    if (!cardRef.current) {
      return undefined;
    }

    const element = cardRef.current;
    const syncWidth = () => {
      setCardWidth(element.clientWidth);
    };

    syncWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncWidth);

      return () => {
        window.removeEventListener('resize', syncWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      syncWidth();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleCopy = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation();
    await navigator.clipboard.writeText(JSON.stringify(task, null, 2));
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1200);
  };

  const handleStartAIAnalysis = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation();
    onStartAIAnalysis?.(task);
  };

  const handleOpenLogs = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation();
    onOpenLogs?.(task);
  };

  return (
    <>
      <TaskCardContainer
        ref={cardRef}
        data-testid='widgets/project-editor/sidebar/task-run-row'
        data-task-id={task.task_id}
        data-task-mode={task.mode}
        data-task-status={task.status}
        {...(task.mode === 'full'
          ? {
              'data-task-row-kind':
                'widgets/project-editor/sidebar/task-run-row-full',
            }
          : {})}
        statusBg={appearance.statusBg}
        statusBorder={appearance.statusBorder}
        onMouseEnter={() => {
          updateRect();
          setIsHovered(true);
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeaderRow>
          <CardHeaderMeta>
            <CardHeaderActions>
              <StatusBadge
                data-testid='widgets/project-editor/sidebar/task-run-status'
                data-task-id={task.task_id}
                data-task-status={task.status}
                statusColor={appearance.statusColor}
                badgeBg={appearance.badgeBg}
                statusBorder={appearance.statusBorder}
              >
                <StatusDot
                  color={appearance.statusColor}
                  pulse={appearance.pulseDot}
                />
                {appearance.label}
              </StatusBadge>

              <CopyButton
                type='button'
                copied={isCopied}
                onClick={handleCopy}
                title={isCopied ? 'Скопировано' : 'Скопировать JSON задачи'}
                aria-label={
                  isCopied ? 'Скопировано' : 'Скопировать JSON задачи'
                }
              >
                {isCopied ? <CopySuccessIcon /> : <CopyIcon />}
              </CopyButton>

              <LogsButton
                type='button'
                onClick={handleOpenLogs}
                title='Просмотреть логи задачи'
                aria-label='Просмотреть логи задачи'
              >
                <SubjectIcon sx={{ fontSize: 16 }} />
              </LogsButton>

              {showAIAnalysisButton ? (
                <AIAnalysisButton
                  type='button'
                  onClick={handleStartAIAnalysis}
                  title='Запустить AI-анализ ошибки'
                  aria-label='Запустить AI-анализ ошибки'
                >
                  <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                </AIAnalysisButton>
              ) : null}
            </CardHeaderActions>

            <div>
              <ModePill
                data-testid='widgets/project-editor/sidebar/task-run-mode'
                data-task-id={task.task_id}
                data-task-mode={task.mode}
              >
                {getModeLabel(task.mode)}
              </ModePill>
            </div>
          </CardHeaderMeta>

          <HeroMetric>
            <HeroLabelRow>
              {heroMetric.showPulse ? <HeroPulseDot /> : null}
              <HeroLabel color={heroMetric.labelColor}>
                {heroMetric.label}
              </HeroLabel>
            </HeroLabelRow>
            <HeroValue color={heroMetric.valueColor}>
              {heroMetric.value}
            </HeroValue>
          </HeroMetric>
        </CardHeaderRow>

        <DataRow>
          <TaskIcon />
          <MonoPrimary>{shortenMiddle(task.task_id)}</MonoPrimary>
        </DataRow>

        <DataRow>
          <FolderIcon />
          <MonoSecondary>{shortenMiddle(task.project_id)}</MonoSecondary>
        </DataRow>

        <DataRow mb={0}>
          <WorkerIcon />
          <WorkerText>
            {task.assigned_worker_id || 'Worker is not assigned'}
          </WorkerText>
        </DataRow>

        {errorMessage ? (
          <ErrorMessageBanner>
            <ErrorMessageText>{errorMessage}</ErrorMessageText>
          </ErrorMessageBanner>
        ) : null}

        <TimelineFooter>
          <TimelineRow>
            {timelineItems.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 ? (
                  <TimelineConnector>
                    <TimelineConnectorLine />
                    <TimelineArrow>
                      <ArrowRightIcon />
                    </TimelineArrow>
                  </TimelineConnector>
                ) : null}
                <TimelineItem>
                  {isCompactTimeline ? (
                    <TimelineIcon>{renderTimelineIcon(item.key)}</TimelineIcon>
                  ) : (
                    <TimelineLabel>{item.label}</TimelineLabel>
                  )}
                  <TimelineValue>{item.value}</TimelineValue>
                </TimelineItem>
              </React.Fragment>
            ))}
          </TimelineRow>
        </TimelineFooter>
      </TaskCardContainer>

      {isHovered && rect ? (
        <TaskHoverTooltip task={task} rect={rect} appearance={appearance} />
      ) : null}
    </>
  );
};

export const QueueTaskList: React.FC<QueueTaskListProps> = ({
  projectId,
  searchTerm = '',
}) => {
  const dispatch = useAppDispatch();
  const { showNotification } = useAlert();
  const { pending, loadQueue, isLoading } = useQueue();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('full');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [snapshotMs, setSnapshotMs] = useState(() => Date.now());
  const [logsTask, setLogsTask] = useState<QueueTask | null>(null);
  const hasActiveAIAnalysis = useAppSelector(state =>
    selectHasActiveAIAnalysis(state, projectId ?? undefined)
  );
  const isAIAnalysisEnabled = useAppSelector(selectIsAIAnalysisEnabled);

  const handleLoad = useCallback(async () => {
    await loadQueue(projectId ?? null, [
      'PENDING',
      'STARTED',
      'RUNNING',
      'SUCCESS',
      'ERROR',
      'CANCELLED',
      'ASSIGNED',
      'QUEUED',
      'CANCEL_REQUESTED',
    ]);
    setSnapshotMs(Date.now());
  }, [loadQueue, projectId]);

  useEffect(() => {
    handleLoad();
  }, [handleLoad]);

  const onRefreshClick = async () => {
    setIsRefreshing(true);

    try {
      await handleLoad();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const processedTasks = useMemo(() => {
    if (!pending) {
      return [];
    }

    const filtered = pending.filter(task => {
      const matchesSearch = task.project_id
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesMode = filterMode === 'ALL' || task.mode === filterMode;

      return matchesSearch && matchesMode;
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.queued_at).getTime();
      const timeB = new Date(b.queued_at).getTime();

      if (Number.isNaN(timeA)) {
        return 1;
      }

      if (Number.isNaN(timeB)) {
        return -1;
      }

      if (sortDirection === 'desc') {
        return timeB - timeA;
      }

      return timeA - timeB;
    });
  }, [pending, searchTerm, filterMode, sortDirection]);

  const latestErrorTaskId = useMemo(() => {
    const errorTasks = pending.filter(task => task.status === 'ERROR');

    return (
      errorTasks.sort((left, right) => {
        const leftTime = new Date(
          left.finished_at ?? left.started_at ?? left.queued_at
        ).getTime();
        const rightTime = new Date(
          right.finished_at ?? right.started_at ?? right.queued_at
        ).getTime();

        return rightTime - leftTime;
      })[0]?.task_id ?? null
    );
  }, [pending]);

  const handleStartAIAnalysis = async (task: QueueTask) => {
    if (!projectId) {
      return;
    }

    try {
      await dispatch(
        startAIAnalysis({
          projectId,
          task_id: task.task_id,
        })
      ).unwrap();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'AI-анализ не запущен',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось запустить анализ ошибки',
      });
    }
  };

  const handleOpenTaskLogs = useCallback((task: QueueTask) => {
    setLogsTask(task);
  }, []);

  const handleCloseTaskLogs = useCallback(() => {
    setLogsTask(null);
  }, []);

  const toggleSort = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <Root>
      <Header>
        <HeaderMeta>
          <Typography
            component='h3'
            sx={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.25,
              color: '#111827',
            }}
          >
            Очередь задач
          </Typography>
        </HeaderMeta>

        <RefreshButton
          type='button'
          onClick={onRefreshClick}
          disabled={isLoading || isRefreshing}
          title='Обновить список'
          aria-label='Обновить список'
        >
          <Box
            sx={{
              display: 'inline-flex',
              transform:
                isRefreshing || isLoading ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 500ms ease',
            }}
          >
            <RefreshSvgIcon />
          </Box>
        </RefreshButton>
      </Header>

      <ToolbarRow>
        <SegmentedContainer>
          {FILTER_TABS.map(tab => (
            <SegmentedTab
              key={tab.value}
              type='button'
              active={filterMode === tab.value}
              onClick={() => setFilterMode(tab.value)}
            >
              {tab.label}
            </SegmentedTab>
          ))}
        </SegmentedContainer>

        <SortButton
          type='button'
          onClick={toggleSort}
          title={
            sortDirection === 'desc'
              ? 'Сейчас сначала новые'
              : 'Сейчас сначала старые'
          }
          aria-label={
            sortDirection === 'desc'
              ? 'Сейчас сначала новые'
              : 'Сейчас сначала старые'
          }
        >
          <SortArrowIcon sortDirection={sortDirection} />
          {sortDirection === 'desc' ? 'Новые' : 'Старые'}
        </SortButton>
      </ToolbarRow>

      <ListScrollArea>
        {isLoading && !pending && !isRefreshing ? (
          <CenterState>
            <CircularProgress size={24} />
            <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
              Loading...
            </Typography>
          </CenterState>
        ) : processedTasks.length > 0 ? (
          <CardList data-testid='widgets/project-editor/sidebar/task-run-list'>
            {processedTasks.map(task => (
              <QueueTaskCard
                key={task.task_id}
                task={task}
                snapshotMs={snapshotMs}
                onOpenLogs={handleOpenTaskLogs}
                showAIAnalysisButton={
                  isAIAnalysisEnabled &&
                  task.task_id === latestErrorTaskId &&
                  !hasActiveAIAnalysis
                }
                onStartAIAnalysis={handleStartAIAnalysis}
              />
            ))}
          </CardList>
        ) : (
          <EmptyState>
            <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
              {searchTerm
                ? 'По вашему запросу ничего не найдено'
                : 'Нет задач в очереди'}
            </Typography>
          </EmptyState>
        )}
      </ListScrollArea>
      <TaskLogsDialog
        open={logsTask != null}
        projectId={projectId}
        task={logsTask}
        onClose={handleCloseTaskLogs}
      />
    </Root>
  );
};
