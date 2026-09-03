import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import HubIcon from '@mui/icons-material/HubOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { type Dayjs } from 'dayjs';

import { useAlert } from '@/app/notifications';

import { useMcpTokens } from '@/entities/admin/mcp-token';
import {
  type DBConnectionRecord,
  useConnections,
} from '@/entities/data/db-connection';
import { useProjects } from '@/entities/project/projects';

import type {
  McpTokenReadSchema,
  ProjectReadSchema,
} from '@/shared/gatewayClient';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import { MultiOptionDropdownSelect } from '@/shared/ui/select';

import {
  buildResourceScope,
  isResourceScopeValid,
  type ResourceScopeMode,
} from '../lib/mcpTokenScope';

import {
  AccessKeysPageLayout,
  type AccessKeysStatusFilter,
} from './AccessKeysPageLayout';
import {
  AccessKeyIconBox,
  AccessKeysInfoBar,
  AccessKeysTableSkeleton,
  AccessKeyStatusBadge,
  CreatedAtCell,
  ExpiresAtCell,
  getAccessKeyVisualStatus,
} from './AccessKeysTableUi';

const getErrorMessage = (error: unknown, fallback: string) =>
  (error as { message?: string })?.message ?? fallback;

const scopeLabel = (
  scope: McpTokenReadSchema['access_scope']['projects'],
  resourceName: string
) =>
  scope.mode === 'all'
    ? `${resourceName}: все`
    : `${resourceName}: ${scope.ids?.length ?? 0}`;

type McpTokenExpiryMode = '30d' | '90d' | '1y' | 'never' | 'date';

const MCP_TOKEN_EXPIRY_OPTIONS: Array<{
  value: McpTokenExpiryMode;
  label: string;
}> = [
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
  { value: '1y', label: '1 год' },
  { value: 'never', label: 'Бессрочно' },
  { value: 'date', label: 'Дата' },
];

const formatResourceCount = (
  count: number,
  forms: [string, string, string]
) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form =
    mod10 === 1 && mod100 !== 11
      ? forms[0]
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? forms[1]
        : forms[2];

  return `${count} ${form}`;
};

