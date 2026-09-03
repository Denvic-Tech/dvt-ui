import * as React from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { Badge as MuiBadge, Box, Typography } from '@mui/material';
import { Link as RouterLink, useLocation, useMatch } from 'react-router-dom';

import { NotificationCenter } from '@/app/notifications';
import { useAppSelector } from '@/app/providers/store';

import { useBuildVersion } from '@/features/profile/build-version-info';

import { useTaskExecutionStatus } from '@/entities/project/task-execution-status';

import { TaskExecutionStatus } from '@/shared/gatewayClient';
import {
  Avatar,
  Button,
  IconButton,
  Panel,
  Tooltip,
} from '@/shared/ui/primitives';

import {
  avatarLinkSx,
  avatarSx,
  branchBadgeSx,
  branchDotSx,
  breadcrumbButtonSx,
  chevronSx,
  currentProjectSx,
  getProjectStatusButtonSx,
  getStatusDotSx,
  headerActionsSx,
  headerBrandButtonSx,
  headerBrandDividerSx,
  headerBrandGroupSx,
  headerNavContentSx,
  headerNavSx,
  headerPanelSx,
  logoImageSx,
  logoLinkSx,
  notificationBadgeSx,
  productTitleAccentSx,
  productTitleBrandSx,
  productTitleMetaRowSx,
  productTitleSx,
  productVersionSx,
  ProjectBadgeVariant,
  projectStatusContentSx,
  projectStatusLabelSx,
} from './styles';

