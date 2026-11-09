import * as React from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import UpdateRoundedIcon from '@mui/icons-material/UpdateRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { IconPuzzle } from '@tabler/icons-react';

import { extensionsApi } from '@/features/profile/extensions';

import type {
  ExtensionCatalogVersionSchema,
  ExtensionManifestNodeSchema,
  ExtensionPackagePreviewSchema,
  ExtensionReadSchema,
} from '@/shared/gatewayClient';
import { ApiErrorPayload, isApiError } from '@/shared/lib/errors';
import { PageLayout, PageToolbar } from '@/shared/ui/page-layout';

type PendingAction = 'install' | 'reload' | 'delete' | null;

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

type ExtensionFilter = 'all' | 'installed' | 'updates';
type VersionConfirmation = {
  extension: ExtensionReadSchema;
  release: ExtensionCatalogVersionSchema;
};

const hasUpdate = (extension: ExtensionReadSchema) =>
  extension.is_installed && Boolean(extension.recommended_version);

const platformFieldLabels = {
  os: 'ОС',
  architecture: 'Архитектура',
  python: 'Python',
  implementation: 'Реализация Python',
};

const releaseLimitation = (release: ExtensionCatalogVersionSchema) => {
  const differences = release.incompatibility_details ?? [];
  if (release.incompatibility === 'target') {
    const reasons = differences.flatMap(({ field, current, required }) =>
      field === 'dvt_version'
        ? []
        : [`${platformFieldLabels[field]}: ${current}, требуется ${required}`]
    );
    return reasons.length ? reasons.join(' · ') : 'Несовместимая платформа';
  }
  if (release.incompatibility === 'dvt_version') {
    const difference = differences.find(({ field }) => field === 'dvt_version');
    const requirement = difference?.required ?? release.dvt_version;
    if (difference?.current && requirement) {
      return `DVT ${difference.current}, требуется ${requirement}`;
    }
    return `Требуется DVT ${requirement ?? 'совместимой версии'}`;
  }
  return release.operation === 'reinstall' ? 'Установлено' : null;
};

const ReleaseChannelChip = ({
  channel,
}: Pick<ExtensionCatalogVersionSchema, 'channel'>) => (
  <Chip
    size='small'
    label={channel === 'rc' ? 'RC' : 'Stable'}
    sx={{
      height: 22,
      fontSize: 11,
      fontWeight: 600,
      justifySelf: 'start',
      ...(channel === 'rc' && {
        color: '#4338ca',
        bgcolor: '#eef2ff',
      }),
    }}
  />
);

const releaseMenuRowSx = {
  display: 'grid',
  gridColumn: '1 / -1',
  gridTemplateColumns: 'subgrid',
  alignItems: 'center',
  minHeight: 36,
  px: 1.25,
  py: 0.75,
  borderRadius: '8px',
  '@supports not (grid-template-columns: subgrid)': {
    gridTemplateColumns: '11ch 56px minmax(0, 1fr)',
    columnGap: 1.25,
  },
};

