import {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { DataFrameMetadata } from '@/shared/gatewayClient';

import {
  DTypeMetadataDetails,
  hasDTypeMetadata,
} from './components/DTypeMetadataDetails.tsx';
import {
  MetadataMetricsGrid,
  MetadataPanelSurface,
  MetadataPill,
  MetadataSection,
} from './components/MetadataPrimitives.tsx';
import { formatBytes, formatNumber } from './lib/formatters.ts';

interface DataFrameMetadataPanelProps {
  metadata: DataFrameMetadata;
}

interface DataFrameColumnRowProps {
  column: DataFrameMetadata['columns'][number];
}

const normalizeSearchText = (value: string) => value.trim().toLowerCase();

const buildColumnSearchText = (
  column: DataFrameMetadata['columns'][number]
) => {
  const searchParts: string[] = [column.name, column.dtype];

  if (column.nullable) {
    searchParts.push('nullable', 'null', 'nulls');
  }

  if (column.index) {
    searchParts.push('index', 'indexed');
  }

  if (column.dtype_metadata) {
    Object.entries(column.dtype_metadata).forEach(([key, value]) => {
      if (value == null) {
        return;
      }

      searchParts.push(key);

      if (Array.isArray(value)) {
        value.forEach(item => searchParts.push(String(item)));
        return;
      }

      searchParts.push(String(value));
    });
  }

  return normalizeSearchText(searchParts.join(' '));
};

const DataFrameColumnRow = memo(({ column }: DataFrameColumnRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const canExpand = hasDTypeMetadata(column.dtype_metadata);

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 1.5,
        borderRadius: '20px',
        border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
        background:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.04)
            : alpha(theme.palette.common.white, 0.78),
      })}
    >
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={1}
        >
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {column.name}
            </Typography>
            <Typography color='text.secondary' sx={{ mt: 0.35, fontSize: 12 }}>
              Минимальная сводка по колонке dataframe.
            </Typography>
          </Box>

          <Button
            variant='outlined'
            size='small'
            disabled={!canExpand}
            onClick={() => setExpanded(current => !current)}
            endIcon={
              <ExpandMoreRoundedIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              />
            }
            sx={{
              borderRadius: '999px',
              textTransform: 'none',
              minWidth: 0,
            }}
          >
            {canExpand
              ? expanded
                ? 'Скрыть dtype metadata'
                : 'Показать dtype metadata'
              : 'Нет dtype metadata'}
          </Button>
        </Stack>

        <Stack direction='row' flexWrap='wrap' gap={0.75}>
          <MetadataPill label={column.dtype} tone='info' />
          {column.nullable ? (
            <MetadataPill label='nullable' tone='warning' />
          ) : null}
          {column.index ? <MetadataPill label='index' tone='success' /> : null}
        </Stack>

        <Collapse in={expanded} unmountOnExit>
          <DTypeMetadataDetails
            dtypeMetadata={column.dtype_metadata ?? null}
            description='Подробные параметры dtype для выбранной колонки.'
          />
        </Collapse>
      </Stack>
    </Paper>
  );
});

DataFrameColumnRow.displayName = 'DataFrameColumnRow';

export const DataFrameMetadataPanel = ({
  metadata,
}: DataFrameMetadataPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const nullableColumns = metadata.columns.filter(
    column => column.nullable
  ).length;
  const indexedColumns = metadata.columns.filter(column => column.index).length;

  const indexedColumnsMetadata = useMemo(() => {
    return metadata.columns.map(column => ({
      column,
      searchText: buildColumnSearchText(column),
    }));
  }, [metadata.columns]);

  const filteredColumns = useMemo(() => {
    const normalizedQuery = normalizeSearchText(deferredSearchQuery);

    if (!normalizedQuery) {
      return indexedColumnsMetadata.map(entry => entry.column);
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return indexedColumnsMetadata
      .filter(entry =>
        queryTokens.every(token => entry.searchText.includes(token))
      )
      .map(entry => entry.column);
  }, [deferredSearchQuery, indexedColumnsMetadata]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) &&
        (event.code === 'KeyF' || key === 'f' || key === 'а');

      if (!isSearchShortcut) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setIsCopied(true);

    if (copyFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(copyFeedbackTimeoutRef.current);
    }

    copyFeedbackTimeoutRef.current = window.setTimeout(() => {
      setIsCopied(false);
      copyFeedbackTimeoutRef.current = null;
    }, 1600);
  };

  return (
    <MetadataPanelSurface>
      <MetadataSection
        title='DataFrame metadata'
        description='Быстрая сводка по размеру dataframe и подробные dtype metadata для каждой колонки.'
        actions={
          <Tooltip title={isCopied ? 'Скопировано' : 'Скопировать JSON'}>
            <IconButton
              size='small'
              onClick={() => void handleCopyJson()}
              aria-label='Скопировать JSON metadata'
            >
              <ContentCopyRoundedIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        }
      >
        <MetadataMetricsGrid
          metrics={[
            {
              label: 'Колонки',
              value: formatNumber(metadata.columns.length),
            },
            {
              label: 'Строки',
              value: formatNumber(metadata.rows_num ?? null),
            },
            {
              label: 'Размер',
              value: formatBytes(metadata.size ?? null),
            },
            {
              label: 'Nullable',
              value: formatNumber(nullableColumns),
              caption: `${formatNumber(indexedColumns)} индексных колонок`,
            },
          ]}
        />
      </MetadataSection>

      <MetadataSection
        title='Колонки'
        description='Поиск работает по имени колонки, флагам `nullable`/`index` и полям внутри `dtype_metadata`. Горячая клавиша: `Ctrl+F`.'
      >
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'stretch', md: 'center' }}
            gap={1}
          >
            <TextField
              fullWidth
              size='small'
              value={searchQuery}
              inputRef={searchInputRef}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder='Поиск по колонкам, nullable, index, dtype metadata...'
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchRoundedIcon fontSize='small' color='action' />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                maxWidth: { xs: '100%', md: 420 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                },
              }}
            />

            <Stack direction='row' flexWrap='wrap' gap={0.75}>
              <MetadataPill
                label={`${formatNumber(filteredColumns.length)} / ${formatNumber(metadata.columns.length)} колонок`}
              />
              <MetadataPill label='Ctrl+F' tone='info' />
            </Stack>
          </Stack>

          {filteredColumns.length > 0 ? (
            <Stack spacing={1.25}>
              {filteredColumns.map(column => (
                <DataFrameColumnRow key={column.name} column={column} />
              ))}
            </Stack>
          ) : (
            <Paper
              elevation={0}
              sx={theme => ({
                p: 2,
                borderRadius: '18px',
                border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
                background:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.04)
                    : alpha(theme.palette.common.white, 0.78),
              })}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                Совпадения не найдены
              </Typography>
              <Typography color='text.secondary' sx={{ mt: 0.5, fontSize: 12 }}>
                Попробуйте имя колонки, `nullable`, `index` или одно из полей
                `dtype_metadata`.
              </Typography>
            </Paper>
          )}
        </Stack>
      </MetadataSection>
    </MetadataPanelSurface>
  );
};
