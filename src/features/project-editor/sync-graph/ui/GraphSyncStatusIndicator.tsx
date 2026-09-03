import { Box, CircularProgress, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useAppSelector } from '@/app/providers/store';

import {
  type GraphSyncStatus,
  selectGraphSyncStatus,
} from '../model/selectors';

const STATUS_LABELS: Record<GraphSyncStatus, string> = {
  synced: 'Синхронизировано',
  pending: 'Есть несохранённые изменения',
  syncing: 'Синхронизация...',
  error: 'Ошибка синхронизации',
};

export const GraphSyncStatusIndicator = () => {
  const theme = useTheme();
  const status = useAppSelector(selectGraphSyncStatus);

  const statusColor =
    status === 'synced'
      ? '#22c55e'
      : status === 'pending'
        ? '#f59e0b'
        : status === 'error'
          ? '#ef4444'
          : '#0ea5e9';

  return (
    <Tooltip title={STATUS_LABELS[status]} placement='left'>
      <Box
        aria-label={STATUS_LABELS[status]}
        role='status'
        sx={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: theme.zIndex.appBar + 2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          borderRadius: '999px',
          pointerEvents: 'auto',
        }}
      >
        {status === 'syncing' ? (
          <CircularProgress
            size={14}
            thickness={5}
            sx={{ color: statusColor }}
          />
        ) : (
          <Box
            aria-hidden='true'
            sx={{
              width: 10,
              height: 10,
              borderRadius: '999px',
              backgroundColor: statusColor,
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};
