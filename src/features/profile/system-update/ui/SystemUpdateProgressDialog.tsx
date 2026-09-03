import * as React from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import SystemUpdateAltRoundedIcon from '@mui/icons-material/SystemUpdateAltRounded';
import Box from '@mui/material/Box';
import { alpha, type Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
  Spinner,
} from '@/shared/ui';

import type { SystemUpdateState } from '../model/types';

export const SYSTEM_UPDATE_GATEWAY_TIMEOUT_MESSAGE =
  'Gateway не удалось восстановить. Обновление может продолжаться или завершиться ошибкой. Обратитесь к администратору и проверьте installation manager.';

const stepPresentation = {
  pending: {
    color: 'text.disabled',
    icon: <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16 }} />,
    label: 'Ожидает',
  },
  running: {
    color: 'primary.main',
    icon: (
      <SyncRoundedIcon
        sx={{
          '@keyframes stepSpinner': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' },
          },
          animation: 'stepSpinner 850ms linear infinite',
          fontSize: 16,
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }}
      />
    ),
    label: 'Выполняется',
  },
  ok: {
    color: 'success.main',
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />,
    label: 'Готово',
  },
  failed: {
    color: 'error.main',
    icon: <ErrorRoundedIcon sx={{ fontSize: 16 }} />,
    label: 'Ошибка',
  },
} as const;

const getStepPresentation = (status: string) =>
  stepPresentation[status as keyof typeof stepPresentation] ?? {
    color: 'text.secondary',
    icon: <HourglassEmptyRoundedIcon sx={{ fontSize: 16 }} />,
    label: status,
  };

const getStepIconSurfaceSx = (theme: Theme, status: string) => {
  if (status === 'ok') {
    return {
      backgroundColor: alpha(theme.palette.success.main, 0.09),
      borderColor: alpha(theme.palette.success.main, 0.22),
    };
  }

  if (status === 'failed') {
    return {
      backgroundColor: alpha(theme.palette.error.main, 0.09),
      borderColor: alpha(theme.palette.error.main, 0.22),
    };
  }

  if (status === 'running') {
    return {
      backgroundColor: alpha(theme.palette.primary.main, 0.09),
      borderColor: alpha(theme.palette.primary.main, 0.22),
    };
  }

  return {
    backgroundColor: alpha(theme.palette.text.secondary, 0.05),
    borderColor: alpha(theme.palette.text.secondary, 0.16),
  };
};

const getLogLineColor = (line: string) => {
  const normalized = line.toLowerCase();

  if (
    normalized.includes('error') ||
    normalized.includes('failed') ||
    normalized.includes('ошиб')
  ) {
    return '#fb7185';
  }

  if (
    normalized.includes('success') ||
    normalized.includes('готов') ||
    normalized.includes('завершен')
  ) {
    return '#4ade80';
  }

  return '#c7d2e5';
};

interface SystemUpdateProgressDialogProps {
  state: SystemUpdateState;
  onClear: () => void;
  onPause: () => void;
  onReload: () => void;
}