const versionAction = (
  operation?: ExtensionCatalogVersionSchema['operation']
) => {
  if (operation === 'upgrade') return 'Обновить';
  if (operation === 'downgrade') return 'Понизить версию';
  if (operation === 'reinstall') return 'Переустановить';
  return 'Установить';
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
  catalogReady: boolean;
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
  catalogReady,
  onReload,
  onDelete,
  onVersionChange,
}) => {
  const statusTone = getStatusTone(extension);
  const nodesCount = extension.manifest_json?.nodes?.length ?? 0;
  const releases = extension.catalog_versions ?? [];
  const selected = releases.find(
    release => release.version === selectedVersion
  );
  const recommended = extension.recommended_version;
  const defaultVersionLabel = recommended
    ? `По умолчанию: ${recommended}`
    : 'Выбрать версию';
  const canInstall =
    catalogReady &&
    (selected
      ? Boolean(selected.operation) && !selected.incompatibility
      : Boolean(recommended));
  const compatibleRcOnly =
    !extension.is_installed &&
    !recommended &&
    releases.some(
      release => release.channel === 'rc' && release.operation === 'install'
    );
  const operation =
    selected?.operation ?? (extension.is_installed ? 'upgrade' : 'install');

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
            <Stack
              direction='row'
              spacing={1.5}
              alignItems='flex-start'
              sx={{ minWidth: 0 }}
            >
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
                  flexWrap='wrap'
                  useFlexGap
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
                  {hasUpdate(extension) ? (
                    <Chip
                      label={`Доступно v${recommended}`}
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
                {compatibleRcOnly ? (
                  <Typography variant='body2' color='text.secondary'>
                    Для установки выберите RC.
                  </Typography>
                ) : null}
              </Box>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ flexShrink: 0 }}
            >
              {releases.length ? (
                <Select
                  value={selected?.version ?? ''}
                  inputProps={{
                    'aria-label': `Версия ${extension.display_name || extension.name}`,
                  }}
                  onChange={e => onVersionChange(e.target.value)}
                  size='small'
                  displayEmpty
                  autoWidth
                  renderValue={() =>
                    selected ? (
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <span>{selected.version}</span>
                        <ReleaseChannelChip channel={selected.channel} />
                      </Stack>
                    ) : (
                      <Typography color='text.secondary' sx={{ fontSize: 13 }}>
                        {defaultVersionLabel}
                      </Typography>
                    )
                  }
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          minWidth: 'min(300px, calc(100vw - 32px))',
                          maxWidth: 'min(540px, calc(100vw - 32px))',
                          borderRadius: '12px',
                          '& .MuiMenu-list': {
                            display: 'grid',
                            gridTemplateColumns:
                              'max-content max-content minmax(0, 1fr)',
                            columnGap: 1.25,
                            px: 0.5,
                            py: 0.5,
                          },
                        },
                      },
                    },
                  }}
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
                  <MenuItem
                    value=''
                    sx={{
                      gridColumn: '1 / -1',
                      minHeight: 36,
                      px: 1.25,
                      borderRadius: '8px',
                    }}
                  >
                    <Typography color='text.secondary' sx={{ fontSize: 13 }}>
                      {defaultVersionLabel}
                    </Typography>
                  </MenuItem>
                  {releases.map(release => (
                    <MenuItem
                      key={release.version}
                      value={release.version}
                      sx={releaseMenuRowSx}
                    >
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {release.version}
                      </Typography>
                      <ReleaseChannelChip channel={release.channel} />
                      <Typography
                        color='text.secondary'
                        sx={{
                          fontSize: 12,
                          lineHeight: 1.4,
                          whiteSpace: 'normal',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {releaseLimitation(release)}
                      </Typography>
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
                disabled={!canInstall || pendingAction !== null}
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
                {versionAction(operation)}
              </Button>
              {selected ? (
                <Button
                  href={selected.download_url}
                  variant='outlined'
                  sx={actionButtonSx}
                >
                  Скачать .dvtx
                </Button>
              ) : null}

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
                Перезагрузить
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
                  {recommended || extension.current_version || 'Неизвестно'}
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
  const [filter, setFilter] = React.useState<ExtensionFilter>('all');
  const [catalogReady, setCatalogReady] = React.useState(false);
  const [catalogError, setCatalogError] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [confirmation, setConfirmation] =
    React.useState<VersionConfirmation | null>(null);
  const syncInFlight = React.useRef(false);
  const localRevision = React.useRef(0);
  const opened = React.useRef(false);
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
  const [packagePreview, setPackagePreview] =
    React.useState<ExtensionPackagePreviewSchema | null>(null);
  const [packagePending, setPackagePending] = React.useState(false);
  const packageInputRef = React.useRef<HTMLInputElement | null>(null);

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
      localRevision.current++;
      setExtensions(prev =>
        [...prev.filter(item => item.name !== nextItem.name), nextItem].sort(
          (left, right) =>
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

  const refreshCatalog = React.useCallback(async () => {
    if (syncInFlight.current) return;
    syncInFlight.current = true;
    setSyncing(true);
    try {
      await extensionsApi.sync();
      let items: Array<ExtensionReadSchema>;
      let revision: number;
      do {
        revision = localRevision.current;
        items = await extensionsApi.list();
      } while (revision !== localRevision.current);
      setExtensions(items);
      setCatalogReady(true);
      setCatalogError(false);
    } catch {
      setCatalogReady(false);
      setCatalogError(true);
    } finally {
      syncInFlight.current = false;
      setSyncing(false);
    }
  }, []);

  React.useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    void loadExtensions().then(refreshCatalog);
  }, [loadExtensions, refreshCatalog]);

  const runAction = async (
    extensionName: string,
    action: NonNullable<PendingAction>,
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

  const handlePackageSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setGlobalError(null);
    setFlashMessage(null);
    setPackagePending(true);
    try {
      setPackagePreview(await extensionsApi.previewPackage(file));
    } catch (error) {
      setGlobalError(
        buildErrorPayload(error, 'Не удалось проверить пакет расширения.')
      );
    } finally {
      setPackagePending(false);
    }
  };

  const installPackage = async () => {
    if (!packagePreview) {
      return;
    }
    const preview = packagePreview;
    setGlobalError(null);
    setFlashMessage(null);
    setPackagePending(true);
    try {
      const installed = await extensionsApi.installPackage(preview.package_id, {
        allowDowngrade: preview.operation === 'downgrade',
        allowReinstall: preview.operation === 'reinstall',
      });
      replaceExtension(installed);
      setPackagePreview(null);
      setFlashMessage({
        severity: 'success',
        message: `Расширение "${installed.display_name || installed.name}" установлено из файла.`,
      });
    } catch (error) {
      setPackagePreview(null);
      setGlobalError(
        buildErrorPayload(error, 'Не удалось установить пакет расширения.')
      );
    } finally {
      setPackagePending(false);
    }
  };

  const catalogEntries = extensions.filter(
    extension =>
      extension.is_installed ||
      Boolean(
        extension.catalog_versions?.length ||
        extension.available_versions?.length
      )
  );
  const filteredExtensions = catalogEntries.filter(
    extension =>
      filter === 'all' ||
      (filter === 'installed' ? extension.is_installed : hasUpdate(extension))
  );

  const installFromCatalog = (
    extension: ExtensionReadSchema,
    release?: ExtensionCatalogVersionSchema
  ) => {
    const operation =
      release?.operation ?? (extension.is_installed ? 'upgrade' : 'install');
    void runAction(
      extension.name,
      'install',
      () =>
        extensionsApi.install(extension.name, release?.version ?? null, {
          allowDowngrade: operation === 'downgrade',
          allowReinstall: operation === 'reinstall',
        }),
      operation === 'upgrade'
        ? `Расширение «${extension.display_name}» обновлено.`
        : `Версия расширения «${extension.display_name}» установлена.`
    );
  };

  return (
    <>
      <PageLayout width='default' title='Extensions' icon={IconPuzzle}>
        <PageToolbar>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{
              '& .MuiButton-root': { whiteSpace: 'nowrap' },
            }}
          >
            <input
              ref={packageInputRef}
              type='file'
              accept='.dvtx,.zip,application/zip'
              hidden
              onChange={event => void handlePackageSelected(event)}
            />
            <Button
              variant='contained'
              startIcon={
                packagePending && !packagePreview ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <UploadFileRoundedIcon fontSize='small' />
                )
              }
              disabled={packagePending}
              onClick={() => packageInputRef.current?.click()}
              sx={{ ...actionButtonSx, backgroundColor: '#6366f1' }}
            >
              Установить из файла
            </Button>
            <Button
              variant='outlined'
              startIcon={
                syncing ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <RefreshRoundedIcon fontSize='small' />
                )
              }
              onClick={() => void refreshCatalog()}
              disabled={syncing}
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
              Обновить каталог
            </Button>
          </Stack>
        </PageToolbar>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          useFlexGap
          sx={{ mb: 2 }}
        >
          <Chip
            label={`Всего: ${catalogEntries.length}`}
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
              extensions.filter(hasUpdate).length
            }`}
            size='small'
            sx={statusChipSx('warning')}
          />
        </Stack>

        <Stack spacing={2.5}>
          {catalogError ? (
            <Alert severity='warning'>
              Не удалось обновить каталог. Показаны сохранённые данные.
            </Alert>
          ) : null}

          <ToggleButtonGroup
            exclusive
            value={filter}
            size='small'
            aria-label='Фильтр расширений'
            onChange={(_, value: ExtensionFilter | null) =>
              value && setFilter(value)
            }
          >
            <ToggleButton value='all'>Все</ToggleButton>
            <ToggleButton value='installed'>Установленные</ToggleButton>
            <ToggleButton value='updates'>Доступны обновления</ToggleButton>
          </ToggleButtonGroup>

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
            <Box
              sx={{
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
            </Box>
          ) : null}

          {!loading && !catalogEntries.length ? (
            <Box
              sx={{
                px: 3,
                py: 5,
                textAlign: 'center',
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
              <Typography
                sx={{ fontSize: 16, fontWeight: 700, color: '#111827' }}
              >
                Расширения не найдены
              </Typography>
              <Typography sx={{ mt: 0.75, fontSize: 13, color: '#6b7280' }}>
                После публикации расширений обновите каталог.
              </Typography>
            </Box>
          ) : null}

          {!loading &&
          catalogEntries.length > 0 &&
          filteredExtensions.length === 0 ? (
            <Typography color='text.secondary'>
              Нет расширений по этому фильтру.
            </Typography>
          ) : null}

          {!loading ? (
            <Stack spacing={2}>
              {filteredExtensions.map(extension => (
                <ExtensionListItem
                  key={extension.name}
                  extension={extension}
                  catalogReady={catalogReady && !syncing}
                  expanded={expandedNames.has(extension.name)}
                  pendingAction={pendingByName[extension.name] ?? null}
                  selectedVersion={selectedVersions[extension.name] ?? null}
                  onToggle={() => toggleExpanded(extension.name)}
                  onInstall={() => {
                    const release = extension.catalog_versions?.find(
                      item => item.version === selectedVersions[extension.name]
                    );
                    if (
                      release?.operation === 'downgrade' ||
                      release?.operation === 'reinstall'
                    ) {
                      setConfirmation({ extension, release });
                    } else {
                      installFromCatalog(extension, release);
                    }
                  }}
                  onReload={() =>
                    void runAction(
                      extension.name,
                      'reload',
                      () => extensionsApi.reload(extension.name),
                      `Расширение «${extension.display_name || extension.name}» перезагружено.`
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
        </Stack>
      </PageLayout>

      <Dialog
        open={packagePreview !== null}
        onClose={() => !packagePending && setPackagePreview(null)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Установка расширения из файла</DialogTitle>
        <DialogContent>
          {packagePreview ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                  {packagePreview.display_name}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 13, color: '#6b7280' }}>
                  {packagePreview.filename}
                </Typography>
              </Box>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label={`Версия ${packagePreview.version}`} size='small' />
                {packagePreview.current_version ? (
                  <Chip
                    label={`Установлена ${packagePreview.current_version}`}
                    size='small'
                  />
                ) : null}
                <Chip
                  label={
                    packagePreview.operation === 'upgrade'
                      ? 'Обновление'
                      : packagePreview.operation === 'downgrade'
                        ? 'Понижение версии'
                        : packagePreview.operation === 'reinstall'
                          ? 'Переустановка'
                          : 'Новая установка'
                  }
                  size='small'
                  sx={statusChipSx(
                    packagePreview.operation === 'downgrade'
                      ? 'warning'
                      : 'default'
                  )}
                />
              </Stack>
              <Typography sx={{ fontSize: 13, color: '#4b5563' }}>
                DVT: {packagePreview.dvt_version || 'любая версия'} ·
                Wheelhouse:{' '}
                {packagePreview.has_wheelhouse
                  ? `${packagePreview.bundled_wheels_count} wheel-файлов`
                  : 'не требуется или отсутствует'}
              </Typography>
              {(packagePreview.warnings ?? []).map(warning => (
                <Alert key={warning} severity='warning'>
                  {warning}
                </Alert>
              ))}
              {!packagePreview.offline_ready ? (
                <Alert severity='error'>
                  Пакет нельзя установить автономно: проверьте совместимость с
                  DVT и наличие wheelhouse для Python-зависимостей.
                </Alert>
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            disabled={packagePending}
            onClick={() => setPackagePreview(null)}
          >
            Отмена
          </Button>
          <Button
            variant='contained'
            disabled={packagePending || !packagePreview?.offline_ready}
            startIcon={
              packagePending ? (
                <CircularProgress size={16} color='inherit' />
              ) : undefined
            }
            onClick={() => void installPackage()}
          >
            {packagePreview?.operation === 'downgrade'
              ? 'Понизить версию'
              : packagePreview?.operation === 'reinstall'
                ? 'Переустановить'
                : packagePreview?.operation === 'upgrade'
                  ? 'Обновить'
                  : 'Установить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmation !== null}
        onClose={() => setConfirmation(null)}
      >
        <DialogTitle>
          {versionAction(confirmation?.release.operation)}?
        </DialogTitle>
        {confirmation ? (
          <DialogContent>
            {confirmation.extension.display_name}. Текущая версия{' '}
            {confirmation.extension.current_version}. Выбранная версия{' '}
            {confirmation.release.version}.
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button onClick={() => setConfirmation(null)}>Отмена</Button>
          <Button
            disabled={!catalogReady || syncing}
            onClick={() => {
              if (!confirmation) return;
              installFromCatalog(confirmation.extension, confirmation.release);
              setConfirmation(null);
            }}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};
