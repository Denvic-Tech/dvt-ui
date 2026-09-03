import * as React from 'react';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import SystemUpdateAltRoundedIcon from '@mui/icons-material/SystemUpdateAltRounded';
import Box from '@mui/material/Box';
import { alpha, type Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useBuildVersion } from '@/features/profile/build-version-info';
import {
  getSystemUpdateOwnerKey,
  useSystemUpdate,
} from '@/features/profile/system-update';

import type { UserReadSchema } from '@/shared/gatewayClient';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  Spinner,
} from '@/shared/ui';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

interface SystemUpdatePanelProps {
  currentUser: UserReadSchema | null;
}

type TargetVersionMode = 'latest' | 'manual';

const UPDATE_FORM_MAX_WIDTH = 720;

const optionCardSx = (theme: Theme, selected: boolean) => ({
  backgroundColor: selected
    ? alpha(
        theme.palette.primary.main,
        theme.palette.mode === 'light' ? 0.09 : 0.16
      )
    : alpha(
        theme.palette.background.paper,
        theme.palette.mode === 'light' ? 0.96 : 0.72
      ),
  border: '1px solid',
  borderColor: selected ? 'primary.main' : 'divider',
  borderRadius: '12px',
  cursor: 'pointer',
  display: 'grid',
  gap: 1.25,
  p: 2,
  transition: 'border-color 150ms ease, background-color 150ms ease',
  '&:hover': {
    borderColor: selected
      ? 'primary.main'
      : alpha(theme.palette.primary.main, 0.34),
  },
});

const optionTitleSx = {
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.35,
};

const optionDescriptionSx = {
  color: 'text.secondary',
  fontSize: 13,
  lineHeight: 1.5,
};