export const MenuAppBar = () => {
  const location = useLocation();
  const matchProjectEditor = useMatch('/project-editor/:projectID');
  const isSignInRoute = location.pathname === '/sign_in';
  const isSetupRoute = location.pathname.startsWith('/setup');
  const isHomeRoute =
    location.pathname === '/' || location.pathname === '/home';
  const { selectedProject, projects } = useAppSelector(state => state.projects);
  const { history, notificationsById } = useAppSelector(state => state.alerts);
  const { status, error } = useTaskExecutionStatus();
  const {
    versionInfo,
    isLoading: isVersionLoading,
    loadBuildVersion,
  } = useBuildVersion();
  const [isCopied, setIsCopied] = React.useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const copyTimeoutRef = React.useRef<number | null>(null);

  const currentProject = matchProjectEditor?.params.projectID
    ? selectedProject?.id === matchProjectEditor.params.projectID
      ? selectedProject
      : projects?.find(
          project => project.id === matchProjectEditor.params.projectID
        )
    : undefined;
  const currentProjectName = currentProject?.name;

  const queuedStatuses = new Set<TaskExecutionStatus | 'IDLE'>([
    'QUEUED',
    'ASSIGNED',
    'PENDING',
  ]);
  const runningStatuses = new Set<TaskExecutionStatus | 'IDLE'>([
    'STARTED',
    'RUNNING',
  ]);
  const isQueued = queuedStatuses.has(status);
  const isRunning = runningStatuses.has(status);
  const isSuccess = status === 'SUCCESS';
  const isError = status === 'ERROR' || Boolean(error);
  const isCancelRequested = status === 'CANCEL_REQUESTED';
  const isCancelled = status === 'CANCELLED';

  const projectBadgeVariant: ProjectBadgeVariant = isError
    ? 'error'
    : isSuccess
      ? 'success'
      : isCancelRequested || isCancelled
        ? 'cancel'
        : isRunning
          ? 'running'
          : isQueued
            ? 'queued'
            : 'default';

  const dotBlink = isRunning || isCancelRequested;
  const statusLabels: Record<TaskExecutionStatus | 'IDLE', string> = {
    IDLE: 'Нет активной задачи',
    QUEUED: 'В очереди',
    ASSIGNED: 'Назначена',
    PENDING: 'Ожидает запуска',
    STARTED: 'Запущена',
    RUNNING: 'Выполняется',
    SUCCESS: 'Успешно завершена',
    ERROR: 'Ошибка выполнения',
    CANCELLED: 'Отменена',
    CANCEL_REQUESTED: 'Отмена запрошена',
  };
  const statusLabel = statusLabels[status] ?? 'Неизвестный статус';
  const tooltipLabel = isCopied ? 'Скопировано' : statusLabel;

  const branchName = '';
  const userInitial = 'U';
  const buildVersion = versionInfo?.version?.trim() ?? '';

  const handleCopyProjectName = React.useCallback(async () => {
    if (!currentProjectName || !navigator?.clipboard?.writeText) return;

    try {
      await navigator.clipboard.writeText(currentProjectName);
    } catch {
      return;
    }

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    setIsCopied(true);
    copyTimeoutRef.current = window.setTimeout(() => {
      setIsCopied(false);
      copyTimeoutRef.current = null;
    }, 1200);
  }, [currentProjectName]);

  React.useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    },
    []
  );

  React.useEffect(() => {
    if (!buildVersion && !isVersionLoading) {
      void loadBuildVersion();
    }
  }, [buildVersion, isVersionLoading, loadBuildVersion]);

  const historyItems = React.useMemo(() => {
    return [...history]
      .reverse()
      .map(id => notificationsById[id])
      .filter(Boolean)
      .filter(n => !n.dismissed);
  }, [history, notificationsById]);

  const unreadCount = historyItems.length;

  const handleNavigateHome = React.useCallback(() => {
    window.location.assign('/');
  }, []);

  if (isSignInRoute || isSetupRoute || isHomeRoute) {
    return null;
  }

  return (
    <>
      <Panel component='header' padding='none' sx={headerPanelSx}>
        <Box component='nav' aria-label='Header navigation' sx={headerNavSx}>
          <Box sx={headerBrandGroupSx}>
            <Box
              component='button'
              type='button'
              aria-label='На главную'
              onClick={handleNavigateHome}
              sx={headerBrandButtonSx}
            >
              <Box sx={logoLinkSx}>
                <Box
                  component='img'
                  src='/DVT-logo.png'
                  alt='DVT'
                  sx={logoImageSx}
                />
              </Box>

              <Typography component='div' sx={productTitleSx}>
                <Box component='span' sx={productTitleBrandSx}>
                  Denvic
                </Box>
                <Box component='span' sx={productTitleMetaRowSx}>
                  <Box component='span' sx={productTitleAccentSx}>
                    Visual Transformer
                  </Box>
                  {buildVersion ? (
                    <Box component='span' sx={productVersionSx}>
                      {buildVersion}
                    </Box>
                  ) : null}
                </Box>
              </Typography>
            </Box>
          </Box>

          <Box component='span' aria-hidden='true' sx={headerBrandDividerSx} />

          <Box sx={headerNavContentSx}>
            <Button
              component={RouterLink as React.ElementType}
              {...({ to: '/projects' } as { to: string })}
              variant='outline'
              size='xs'
              startIcon={<FolderOutlinedIcon />}
              sx={breadcrumbButtonSx}
            >
              Проекты
            </Button>

            {currentProjectName ? (
              <>
                <ChevronRightIcon sx={chevronSx} />

                <Box sx={currentProjectSx}>
                  <Tooltip title={tooltipLabel} placement='bottom'>
                    <Button
                      variant='outline'
                      size='xs'
                      onClick={handleCopyProjectName}
                      sx={getProjectStatusButtonSx({
                        variant: projectBadgeVariant,
                        copied: isCopied,
                      })}
                    >
                      <Box component='span' sx={projectStatusContentSx}>
                        <Box
                          component='span'
                          sx={getStatusDotSx({
                            variant: projectBadgeVariant,
                            blink: dotBlink,
                          })}
                        />
                        <Box component='span' sx={projectStatusLabelSx}>
                          {currentProjectName}
                        </Box>
                      </Box>
                    </Button>
                  </Tooltip>
                  {branchName && (
                    <Box component='span' sx={branchBadgeSx}>
                      <Box component='span' sx={branchDotSx} />
                      {branchName}
                    </Box>
                  )}
                </Box>
              </>
            ) : null}
          </Box>
        </Box>

        <Box sx={headerActionsSx}>
          <IconButton
            size='sm'
            onClick={() => setIsNotificationOpen(true)}
            aria-label='Открыть центр уведомлений'
            sx={{ color: 'text.secondary' }}
          >
            <MuiBadge
              badgeContent={unreadCount}
              max={99}
              invisible={unreadCount === 0}
              color='error'
              sx={notificationBadgeSx}
            >
              <NotificationsNoneOutlinedIcon fontSize='small' />
            </MuiBadge>
          </IconButton>

          <Box
            component={RouterLink}
            to='/profile'
            aria-label='Profile'
            sx={avatarLinkSx}
          >
            <Avatar sx={avatarSx}>{userInitial}</Avatar>
          </Box>
        </Box>
      </Panel>

      <NotificationCenter
        open={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};
