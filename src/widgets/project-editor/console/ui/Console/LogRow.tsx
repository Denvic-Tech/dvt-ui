import React, { memo, useMemo } from 'react';
import { Box, ListItem, ListItemText, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import type { LogEntrySchema } from '@/shared/gatewayClient';

import { levelColor } from '../../model/levelColor';

interface LogRowProps {
  log: LogEntrySchema;
  theme: Theme;
}

const LogRowComponent: React.FC<LogRowProps> = ({ log, theme }) => {
  const formattedTimestamp = useMemo(
    () => new Date(log.created_at).toLocaleString(),
    [log.created_at]
  );

  const levelPaletteColor = useMemo(
    () => levelColor(log.level as string, theme),
    [log.level, theme]
  );

  return (
    <ListItem divider>
      <ListItemText
        primary={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant='caption'
                sx={{ color: 'text.secondary', minWidth: 140 }}
              >
                {formattedTimestamp}
              </Typography>

              <Typography
                variant='caption'
                sx={{
                  color: levelPaletteColor,
                  fontWeight: 700,
                  minWidth: 60,
                  textTransform: 'uppercase',
                }}
              >
                {log.level}
              </Typography>

              <Typography
                variant='caption'
                sx={{ color: 'info.light', minWidth: 80 }}
              >
                {log.service_name}
              </Typography>

              <Typography variant='caption' sx={{ color: 'success.light' }}>
                {log.logger_name}
              </Typography>

              <Typography variant='caption' sx={{ color: 'warning.light' }}>
                {log.module}.{log.function}:{log.line}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant='body2'
                sx={{
                  color: 'text.primary',
                  wordBreak: 'break-word',
                  flex: 1,
                }}
              >
                {log.message}
              </Typography>
            </Box>

            {log.exception_traceback && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    color: 'text.primary',
                    wordBreak: 'break-word',
                    flex: 1,
                  }}
                >
                  {log.exception_traceback}
                </Typography>
              </Box>
            )}
          </Box>
        }
      />
    </ListItem>
  );
};

export const LogRow = memo(
  LogRowComponent,
  (prev, next) => prev.log === next.log && prev.theme === next.theme
);

LogRow.displayName = 'LogRow';
