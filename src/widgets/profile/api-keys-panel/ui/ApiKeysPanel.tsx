import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  InputBase,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconKey, IconPlus, IconSearch } from '@tabler/icons-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { useAlert } from '@/app/notifications';

import { useApiKeys } from '@/entities/admin/api-key';

import type { UserTokenRead } from '@/shared/gatewayClient';
import { copyTextToClipboard } from '@/shared/lib/clipboard';
import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import {
  isTokenExpiryValid,
  resolveTokenExpiresAt,
  type TokenExpiryValue,
} from '@/shared/lib/token/tokenExpiryForm';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  CancelButton,
  CreateButton,
} from '@/shared/ui/create-entity-dialog/styles';
import { PageLayout } from '@/shared/ui/page-layout';
import {
  fieldHintSx,
  fieldInputSx,
  fieldTextareaSx,
  TokenDialog,
  TokenExpiryField,
  TokenFieldRow,
  TokenNameInput,
} from '@/shared/ui/token-form';
import {
  getTokenListBoxHeight,
  TokenListBox,
  TokenListCreateButton,
  TokenListEmptyLink,
  TokenListEmptyState,
  TokenListMessage,
  TokenListRow,
  TokenListRowSkeleton,
  TokenListScroll,
  TokenListSearch,
} from '@/shared/ui/token-list';

import 'dayjs/locale/ru';

dayjs.extend(utc);
dayjs.locale('ru');

const SKELETON_ROWS = [
  { nameWidth: 148, detailsWidth: 96 },
  { nameWidth: 112, detailsWidth: 96 },
  { nameWidth: 176, detailsWidth: 96 },
];

const NAME_INPUT_ID = 'api-key-create-name';
const DESCRIPTION_INPUT_ID = 'api-key-create-description';
const IP_INPUT_ID = 'api-key-create-ip';

const NEVER_EXPIRY: TokenExpiryValue = {
  expiryMode: 'never',
  expiryDate: null,
};

const isIPv4 = (v: string) =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(v) &&
  v.split('.').every(o => Number(o) >= 0 && Number(o) <= 255);

