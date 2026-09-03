import React, { memo, useMemo, useState } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ApiIcon from '@mui/icons-material/Api';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorIcon from '@mui/icons-material/Error';
import FolderIcon from '@mui/icons-material/Folder';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WebIcon from '@mui/icons-material/Web';
import {
  alpha,
  Box,
  Chip,
  Divider,
  IconButton,
  keyframes,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import type {
  QueueTask,
  TaskExecutionStatus,
  TaskSource,
} from '@/shared/gatewayClient';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export interface QueueTaskItemProps {
  task: QueueTask;
  isSelected?: boolean;
  onClick?: (task: QueueTask) => void;
}

const getStatusConfig = (status: TaskExecutionStatus) => {
  switch (status) {
    case 'SUCCESS':
      return { icon: CheckCircleIcon, color: '#2e7d32', spin: false };
    case 'ERROR':
      return { icon: ErrorIcon, color: '#d32f2f', spin: false };
    case 'RUNNING':
      return { icon: AutorenewIcon, color: '#1976d2', spin: true };
    case 'STARTED':
      return { icon: PlayCircleFilledWhiteIcon, color: '#0288d1', spin: false };
    case 'PENDING':
      return { icon: HourglassTopIcon, color: '#ed6c02', spin: false };
    case 'CANCELLED':
      return { icon: CancelIcon, color: '#9e9e9e', spin: false };
    default:
      return { icon: HourglassEmptyIcon, color: '#757575', spin: false };
  }
};

const getSourceConfig = (source?: TaskSource) => {
  switch (source) {
    case 'API':
      return { icon: ApiIcon, label: 'API', color: '#7b1fa2' };
    case 'UI':
      return { icon: WebIcon, label: 'UI', color: '#0288d1' };
    case 'SCHEDULER':
      return { icon: ScheduleIcon, label: 'Scheduler', color: '#388e3c' };
    default:
      return { icon: WebIcon, label: 'Unknown', color: '#757575' };
  }
};

const TaskTooltipContent: React.FC<{ task: QueueTask; fullDate: string }> = ({
  task,
  fullDate,
}) => (
  <Stack spacing={1.5} sx={{ p: 0.5, maxWidth: 320 }}>
    <Box>
      <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Task ID (Full):
      </Typography>
      <Typography
        variant='body2'
        sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
      >
        {task.task_id}
      </Typography>
    </Box>
    <Box>
      <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Project ID:
      </Typography>
      <Typography
        variant='body2'
        sx={{
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          lineHeight: 1.2,
        }}
      >
        {task.project_id}
      </Typography>
    </Box>
    <Stack direction='row' spacing={1} alignItems='center'>
      <Chip
        label={task.status}
        size='small'
        sx={{
          bgcolor: 'rgba(255,255,255,0.15)',
          color: '#fff',
          fontWeight: 'bold',
        }}
      />
      {task.force_exec && <Chip label='FORCE' size='small' color='error' />}
    </Stack>
    <Box>
      <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Source:
      </Typography>
      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
        {task.source || 'N/A'}
      </Typography>
    </Box>
    <Box>
      <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Дата: {fullDate}
      </Typography>
    </Box>
  </Stack>
);

export const QueueTaskItem: React.FC<QueueTaskItemProps> = memo(
  ({ task, isSelected, onClick }) => {
    const theme = useTheme();
    const [copyTooltip, setCopyTooltip] = useState('Copy JSON');

    const { queuedAt, fullDate } = useMemo(() => {
      const date = new Date(task.queued_at);
      if (Number.isNaN(date.getTime()))
        return { queuedAt: task.queued_at, fullDate: task.queued_at };
      return {
        queuedAt: date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        fullDate: date.toLocaleString(),
      };
    }, [task.queued_at]);

    const shortTaskId = useMemo(() => {
      const len = task.task_id.length;
      if (len <= 10) return task.task_id;
      return `${task.task_id.slice(0, 5)}...${task.task_id.slice(-5)}`;
    }, [task.task_id]);

    const statusConfig = getStatusConfig(task.status);
    const StatusIcon = statusConfig.icon;

    const sourceConfig = getSourceConfig(task.source);
    const SourceIcon = sourceConfig.icon;

    const handleCopyJson = (e: React.MouseEvent) => {
      e.stopPropagation();
      const json = JSON.stringify(task, null, 2);
      navigator.clipboard.writeText(json);
      setCopyTooltip('Copied!');
      setTimeout(() => setCopyTooltip('Copy JSON'), 2000);
    };

    const handleRowClick = () => {
      if (onClick) onClick(task);
    };

    return (
      <Tooltip
        title={<TaskTooltipContent task={task} fullDate={fullDate} />}
        placement='right'
        arrow
        enterDelay={700}
      >
        <Box
          onClick={handleRowClick}
          sx={{
            position: 'relative',
            cursor: onClick ? 'pointer' : 'default',
            pl: 2,
            pr: 1.5,
            py: 1.5,
            mb: 1,
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: isSelected
              ? alpha(theme.palette.primary.main, 0.08)
              : 'background.paper',
            border: '1px solid',
            borderColor: isSelected
              ? theme.palette.primary.main
              : theme.palette.divider,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: isSelected
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.action.hover, 0.04),
              borderColor: isSelected
                ? theme.palette.primary.main
                : theme.palette.action.active,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 5,
              bgcolor: statusConfig.color,
            }}
          />

          <Stack spacing={0.5}>
            <Stack
              direction='row'
              justifyContent='space-between'
              alignItems='center'
            >
              <Stack direction='row' alignItems='center' spacing={0.5}>
                <Chip
                  icon={
                    <StatusIcon
                      style={{
                        fontSize: 16,
                        color: statusConfig.color,
                        animation: statusConfig.spin
                          ? `${spin} 2s linear infinite`
                          : 'none',
                      }}
                    />
                  }
                  label={task.status}
                  size='small'
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: alpha(statusConfig.color, 0.1),
                    color: statusConfig.color,
                    borderColor: alpha(statusConfig.color, 0.3),
                    borderWidth: 1,
                    borderStyle: 'solid',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
                <Tooltip title={copyTooltip} placement='top'>
                  <IconButton
                    size='small'
                    onClick={handleCopyJson}
                    sx={{
                      p: 0.5,
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Chip
                label={task.mode}
                size='small'
                variant='outlined'
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  color: 'text.secondary',
                  borderColor: 'divider',
                  maxWidth: 100,
                }}
              />
            </Stack>

            <Typography
              variant='subtitle2'
              noWrap
              sx={{
                fontWeight: 700,
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                color: 'text.primary',
                pt: 0.5,
              }}
            >
              {shortTaskId}
            </Typography>

            <Stack
              direction='row'
              alignItems='center'
              spacing={0.8}
              sx={{ minWidth: 0 }}
            >
              <FolderIcon
                sx={{ fontSize: 16, color: 'action.active', flexShrink: 0 }}
              />
              <Typography
                variant='body2'
                color='text.secondary'
                noWrap
                sx={{ fontSize: '0.8rem', fontWeight: 500 }}
              >
                {task.project_id}
              </Typography>
            </Stack>

            <Divider sx={{ my: 0.5, borderStyle: 'dashed', opacity: 0.5 }} />

            <Stack
              direction='row'
              justifyContent='space-between'
              alignItems='center'
              spacing={2}
            >
              <Stack
                direction='row'
                alignItems='center'
                spacing={0.5}
                sx={{ minWidth: 0, flex: 1 }}
              >
                <AccountCircleIcon
                  sx={{
                    fontSize: 16,
                    color: task.assigned_worker_id
                      ? 'success.main'
                      : 'text.disabled',
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant='caption'
                  color={
                    task.assigned_worker_id ? 'text.primary' : 'text.disabled'
                  }
                  noWrap
                >
                  {task.assigned_worker_id || 'Воркер не определён'}
                </Typography>
              </Stack>

              <Stack
                direction='row'
                alignItems='center'
                spacing={1}
                sx={{ flexShrink: 0 }}
              >
                {task.source && (
                  <Tooltip
                    title={`Source: ${sourceConfig.label}`}
                    placement='top'
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: alpha(sourceConfig.color, 0.1),
                        color: sourceConfig.color,
                      }}
                    >
                      <SourceIcon sx={{ fontSize: 14 }} />
                    </Box>
                  </Tooltip>
                )}
                <Stack direction='row' alignItems='center' spacing={0.5}>
                  <AccessTimeIcon
                    sx={{ fontSize: 14, color: 'text.secondary' }}
                  />
                  <Typography variant='caption' color='text.secondary'>
                    {queuedAt}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Tooltip>
    );
  }
);
QueueTaskItem.displayName = 'QueueTaskItem';
