import React, { useEffect, useMemo, useRef } from 'react';
import { Drawer, IconButton, styled, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { useAppSelector } from '@/app/providers/store/hooks.ts';
import { useAlertCenter } from '@/app/notifications/hooks/useAlertCenter.ts';
import { getNotificationIcon } from '@/app/notifications';
import type { AlertType } from '@/app/notifications/model/types.ts';

const PANEL_WIDTH = 320;
const PANEL_PADDING = 16;
const PANEL_TOP_OFFSET = 12;
const DRAWER_WIDTH = PANEL_WIDTH + PANEL_PADDING * 2;

type NotificationVariant = AlertType;

type NotificationCenterProps = {
  open: boolean;
  onClose: () => void;
};

const getPanelShadow = (isDark: boolean): string =>
  `0 12px 32px ${alpha('#0f172a', isDark ? 0.36 : 0.12)}`;

const NotificationDrawer = styled(Drawer)(() => ({
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    backgroundColor: 'transparent',
    borderLeft: 'none',
    borderRadius: 0,
    boxShadow: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: `${PANEL_TOP_OFFSET}px ${PANEL_PADDING}px ${PANEL_PADDING}px`,
    boxSizing: 'border-box',
    overflow: 'visible',
  },
}));

const NotificationPanel = styled('div')(({ theme }) => ({
  width: PANEL_WIDTH,
  backgroundColor: alpha(
    theme.palette.background.paper,
    theme.palette.mode === 'dark' ? 0.94 : 0.98
  ),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: getPanelShadow(theme.palette.mode === 'dark'),
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

const NotificationHeader = styled('div')(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1.5),
}));

const HeaderLeft = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

const HeaderIconWrapper = styled('div')(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: Math.max(theme.shape.borderRadius - 8, 8),
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '& svg': {
    width: 16,
    height: 16,
    color: theme.palette.primary.main,
  },
}));

const HeaderTitleGroup = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 600,
  color: theme.palette.text.primary,
  lineHeight: 1.25,
}));

const HeaderSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.fontWeightRegular,
  color: theme.palette.text.secondary,
  lineHeight: 1.25,
}));

const HeaderActions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
}));

const ClearButton = styled('button')(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 500,
  color: theme.palette.primary.main,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: Math.max(theme.shape.borderRadius - 8, 8),
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color', 'color'], {
    duration: theme.transitions.duration.shorter,
  }),

  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.dark,
  },

  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
  },

  '&:disabled': {
    color: theme.palette.text.disabled,
    cursor: 'not-allowed',
  },
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: Math.max(theme.shape.borderRadius - 10, 8),
  color: theme.palette.text.secondary,
  transition: theme.transitions.create(['background-color', 'color'], {
    duration: theme.transitions.duration.shorter,
  }),

  '&:hover': {
    backgroundColor: alpha(theme.palette.text.primary, 0.06),
    color: theme.palette.text.primary,
  },

  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
  },

  '& .MuiSvgIcon-root': {
    fontSize: 16,
  },
}));

const NotificationContent = styled('div')(({ theme }) => ({
  maxHeight: 320,
  overflowY: 'auto',
  overflowX: 'hidden',

  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.text.secondary, 0.24),
    borderRadius: 3,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: alpha(theme.palette.text.secondary, 0.36),
  },
}));

const NotificationItem = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1.5),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.shortest,
  }),

  '&:last-child': {
    borderBottom: 'none',
  },

  '&:hover': {
    backgroundColor: alpha(theme.palette.text.primary, 0.03),
  },
}));

const NotificationIcon = styled('div')<{ variant: NotificationVariant }>(({
  theme,
  variant,
}) => {
  const palette = {
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  } satisfies Record<NotificationVariant, string>;
  const color = palette[variant];

  return {
    width: 32,
    height: 32,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: alpha(color, 0.14),
    color,

    '& svg': {
      width: 16,
      height: 16,
    },
  };
});

const NotificationBody = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const NotificationMessage = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body2.fontSize,
  fontWeight: theme.typography.fontWeightRegular,
  color: theme.palette.text.primary,
  lineHeight: 1.5,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
}));

