import * as React from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import UpdateRoundedIcon from '@mui/icons-material/UpdateRounded';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

import { extensionsApi } from '@/features/profile/extensions';

import type {
  ExtensionManifestNodeSchema,
  ExtensionReadSchema,
} from '@/shared/gatewayClient';
import { ApiErrorPayload, isApiError } from '@/shared/lib/errors';

type PendingAction = 'install' | 'reload' | 'delete' | 'sync' | null;

const cleanMinimalPaperSx = {
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden',
};

const actionButtonSx = {
  minWidth: 112,
  borderRadius: '10px',
  px: 1.75,
  py: 0.9,
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
};

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Не установлено';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const buildErrorPayload = (
  error: unknown,
  fallbackMessage: string
): ApiErrorPayload => {
  if (isApiError(error)) {
    return error.payload;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return {
      code: 'UNKNOWN',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN',
    message: fallbackMessage,
  };
};

const buildVersionOptions = (
  availableVersions?: Array<string>,
  currentVersion?: string | null
): Array<{ value: string; label: string }> => {
  if (!availableVersions?.length) {
    return [];
  }

  return availableVersions.map(version => ({
    value: version,
    label:
      currentVersion && version === currentVersion
        ? `${version} (Установлено)`
        : version,
  }));
};

const getStatusTone = (
  extension: ExtensionReadSchema
): 'default' | 'success' | 'warning' | 'error' => {
  if (extension.error_message) {
    return 'error';
  }

  if (extension.is_installed && extension.is_enabled) {
    return 'success';
  }

  if (extension.is_installed) {
    return 'warning';
  }

  return 'default';
};

const getStatusLabel = (extension: ExtensionReadSchema) => {
  if (extension.error_message) {
    return 'Ошибка';
  }

  if (extension.is_installed && extension.is_enabled) {
    return 'Установлено';
  }

  if (extension.is_installed) {
    return 'Установлено, выключено';
  }

  return 'Доступно';
};

const statusChipSx = (tone: 'default' | 'success' | 'warning' | 'error') => {
  const palette = {
    default: { bg: '#f3f4f6', color: '#6b7280' },
    success: { bg: '#d1fae5', color: '#047857' },
    warning: { bg: '#fef3c7', color: '#b45309' },
    error: { bg: '#fee2e2', color: '#dc2626' },
  }[tone];

  return {
    height: 24,
    borderRadius: '999px',
    backgroundColor: palette.bg,
    color: palette.color,
    fontSize: 11,
    fontWeight: 700,
    '& .MuiChip-label': {
      px: 1.25,
    },
  };
};

const versionChipSx = {
  height: 24,
  borderRadius: '999px',
  backgroundColor: '#eef2ff',
  color: '#4f46e5',
  fontSize: 11,
  fontWeight: 700,
  '& .MuiChip-label': {
    px: 1.25,
  },
};

const metaLabelSx = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#9ca3af',
};

const metaValueSx = {
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
};