export const SystemUpdatePanel = ({ currentUser }: SystemUpdatePanelProps) => {
  const { confirm } = useConfirmDialog();
  const {
    versionInfo,
    isLoading: versionLoading,
    loadBuildVersion,
  } = useBuildVersion();
  const { phase, marker, error, start, resume, clear, clearStartError } =
    useSystemUpdate();
  const [targetMode, setTargetMode] =
    React.useState<TargetVersionMode>('manual');
  const [manualVersion, setManualVersion] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );
  const ownerKey = getSystemUpdateOwnerKey(currentUser);
  const ownsMarker = Boolean(
    marker && ownerKey && marker.ownerKey === ownerKey
  );
  const pausedMarker = ownsMarker && marker?.paused ? marker : null;
  const isStarting = phase === 'starting';
  const targetVersion =
    targetMode === 'latest' ? 'latest' : manualVersion.trim();
  const isFormDisabled = isStarting || Boolean(marker);
  const canStart = Boolean(targetVersion) && !isFormDisabled;

  React.useEffect(() => {
    void loadBuildVersion();
  }, [loadBuildVersion]);

  const selectTargetMode = (mode: TargetVersionMode) => {
    if (isFormDisabled) {
      return;
    }

    setTargetMode(mode);
    setValidationError(null);
    clearStartError();
  };

  const handleStart = async () => {
    if (!targetVersion) {
      setValidationError('Укажите целевую версию DVT.');
      return;
    }

    if (!ownerKey) {
      setValidationError('Не удалось определить текущего пользователя.');
      return;
    }

    const approved = await confirm({
      title: 'Запустить обновление DVT?',
      message: `Будет запущено обновление до версии «${targetVersion}». Gateway, UI и другие сервисы временно станут недоступны. Не закрывайте приложение до появления результата.`,
      confirmLabel: 'Запустить обновление',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'sm',
    });

    if (!approved) {
      return;
    }

    try {
      await start({ ownerKey, version: targetVersion });
    } catch {
      // The slice exposes the locally rendered API error.
    }
  };

  const handleResetPausedMarker = async () => {
    const approved = await confirm({
      title: 'Сбросить локальный статус?',
      message:
        'DVT перестанет отслеживать это обновление в текущей вкладке. Само обновление в installation manager остановлено не будет.',
      confirmLabel: 'Сбросить статус',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'sm',
    });

    if (approved) {
      clear();
    }
  };

  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        minHeight: '100%',
        px: { xs: 2, sm: 3, md: 0 },
        py: { xs: 2, sm: 3, md: 0 },
      }}
    >
      <Card
        sx={theme => ({
          alignSelf: 'start',
          background: theme.palette.background.paper,
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        })}
      >
        <CardHeader
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            gap: 0.25,
            px: { xs: 2, sm: 3.25 },
            py: 2.5,
          }}
        >
          <Box
            sx={{
              alignItems: 'flex-start',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'space-between',
              maxWidth: UPDATE_FORM_MAX_WIDTH,
              width: '100%',
            }}
          >
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.75 }}>
              <Box
                sx={theme => ({
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: '11px',
                  color: 'primary.main',
                  display: 'flex',
                  flex: '0 0 auto',
                  height: 44,
                  justifyContent: 'center',
                  width: 44,
                })}
              >
                <SystemUpdateAltRoundedIcon sx={{ fontSize: 21 }} />
              </Box>

              <Box sx={{ display: 'grid', gap: 0 }}>
                <CardTitle
                  sx={{
                    fontSize: { xs: 21, sm: 24 },
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.1,
                  }}
                >
                  Обновление DVT
                </CardTitle>
                <CardDescription sx={{ fontSize: 13, lineHeight: 1.3 }}>
                  Обновление системных сервисов
                </CardDescription>
              </Box>
            </Box>

            <Box
              sx={theme => ({
                alignItems: 'center',
                alignSelf: 'flex-start',
                backgroundColor: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === 'light' ? 0.98 : 0.76
                ),
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '10px',
                color: 'text.secondary',
                display: 'flex',
                gap: 1,
                minHeight: 36,
                px: 1.5,
              })}
            >
              <LocalOfferOutlinedIcon color='primary' sx={{ fontSize: 15 }} />
              <Typography sx={{ fontSize: 12 }}>Текущая версия</Typography>
              <Typography
                component='code'
                sx={{
                  color: 'text.primary',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {versionLoading && !versionInfo
                  ? 'определение…'
                  : versionInfo?.version || 'неизвестна'}
              </Typography>
            </Box>
          </Box>
        </CardHeader>

        <CardContent
          sx={{
            px: { xs: 2, sm: 3.25 },
            py: 2.75,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              maxWidth: UPDATE_FORM_MAX_WIDTH,
              width: '100%',
            }}
          >
            {pausedMarker ? (
              <Alert variant='warning'>
                <AlertTitle>Мониторинг обновления приостановлен</AlertTitle>
                <AlertDescription>
                  Проверка версии {pausedMarker.targetVersion} была остановлена
                  после продолжительной недоступности gateway. Обновление могло
                  продолжить выполняться в installation manager.
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    <Button onClick={resume} size='sm'>
                      Продолжить проверку
                    </Button>
                    <Button
                      onClick={() => void handleResetPausedMarker()}
                      size='sm'
                      variant='outline'
                    >
                      Сбросить локальный статус
                    </Button>
                  </Box>
                </AlertDescription>
              </Alert>
            ) : null}

            {phase === 'idle' && error ? (
              <Alert variant='destructive'>
                <AlertTitle>Не удалось запустить обновление</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : null}

            <RadioGroup
              onValueChange={value =>
                selectTargetMode(value as TargetVersionMode)
              }
              value={targetMode}
            >
              <Box
                onClick={() => selectTargetMode('latest')}
                sx={theme => optionCardSx(theme, targetMode === 'latest')}
              >
                <Box sx={{ alignItems: 'flex-start', display: 'flex', gap: 1 }}>
                  <RadioGroupItem
                    disabled={isFormDisabled}
                    inputProps={{ 'aria-label': 'Последняя версия' }}
                    sx={{ mt: -0.75, ml: -0.75 }}
                    value='latest'
                  />
                  <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
                    <Box
                      sx={{
                        alignItems: 'center',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.75,
                      }}
                    >
                      <Typography sx={optionTitleSx}>
                        Последняя версия
                      </Typography>
                      <Badge
                        variant='success'
                        style={{
                          border: 0,
                          borderRadius: 4,
                          minHeight: 18,
                          paddingInline: 7,
                        }}
                      >
                        РЕКОМЕНДУЕТСЯ
                      </Badge>
                    </Box>
                    <Typography sx={optionDescriptionSx}>
                      Устанавливает самый свежий стабильный релиз — tag{' '}
                      <Box
                        component='code'
                        sx={theme => ({
                          backgroundColor: alpha(
                            theme.palette.text.secondary,
                            0.08
                          ),
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: '4px',
                          color: 'text.primary',
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, monospace',
                          fontSize: 12,
                          px: 0.5,
                          py: 0.125,
                        })}
                      >
                        latest
                      </Box>
                      .
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                onClick={() => selectTargetMode('manual')}
                sx={theme => optionCardSx(theme, targetMode === 'manual')}
              >
                <Box sx={{ alignItems: 'flex-start', display: 'flex', gap: 1 }}>
                  <RadioGroupItem
                    disabled={isFormDisabled}
                    inputProps={{ 'aria-label': 'Указать версию вручную' }}
                    sx={{ mt: -0.75, ml: -0.75 }}
                    value='manual'
                  />
                  <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
                    <Typography sx={optionTitleSx}>
                      Указать версию вручную
                    </Typography>
                    <Typography sx={optionDescriptionSx}>
                      Разверните конкретный tag образов.
                    </Typography>
                  </Box>
                </Box>

                {targetMode === 'manual' ? (
                  <Box
                    onClick={event => event.stopPropagation()}
                    sx={theme => ({
                      display: 'grid',
                      gap: 0.75,
                      pl: { xs: 0, sm: 3.75 },
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: '8px',
                        boxShadow: 'none',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.divider,
                          borderRadius: '8px',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.divider,
                        },
                        '&.Mui-focused': {
                          boxShadow: 'none',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 1,
                        },
                        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.error.main,
                        },
                        '&.Mui-error:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.error.main,
                        },
                      },
                      '& input': {
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 14,
                      },
                    })}
                  >
                    <Input
                      autoFocus
                      disabled={isFormDisabled}
                      error={Boolean(validationError)}
                      id='system-update-version'
                      inputProps={{
                        'aria-label': 'Целевая версия DVT',
                      }}
                      onChange={event => {
                        setManualVersion(event.target.value);
                        setValidationError(null);
                        clearStartError();
                      }}
                      placeholder='1.20.0'
                      startAdornment={
                        <LocalOfferOutlinedIcon sx={{ fontSize: 17 }} />
                      }
                      value={manualVersion}
                    />
                    <Typography
                      color={validationError ? 'error.main' : 'text.secondary'}
                      sx={{ fontSize: 12, lineHeight: 1.5 }}
                    >
                      {validationError ?? (
                        <>
                          Например:{' '}
                          <Box
                            component='code'
                            sx={{
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, monospace',
                            }}
                          >
                            1.20.0
                          </Box>
                        </>
                      )}
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            </RadioGroup>

            <Alert
              sx={theme => ({
                backgroundColor: alpha(
                  theme.palette.warning.main,
                  theme.palette.mode === 'light' ? 0.07 : 0.12
                ),
                borderColor: alpha(theme.palette.warning.main, 0.38),
                borderRadius: '12px',
                px: 1.75,
                py: 1.25,
              })}
              variant='warning'
            >
              <AlertTitle sx={{ fontSize: 14, mb: 0.25 }}>
                Сервисы будут перезапущены
              </AlertTitle>
              <AlertDescription sx={{ fontSize: 13, lineHeight: 1.5 }}>
                Во время обновления DVT временно потеряет соединение. После
                запуска откроется экран мониторинга.
              </AlertDescription>
            </Alert>
          </Box>
        </CardContent>

        <CardFooter
          sx={{
            alignItems: { xs: 'stretch', sm: 'center' },
            backgroundColor: 'action.hover',
            borderTop: '1px solid',
            borderColor: 'divider',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3.25 },
            py: 2,
          }}
        >
          <Box
            sx={{
              alignItems: { xs: 'stretch', sm: 'center' },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1.5,
              justifyContent: 'flex-end',
              maxWidth: UPDATE_FORM_MAX_WIDTH,
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                gap: 1,
              }}
            >
              <Button
                disabled={!canStart}
                onClick={() => void handleStart()}
                startIcon={
                  isStarting ? <Spinner color='inherit' size={16} /> : undefined
                }
                sx={{
                  backgroundColor: 'primary.main',
                  backgroundImage: 'none',
                  borderRadius: '12px',
                  boxShadow: 'none',
                  color: 'common.white',
                  fontSize: 14,
                  fontWeight: 500,
                  minWidth: 0,
                  px: 3,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    backgroundImage: 'none',
                    boxShadow: 'none',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'grey.300',
                    backgroundImage: 'none',
                    color: 'common.white',
                  },
                }}
              >
                {isStarting ? 'Запуск обновления…' : 'Обновить DVT'}
              </Button>
            </Box>
          </Box>
        </CardFooter>
      </Card>
    </Box>
  );
};
