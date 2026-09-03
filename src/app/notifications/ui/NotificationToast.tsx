import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { AlertGroup } from '@/app/notifications/model/types.ts';

import { getControlRadiusValue } from '@/shared/ui/primitives/components/theme-style-helpers.ts';

import {
  getNotificationColor,
  getNotificationIcon,
} from './notificationIcons.tsx';

const TOAST_WIDTH = 360;

const slideInRight = {
  '@keyframes slideInRight': {
    from: {
      opacity: 0,
      transform: 'translateX(80px) scale(0.95)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) scale(1)',
    },
  },
};

const fadeOutCollapse = {
  '@keyframes fadeOutCollapse': {
    from: {
      opacity: 1,
      transform: 'translateX(0) scale(1)',
      maxHeight: '200px',
      marginBottom: '8px',
    },
    to: {
      opacity: 0,
      transform: 'translateX(40px) scale(0.95)',
      maxHeight: '0px',
      marginBottom: '0px',
    },
  },
};

type NotificationToastProps = {
  group: AlertGroup;
  onDismiss: (groupKey: string) => void;
  onMouseEnter: (groupKey: string) => void;
  onMouseLeave: (groupKey: string) => void;
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  group,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const iconInfo = getNotificationIcon(group.type);
  const accentColor = getNotificationColor(theme, group.type);
  const hasActions = Boolean(group.lastActions?.length);

  return (
    <Box
      onMouseEnter={() => onMouseEnter(group.key)}
      onMouseLeave={() => onMouseLeave(group.key)}
      sx={{
        ...slideInRight,
        ...fadeOutCollapse,
        width: TOAST_WIDTH,
        borderRadius: `${getControlRadiusValue('sm')}px`,
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        backgroundColor: alpha(
          theme.palette.background.paper,
          isDark ? 0.78 : 0.88
        ),
        boxShadow: `0 12px 32px ${alpha('#0f172a', isDark ? 0.32 : 0.12)}`,
        border: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.5,
        pointerEvents: 'auto',
        cursor: 'default',
        overflow: 'hidden',
        animation: group.exiting
          ? 'fadeOutCollapse 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
          : 'slideInRight 400ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Box
        sx={{
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          mt: 0.25,
          flexShrink: 0,
        }}
      >
        {group.lastIcon ?? iconInfo.icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, py: 0.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant='body2'
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              lineHeight: 1.4,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {group.lastTitle}
          </Typography>
          {group.count > 1 && (
            <Chip
              size='small'
              label={`\u00d7${group.count}`}
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: alpha(accentColor, isDark ? 0.16 : 0.1),
                color: accentColor,
                flexShrink: 0,
              }}
            />
          )}
        </Box>
        {group.lastDescription && (
          <Typography
            variant='caption'
            sx={{
              color: alpha(theme.palette.text.secondary, isDark ? 0.92 : 0.88),
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.25,
            }}
          >
            {group.lastDescription}
          </Typography>
        )}
        {group.lastDetail && (
          <Typography
            variant='caption'
            sx={{
              color: alpha(theme.palette.text.secondary, isDark ? 0.76 : 0.72),
              lineHeight: 1.35,
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.25,
            }}
          >
            {group.lastDetail}
          </Typography>
        )}
        {hasActions && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
              mt: 1,
            }}
          >
            {group.lastActions?.map(action => (
              <Button
                key={action.id}
                type='button'
                size='small'
                variant={
                  action.variant === 'secondary' ? 'outlined' : 'contained'
                }
                onClick={() => {
                  action.onClick();

                  if (action.closeOnClick !== false) {
                    onDismiss(group.key);
                  }
                }}
                sx={{
                  minHeight: 26,
                  px: 1.25,
                  borderRadius: 1.25,
                  boxShadow: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'none',
                  ...(action.variant === 'secondary'
                    ? {
                        borderColor: alpha(
                          theme.palette.text.secondary,
                          isDark ? 0.2 : 0.18
                        ),
                        color: theme.palette.text.primary,
                      }
                    : {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      }),
                }}
              >
                {action.label}
                {action.icon}
              </Button>
            ))}
          </Box>
        )}
      </Box>

      <IconButton
        size='small'
        onClick={() => onDismiss(group.key)}
        sx={{
          mt: -0.25,
          mr: -0.75,
          flexShrink: 0,
          color: alpha(theme.palette.text.secondary, isDark ? 0.72 : 0.64),
          '&:hover': {
            color: theme.palette.text.primary,
            backgroundColor: alpha(theme.palette.text.primary, 0.06),
          },
        }}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
};