export const ApiKeysPanel: React.FC = () => {
  const {
    items: tokens,
    status,
    creationStatus,
    createdSecret,
    loadApiKeys,
    createApiKey: createApiKeyAction,
    deleteApiKey: deleteApiKeyAction,
    resetCreationState,
    resetDeletionState,
  } = useApiKeys();

  const [searchValue, setSearchValue] = useState('');

  const [createOpen, setCreateOpen] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiry, setExpiry] = useState<TokenExpiryValue>(NEVER_EXPIRY);
  const [ipInput, setIpInput] = useState('');
  const [ips, setIps] = useState<string[]>([]);
  const [ipError, setIpError] = useState<string | null>(null);

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

  const resetCreateForm = () => {
    setName('');
    setDescription('');
    setExpiry(NEVER_EXPIRY);
    setIpInput('');
    setIps([]);
    setIpError(null);
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

  const canCreate = useMemo(
    () => name.trim().length > 0 && isTokenExpiryValid(expiry),
    [name, expiry]
  );

  const closeCreatedKeyDialog = () => {
    setShowSecret(false);
    resetCreationState();
  };

  const onCreate = async () => {
    if (!canCreate || creationStatus === 'loading') return;

    try {
      const submittedName = name.trim();
      const expiresAt = resolveTokenExpiresAt(expiry);
      const submittedExpiration = expiresAt
        ? dayjs.unix(expiresAt).format('DD.MM.YYYY HH:mm')
        : 'Бессрочный';

      await createApiKeyAction({
        name: submittedName,
        description: description.trim() ?? null,
        expires_at: expiresAt,
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
  const visibleTokens = tokens.filter(
    token =>
      !normalizedSearch ||
      (token.name ?? 'Без названия')
        .toLocaleLowerCase('ru')
        .includes(normalizedSearch)
  );

  const confirmDelete = (token: UserTokenRead) => {
    void confirm({
      title: 'Удалить API-ключ?',
      message: `Ключ «${token.name ?? 'Без названия'}» будет удалён. Отозванный ключ перестаёт работать мгновенно, без возможности восстановления.`,
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'xs',
      onConfirm: () => onDelete(token.id),
    });
  };

  // Background refreshes must not bring the skeleton back over an empty list.
  const hasLoadedRef = useRef(false);
  if (status === 'succeeded' || status === 'failed') {
    hasLoadedRef.current = true;
  }
  const isLoadingList = !hasLoadedRef.current && tokens.length === 0;
  // A fast response never shows the skeleton, so the tab does not blink.
  const showSkeleton = useDelayedLoading(isLoadingList);

  return (
    <>
      <PageLayout
        width='default'
        title='API Keys'
        icon={IconKey}
        headerActions={
          <>
            <TokenListSearch
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              placeholder='Поиск по названию'
              inputProps={{ 'aria-label': 'Поиск по названию' }}
              startAdornment={<IconSearch size={14} stroke={1.6} />}
            />
            <TokenListCreateButton
              disableRipple
              onClick={() => setCreateOpen(true)}
            >
              <AddRoundedIcon sx={{ fontSize: 16 }} />
              Новый ключ
            </TokenListCreateButton>
          </>
        }
        fitContent
      >
        <TokenListBox
          aria-label='API-ключи'
          sx={{ flex: `0 1 ${getTokenListBoxHeight(visibleTokens.length)}px` }}
        >
          {showSkeleton ? (
            SKELETON_ROWS.map(row => (
              <TokenListRowSkeleton key={row.nameWidth} {...row} />
            ))
          ) : isLoadingList ? null : tokens.length === 0 ? (
            <TokenListEmptyState title='Ключей пока нет'>
              <TokenListEmptyLink
                type='button'
                onClick={() => setCreateOpen(true)}
              >
                Создайте ключ
              </TokenListEmptyLink>{' '}
              для доступа к API из внешних сервисов.
            </TokenListEmptyState>
          ) : visibleTokens.length === 0 ? (
            <TokenListMessage>Ничего не найдено</TokenListMessage>
          ) : (
            <TokenListScroll>
              {visibleTokens.map(token => {
                const tokenName = token.name ?? 'Без названия';

                return (
                  <TokenListRow
                    key={token.id}
                    name={tokenName}
                    details={`создан ${dayjs(token.created_at).format('DD.MM.YYYY')}`}
                    expiresAt={token.expires_at}
                    actionsLabel={`Действия с ключом ${tokenName}`}
                    actions={[
                      {
                        label: 'Удалить',
                        onSelect: () => confirmDelete(token),
                        danger: true,
                      },
                    ]}
                  />
                );
              })}
            </TokenListScroll>
          )}
        </TokenListBox>
      </PageLayout>

      <TokenDialog
        open={createOpen}
        icon={<IconPlus stroke={1.5} />}
        title='Новый API-ключ'
        subtitle='Ключ для доступа к API из внешних сервисов'
        actions={
          <>
            <CancelButton type='button' onClick={() => setCreateOpen(false)}>
              Отмена
            </CancelButton>
            <CreateButton
              type='button'
              disabled={!canCreate || creationStatus === 'loading'}
              onClick={() => void onCreate()}
            >
              Создать ключ
            </CreateButton>
          </>
        }
      >
        <Stack spacing={1.5}>
          <TokenFieldRow label='Название' htmlFor={NAME_INPUT_ID}>
            <TokenNameInput
              id={NAME_INPUT_ID}
              value={name}
              placeholder='Airflow sync'
              onChange={setName}
            />
          </TokenFieldRow>

          <TokenFieldRow label='Описание' htmlFor={DESCRIPTION_INPUT_ID}>
            <InputBase
              id={DESCRIPTION_INPUT_ID}
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder='Для чего используется ключ'
              multiline
              minRows={2}
              maxRows={5}
              sx={fieldTextareaSx}
            />
          </TokenFieldRow>

          <TokenFieldRow label='Срок'>
            <TokenExpiryField form={expiry} onChange={setExpiry} />
          </TokenFieldRow>

          <TokenFieldRow label='Разрешённые IP' htmlFor={IP_INPUT_ID}>
            <Stack direction='row' gap={1}>
              <InputBase
                id={IP_INPUT_ID}
                value={ipInput}
                onChange={event => {
                  setIpInput(event.target.value);
                  if (ipError) setIpError(null);
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddIp();
                  }
                }}
                placeholder='10.20.4.11'
                error={Boolean(ipError)}
                sx={fieldInputSx}
              />
              <ButtonBase
                disableRipple
                onClick={handleAddIp}
                sx={{
                  flexShrink: 0,
                  height: 38,
                  px: 1.5,
                  border: '1px solid #DDE2EA',
                  borderRadius: '9px',
                  color: '#3A4152',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'background-color 150ms ease',
                  '&:hover': { bgcolor: '#F5F6FA' },
                }}
              >
                Добавить
              </ButtonBase>
            </Stack>
            {ipError ? (
              <Typography
                role='alert'
                sx={{ ...fieldHintSx, color: '#B42318' }}
              >
                {ipError}
              </Typography>
            ) : null}
            {ips.length > 0 ? (
              <Stack direction='row' gap={0.75} flexWrap='wrap' sx={{ mt: 1 }}>
                {ips.map(ip => (
                  <Chip
                    key={ip}
                    size='small'
                    label={ip}
                    deleteIcon={<CloseIcon />}
                    onDelete={() => handleDeleteIp(ip)}
                    sx={{
                      height: 26,
                      bgcolor: '#F5F6FA',
                      color: '#3A4152',
                      borderRadius: '7px',
                      fontSize: 12.5,
                      fontWeight: 500,
                      '& .MuiChip-label': { px: 1 },
                      '& .MuiChip-deleteIcon': {
                        mr: 0.5,
                        color: '#9AA0AD',
                        fontSize: '14px !important',
                        '&:hover': { color: '#3A4152' },
                      },
                    }}
                  />
                ))}
              </Stack>
            ) : null}
            <Typography sx={fieldHintSx}>
              Пусто — запросы принимаются с любых адресов.
            </Typography>
          </TokenFieldRow>
        </Stack>
      </TokenDialog>

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
              Значение ключа показывается <b>только один раз</b> — сразу после
              создания. После закрытия окна его не восстановить — скопируйте и
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
