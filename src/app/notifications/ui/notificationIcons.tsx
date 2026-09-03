import React from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import type { Theme } from '@mui/material/styles';

import { AlertType } from '@/app/notifications/model/types.ts';

interface NotificationIconInfo {
  icon: React.ReactNode;
}

const iconMap: Record<AlertType, NotificationIconInfo> = {
  success: {
    icon: <CheckCircleRoundedIcon fontSize='small' />,
  },
  error: {
    icon: <ErrorRoundedIcon fontSize='small' />,
  },
  warning: {
    icon: <WarningRoundedIcon fontSize='small' />,
  },
  info: {
    icon: <InfoRoundedIcon fontSize='small' />,
  },
};

export const getNotificationIcon = (type: AlertType): NotificationIconInfo =>
  iconMap[type];

export const getNotificationColor = (
  theme: Theme,
  type: AlertType
): string => {
  const palette = {
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  } satisfies Record<AlertType, string>;

  return palette[type];
};