type ScopeSelectorProps<T extends { id: string }> = {
  title: string;
  allLabel: string;
  selectedLabel: string;
  placeholder: string;
  mode: ResourceScopeMode;
  onModeChange: (mode: ResourceScopeMode) => void;
  options: T[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  getOptionLabel: (option: T) => string;
  loading: boolean;
  emptyText: string;
};

const ScopeSelector = <T extends { id: string }>({
  title,
  allLabel,
  selectedLabel,
  placeholder,
  mode,
  onModeChange,
  options,
  selectedIds,
  onSelectedIdsChange,
  getOptionLabel,
  loading,
  emptyText,
}: ScopeSelectorProps<T>) => {
  const comboboxOptions = useMemo(
    () =>
      options.map(option => ({
        value: option.id,
        label: getOptionLabel(option),
      })),
    [getOptionLabel, options]
  );

  return (
    <Box>
      <Typography sx={{ mb: 0.65, fontSize: 12.5, fontWeight: 600 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0.4,
          p: 0.35,
          bgcolor: 'rgba(248, 250, 252, 0.92)',
          border: 1,
          borderColor: 'divider',
          borderRadius: '10px',
        }}
      >
        {(
          [
            { value: 'all', label: allLabel },
            { value: 'selected', label: selectedLabel },
          ] as const
        ).map(option => {
          const selected = mode === option.value;

          return (
            <Button
              key={option.value}
              disableRipple
              onClick={() => onModeChange(option.value)}
              sx={{
                minHeight: 32,
                color: selected ? 'text.primary' : 'text.secondary',
                bgcolor: selected ? 'background.paper' : 'transparent',
                border: selected ? 1 : 0,
                borderColor: 'divider',
                borderRadius: '8px',
                boxShadow: selected
                  ? '0 1px 3px rgba(15, 23, 42, 0.08)'
                  : 'none',
                fontSize: 12,
                fontWeight: selected ? 600 : 500,
                '&:hover': {
                  bgcolor: selected ? 'background.paper' : 'transparent',
                },
              }}
            >
              {option.label}
            </Button>
          );
        })}
      </Box>
      {mode === 'selected' && (
        <Box sx={{ mt: 1 }}>
          <MultiOptionDropdownSelect
            value={selectedIds}
            options={comboboxOptions}
            placeholder={loading ? 'Загрузка…' : placeholder}
            loading={loading}
            noOptionText={emptyText}
            error={selectedIds.length === 0}
            onChange={onSelectedIdsChange}
            sx={{
              minHeight: 40,
              boxShadow: 'none',
            }}
            textFieldSx={{ borderRadius: '9px' }}
          />
          {selectedIds.length === 0 && (
            <Typography sx={{ mt: 0.5, color: 'error.main', fontSize: 11.5 }}>
              Выберите хотя бы один вариант
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

type McpTokensSectionProps = {
  apiKeyCount: number;
  onShowApiKeys: () => void;
};

export const McpTokensSection: React.FC<McpTokensSectionProps> = ({
  apiKeyCount,
  onShowApiKeys,
}) => {
  const {
    items,
    status,
    error,
    creationStatus,
    createdSecret,
    loadMcpTokens,
    createMcpToken,
    revokeMcpToken,
    resetCreationState,
    resetDeletionState,
  } = useMcpTokens();
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    loadProjects,
  } = useProjects();
  const {
    connections,
    loading: connectionsLoading,
    error: connectionsError,
    fetchConnections,
  } = useConnections();
  const { showNotification } = useAlert();
  const { confirm } = useConfirmDialog();

  const [createOpen, setCreateOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTokenId, setMenuTokenId] = useState<string | null>(null);
  const menuOpen = Boolean(anchorEl);
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState<Dayjs | null>(null);
  const [expiryMode, setExpiryMode] = useState<McpTokenExpiryMode>('never');
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [projectsMode, setProjectsMode] = useState<ResourceScopeMode>('all');
  const [connectionsMode, setConnectionsMode] =
    useState<ResourceScopeMode>('all');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>(
    []
  );
  const [showSecret, setShowSecret] = useState(false);
  const secretInputRef = useRef<HTMLInputElement | null>(null);
  const [createdTokenName, setCreatedTokenName] = useState('');
  const [createdTokenAccess, setCreatedTokenAccess] = useState(
    'все проекты · все подключения'
  );
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<AccessKeysStatusFilter>('all');

  const projectOptions = projects ?? [];
  const isLoading = status === 'loading';

  const fetchTokens = useCallback(async () => {
    try {
      await loadMcpTokens();
    } catch (loadError) {
      showNotification({
        type: 'error',
        title: 'Не удалось загрузить MCP-токены',
        description: getErrorMessage(
          loadError,
          'Не удалось загрузить MCP-токены'
        ),
        group: 'mcp-tokens-load',
      });
    }
  }, [loadMcpTokens, showNotification]);

  useEffect(() => {
    void fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    if (!createOpen) return;

    if (projects === null) {
      void loadProjects();
    }
    if (connections.length === 0) {
      void fetchConnections();
    }
  }, [
    connections.length,
    createOpen,
    fetchConnections,
    loadProjects,
    projects,
  ]);

  const resetForm = () => {
    setName('');
    setExpiresAt(null);
    setExpiryMode('never');
    setPickerError(null);
    setProjectsMode('all');
    setConnectionsMode('all');
    setSelectedProjectIds([]);
    setSelectedConnectionIds([]);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    tokenId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuTokenId(tokenId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTokenId(null);
  };

  const handleExpiryModeChange = (mode: McpTokenExpiryMode) => {
    setExpiryMode(mode);
    setPickerError(null);

    if (mode === '30d') setExpiresAt(dayjs().add(30, 'day'));
    if (mode === '90d') setExpiresAt(dayjs().add(90, 'day'));
    if (mode === '1y') setExpiresAt(dayjs().add(1, 'year'));
    if (mode === 'never') setExpiresAt(null);
    if (mode === 'date' && !expiresAt) setExpiresAt(dayjs().add(30, 'day'));
  };

  const canCreate =
    !pickerError &&
    isResourceScopeValid(projectsMode, selectedProjectIds) &&
    isResourceScopeValid(connectionsMode, selectedConnectionIds);

  const expirationSummary = expiresAt
    ? expiresAt.format('DD.MM.YYYY HH:mm')
    : 'Бессрочный';

  const closeCreatedTokenDialog = () => {
    setShowSecret(false);
    resetCreationState();
  };

  const normalizedSearch = searchValue.trim().toLocaleLowerCase('ru');
  const visibleItems = items.filter(token => {
    const visualStatus = getAccessKeyVisualStatus(token.expires_at);
    const matchesSearch =
      !normalizedSearch ||
      (token.name ?? 'Без названия')
        .toLocaleLowerCase('ru')
        .includes(normalizedSearch);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'expired'
        ? visualStatus === 'expired'
        : visualStatus !== 'expired');

    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!canCreate || creationStatus === 'loading') return;

    try {
      const submittedName = name.trim() || 'MCP-токен';
      const submittedAccess = `${
        projectsMode === 'all'
          ? 'все проекты'
          : formatResourceCount(selectedProjectIds.length, [
              'проект',
              'проекта',
              'проектов',
            ])
      } · ${
        connectionsMode === 'all'
          ? 'все подключения'
          : formatResourceCount(selectedConnectionIds.length, [
              'подключение',
              'подключения',
              'подключений',
            ])
      }`;

      await createMcpToken({
        name: name.trim() || null,
        expires_at: expiresAt?.unix() ?? null,
        access_scope: {
          schema_version: 1,
          purpose: 'mcp',
          projects: buildResourceScope(projectsMode, selectedProjectIds),
          db_connections: buildResourceScope(
            connectionsMode,
            selectedConnectionIds
          ),
        },
      });
      setCreatedTokenName(submittedName);
      setCreatedTokenAccess(submittedAccess);
      setCreateOpen(false);
      setShowSecret(false);
      resetForm();
      showNotification({
        type: 'success',
        title: 'MCP-токен создан',
        group: 'mcp-tokens-create',
      });
    } catch (createError) {
      showNotification({
        type: 'error',
        title: 'Не удалось создать MCP-токен',
        description: getErrorMessage(
          createError,
          'Не удалось создать MCP-токен'
        ),
        group: 'mcp-tokens-create',
      });
    }
  };

  const handleRevoke = async (token: McpTokenReadSchema) => {
    try {
      await revokeMcpToken(token.id);
      showNotification({
        type: 'success',
        title: 'MCP-токен отозван',
        group: 'mcp-tokens-revoke',
      });
    } catch (revokeError) {
      showNotification({
        type: 'error',
        title: 'Не удалось отозвать MCP-токен',
        description: getErrorMessage(
          revokeError,
          'Не удалось отозвать MCP-токен'
        ),
        group: 'mcp-tokens-revoke',
      });
    } finally {
      resetDeletionState();
    }
  };

  const handleCopy = async () => {
    if (!createdSecret) return;

    try {
      if (
        window.isSecureContext &&
        typeof navigator.clipboard?.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(createdSecret);
      } else {
        secretInputRef.current?.focus();
        secretInputRef.current?.select();
        document.execCommand('copy');
      }
      showNotification({
        type: 'success',
        title: 'MCP-токен скопирован',
        group: 'mcp-token-copy',
      });
    } catch {
      secretInputRef.current?.focus();
      secretInputRef.current?.select();
      showNotification({
        type: 'info',
        title: 'Токен выделен. Нажмите Ctrl+C',
        group: 'mcp-token-copy',
      });
    }
  };

  return (
    <>
      <AccessKeysPageLayout
        activeTab='mcp'
        apiKeyCount={apiKeyCount}
        mcpTokenCount={items.length}
        onTabChange={tab => {
          if (tab === 'api') onShowApiKeys();
        }}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        createLabel='Новый токен'
        onCreate={() => {
          resetForm();
          setCreateOpen(true);
        }}
      >
        <Paper
          variant='outlined'
          sx={{
            mt: 2.75,
            overflow: 'hidden',
            borderRadius: '16px',
            borderColor: 'divider',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <AccessKeysInfoBar>
            Токен показывается <b>один раз</b>. Его доступ ограничивается
            выбранными проектами и подключениями.
          </AccessKeysInfoBar>

          {error && !isLoading && (
            <Alert severity='error' sx={{ m: 2 }}>
              {error.description ?? error.message}
            </Alert>
          )}

          <Box
            sx={{
              display: { xs: 'none', lg: 'grid' },
              gridTemplateColumns:
                'minmax(250px, 1.2fr) minmax(220px, 0.9fr) 156px 168px 44px',
              alignItems: 'center',
              minHeight: 34,
              px: 2.5,
              borderBottom: 1,
              borderColor: 'divider',
              color: 'text.disabled',
            }}
          >
            {['Название', 'Доступ', 'Создан', 'Экспирация', ''].map(label => (
              <Typography
                key={label || 'actions'}
                sx={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>

          {isLoading && <AccessKeysTableSkeleton variant='mcp' rows={3} />}

          {!isLoading && !error && visibleItems.length === 0 && (
            <Box sx={{ px: 3, py: 5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                {items.length === 0
                  ? 'У вас пока нет MCP-токенов.'
                  : 'Токены с такими параметрами не найдены.'}
              </Typography>
            </Box>
          )}

          {visibleItems.map(token => {
            const visualStatus = getAccessKeyVisualStatus(token.expires_at);

            return (
              <Box
                key={token.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr) 36px',
                    lg: 'minmax(250px, 1.2fr) minmax(220px, 0.9fr) 156px 168px 44px',
                  },
                  alignItems: 'center',
                  minHeight: 64,
                  px: 2.5,
                  py: { xs: 1.25, lg: 0.75 },
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                  '&:hover': { bgcolor: 'action.hover' },
                  opacity: visualStatus === 'expired' ? 0.72 : 1,
                }}
              >
                <Stack
                  direction='row'
                  alignItems='center'
                  gap={1.35}
                  minWidth={0}
                >
                  <AccessKeyIconBox tone='mcp'>
                    <HubIcon />
                  </AccessKeyIconBox>
                  <Box minWidth={0}>
                    <Stack
                      direction='row'
                      alignItems='center'
                      gap={0.8}
                      flexWrap='wrap'
                    >
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 650,
                          color: 'text.primary',
                        }}
                      >
                        {token.name ?? 'Без названия'}
                      </Typography>
                      <AccessKeyStatusBadge status={visualStatus} />
                    </Stack>
                    <Typography
                      noWrap
                      sx={{ mt: 0.1, fontSize: 12, color: 'text.disabled' }}
                    >
                      MCP-токен
                    </Typography>
                    <Stack
                      gap={0.75}
                      sx={{ display: { xs: 'flex', lg: 'none' }, mt: 0.85 }}
                    >
                      <Stack direction='row' gap={0.65} flexWrap='wrap'>
                        <Chip
                          size='small'
                          label={scopeLabel(
                            token.access_scope.projects,
                            'Проекты'
                          )}
                        />
                        <Chip
                          size='small'
                          label={scopeLabel(
                            token.access_scope.db_connections,
                            'Подключения'
                          )}
                        />
                      </Stack>
                      <Stack direction='row' gap={2}>
                        <CreatedAtCell value={token.created_at} />
                        <ExpiresAtCell
                          value={token.expires_at}
                          status={visualStatus}
                        />
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>

                <Stack
                  direction='row'
                  gap={0.65}
                  flexWrap='wrap'
                  sx={{ display: { xs: 'none', lg: 'flex' } }}
                >
                  <Chip
                    size='small'
                    label={scopeLabel(token.access_scope.projects, 'Проекты')}
                    sx={{ height: 23, borderRadius: '6px', fontSize: 11.5 }}
                  />
                  <Chip
                    size='small'
                    label={scopeLabel(
                      token.access_scope.db_connections,
                      'Подключения'
                    )}
                    sx={{ height: 23, borderRadius: '6px', fontSize: 11.5 }}
                  />
                </Stack>
                <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                  <CreatedAtCell value={token.created_at} />
                </Box>
                <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                  <ExpiresAtCell
                    value={token.expires_at}
                    status={visualStatus}
                  />
                </Box>
                <Tooltip title='Действия'>
                  <IconButton
                    size='small'
                    disableRipple
                    onClick={event => handleMenuOpen(event, token.id)}
                    aria-label={`Действия с токеном ${
                      token.name ?? 'MCP-токен'
                    }`}
                    sx={{
                      width: 32,
                      height: 32,
                      color: 'text.disabled',
                      borderRadius: '7px',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <MoreVertIcon sx={{ fontSize: 19 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
        </Paper>
      </AccessKeysPageLayout>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 176,
            mt: 0.5,
            p: 0.75,
            borderRadius: '12px',
            borderColor: 'divider',
            boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
          },
        }}
        MenuListProps={{ disablePadding: true }}
      >
        <MenuItem
          onClick={() => {
            const token = items.find(item => item.id === menuTokenId);
            handleMenuClose();
            if (!token) return;

            void confirm({
              title: 'Удалить MCP-токен?',
              message: `Токен «${token.name ?? 'Без названия'}» сразу перестанет работать. Это действие нельзя отменить.`,
              confirmLabel: 'Удалить',
              cancelLabel: 'Отмена',
              confirmColor: 'error',
              maxWidth: 'xs',
              onConfirm: () => handleRevoke(token),
            });
          }}
          sx={{
            minHeight: 38,
            px: 1.25,
            gap: 1.15,
            color: 'error.main',
            borderRadius: '8px',
            fontSize: 13,
            fontWeight: 500,
            '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.06)' },
          }}
        >
          <DeleteIcon sx={{ fontSize: 18 }} />
          Удалить
        </MenuItem>
      </Menu>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            width: 560,
            maxWidth: 'calc(100% - 32px)',
            borderRadius: '18px',
            overflow: 'hidden',
          },
        }}
      >
        <Stack
          direction='row'
          alignItems='center'
          gap={1.5}
          sx={{ px: 2.75, py: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <AccessKeyIconBox tone='api'>
            <HubIcon />
          </AccessKeyIconBox>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}
            >
              Новый MCP-токен
            </Typography>
            <Typography
              sx={{ mt: 0.1, color: 'text.secondary', fontSize: 12.5 }}
            >
              Ограничьте доступ MCP-сервера конкретными проектами и
              подключениями.
            </Typography>
          </Box>
          <IconButton
            size='small'
            onClick={() => setCreateOpen(false)}
            aria-label='Закрыть создание MCP-токена'
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Stack>

        <DialogContent sx={{ px: 2.75, py: 2.5 }}>
          <Stack spacing={2.15}>
            <Box>
              <Typography sx={{ mb: 0.65, fontSize: 12.5, fontWeight: 600 }}>
                Название
              </Typography>
              <TextField
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder='Codex app'
                fullWidth
                size='small'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    minHeight: 40,
                    borderRadius: '9px',
                    '&.Mui-focused': { boxShadow: 'none' },
                  },
                }}
              />
              <Typography
                sx={{ mt: 0.65, color: 'text.disabled', fontSize: 11.5 }}
              >
                Необязательно — по умолчанию «MCP-токен».
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ mb: 0.65, fontSize: 12.5, fontWeight: 600 }}>
                Срок действия
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                  gap: 0.4,
                  p: 0.35,
                  bgcolor: 'rgba(248, 250, 252, 0.92)',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: '10px',
                }}
              >
                {MCP_TOKEN_EXPIRY_OPTIONS.map(option => {
                  const selected = expiryMode === option.value;

                  return (
                    <Button
                      key={option.value}
                      disableRipple
                      onClick={() => handleExpiryModeChange(option.value)}
                      sx={{
                        minWidth: 0,
                        minHeight: 32,
                        px: 0.75,
                        color: selected ? 'text.primary' : 'text.secondary',
                        bgcolor: selected ? 'background.paper' : 'transparent',
                        border: selected ? 1 : 0,
                        borderColor: 'divider',
                        borderRadius: '8px',
                        boxShadow: selected
                          ? '0 1px 3px rgba(15, 23, 42, 0.08)'
                          : 'none',
                        fontSize: 12,
                        fontWeight: selected ? 600 : 500,
                        '&:hover': {
                          bgcolor: selected
                            ? 'background.paper'
                            : 'transparent',
                        },
                      }}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </Box>

              {expiryMode === 'date' && (
                <DateTimePicker
                  value={expiresAt}
                  onChange={setExpiresAt}
                  ampm={false}
                  format='DD.MM.YYYY HH:mm'
                  reduceAnimations
                  onError={reason =>
                    setPickerError(
                      reason ? 'Неверный формат даты/времени' : null
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      error: Boolean(pickerError),
                      helperText: pickerError,
                      placeholder: 'дд.мм.гггг чч:мм',
                      sx: {
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '9px',
                          '&.Mui-focused': { boxShadow: 'none' },
                        },
                      },
                      InputProps: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              onClick={() => setExpiresAt(null)}
                              size='small'
                              aria-label='Очистить дату MCP-токена'
                            >
                              <ClearIcon fontSize='small' />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              )}
            </Box>

            {(projectsError || connectionsError) && (
              <Alert severity='warning' sx={{ py: 0.75 }}>
                Не все ресурсы удалось загрузить. Обновите страницу и попробуйте
                снова.
              </Alert>
            )}

            <Stack
              spacing={2}
              sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}
            >
              <ScopeSelector<ProjectReadSchema>
                title='Разрешённые проекты'
                allLabel='Все проекты'
                selectedLabel='Только выбранные'
                placeholder='Выберите проекты'
                mode={projectsMode}
                onModeChange={setProjectsMode}
                options={projectOptions}
                selectedIds={selectedProjectIds}
                onSelectedIdsChange={setSelectedProjectIds}
                getOptionLabel={project => project.name || project.id}
                loading={projectsLoading}
                emptyText='Нет доступных проектов'
              />

              <ScopeSelector<DBConnectionRecord>
                title='Разрешённые подключения'
                allLabel='Все подключения'
                selectedLabel='Только выбранные'
                placeholder='Выберите подключения'
                mode={connectionsMode}
                onModeChange={setConnectionsMode}
                options={connections}
                selectedIds={selectedConnectionIds}
                onSelectedIdsChange={setSelectedConnectionIds}
                getOptionLabel={connection =>
                  `${connection.name} (${connection.type})`
                }
                loading={connectionsLoading}
                emptyText='Нет доступных подключений'
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.75,
            py: 1.5,
            justifyContent: 'space-between',
            bgcolor: 'rgba(248, 250, 252, 0.8)',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            Экспирация:{' '}
            <Box
              component='span'
              sx={{ color: 'text.primary', fontWeight: 600 }}
            >
              {expirationSummary}
            </Box>
          </Typography>
          <Stack direction='row' gap={1}>
            <Button
              variant='outlined'
              disableRipple
              onClick={() => setCreateOpen(false)}
              sx={{
                minHeight: 36,
                px: 2,
                color: 'text.secondary',
                bgcolor: 'background.paper',
                borderColor: 'divider',
                borderRadius: '9px',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  boxShadow: 'none',
                },
              }}
            >
              Отмена
            </Button>
            <Button
              variant='contained'
              disableRipple
              startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
              onClick={() => void handleCreate()}
              disabled={!canCreate || creationStatus === 'loading'}
              sx={{
                minWidth: 150,
                minHeight: 36,
                px: 2,
                borderRadius: '9px',
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(148, 163, 184, 0.1)',
                  color: 'rgba(100, 116, 139, 0.35)',
                },
              }}
            >
              Создать токен
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(createdSecret)}
        onClose={(_event, reason) => {
          if (reason === 'backdropClick') return;
        }}
        disableEscapeKeyDown
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            width: 560,
            maxWidth: 'calc(100% - 32px)',
            borderRadius: '18px',
            overflow: 'hidden',
          },
        }}
      >
        <Stack
          direction='row'
          alignItems='center'
          sx={{ px: 2.75, py: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}
            >
              MCP-токен создан
            </Typography>
            <Typography
              noWrap
              sx={{ mt: 0.15, color: 'text.secondary', fontSize: 12.5 }}
            >
              «{createdTokenName || 'MCP-токен'}» готов к использованию
            </Typography>
          </Box>
          <IconButton
            size='small'
            onClick={closeCreatedTokenDialog}
            aria-label='Закрыть окно созданного MCP-токена'
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Stack>

        <DialogContent sx={{ px: 2.75, py: 2.75 }}>
          <Stack alignItems='center' textAlign='center'>
            <Box
              sx={{
                width: 46,
                height: 46,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#0f9f6e',
                borderRadius: '13px',
              }}
            >
              <GppGoodOutlinedIcon sx={{ fontSize: 23 }} />
            </Box>
            <Typography sx={{ mt: 1.2, fontSize: 16, fontWeight: 700 }}>
              Сохраните токен
            </Typography>
            <Typography
              sx={{
                mt: 0.55,
                maxWidth: 350,
                color: 'text.secondary',
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              Передавайте его только доверенным MCP-клиентам — токен действует
              от вашего имени.
            </Typography>
          </Stack>

          <Box sx={{ mt: 2.25 }}>
            <Typography sx={{ mb: 0.65, fontSize: 12.5, fontWeight: 600 }}>
              Секретный токен
            </Typography>
            <TextField
              fullWidth
              value={createdSecret ?? ''}
              type={showSecret ? 'text' : 'password'}
              inputRef={secretInputRef}
              inputProps={{
                'aria-label': 'Секретный MCP-токен',
                style: { fontFamily: 'monospace', fontSize: 13 },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: 44,
                  pr: 0,
                  borderRadius: '9px',
                  '&.Mui-focused': { boxShadow: 'none' },
                },
              }}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position='end' sx={{ height: 44, ml: 0 }}>
                    <IconButton
                      aria-label={
                        showSecret ? 'Скрыть токен' : 'Показать токен'
                      }
                      onClick={() => setShowSecret(value => !value)}
                      sx={{
                        width: 42,
                        height: 42,
                        borderLeft: 1,
                        borderColor: 'divider',
                        borderRadius: 0,
                        color: 'text.secondary',
                      }}
                    >
                      {showSecret ? (
                        <VisibilityOff sx={{ fontSize: 17 }} />
                      ) : (
                        <Visibility sx={{ fontSize: 17 }} />
                      )}
                    </IconButton>
                    <Tooltip title='Скопировать'>
                      <IconButton
                        onClick={() => void handleCopy()}
                        aria-label='Скопировать MCP-токен'
                        sx={{
                          width: 42,
                          height: 42,
                          borderLeft: 1,
                          borderColor: 'divider',
                          borderRadius: 0,
                          color: 'text.secondary',
                        }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Stack
            direction='row'
            alignItems='flex-start'
            gap={1.15}
            sx={{
              mt: 2,
              px: 1.5,
              py: 1.25,
              color: '#985c00',
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              border: 1,
              borderColor: 'rgba(245, 158, 11, 0.42)',
              borderRadius: '9px',
            }}
          >
            <WarningAmberRoundedIcon sx={{ mt: 0.05, fontSize: 18 }} />
            <Typography sx={{ fontSize: 12, lineHeight: 1.5 }}>
              После закрытия окна значение не восстановить — скопируйте и
              сохраните его в надёжном месте.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.75,
            py: 1.5,
            justifyContent: 'space-between',
            bgcolor: 'rgba(248, 250, 252, 0.8)',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            Доступ:{' '}
            <Box
              component='span'
              sx={{ color: 'text.primary', fontWeight: 600 }}
            >
              {createdTokenAccess}
            </Box>
          </Typography>
          <Button
            variant='contained'
            disableRipple
            onClick={closeCreatedTokenDialog}
            sx={{
              minWidth: 76,
              minHeight: 36,
              borderRadius: '9px',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' },
            }}
          >
            Готово
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
