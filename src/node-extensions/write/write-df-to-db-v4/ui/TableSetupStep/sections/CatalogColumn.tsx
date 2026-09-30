import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Box, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { Check, ChevronRight, Code, RefreshCw, Search } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

import type { CatalogListUiProps } from '@/features/node/db-target-selector';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import { isExpressionValue } from '@/shared/lib/node-input-values';
import type { VariableOutput } from '@/shared/lib/variables';
import { buildSingleExpressionValue } from '@/shared/ui/node-input/primitiveExpression';
import PrimitiveNodeInput from '@/shared/ui/node-input/PrimitiveNodeInput';
import { Button, IconButton, Input, Tooltip } from '@/shared/ui/primitives';

import {
  CatalogName,
  CatalogRow,
  catalogSearchSx,
  ColumnBody,
  ColumnHeader,
  ColumnPlaceholder,
  ColumnRoot,
} from './CatalogColumn.styles';

export type CatalogOption = {
  value: string;
  label: string;
  count?: number | undefined;
  isNew?: boolean;
};
export type CatalogColumnProps = CatalogListUiProps & {
  title: string;
  attribute: string;
  icon: ReactNode;
  options: CatalogOption[];
  pinnedOptions?: CatalogOption[];
  selectedValue?: string | null;
  onSelect: (value: string) => void;
  value: unknown;
  onChange: (value: unknown) => void;
  inputDefinition: InputDefinitionModel | null | undefined;
  variables: VariableOutput[];
  blockedMessage?: string | null;
  emptyText: string;
  action?: ReactNode;
  headerAction?: ReactNode;
  notice?: ReactNode;
  children?: ReactNode;
  leaf?: boolean;
};

const errors: Record<string, string> = {
  error: 'Не удалось загрузить список',
  badGateway: 'Сервис каталога временно недоступен',
  gatewayTimeout: 'Сервер не ответил вовремя',
  notFound: 'Объект больше не существует',
  unsupported: 'Этот уровень каталога не поддерживается',
};
const EMPTY_OPTIONS: CatalogOption[] = [];
const skeletonWidths = [64, 47, 73, 55, 82, 60, 43, 70, 52, 65];