export const SystemUpdateProgressDialog = ({
  state,
  onClear,
  onPause,
  onReload,
}: SystemUpdateProgressDialogProps) => {
  const logRef = React.useRef<HTMLDivElement | null>(null);
  const steps = state.snapshot?.steps ?? [];
  const finishedSteps = steps.filter(
    step => step.status === 'ok' || step.status === 'failed'
  ).length;
  const progress =
    state.phase === 'succeeded'
      ? 100
      : steps.length > 0
        ? Math.round((finishedSteps / steps.length) * 100)
        : 0;
  const summaryPrefix =
    state.phase === 'succeeded'
      ? 'Готово'
      : state.phase === 'failed' || state.phase === 'status_error'
        ? 'Остановлено'
        : 'Выполнено';
  const inlineStatus =
    state.phase === 'reconnecting'
      ? state.reconnectTimedOut
        ? SYSTEM_UPDATE_GATEWAY_TIMEOUT_MESSAGE
        : 'Переподключение к gateway…'
      : state.phase === 'failed'
        ? state.snapshot?.error ||
          'Installation manager не сообщил подробности ошибки.'
        : state.phase === 'status_error'
          ? state.error?.message || 'Получен неожиданный статус обновления.'
          : null;
  const inlineStatusColor =
    state.phase === 'reconnecting' ? 'warning.main' : 'error.main';

  React.useLayoutEffect(() => {
    const logElement = logRef.current;

    if (logElement) {
      logElement.scrollTo({
        behavior: 'auto',
        top: logElement.scrollHeight,
      });
    }
  }, [state.logs.length]);

  return (
    <Dialog
      aria-labelledby='system-update-progress-title'
      disableEscapeKeyDown
      maxWidth={false}
      open
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(7px)',
            backgroundColor: 'rgba(15, 23, 42, 0.38)',
          },
        },
        paper: {
          sx: {
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '18px',
            boxShadow: '0 24px 64px rgba(15, 23, 42, 0.24)',
            height: 'min(760px, calc(100vh - 32px))',
            m: 2,
            maxHeight: 'calc(100vh - 32px)',
            maxWidth: 'none',
            width: 'min(1180px, calc(100vw - 32px))',
            '& > .MuiBox-root': {
              gridTemplateRows: 'auto minmax(0, 1fr) auto',
              height: '100%',
              minHeight: 0,
            },
          },
        },
      }}
    >
      <DialogHeader
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'row',
          gap: 1.5,
        }}
      >
        <Box
          sx={theme => ({
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.primary.main, 0.09),
            borderRadius: '10px',
            color: 'primary.main',
            display: 'flex',
            height: 40,
            justifyContent: 'center',
            width: 40,
          })}
        >
          <SystemUpdateAltRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <DialogTitle id='system-update-progress-title'>
            Обновление DVT
          </DialogTitle>
          <Typography color='text.secondary' variant='body2'>
            Версия: {state.snapshot?.version || state.marker?.targetVersion}
          </Typography>
        </Box>
      </DialogHeader>

      <DialogContent
        sx={{
          height: 'auto',
          minHeight: 0,
          overflow: { xs: 'auto', lg: 'hidden' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(360px, 0.96fr) minmax(0, 1.04fr)',
            },
            height: { lg: '100%' },
            minHeight: 0,
          }}
        >
          <Card
            sx={theme => ({
              background: theme.palette.background.paper,
              borderRadius: '16px',
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 360, lg: 0 },
            })}
          >
            <CardHeader sx={{ gap: 1.75, px: 3, py: 2.5 }}>
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <CardTitle>Этапы обновления</CardTitle>
                <Typography color='text.secondary' sx={{ fontSize: 12 }}>
                  {summaryPrefix}{' '}
                  <Box
                    component='span'
                    sx={{ color: 'text.primary', fontWeight: 700 }}
                  >
                    {finishedSteps} из {steps.length}
                  </Box>
                </Typography>
              </Box>
              <Progress
                sx={{
                  height: 6,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor:
                      state.phase === 'succeeded'
                        ? 'success.main'
                        : state.phase === 'failed' ||
                            state.phase === 'status_error'
                          ? 'error.main'
                          : 'primary.main',
                  },
                }}
                value={progress}
              />
              {inlineStatus ? (
                <Typography
                  color={inlineStatusColor}
                  sx={{ fontSize: 12, lineHeight: 1.55 }}
                >
                  {inlineStatus}
                </Typography>
              ) : null}
            </CardHeader>

            <CardContent
              sx={{
                display: 'grid',
                gap: 0.75,
                overflow: 'auto',
                px: 3,
                py: 1.25,
              }}
            >
              {steps.length === 0 ? (
                <Box
                  sx={{
                    alignItems: 'center',
                    color: 'text.secondary',
                    display: 'flex',
                    gap: 1.25,
                    py: 3,
                  }}
                >
                  <Spinner size={18} />
                  Ожидаем первый статус от installation manager…
                </Box>
              ) : (
                steps.map(step => {
                  const stepUi = getStepPresentation(step.status);

                  return (
                    <Box
                      key={step.id}
                      sx={{
                        alignItems: 'center',
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: '24px minmax(0, 1fr) auto',
                        px: 1,
                        py: 1.25,
                      }}
                    >
                      <Box
                        sx={theme => ({
                          alignItems: 'center',
                          border: '1px solid',
                          borderRadius: '50%',
                          color: stepUi.color,
                          display: 'flex',
                          height: 22,
                          justifyContent: 'center',
                          width: 22,
                          ...getStepIconSurfaceSx(theme, step.status),
                        })}
                      >
                        {stepUi.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 600,
                            lineHeight: 1.4,
                          }}
                        >
                          {step.title}
                        </Typography>
                        {step.detail ? (
                          <Typography
                            color='text.secondary'
                            sx={{ fontSize: 12, lineHeight: 1.45 }}
                          >
                            {step.detail}
                          </Typography>
                        ) : null}
                      </Box>
                      <Typography
                        color={stepUi.color}
                        sx={{ fontSize: 11.5, fontWeight: 600 }}
                      >
                        {stepUi.label}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 360, lg: 0 },
            }}
          >
            <Box
              ref={logRef}
              aria-live='polite'
              role='log'
              sx={{
                '@keyframes logIn': {
                  from: { opacity: 0, transform: 'translateY(5px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '@keyframes cursorBlink': {
                  '0%, 44%': { opacity: 1 },
                  '45%, 100%': { opacity: 0 },
                },
                backgroundColor: '#191a20',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                color: '#c7d2e5',
                flex: 1,
                fontFamily:
                  '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                fontSize: 12.5,
                lineHeight: 1.7,
                minHeight: 320,
                overflow: 'auto',
                overflowAnchor: 'none',
                p: 2.5,
                scrollbarWidth: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              <Box
                sx={{
                  color: '#818cf8',
                  fontWeight: 500,
                  mb: 0.35,
                }}
              >
                $ dvt-installer update --tag{' '}
                {state.snapshot?.version || state.marker?.targetVersion}
              </Box>

              {state.logs.map((line, index) => (
                <Box
                  key={`${index}-${line}`}
                  sx={{
                    animation: 'logIn 220ms ease-out both',
                    color: getLogLineColor(line),
                    minHeight: '1.7em',
                    '@media (prefers-reduced-motion: reduce)': {
                      animation: 'none',
                    },
                  }}
                >
                  {line}
                </Box>
              ))}

              <Box
                aria-hidden
                component='span'
                sx={{
                  animation: 'cursorBlink 900ms step-end infinite',
                  backgroundColor: '#a5b4fc',
                  display: 'inline-block',
                  height: '1.05em',
                  ml: 0.35,
                  verticalAlign: '-0.15em',
                  width: 7,
                  '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogFooter>
        {state.phase === 'succeeded' ? (
          <Button onClick={onReload}>Перезагрузить приложение</Button>
        ) : state.phase === 'failed' || state.phase === 'status_error' ? (
          <Button onClick={onClear} variant='outline'>
            Вернуться в раздел обновления
          </Button>
        ) : state.phase === 'reconnecting' && state.reconnectTimedOut ? (
          <Button onClick={onPause} variant='outline'>
            Вернуться и продолжить позже
          </Button>
        ) : (
          <Typography color='text.secondary' variant='body2'>
            Не закрывайте приложение до завершения обновления.
          </Typography>
        )}
      </DialogFooter>
    </Dialog>
  );
};
