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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/VpnKey';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
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
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

import { useAlert } from '@/app/notifications';

import { useApiKeys } from '@/entities/admin/api-key';
import { useMcpTokens } from '@/entities/admin/mcp-token';

import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import {
  AccessKeysPageLayout,
  type AccessKeysStatusFilter,
  type AccessKeysTab,
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
import { McpTokensSection } from './McpTokensSection';

import 'dayjs/locale/ru';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.locale('ru');

const toUnix = (d: Dayjs | null): number | undefined =>
  d ? d.unix() : undefined;
const isIPv4 = (v: string) =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(v) &&
  v.split('.').every(o => Number(o) >= 0 && Number(o) <= 255);

type ClipboardCopyResult = 'copied' | 'manual' | 'failed';
type ApiKeyExpiryMode = '30d' | '90d' | '1y' | 'never' | 'date';

const API_KEY_EXPIRY_OPTIONS: Array<{
  value: ApiKeyExpiryMode;
  label: string;
}> = [
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
  { value: '1y', label: '1 год' },
  { value: 'never', label: 'Бессрочно' },
  { value: 'date', label: 'Дата' },
];

const canUseAsyncClipboard = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard?.writeText === 'function';

const selectInputText = (
  input: HTMLInputElement | HTMLTextAreaElement | null,
  textLength: number
): boolean => {
  if (!input) return false;

  input.focus();
  input.select();

  try {
    input.setSelectionRange(0, textLength);
  } catch {
    // Some input types may not support explicit selection range updates.
  }

  return true;
};

const fallbackCopyFromInput = (
  input: HTMLInputElement | HTMLTextAreaElement | null,
  text: string
) => {
  const selected = selectInputText(input, text.length);
  if (!selected || typeof document === 'undefined') {
    return { selected, copied: false };
  }

  try {
    return { selected, copied: document.execCommand('copy') };
  } catch {
    return { selected, copied: false };
  }
};

const copyTextToClipboard = async (
  text: string,
  input: HTMLInputElement | HTMLTextAreaElement | null
): Promise<ClipboardCopyResult> => {
  if (!text) return 'failed';

  try {
    if (canUseAsyncClipboard()) {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    // noop, fallback below
  }

  const { selected, copied } = fallbackCopyFromInput(input, text);
  if (copied && typeof window !== 'undefined' && window.isSecureContext) {
    return 'copied';
  }
  if (selected) {
    return 'manual';
  }

  return 'failed';
};

export const ApiKeysPanel: React.FC = () => {
  const {
    items: tokens,
    isLoading,
    creationStatus,
    createdSecret,
    loadApiKeys,
    createApiKey: createApiKeyAction,
    deleteApiKey: deleteApiKeyAction,
    resetCreationState,
    resetDeletionState,
  } = useApiKeys();
  const { items: mcpTokens, status: mcpStatus, loadMcpTokens } = useMcpTokens();

  const [activeTab, setActiveTab] = useState<AccessKeysTab>('api');
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<AccessKeysStatusFilter>('all');

  const [createOpen, setCreateOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTokenId, setMenuTokenId] = useState<string | null>(null);
  const menuOpen = Boolean(anchorEl);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState<Dayjs | null>(null);
  const [expiryMode, setExpiryMode] = useState<ApiKeyExpiryMode>('never');
  const [ipInput, setIpInput] = useState('');
  const [ips, setIps] = useState<string[]>([]);
  const [ipError, setIpError] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const [showSecret, setShowSecret] = useState(false);
  const createdSecretInputRef = useRef<HTMLInputElement | null>(null);
  const [createdKeyName, setCreatedKeyName] = useState('');
  const [createdKeyExpiration, setCreatedKeyExpiration] =
    useState('Бессрочный');

  const { showNotification } = useAlert();
  const { confirm } = useConfirmDialog();

  const fetchTokens = useCallback(async () => {
    try {
      await loadApiKeys();
    } catch (error) {
      const message =
        (error as { message?: string })?.message ??
        'Не удалось загрузить токены';
      showNotification({
        type: 'error',
        title: 'Не удалось загрузить токены',
        description: message,
        group: 'api-keys-panel-load',
      });
    }
  }, [loadApiKeys, showNotification]);

  useEffect(() => {
    void fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    if (mcpStatus === 'idle') {
      void loadMcpTokens().catch(() => undefined);
    }
  }, [loadMcpTokens, mcpStatus]);

  const resetCreateForm = () => {
    setName('');
    setDescription('');
    setExpiresAt(null);
    setExpiryMode('never');
    setIpInput('');
    setIps([]);
    setIpError(null);
    setPickerError(null);
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(e.currentTarget);
    setMenuTokenId(id);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTokenId(null);
  };

  const handleAddIp = () => {
    const v = ipInput.trim();
    if (!v) return;
    if (!isIPv4(v)) {
      setIpError('Введите корректный IPv4-адрес');
      return;
    }
    if (ips.includes(v)) {
      setIpError('Этот IP-адрес уже добавлен');
      return;
    }
    setIpError(null);
    setIps(prev => [...prev, v]);
    setIpInput('');
  };
  const handleDeleteIp = (ip: string) => {
    setIps(prev => prev.filter(i => i !== ip));
    setIpError(null);
  };

  const handleExpiryModeChange = (mode: ApiKeyExpiryMode) => {
    setExpiryMode(mode);
    setPickerError(null);

    if (mode === '30d') setExpiresAt(dayjs().add(30, 'day'));
    if (mode === '90d') setExpiresAt(dayjs().add(90, 'day'));
    if (mode === '1y') setExpiresAt(dayjs().add(1, 'year'));
    if (mode === 'never') setExpiresAt(null);
    if (mode === 'date' && !expiresAt) setExpiresAt(dayjs().add(30, 'day'));
  };

  const canCreate = useMemo(
    () => name.trim().length > 0 && !pickerError,
    [name, pickerError]
  );

  const expirationSummary = expiresAt
    ? expiresAt.format('DD.MM.YYYY HH:mm')
    : 'Бессрочный';

  const closeCreatedKeyDialog = () => {
    setShowSecret(false);
    resetCreationState();
  };

  const onCreate = async () => {
    if (!canCreate || creationStatus === 'loading') return;

    try {
      const submittedName = name.trim();
      const submittedExpiration = expirationSummary;

      await createApiKeyAction({
        name: submittedName,
        description: description.trim() ?? null,
        expires_at: toUnix(expiresAt) ?? null,
        whitelisted_ip_addresses: ips.length > 0 ? ips : null,
      });

      setCreatedKeyName(submittedName);
      setCreatedKeyExpiration(submittedExpiration);
      setShowSecret(false);
      showNotification({
        type: 'success',
        title: 'API-ключ создан',
        group: 'api-keys-panel-create',
      });
      setCreateOpen(false);
      resetCreateForm();
      await fetchTokens();
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? 'Ошибка создания API ключа';
      showNotification({
        type: 'error',
        title: 'Не удалось создать API-ключ',
        description: message,
        group: 'api-keys-panel-create',
      });
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteApiKeyAction(id);
      showNotification({
        type: 'success',
        title: 'API-ключ удалён',
        group: 'api-keys-panel-delete',
      });
      await fetchTokens();
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? 'Не удалось удалить токен';
      showNotification({
        type: 'error',
        title: 'Не удалось удалить токен',
        description: message,
        group: 'api-keys-panel-delete',
      });
    } finally {
      resetDeletionState();
    }
  };

  const normalizedSearch = searchValue.trim().toLocaleLowerCase('ru');
  const visibleTokens = tokens.filter(token => {
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

  if (activeTab === 'mcp') {
    return (
      <McpTokensSection
        apiKeyCount={tokens.length}
        onShowApiKeys={() => {
          setSearchValue('');
          setStatusFilter('all');
          setActiveTab('api');
        }}
      />
    );
  }

  return (
    <>
      <AccessKeysPageLayout
        activeTab='api'
        apiKeyCount={tokens.length}
        mcpTokenCount={mcpTokens.length}
        onTabChange={tab => {
          setSearchValue('');
          setStatusFilter('all');
          setActiveTab(tab);
        }}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        createLabel='Новый ключ'
        onCreate={() => setCreateOpen(true)}
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
            Значение ключа показывается <b>только один раз</b> — сразу после
            создания. Скопируйте и сохраните его!
          </AccessKeysInfoBar>

          <Box
            sx={{
              display: { xs: 'none', md: 'grid' },
              gridTemplateColumns: 'minmax(280px, 1fr) 166px 176px 44px',
              alignItems: 'center',
              minHeight: 34,
              px: 2.5,
              borderBottom: 1,
              borderColor: 'divider',
              color: 'text.disabled',
            }}
          >
            {['Название', 'Создан', 'Экспирация', ''].map(label => (
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

          {isLoading && <AccessKeysTableSkeleton variant='api' />}

          {!isLoading && visibleTokens.length === 0 && (
            <Box sx={{ px: 3, py: 5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                {tokens.length === 0
                  ? 'У вас пока нет API-ключей.'
                  : 'Ключи с такими параметрами не найдены.'}
              </Typography>
            </Box>
          )}

          {visibleTokens.map(token => {
            const visualStatus = getAccessKeyVisualStatus(token.expires_at);

            return (
              <Box
                key={token.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr) 36px',
                    md: 'minmax(280px, 1fr) 166px 176px 44px',
                  },
                  alignItems: 'center',
                  minHeight: 64,
                  px: 2.5,
                  py: { xs: 1.25, md: 0.75 },
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
                  <AccessKeyIconBox tone='api'>
                    <KeyIcon />
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
                      Персональный API-ключ
                    </Typography>
                    <Stack
                      direction='row'
                      gap={2}
                      sx={{ display: { xs: 'flex', md: 'none' }, mt: 0.75 }}
                    >
                      <CreatedAtCell value={token.created_at} />
                      <ExpiresAtCell
                        value={token.expires_at}
                        status={visualStatus}
                      />
                    </Stack>
                  </Box>
                </Stack>

                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <CreatedAtCell value={token.created_at} />
                </Box>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <ExpiresAtCell
                    value={token.expires_at}
                    status={visualStatus}
                  />
                </Box>
                <IconButton
                  size='small'
                  disableRipple
                  onClick={event => handleMenuOpen(event, token.id)}
                  aria-label={`Действия с ключом ${token.name ?? 'Без названия'}`}
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
              </Box>
            );
          })}
        </Paper>
      </AccessKeysPageLayout>

      {/* Row menu */}
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
            const token = tokens.find(item => item.id === menuTokenId);
            handleMenuClose();
            if (!token) return;

            void confirm({
              title: 'Удалить API-ключ?',
              message: `Ключ «${token.name ?? 'Без названия'}» сразу перестанет работать. Это действие нельзя отменить.`,
              confirmLabel: 'Удалить',
              cancelLabel: 'Отмена',
              confirmColor: 'error',
              maxWidth: 'xs',
              onConfirm: () => onDelete(token.id),
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
            <KeyIcon />
          </AccessKeyIconBox>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}
            >
              Новый API-ключ
            </Typography>
            <Typography
              sx={{ mt: 0.1, color: 'text.secondary', fontSize: 12.5 }}
            >
              Ключ действует от вашего имени и показывается один раз.
            </Typography>
          </Box>
          <IconButton
            size='small'
            onClick={() => setCreateOpen(false)}
            aria-label='Закрыть создание API-ключа'
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Stack>

        <DialogContent sx={{ px: 2.75, py: 2.5 }}>
          <Stack spacing={2.15}>
            <Box>
              <Typography sx={{ mb: 0.65, fontSize: 12.5, fontWeight: 600 }}>
                Название{' '}
                <Box component='span' sx={{ color: 'primary.main' }}>
                  *
                </Box>
              </Typography>
              <TextField
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder='Airflow sync'
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
                Например: Airflow sync, CI/CD deploy — чтобы потом понять, чей
                это ключ.
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ mb: 0.65, fontSize: 12.5, fontWeight: 600 }}>
                Описание
              </Typography>
              <TextField
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder='Для чего используется ключ'
                fullWidth
                multiline
                minRows={2}
                maxRows={5}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    alignItems: 'flex-start',
                    p: '12px 14px',
                    borderRadius: '9px',
                    '&.Mui-focused': { boxShadow: 'none' },
                  },
                  '& .MuiInputBase-inputMultiline': {
                    p: '0 !important',
                    lineHeight: 1.5,
                    overflowY: 'auto !important',
                  },
                }}
              />
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
                {API_KEY_EXPIRY_OPTIONS.map(option => {
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
                  minutesStep={1}
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
                              aria-label='Очистить дату'
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

              <Typography
                sx={{ mt: 0.65, color: 'text.disabled', fontSize: 11.5 }}
              >
                {expiryMode === 'never'
                  ? 'Бессрочный ключ придётся отзывать вручную.'
                  : `Ключ будет действовать до ${expirationSummary}.`}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ mb: 0.65, fontSize: 12.5, fontWeight: 600 }}>
                Разрешённые IP
              </Typography>
              <Stack direction='row' gap={1} alignItems='flex-start'>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    value={ipInput}
                    onChange={event => {
                      setIpInput(event.target.value);
                      if (ipError) setIpError(null);
                    }}
                    placeholder='10.20.4.11'
                    fullWidth
                    size='small'
                    error={Boolean(ipError)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '9px',
                        '&.Mui-focused': { boxShadow: 'none' },
                      },
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddIp();
                      }
                    }}
                  />
                  {ipError && (
                    <Typography
                      role='alert'
                      sx={{ mt: 0.5, color: 'error.main', fontSize: 11.5 }}
                    >
                      {ipError}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant='outlined'
                  disableRipple
                  startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
                  onClick={handleAddIp}
                  sx={{
                    minHeight: 40,
                    px: 1.75,
                    color: 'text.secondary',
                    bgcolor: 'background.paper',
                    borderColor: 'divider',
                    borderRadius: '9px',
                    whiteSpace: 'nowrap',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: 'background.paper',
                      borderColor: 'divider',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Добавить
                </Button>
              </Stack>
              {!!ips.length && (
                <Stack
                  direction='row'
                  gap={0.75}
                  flexWrap='wrap'
                  sx={{ mt: 1 }}
                >
                  {ips.map(ip => (
                    <Chip
                      key={ip}
                      size='small'
                      label={ip}
                      deleteIcon={<CloseIcon />}
                      onDelete={() => handleDeleteIp(ip)}
                      sx={{
                        height: 27,
                        bgcolor: 'rgba(148, 163, 184, 0.12)',
                        color: 'text.secondary',
                        borderRadius: '7px',
                        fontSize: 12,
                        fontWeight: 500,
                        '& .MuiChip-label': { px: 1.1 },
                        '& .MuiChip-deleteIcon': {
                          mr: 0.65,
                          color: 'text.disabled',
                          fontSize: '14px !important',
                          '&:hover': { color: 'text.secondary' },
                        },
                      }}
                    />
                  ))}
                </Stack>
              )}
              <Typography
                sx={{ mt: 0.65, color: 'text.disabled', fontSize: 11.5 }}
              >
                Пусто — запросы принимаются с любых адресов.
              </Typography>
            </Box>
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
              onClick={onCreate}
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
              Создать ключ
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!createdSecret}
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
              API-ключ создан
            </Typography>
            <Typography
              noWrap
              sx={{ mt: 0.15, color: 'text.secondary', fontSize: 12.5 }}
            >
              «{createdKeyName || 'Новый ключ'}» готов к использованию
            </Typography>
          </Box>
          <IconButton
            size='small'
            onClick={closeCreatedKeyDialog}
            aria-label='Закрыть окно созданного API-ключа'
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
              Сохраните ключ
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
              Передавайте его только доверенным сервисам — ключ действует от
              вашего имени.
            </Typography>
          </Stack>

          <Box sx={{ mt: 2.25 }}>
            <Stack direction='row' alignItems='center' sx={{ mb: 0.65 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                Секретный ключ
              </Typography>
            </Stack>
            <TextField
              fullWidth
              value={createdSecret ?? ''}
              type={showSecret ? 'text' : 'password'}
              inputRef={createdSecretInputRef}
              inputProps={{
                'aria-label': 'Секретный API-ключ',
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
                      aria-label={showSecret ? 'Скрыть ключ' : 'Показать ключ'}
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
                        onClick={async () => {
                          if (createdSecret) {
                            const copyResult = await copyTextToClipboard(
                              createdSecret,
                              createdSecretInputRef.current
                            );

                            showNotification(
                              copyResult === 'copied'
                                ? {
                                    type: 'success',
                                    title: 'Ключ скопирован',
                                    group: 'api-key-copy',
                                  }
                                : copyResult === 'manual'
                                  ? {
                                      type: 'info',
                                      title:
                                        'Автокопирование недоступно на HTTP-стенде',
                                      description:
                                        'Ключ выделен. Нажмите Ctrl+C.',
                                      group: 'api-key-copy',
                                    }
                                  : {
                                      type: 'error',
                                      title: 'Не удалось скопировать ключ',
                                      group: 'api-key-copy',
                                    }
                            );
                          }
                        }}
                        aria-label='Скопировать API-ключ'
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
            Экспирация:{' '}
            <Box
              component='span'
              sx={{ color: 'text.primary', fontWeight: 600 }}
            >
              {createdKeyExpiration}
            </Box>
          </Typography>
          <Button
            variant='contained'
            disableRipple
            onClick={closeCreatedKeyDialog}
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