export const CatalogColumn = ({
  title,
  icon,
  options,
  pinnedOptions = EMPTY_OPTIONS,
  selectedValue,
  onSelect,
  value,
  onChange,
  inputDefinition,
  variables,
  blockedMessage,
  emptyText,
  action,
  headerAction,
  notice,
  children,
  leaf,
  query,
  onQueryChange,
  state,
  hasNextPage,
  isFetchingNextPage,
  loadMoreError,
  onLoadNextPage,
  onRetry,
  onRefresh,
  isRefreshing,
}: CatalogColumnProps) => {
  const [localQuery, setLocalQuery] = useState(query ?? '');
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const lastLiteral = useRef<unknown>(isExpressionValue(value) ? null : value);
  const expressionMode =
    isExpressionValue(value) && value.expression_kind === 'single';
  useEffect(() => {
    if (!expressionMode) lastLiteral.current = value;
  }, [expressionMode, value]);
  useEffect(() => {
    if (query !== undefined) setLocalQuery(query);
  }, [query]);
  useEffect(() => {
    if (!onQueryChange || localQuery === query) return;
    const timeout = setTimeout(() => onQueryChange(localQuery), 300);
    return () => clearTimeout(timeout);
  }, [localQuery, onQueryChange, query]);
  const deferredQuery = useDeferredValue(localQuery);
  const filtered = useMemo(
    () =>
      options.filter(option =>
        option.label
          .toLocaleLowerCase()
          .includes(deferredQuery.trim().toLocaleLowerCase())
      ),
    [options, deferredQuery]
  );
  const loading = state === 'loading' || isRefreshing || pending;
  const error = state ? errors[state] : undefined;
  const runRequest = async (
    request: CatalogListUiProps['onRefresh'] | CatalogListUiProps['onRetry']
  ) => {
    if (!request || pending) return;
    setPending(true);
    setRefreshFailed(false);
    try {
      setRefreshFailed((await request()) === false);
    } catch {
      setRefreshFailed(true);
    } finally {
      setPending(false);
    }
  };
  const toggleExpression = () => {
    if (!inputDefinition) return;
    onChange(
      expressionMode
        ? lastLiteral.current
        : buildSingleExpressionValue(inputDefinition.type, value)
    );
  };
  const renderOption = (option: CatalogOption) => (
    <CatalogRow
      disableRipple
      key={option.value}
      selected={option.value === selectedValue}
      aria-pressed={option.value === selectedValue}
      onClick={() => onSelect(option.value)}
      title={option.label}
      sx={
        option.isNew && leaf
          ? {
              '&, &:hover, &.Mui-selected, &.Mui-selected:hover': {
                backgroundColor: '#EEF2FF',
              },
              '& > svg:first-of-type': {
                color: 'primary.main',
                stroke: 'currentColor',
              },
            }
          : {}
      }
    >
      {icon}
      <CatalogName
        noWrap
        sx={option.isNew && leaf ? { color: 'primary.main' } : {}}
      >
        {option.label}
      </CatalogName>
      {option.isNew ? (
        <Chip
          label='NEW'
          size='small'
          sx={{
            height: 18,
            flexShrink: 0,
            borderRadius: '4px',
            backgroundColor: '#E8F6ED',
            color: '#15803D',
            fontSize: 9,
            fontWeight: 600,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      ) : null}
      {option.value === selectedValue ? (
        leaf ? (
          <Check size={16} />
        ) : (
          <ChevronRight size={16} />
        )
      ) : option.count !== undefined ? (
        <Typography variant='caption' color='text.secondary'>
          {option.count}
        </Typography>
      ) : null}
    </CatalogRow>
  );
  const footer = (
    <>
      {loadMoreError ? (
        <Alert severity='error' sx={{ m: 1.5 }}>
          Не удалось загрузить следующую страницу.
          <Button
            variant='ghost'
            size='sm'
            onClick={() => void runRequest(onRetry)}
          >
            Повторить
          </Button>
        </Alert>
      ) : null}
      {isFetchingNextPage ? (
        <Skeleton sx={{ mx: 2 }} height={38} animation='wave' />
      ) : hasNextPage && !loadMoreError ? (
        <Button variant='ghost' size='sm' onClick={onLoadNextPage} fullWidth>
          Загрузить ещё
        </Button>
      ) : null}
    </>
  );
  return (
    <ColumnRoot
      role='region'
      aria-label={title}
      aria-busy={Boolean(loading && !blockedMessage)}
    >
      <ColumnHeader
        sx={blockedMessage && !expressionMode ? { borderBottom: 0 } : {}}
      >
        <Stack
          direction='row'
          alignItems='center'
          gap={0.75}
          minHeight={24}
          mb={0.75}
        >
          <Typography
            sx={{
              flex: 1,
              fontFamily: 'Inter, sans-serif',
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#9B9BA6',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
          {!blockedMessage && !expressionMode ? headerAction : null}
          {!blockedMessage && onRefresh ? (
            <Tooltip title='Обновить список'>
              <Box
                component='span'
                sx={{
                  display: 'inline-flex',
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                }}
              >
                <IconButton
                  size='sm'
                  aria-label={`Обновить: ${title}`}
                  disabled={loading}
                  onClick={() => void runRequest(onRefresh)}
                >
                  <RefreshCw size={14} />
                </IconButton>
              </Box>
            </Tooltip>
          ) : null}
          {inputDefinition?.allow_expressions ? (
            <Tooltip
              title={expressionMode ? 'Вернуться к списку' : 'Ввести выражение'}
            >
              <IconButton
                size='sm'
                aria-label={`Выражение: ${title}`}
                aria-pressed={expressionMode}
                disableRipple
                onClick={toggleExpression}
              >
                <Code size={15} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
        {!blockedMessage && !expressionMode ? (
          <Input
            sx={catalogSearchSx}
            placeholder='Поиск'
            value={localQuery}
            onChange={event => setLocalQuery(event.target.value)}
            startAdornment={<Search size={15} />}
            inputProps={{ 'aria-label': `Поиск: ${title}` }}
          />
        ) : null}
      </ColumnHeader>
      {expressionMode ? (
        <Box p={1.5}>
          <PrimitiveNodeInput
            inputDefinition={inputDefinition}
            value={value}
            onChange={onChange}
            variables={variables}
          />
        </Box>
      ) : blockedMessage ? (
        <ColumnPlaceholder>{blockedMessage}</ColumnPlaceholder>
      ) : (
        <>
          {notice}
          {action}
          {children}
          {pinnedOptions.map(renderOption)}
          {loading ? (
            <ColumnBody role='status' aria-label={`Загрузка: ${title}`}>
              {skeletonWidths.map((width, index) => (
                <Stack
                  key={index}
                  direction='row'
                  alignItems='center'
                  gap={1.5}
                  px={2}
                  height={38}
                >
                  <Skeleton
                    variant='rounded'
                    width={16}
                    height={16}
                    animation='wave'
                  />
                  <Skeleton width={`${width}%`} height={18} animation='wave' />
                </Stack>
              ))}
            </ColumnBody>
          ) : error || refreshFailed ? (
            <Box p={1.5}>
              <Alert severity='error' sx={{ alignItems: 'flex-start' }}>
                <Typography variant='body2' fontWeight={600}>
                  {refreshFailed ? 'Не удалось обновить список' : error}
                </Typography>
                <Typography variant='caption'>
                  Попробуйте повторить запрос.
                </Typography>
                <Box mt={1}>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => void runRequest(onRetry ?? onRefresh)}
                  >
                    Повторить
                  </Button>
                </Box>
              </Alert>
            </Box>
          ) : filtered.length ? (
            filtered.length >= 60 ? (
              <Virtuoso
                style={{ flex: 1, minHeight: 0 }}
                data={filtered}
                computeItemKey={(_, option) => option.value}
                itemContent={(_, option) => renderOption(option)}
                components={{ Footer: () => footer }}
              />
            ) : (
              <ColumnBody>
                {filtered.map(renderOption)}
                {footer}
              </ColumnBody>
            )
          ) : (
            <ColumnBody>
              {pinnedOptions.length === 0 ? (
                <ColumnPlaceholder>
                  {localQuery ? 'Ничего не найдено' : emptyText}
                </ColumnPlaceholder>
              ) : null}
              {footer}
            </ColumnBody>
          )}
        </>
      )}
    </ColumnRoot>
  );
};
