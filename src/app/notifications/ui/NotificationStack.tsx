import React from 'react';
import { styled, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';

import { useNotificationStack } from '@/app/notifications/hooks/useNotificationStack.ts';

import { NotificationToast } from './NotificationToast.tsx';

const HEADER_HEIGHT = 58;
const HEADER_EXTRA_OFFSET = 12;
const STACK_WIDTH = 360;

const StackContainer = styled('div')(() => ({
  position: 'fixed',
  zIndex: 1400,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  pointerEvents: 'none',
}));

const HeaderCollapse = styled('div', {
  shouldForwardProp: prop => prop !== 'visible',
})<{ visible: boolean }>(({ theme, visible }) => ({
  maxHeight: visible ? 32 : 0,
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(-6px)',
  marginBottom: visible ? theme.spacing(1) : 0,
  overflow: 'hidden',
  transition:
    'max-height 220ms ease, opacity 180ms ease, transform 220ms ease, margin-bottom 220ms ease',
  pointerEvents: visible ? 'auto' : 'none',
}));

const NotificationsHeader = styled('div')(({ theme }) => ({
  width: STACK_WIDTH,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${theme.spacing(0)} ${theme.spacing(0.5)} ${theme.spacing(1)} ${theme.spacing(0.5)}`,
}));

const NotificationsCount = styled('span')(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 500,
  color: theme.palette.text.secondary,
  lineHeight: '16px',
}));

const CloseAllButton = styled('button')(({ theme }) => ({
  padding: 0,
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 500,
  color: theme.palette.primary.main,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: theme.transitions.create('color', {
    duration: theme.transitions.duration.shorter,
  }),

  '&:hover': {
    color: theme.palette.primary.dark,
  },
}));

const ToastsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const getNotificationWord = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'уведомление';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'уведомления';
  }

  return 'уведомлений';
};

const hasVisibleHeader = (pathname: string): boolean => {
  if (pathname.startsWith('/sign_in')) {
    return false;
  }

  if (pathname.startsWith('/setup')) {
    return false;
  }

  return true;
};

export const NotificationStack: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const {
    visibleGroups,
    renderedGroups,
    dismissGroup,
    dismissAll,
    onMouseEnter,
    onMouseLeave,
  } = useNotificationStack();
  const visibleCount = visibleGroups.length;
  const showHeader = visibleCount >= 2;
  const horizontalOffset = `calc(${theme.spacing(2)} + ${HEADER_EXTRA_OFFSET}px)`;
  const topOffset = hasVisibleHeader(location.pathname)
    ? `calc(${theme.spacing(2)} + ${HEADER_EXTRA_OFFSET}px + ${HEADER_HEIGHT}px + ${theme.spacing(1)})`
    : horizontalOffset;

  if (renderedGroups.length === 0) return null;

  return (
    <StackContainer style={{ top: topOffset, right: horizontalOffset }}>
      <HeaderCollapse visible={showHeader}>
        <NotificationsHeader>
          <NotificationsCount>
            {visibleCount} {getNotificationWord(visibleCount)}
          </NotificationsCount>
          <CloseAllButton type='button' onClick={dismissAll}>
            Закрыть все
          </CloseAllButton>
        </NotificationsHeader>
      </HeaderCollapse>

      <ToastsContainer>
        {renderedGroups.map(g => (
          <NotificationToast
            key={g.key}
            group={g}
            onDismiss={dismissGroup}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        ))}
      </ToastsContainer>
    </StackContainer>
  );
};