const ExtensionNodesList: React.FC<{
  nodes?: Array<ExtensionManifestNodeSchema>;
}> = ({ nodes }) => {
  if (!nodes?.length) {
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px dashed #d1d5db',
          backgroundColor: '#ffffff',
          px: 2,
          py: 1.75,
        }}
      >
        <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
          Это расширение пока не добавляет собственные ноды.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      {nodes.map((node, index) => (
        <Box
          key={`${node.name ?? node.display_name ?? 'node'}-${index}`}
          sx={{
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            px: 2,
            py: 1.5,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent='space-between'
          >
            <Box>
              <Typography
                sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}
              >
                {node.display_name || node.name || 'Без имени'}
              </Typography>
              {node.description ? (
                <Typography sx={{ mt: 0.5, fontSize: 13, color: '#6b7280' }}>
                  {node.description}
                </Typography>
              ) : null}
            </Box>
            {node.name ? (
              <Chip
                label={node.name}
                size='small'
                sx={statusChipSx('default')}
              />
            ) : null}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};

const ExtensionListItem: React.FC<{
  extension: ExtensionReadSchema;
  expanded: boolean;
  pendingAction: PendingAction;
  selectedVersion: string | null;
  onToggle: () => void;
  onInstall: () => void;
  onReload: () => void;
  onDelete: () => void;
  onVersionChange: (version: string) => void;
}> = ({
  extension,
  expanded,
  pendingAction,
  selectedVersion,
  onToggle,
  onInstall,
  onReload,
  onDelete,
  onVersionChange,
}) => {
  const statusTone = getStatusTone(extension);
  const nodesCount = extension.manifest_json?.nodes?.length ?? 0;
  const hasUpdate =
    Boolean(extension.last_version) &&
    extension.last_version !== extension.current_version;
  const versionOptions = React.useMemo(
    () =>
      buildVersionOptions(
        extension.available_versions,
        extension.current_version
      ),
    [extension.available_versions, extension.current_version]
  );
  const showVersionSelect = versionOptions.length > 0;

  return (
    <Paper variant='outlined' sx={cleanMinimalPaperSx}>
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2.25 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ xs: 'stretch', lg: 'flex-start' }}
          >
            <Stack direction='row' spacing={1.5} alignItems='flex-start'>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e0e7ff',
                  color: '#6366f1',
                  flexShrink: 0,
                }}
              >
                <ExtensionRoundedIcon fontSize='small' />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  sx={{ mb: 0.75 }}
                >
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#111827',
                      lineHeight: 1.25,
                    }}
                  >
                    {extension.display_name || extension.name}
                  </Typography>
                  <Chip
                    label={getStatusLabel(extension)}
                    size='small'
                    sx={statusChipSx(statusTone)}
                  />
                  {extension.current_version ? (
                    <Chip
                      label={`v${extension.current_version}`}
                      size='small'
                      sx={versionChipSx}
                    />
                  ) : null}
                  {hasUpdate ? (
                    <Chip
                      label={`Доступно v${extension.last_version}`}
                      size='small'
                      sx={{
                        ...statusChipSx('warning'),
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                      }}
                    />
                  ) : null}
                </Stack>

                <Typography
                  sx={{
                    fontSize: 13,
                    color: '#6b7280',
                    maxWidth: 760,
                  }}
                >
                  {extension.description ||
                    extension.manifest_json?.description ||
                    'Описание пока не указано.'}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              {showVersionSelect ? (
                <Select
                  value={selectedVersion || ''}
                  onChange={e => onVersionChange(e.target.value)}
                  size='small'
                  displayEmpty
                  sx={{
                    minWidth: 160,
                    borderRadius: '10px',
                    fontSize: 13,
                    fontWeight: 500,
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: '#c7d2fe',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#a5b4fc',
                    },
                  }}
                >
                  <MenuItem value='' disabled>
                    <Typography sx={{ fontSize: 13, color: '#9ca3af' }}>
                      Выбрать версию
                    </Typography>
                  </MenuItem>
                  {versionOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Typography sx={{ fontSize: 13 }}>{opt.label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              ) : null}
              <Button
                variant='contained'
                startIcon={
                  pendingAction === 'install' ? (
                    <CircularProgress size={16} color='inherit' />
                  ) : (
                    <DownloadRoundedIcon fontSize='small' />
                  )
                }
                disabled={
                  (extension.is_installed &&
                    (!selectedVersion ||
                      selectedVersion === extension.current_version)) ||
                  pendingAction !== null
                }
                onClick={onInstall}
                sx={{
                  ...actionButtonSx,
                  backgroundColor: '#6366f1',
                  '&:hover': {
                    backgroundColor: '#4f46e5',
                    boxShadow: 'none',
                  },
                }}
              >
                Установить
              </Button>

              <Button
                variant='outlined'
                startIcon={
                  pendingAction === 'reload' ? (
                    <CircularProgress size={16} color='inherit' />
                  ) : (
                    <UpdateRoundedIcon fontSize='small' />
                  )
                }
                disabled={!extension.is_installed || pendingAction !== null}
                onClick={onReload}
                sx={{
                  ...actionButtonSx,
                  borderColor: '#c7d2fe',
                  color: '#4f46e5',
                  backgroundColor: '#eef2ff',
                  '&:hover': {
                    borderColor: '#a5b4fc',
                    backgroundColor: '#e0e7ff',
                  },
                }}
              >
                Обновить
              </Button>

              <Button
                variant='outlined'
                color='error'
                startIcon={
                  pendingAction === 'delete' ? (
                    <CircularProgress size={16} color='inherit' />
                  ) : (
                    <DeleteOutlineRoundedIcon fontSize='small' />
                  )
                }
                disabled={!extension.is_installed || pendingAction !== null}
                onClick={onDelete}
                sx={{
                  ...actionButtonSx,
                  borderColor: '#fecaca',
                  backgroundColor: '#fff5f5',
                  '&:hover': {
                    borderColor: '#fca5a5',
                    backgroundColor: '#fee2e2',
                  },
                }}
              >
                Удалить
              </Button>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              <Box>
                <Typography sx={metaLabelSx}>Системное имя</Typography>
                <Typography sx={metaValueSx}>{extension.name}</Typography>
              </Box>
              <Divider
                orientation='vertical'
                flexItem
                sx={{ display: { xs: 'none', md: 'block' } }}
              />
              <Box>
                <Typography sx={metaLabelSx}>Последняя версия</Typography>
                <Typography sx={metaValueSx}>
                  {extension.last_version ||
                    extension.current_version ||
                    'Неизвестно'}
                </Typography>
              </Box>
              <Divider
                orientation='vertical'
                flexItem
                sx={{ display: { xs: 'none', md: 'block' } }}
              />
              <Box>
                <Typography sx={metaLabelSx}>Установлено</Typography>
                <Typography sx={metaValueSx}>
                  {formatTimestamp(extension.installed_at)}
                </Typography>
              </Box>
            </Stack>

            <Button
              onClick={onToggle}
              endIcon={
                <ExpandMoreRoundedIcon
                  sx={{
                    transition: 'transform 200ms ease',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              }
              sx={{
                ...actionButtonSx,
                minWidth: 'auto',
                color: '#374151',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                },
              }}
            >
              Ноды расширения ({nodesCount})
            </Button>
          </Stack>

          <Collapse in={expanded} timeout={200} unmountOnExit>
            <Box
              sx={{
                borderRadius: '12px',
                backgroundColor: '#f9fafb',
                border: '1px solid #f3f4f6',
                px: { xs: 1.5, md: 2 },
                py: 1.5,
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#dbeafe',
                      color: '#2563eb',
                    }}
                  >
                    <AutoAwesomeRoundedIcon fontSize='small' />
                  </Box>
                  <Box>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 700, color: '#111827' }}
                    >
                      Список нод из manifest
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                      Раздел показывает ноды, которые расширение регистрирует в
                      приложении.
                    </Typography>
                  </Box>
                </Stack>
                <ExtensionNodesList
                  {...(extension.manifest_json?.nodes
                    ? { nodes: extension.manifest_json.nodes }
                    : {})}
                />
              </Stack>
            </Box>
          </Collapse>

          {extension.error_message ? (
            <Alert
              severity='error'
              sx={{
                borderRadius: '12px',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
              }}
            >
              {extension.error_message}
            </Alert>
          ) : null}
        </Stack>
      </Box>
    </Paper>
  );
};

