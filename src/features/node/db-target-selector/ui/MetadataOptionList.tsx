import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  styled,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { DbCatalogState } from '@/entities/data/db-connection/model/catalogTypes';

import type { MetadataOption } from '../model/helpers';

const SKELETON_ROWS = [0, 1, 2, 3, 4];
const VIRTUALIZATION_THRESHOLD = 60;
const VIRTUALIZED_LIST_HEIGHT = 320;
const VIRTUALIZED_OVERSCAN_PX = 80;
const ROW_ITEM_HEIGHT = 49;
const CARD_ITEM_HEIGHT = 54;

const RetryButton = styled(Button)({
  minWidth: 0,
  padding: '5px 14px',
  borderRadius: 8,
  boxShadow: 'none',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': {
    boxShadow: 'none',
  },
});

type MetadataOptionListProps = {
  appearance?: 'cards' | 'rows';
  fillAvailableHeight?: boolean;
  emptyText: string;
  icon: ReactNode;
  onSelect: (value: string) => void;
  options: MetadataOption[];
  query?: string | undefined;
  onQueryChange?: ((value: string) => void) | undefined;
  state?: DbCatalogState | undefined;
  hasNextPage?: boolean | undefined;
  isFetchingNextPage?: boolean | undefined;
  loadMoreError?: unknown;
  onLoadNextPage?: (() => void) | undefined;
  onRetry?: (() => void | Promise<unknown>) | undefined;
  onRefresh?: (() => boolean | void | Promise<boolean | void>) | undefined;
  isRefreshing?: boolean | undefined;
  searchPlaceholder: string;
  selectedValue?: string | null | undefined;
  testIds?: {
    root?: string;
    searchInput?: string;
    list?: string;
    option?: string;
  };
};

const listItemSx = (
  theme: Theme,
  selected: boolean,
  appearance: 'cards' | 'rows'
) => {
  if (appearance === 'rows') {
    return {
      flex: '0 0 auto',
      borderRadius: 0,
      px: 1.5,
      py: 1.25,
      borderBottom: `1px solid ${theme.palette.divider}`,
      backgroundColor: selected
        ? alpha(theme.palette.primary.main, 0.06)
        : 'transparent',
      '&:hover': {
        backgroundColor: selected
          ? alpha(theme.palette.primary.main, 0.08)
          : alpha(theme.palette.common.black, 0.025),
      },
      '&.Mui-selected': {
        backgroundColor: alpha(theme.palette.primary.main, 0.06),
      },
      '&.Mui-selected:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },
    };
  }

  return {
    borderRadius: '16px',
    px: 1.25,
    py: 1,
    border: `1px solid ${
      selected
        ? alpha(theme.palette.primary.main, 0.22)
        : alpha(theme.palette.common.black, 0.06)
    }`,
    backgroundColor: selected
      ? alpha(theme.palette.primary.main, 0.08)
      : alpha(theme.palette.common.white, 0.72),
  };
};