const NotificationDescription = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.fontWeightRegular,
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
}));

const NotificationDetail = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  fontWeight: theme.typography.fontWeightRegular,
  fontFamily: 'monospace',
  color: alpha(theme.palette.text.secondary, 0.82),
  lineHeight: 1.5,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
}));

const NotificationTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  fontWeight: theme.typography.fontWeightRegular,
  color: alpha(theme.palette.text.secondary, 0.82),
}));

const EmptyState = styled('div')(({ theme }) => ({
  padding: theme.spacing(8, 3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
}));

const EmptyIconWrapper = styled('div')(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.text.primary, 0.06),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),

  '& svg': {
    width: 32,
    height: 32,
    color: alpha(theme.palette.text.secondary, 0.5),
  },
}));

const EmptyTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 500,
  color: theme.palette.text.secondary,
}));

const EmptySubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  fontWeight: theme.typography.fontWeightRegular,
  color: alpha(theme.palette.text.secondary, 0.76),
  marginTop: theme.spacing(0.5),
}));

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
}) => {
  const { clearHistory, hideAll } = useAlertCenter();

  const { history, notificationsById } = useAppSelector(s => s.alerts);

  const historyItems = useMemo(() => {
    return [...history]
      .reverse()
      .map(id => notificationsById[id])
      .filter(Boolean)
      .filter(n => !n.dismissed);
  }, [history, notificationsById]);

  const unreadCount = historyItems.length;
  const hasNotifications = unreadCount > 0;

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      hideAll();
    }
    wasOpen.current = open;
  }, [open, hideAll]);

  return (
    <NotificationDrawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{
        BackdropProps: {
          sx: theme => ({
            backgroundColor: alpha(
              theme.palette.common.black,
              theme.palette.mode === 'dark' ? 0.44 : 0.18
            ),
          }),
        },
      }}
    >
      <NotificationPanel>
        <NotificationHeader>
          <HeaderLeft>
            <HeaderIconWrapper>
              <NotificationsRoundedIcon />
            </HeaderIconWrapper>
            <HeaderTitleGroup>
              <HeaderTitle>Уведомления</HeaderTitle>
              {hasNotifications && (
                <HeaderSubtitle>{unreadCount} новых</HeaderSubtitle>
              )}
            </HeaderTitleGroup>
          </HeaderLeft>

          <HeaderActions>
            {hasNotifications && (
              <ClearButton
                type='button'
                onClick={clearHistory}
                aria-label='Очистить уведомления'
              >
                Очистить
              </ClearButton>
            )}
            <CloseButton
              size='small'
              onClick={onClose}
              aria-label='Закрыть центр уведомлений'
            >
              <CloseRoundedIcon fontSize='small' />
            </CloseButton>
          </HeaderActions>
        </NotificationHeader>

        {hasNotifications ? (
          <NotificationContent>
            {historyItems.map(n => {
              const iconInfo = getNotificationIcon(n.type);

              return (
                <NotificationItem key={n.id}>
                  <NotificationIcon variant={n.type}>
                    {iconInfo.icon}
                  </NotificationIcon>
                  <NotificationBody>
                    <NotificationMessage>{n.title}</NotificationMessage>
                    {n.description && (
                      <NotificationDescription>
                        {n.description}
                      </NotificationDescription>
                    )}
                    {n.detail && (
                      <NotificationDetail>{n.detail}</NotificationDetail>
                    )}
                    <NotificationTime>
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </NotificationTime>
                  </NotificationBody>
                </NotificationItem>
              );
            })}
          </NotificationContent>
        ) : (
          <EmptyState>
            <EmptyIconWrapper>
              <NotificationsRoundedIcon />
            </EmptyIconWrapper>
            <EmptyTitle>Нет уведомлений</EmptyTitle>
            <EmptySubtitle>
              Здесь будут появляться уведомления о событиях
            </EmptySubtitle>
          </EmptyState>
        )}
      </NotificationPanel>
    </NotificationDrawer>
  );
};