export const ExtensionsPanel: React.FC = () => {
  const [extensions, setExtensions] = React.useState<
    Array<ExtensionReadSchema>
  >([]);
  const [expandedNames, setExpandedNames] = React.useState<Set<string>>(
    () => new Set()
  );
  const [loading, setLoading] = React.useState(true);
  const [globalError, setGlobalError] = React.useState<ApiErrorPayload | null>(
    null
  );
  const [flashMessage, setFlashMessage] = React.useState<{
    severity: 'success' | 'info';
    message: string;
  } | null>(null);
  const [pendingByName, setPendingByName] = React.useState<
    Record<string, PendingAction>
  >({});
  const [selectedVersions, setSelectedVersions] = React.useState<
    Record<string, string>
  >({});
  const [deleteTarget, setDeleteTarget] =
    React.useState<ExtensionReadSchema | null>(null);
  const [dropExtensionData, setDropExtensionData] = React.useState(false);

  const setPendingAction = React.useCallback(
    (extensionName: string, action: PendingAction) => {
      setPendingByName(prev => ({
        ...prev,
        [extensionName]: action,
      }));
    },
    []
  );

  const replaceExtension = React.useCallback(
    (nextItem: ExtensionReadSchema) => {
      setExtensions(prev =>
        [...prev]
          .map(item => (item.name === nextItem.name ? nextItem : item))
          .sort((left, right) =>
            (left.display_name || left.name).localeCompare(
              right.display_name || right.name,
              'ru'
            )
          )
      );
    },
    []
  );

  const loadExtensions = React.useCallback(async () => {
    setLoading(true);
    setGlobalError(null);

    try {
      await extensionsApi.sync();
      const items = await extensionsApi.list();
      setExtensions(items);
    } catch (error) {
      setGlobalError(
        buildErrorPayload(error, 'Не удалось загрузить список расширений.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadExtensions();
  }, [loadExtensions]);

  const handleSync = async () => {
    setGlobalError(null);
    setFlashMessage(null);
    setPendingByName(prev => ({ ...prev, __sync__: 'sync' }));

    try {
      await extensionsApi.sync();
      const items = await extensionsApi.list();
      setExtensions(items);
      setFlashMessage({
        severity: 'success',
        message: 'Каталог расширений обновлён.',
      });
    } catch (error) {
      setGlobalError(
        buildErrorPayload(
          error,
          'Не удалось синхронизировать каталог расширений.'
        )
      );
    } finally {
      setPendingByName(prev => {
        const next = { ...prev };
        delete next['__sync__'];
        return next;
      });
    }
  };

  const runAction = async (
    extensionName: string,
    action: Exclude<PendingAction, 'sync' | null>,
    request: () => Promise<ExtensionReadSchema | void>,
    successMessage: string
  ) => {
    setGlobalError(null);
    setFlashMessage(null);
    setPendingAction(extensionName, action);

    try {
      const response = await request();
      if (response) {
        replaceExtension(response);
      } else {
        await loadExtensions();
      }
      setFlashMessage({
        severity: 'success',
        message: successMessage,
      });
    } catch (error) {
      setGlobalError(
        buildErrorPayload(error, 'Операция завершилась с ошибкой.')
      );
    } finally {
      setPendingByName(prev => {
        const next = { ...prev };
        delete next[extensionName];
        return next;
      });
    }
  };

  const toggleExpanded = (extensionName: string) => {
    setExpandedNames(prev => {
      const next = new Set(prev);
      if (next.has(extensionName)) {
        next.delete(extensionName);
      } else {
        next.add(extensionName);
      }
      return next;
    });
  };

  const openDeleteDialog = (extension: ExtensionReadSchema) => {
    setDeleteTarget(extension);
    setDropExtensionData(false);
  };

  const closeDeleteDialog = () => {
    if (deleteTarget && pendingByName[deleteTarget.name] === 'delete') {
      return;
    }
    setDeleteTarget(null);
    setDropExtensionData(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const target = deleteTarget;
    await runAction(
      target.name,
      'delete',
      () => extensionsApi.remove(target.name, dropExtensionData),
      `Расширение "${target.display_name || target.name}" удалено.`
    );
    setDeleteTarget(null);
    setDropExtensionData(false);
  };

  return (
    <Stack spacing={2.5}>
      <Paper variant='outlined' sx={cleanMinimalPaperSx}>
        <Box
          sx={{
            px: { xs: 2, md: 2.5 },
            py: 2.25,
            background:
              'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)',
          }}
        >
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', lg: 'center' }}
          >
            <Stack direction='row' spacing={1.5} alignItems='flex-start'>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e0e7ff',
                  color: '#4f46e5',
                  boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.12)',
                }}
              >
                <ExtensionRoundedIcon />
              </Box>
              <Box>
                <Typography
                  sx={{ fontSize: 18, fontWeight: 700, color: '#111827' }}
                >
                  Расширения
                </Typography>
                <Typography
                  sx={{
                    mt: 0.75,
                    fontSize: 13,
                    color: '#6b7280',
                    maxWidth: 760,
                  }}
                >
                  Управление каталогом расширений: установка, обновление и
                  удаление пакетов, а также просмотр нод, которые они добавляют
                  в редактор.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant='outlined'
              startIcon={
                pendingByName['__sync__'] === 'sync' ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <RefreshRoundedIcon fontSize='small' />
                )
              }
              onClick={() => void handleSync()}
              disabled={pendingByName['__sync__'] === 'sync'}
              sx={{
                ...actionButtonSx,
                borderColor: '#d1d5db',
                color: '#374151',
                backgroundColor: '#ffffff',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb',
                },
              }}
            >
              Синхронизировать
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Box
          sx={{ px: { xs: 2, md: 2.5 }, py: 1.75, backgroundColor: '#f9fafb' }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            useFlexGap
          >
            <Chip
              label={`Всего: ${extensions.length}`}
              size='small'
              sx={statusChipSx('default')}
            />
            <Chip
              label={`Установлено: ${extensions.filter(item => item.is_installed).length}`}
              size='small'
              sx={statusChipSx('success')}
            />
            <Chip
              label={`Доступны обновления: ${
                extensions.filter(
                  item =>
                    item.is_installed &&
                    item.last_version &&
                    item.last_version !== item.current_version
                ).length
              }`}
              size='small'
              sx={statusChipSx('warning')}
            />
          </Stack>
        </Box>
      </Paper>

      {flashMessage ? (
        <Alert
          severity={flashMessage.severity}
          onClose={() => setFlashMessage(null)}
          sx={{
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
            backgroundColor: '#f0fdf4',
          }}
        >
          {flashMessage.message}
        </Alert>
      ) : null}

      {globalError ? (
        <Alert
          severity='error'
          onClose={() => setGlobalError(null)}
          sx={{
            borderRadius: '12px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
          }}
        >
          {globalError.message}
        </Alert>
      ) : null}

      {loading ? (
        <Paper
          variant='outlined'
          sx={{
            ...cleanMinimalPaperSx,
            px: 3,
            py: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <CircularProgress />
          <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
            Загружаем каталог расширений...
          </Typography>
        </Paper>
      ) : null}

      {!loading && !extensions.length ? (
        <Paper
          variant='outlined'
          sx={{
            ...cleanMinimalPaperSx,
            px: 3,
            py: 5,
            textAlign: 'center',
            backgroundColor: '#ffffff',
          }}
        >
          <Box
            sx={{
              mx: 'auto',
              mb: 1.5,
              width: 48,
              height: 48,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: alpha('#6366f1', 0.12),
              color: '#4f46e5',
            }}
          >
            <ExtensionRoundedIcon />
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
            Расширения не найдены
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: 13, color: '#6b7280' }}>
            Выполните синхронизацию каталога после публикации новых расширений
            на backend.
          </Typography>
        </Paper>
      ) : null}

      {!loading ? (
        <Stack spacing={2}>
          {extensions.map(extension => (
            <ExtensionListItem
              key={extension.name}
              extension={extension}
              expanded={expandedNames.has(extension.name)}
              pendingAction={pendingByName[extension.name] ?? null}
              selectedVersion={selectedVersions[extension.name] ?? null}
              onToggle={() => toggleExpanded(extension.name)}
              onInstall={() =>
                void runAction(
                  extension.name,
                  'install',
                  () =>
                    extensionsApi.install(
                      extension.name,
                      selectedVersions[extension.name] || null
                    ),
                  `Расширение "${extension.display_name || extension.name}" установлено.`
                )
              }
              onReload={() =>
                void runAction(
                  extension.name,
                  'reload',
                  () => extensionsApi.reload(extension.name),
                  `Расширение "${extension.display_name || extension.name}" обновлено.`
                )
              }
              onDelete={() => openDeleteDialog(extension)}
              onVersionChange={(version: string) =>
                setSelectedVersions(prev => ({
                  ...prev,
                  [extension.name]: version,
                }))
              }
            />
          ))}
        </Stack>
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Удалить расширение?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography sx={{ fontSize: 14, color: '#4b5563' }}>
              Обычное удаление удалит код расширения, но сохранит его данные в
              service PostgreSQL. При повторной установке расширение сможет
              продолжить работу с существующими данными.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={dropExtensionData}
                  onChange={event => setDropExtensionData(event.target.checked)}
                  color='error'
                />
              }
              label='Удалить данные расширения'
            />
            {dropExtensionData ? (
              <Alert severity='error'>
                Данные расширения будут навсегда удалены из service PostgreSQL.
                Автоматически восстановить их после удаления нельзя.
              </Alert>
            ) : (
              <Alert severity='info'>
                Данные расширения будут сохранены для возможной повторной
                установки.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDeleteDialog}>Отмена</Button>
          <Button
            variant='contained'
            color='error'
            disabled={
              deleteTarget !== null &&
              pendingByName[deleteTarget.name] === 'delete'
            }
            onClick={() => void confirmDelete()}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