export const MetadataOptionList = ({
  appearance = 'cards',
  fillAvailableHeight = false,
  emptyText,
  icon,
  onSelect,
  options,
  query: controlledQuery,
  onQueryChange,
  state,
  hasNextPage = false,
  isFetchingNextPage = false,
  loadMoreError,
  onLoadNextPage,
  onRetry,
  onRefresh,
  isRefreshing = false,
  searchPlaceholder,
  selectedValue,
  testIds,
}: MetadataOptionListProps) => {
  const [localQuery, setLocalQuery] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRetryingNextPage, setIsRetryingNextPage] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const isRowsAppearance = appearance === 'rows';
  const query = isRowsAppearance ? localQuery : (controlledQuery ?? localQuery);
  const setQuery = isRowsAppearance
    ? setLocalQuery
    : (onQueryChange ?? setLocalQuery);
  const deferredQuery = useDeferredValue(query);
  const canSearchOnServer =
    isRowsAppearance && Boolean(onQueryChange) && query.trim().length > 0;

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);

    if (isRowsAppearance && nextQuery.trim() === '') {
      onQueryChange?.('');
    }
  };

  const handleRefresh = async () => {
    if (isRowsAppearance) {
      setLocalQuery('');
      onQueryChange?.('');
    }

    if (!onRefresh) {
      return;
    }

    setRefreshFailed(false);
    try {
      const succeeded = await onRefresh();
      setRefreshFailed(succeeded === false);
    } catch {
      setRefreshFailed(true);
    }
  };

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) {
      return;
    }

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, onRetry]);

  const handleLoadMoreRetry = useCallback(async () => {
    if (!onRetry || isRetryingNextPage) {
      return;
    }

    setIsRetryingNextPage(true);
    try {
      await onRetry();
    } finally {
      setIsRetryingNextPage(false);
    }
  }, [isRetryingNextPage, onRetry]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [deferredQuery, options]);
  const shouldVirtualize = filteredOptions.length >= VIRTUALIZATION_THRESHOLD;

  const renderOption = useCallback(
    (option: MetadataOption) => {
      const selected = selectedValue === option.value;

      return (
        <ListItemButton
          key={option.value}
          disableRipple
          data-testid={
            testIds?.option ??
            'features/node/db-target-selector/metadata-option'
          }
          data-option-value={option.value}
          data-option-label={option.label}
          selected={selected}
          onClick={() => onSelect(option.value)}
          sx={theme => listItemSx(theme, selected, appearance)}
        >
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='space-between'
            spacing={1}
            width='100%'
          >
            <Stack
              direction='row'
              alignItems='center'
              spacing={1}
              sx={{ minWidth: 0 }}
            >
              <Box
                sx={theme => ({
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: appearance === 'rows' ? '8px' : '12px',
                  color: selected
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                  backgroundColor: selected
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.common.black, 0.04),
                  flexShrink: 0,
                })}
              >
                {icon}
              </Box>
              <ListItemText
                primary={option.label}
                primaryTypographyProps={{
                  noWrap: true,
                  fontSize: appearance === 'rows' ? 12 : 14,
                  fontWeight:
                    appearance === 'rows' ? 500 : selected ? 600 : 500,
                  color:
                    appearance === 'rows' && selected
                      ? 'primary.main'
                      : 'text.primary',
                  fontFamily:
                    appearance === 'rows'
                      ? '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                      : 'inherit',
                }}
              />
            </Stack>

            {option.tableCount !== undefined ? (
              <Typography
                color='text.secondary'
                sx={{
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {option.tableCount} таблиц
              </Typography>
            ) : null}
          </Stack>
        </ListItemButton>
      );
    },
    [appearance, icon, onSelect, selectedValue, testIds?.option]
  );

  const stateText =
    state === 'unsupported'
      ? 'Этот уровень каталога не поддерживается'
      : state === 'notFound'
        ? 'Ресурс больше не существует'
        : state === 'badGateway'
          ? 'Gateway не смог загрузить каталог (502)'
          : state === 'gatewayTimeout'
            ? 'Истекло время загрузки каталога (504)'
            : state === 'error'
              ? 'Не удалось загрузить каталог'
              : null;

  return (
    <Stack
      spacing={1.25}
      {...(fillAvailableHeight
        ? { sx: { height: '100%', minHeight: 0, flex: '1 1 auto' } }
        : {})}
      data-testid={
        testIds?.root ?? 'features/node/db-target-selector/metadata-option-list'
      }
    >
      <Stack
        direction='row'
        spacing={isRowsAppearance ? 0.75 : 1}
        alignItems='center'
      >
        <TextField
          fullWidth
          size='small'
          {...(isRowsAppearance
            ? {
                sx: theme => ({
                  '& .MuiOutlinedInput-root': {
                    height: 36,
                    borderRadius: '8px',
                    backgroundColor: alpha(theme.palette.common.black, 0.035),
                    boxShadow: 'none',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.divider,
                    },
                    '&.Mui-focused': {
                      boxShadow: 'none',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderWidth: 1,
                      borderColor: theme.palette.divider,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: 13,
                    '&::placeholder': {
                      fontSize: 13,
                    },
                  },
                }),
              }
            : {})}
          slotProps={{
            htmlInput: {
              'data-testid':
                testIds?.searchInput ??
                'features/node/db-target-selector/metadata-option-search-input',
            },
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchRoundedIcon
                    color='action'
                    sx={{ fontSize: isRowsAppearance ? 17 : 20 }}
                  />
                </InputAdornment>
              ),
            },
          }}
          placeholder={searchPlaceholder}
          value={query}
          onChange={event => handleQueryChange(event.target.value)}
        />
        {isRowsAppearance && onQueryChange ? (
          <Button
            variant='outlined'
            color='inherit'
            startIcon={<SearchRoundedIcon sx={{ fontSize: 16 }} />}
            disabled={!canSearchOnServer || state === 'loading' || isRefreshing}
            onClick={() => onQueryChange(query.trim())}
            sx={theme => ({
              height: 36,
              minHeight: 36,
              minWidth: 114,
              px: 1.25,
              py: 0,
              flexShrink: 0,
              borderRadius: '8px',
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.secondary,
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: theme.palette.grey[400],
                backgroundColor: alpha(theme.palette.common.black, 0.025),
              },
            })}
          >
            На сервере
          </Button>
        ) : null}
        {onRefresh ? (
          <Tooltip title='Обновить каталог'>
            <span>
              <IconButton
                aria-label='Обновить каталог'
                disabled={isRefreshing}
                onClick={() => void handleRefresh()}
                size='small'
                {...(isRowsAppearance
                  ? {
                      sx: theme => ({
                        width: 36,
                        height: 36,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '8px',
                        backgroundColor: theme.palette.background.paper,
                        '&:hover': {
                          backgroundColor: alpha(
                            theme.palette.common.black,
                            0.025
                          ),
                        },
                      }),
                    }
                  : {})}
              >
                {isRefreshing ? (
                  <CircularProgress size={isRowsAppearance ? 16 : 18} />
                ) : (
                  <RefreshRoundedIcon
                    sx={{ fontSize: isRowsAppearance ? 18 : 20 }}
                  />
                )}
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
      </Stack>

      {refreshFailed ? (
        <Paper
          elevation={0}
          sx={theme => ({
            px: 2,
            py: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
          })}
        >
          <Typography color='text.secondary' sx={{ fontSize: 13 }}>
            Не удалось обновить каталог
          </Typography>
          <RetryButton
            variant='contained'
            size='small'
            sx={{ mt: 1.25 }}
            disabled={isRefreshing}
            onClick={() => void handleRefresh()}
          >
            Повторить
          </RetryButton>
        </Paper>
      ) : null}

      <Paper
        elevation={0}
        sx={theme => ({
          borderRadius: appearance === 'rows' ? '12px' : '20px',
          border:
            appearance === 'rows'
              ? `1px solid ${theme.palette.divider}`
              : `1px solid ${alpha(theme.palette.common.black, 0.08)}`,
          backgroundColor:
            appearance === 'rows'
              ? theme.palette.background.paper
              : alpha(theme.palette.common.white, 0.74),
          overflow: 'hidden',
          ...(fillAvailableHeight
            ? {
                flex: '1 1 auto',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }
            : {}),
        })}
      >
        {state === 'loading' || isRefreshing || isRetrying ? (
          appearance === 'rows' ? (
            <Stack sx={{ px: 1.5, py: 1.25 }} spacing={1.5}>
              {SKELETON_ROWS.map(row => (
                <Stack
                  key={row}
                  direction='row'
                  alignItems='center'
                  spacing={1.25}
                >
                  <Skeleton
                    animation='wave'
                    variant='rounded'
                    width={28}
                    height={28}
                    sx={{ borderRadius: '8px', flexShrink: 0 }}
                  />
                  <Skeleton
                    animation='wave'
                    variant='rounded'
                    width='38%'
                    height={12}
                  />
                </Stack>
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                px: 2,
                py: 2.25,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={20} />
            </Box>
          )
        ) : filteredOptions.length === 0 ? (
          <Box sx={{ px: 2, py: 2.25 }}>
            <Typography color='text.secondary' sx={{ fontSize: 13 }}>
              {stateText ?? emptyText}
            </Typography>
            {stateText && onRetry ? (
              <RetryButton
                variant='contained'
                size='small'
                sx={{ mt: 1.25 }}
                onClick={() => void handleRetry()}
              >
                Повторить
              </RetryButton>
            ) : null}
          </Box>
        ) : (
          <List
            component='div'
            data-testid={
              testIds?.list ??
              'features/node/db-target-selector/metadata-option-list-items'
            }
            onScroll={
              shouldVirtualize
                ? undefined
                : event => {
                    const target = event.currentTarget;
                    if (
                      hasNextPage &&
                      !isFetchingNextPage &&
                      target.scrollHeight -
                        target.scrollTop -
                        target.clientHeight <
                        80
                    ) {
                      onLoadNextPage?.();
                    }
                  }
            }
            sx={{
              p: appearance === 'rows' ? 0 : 1,
              display: 'flex',
              flexDirection: 'column',
              gap: appearance === 'rows' ? 0 : 1,
              height: fillAvailableHeight
                ? 'auto'
                : shouldVirtualize
                  ? VIRTUALIZED_LIST_HEIGHT
                  : undefined,
              maxHeight: fillAvailableHeight ? 'none' : VIRTUALIZED_LIST_HEIGHT,
              flex: fillAvailableHeight ? '1 1 auto' : undefined,
              minHeight: fillAvailableHeight ? 0 : undefined,
              overflowY: shouldVirtualize ? 'hidden' : 'auto',
            }}
          >
            {shouldVirtualize ? (
              <Virtuoso
                data={filteredOptions}
                style={{ height: '100%' }}
                overscan={VIRTUALIZED_OVERSCAN_PX}
                fixedItemHeight={
                  appearance === 'rows' ? ROW_ITEM_HEIGHT : CARD_ITEM_HEIGHT
                }
                computeItemKey={(_, option) => option.value}
                itemContent={(_, option) =>
                  appearance === 'rows' ? (
                    renderOption(option)
                  ) : (
                    <Box sx={{ pb: 1 }}>{renderOption(option)}</Box>
                  )
                }
                components={{
                  Footer: () => (
                    <>
                      {isFetchingNextPage || isRetryingNextPage ? (
                        <Box
                          sx={{
                            py: 1,
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <CircularProgress size={18} />
                        </Box>
                      ) : null}
                      {loadMoreError && !isRetryingNextPage ? (
                        <Box
                          sx={{
                            p: 1,
                            display: 'flex',
                            justifyContent: 'flex-start',
                          }}
                        >
                          <RetryButton
                            variant='contained'
                            size='small'
                            onClick={() => void handleLoadMoreRetry()}
                          >
                            Повторить
                          </RetryButton>
                        </Box>
                      ) : null}
                    </>
                  ),
                }}
                endReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    onLoadNextPage?.();
                  }
                }}
              />
            ) : (
              filteredOptions.map(renderOption)
            )}
            {!shouldVirtualize && (isFetchingNextPage || isRetryingNextPage) ? (
              <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={18} />
              </Box>
            ) : null}
            {!shouldVirtualize && loadMoreError && !isRetryingNextPage ? (
              <RetryButton
                variant='contained'
                size='small'
                sx={{ m: 1, alignSelf: 'flex-start' }}
                onClick={() => void handleLoadMoreRetry()}
              >
                Повторить
              </RetryButton>
            ) : null}
          </List>
        )}
      </Paper>
    </Stack>
  );
};
