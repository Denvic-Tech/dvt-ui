import { useDeferredValue, useMemo, useState } from 'react';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import {
  type DatasetField,
  DatasetFieldStatusBadge,
  DatasetFreshnessBadge,
  formatDatasetDateTime,
  getDatasetHostLabel,
  getDatasetName,
  getDatasetQualifiedName,
  useGetDatasetQuery,
} from '@/entities/data/data-catalog';

import {
  Alert,
  Button,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
} from '@/shared/ui/primitives';

import {
  DetailHeader,
  DetailScroll,
  DetailSubtitle,
  DetailTitle,
  GhostIconButton,
  SearchField,
  SearchInput,
} from './DataCatalogModal.styles';

const compareFields = (left: DatasetField, right: DatasetField) => {
  const leftOrdinal = left.ordinal ?? Number.MAX_SAFE_INTEGER;
  const rightOrdinal = right.ordinal ?? Number.MAX_SAFE_INTEGER;

  return leftOrdinal !== rightOrdinal
    ? leftOrdinal - rightOrdinal
    : left.name.localeCompare(right.name);
};

const getNullableLabel = (nullable: boolean | null | undefined) => {
  if (nullable == null) {
    return '—';
  }

  return nullable ? 'Да' : 'Нет';
};

const FieldDescription = ({ field }: { field: DatasetField }) => {
  const description = field.effective_description?.trim();

  if (!description) {
    return (
      <Typography variant='body2' color='text.disabled' sx={{ fontSize: 12.5 }}>
        —
      </Typography>
    );
  }

  return (
    <Box>
      <Typography
        variant='body2'
        sx={{ fontSize: 12.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {description}
      </Typography>
      {field.description_provenance === 'source' ? (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ fontSize: 11 }}
        >
          из комментария источника
        </Typography>
      ) : null}
    </Box>
  );
};

const FieldsTable = ({ fields }: { fields: DatasetField[] }) => (
  <Table>
    <TableHeader>
      <TableRow hover={false}>
        <TableHead sx={{ width: 40 }}>#</TableHead>
        <TableHead>Поле</TableHead>
        <TableHead>Тип</TableHead>
        <TableHead sx={{ width: 64 }}>Null</TableHead>
        <TableHead>Описание</TableHead>
        <TableHead sx={{ width: 110 }}>Статус</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {fields.map((field, index) => (
        <TableRow
          key={field.id}
          data-testid='widgets/data-catalog/dataset-field'
          sx={{
            opacity: field.status === 'missing' ? 0.6 : 1,
            verticalAlign: 'top',
          }}
        >
          <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
            {field.ordinal ?? index + 1}
          </TableCell>
          <TableCell>
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 0.5 }}>
              <Typography
                variant='body2'
                sx={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  textDecoration:
                    field.status === 'missing' ? 'line-through' : 'none',
                }}
              >
                {field.name}
              </Typography>
              {field.primary_key ? (
                <Tooltip title='Первичный ключ'>
                  <KeyRoundedIcon
                    sx={{ fontSize: 14, color: 'warning.main' }}
                  />
                </Tooltip>
              ) : null}
            </Box>
          </TableCell>
          <TableCell
            sx={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'text.secondary',
              wordBreak: 'break-all',
            }}
          >
            {field.dtype || '—'}
          </TableCell>
          <TableCell sx={{ fontSize: 12 }}>
            {getNullableLabel(field.nullable)}
          </TableCell>
          <TableCell>
            <FieldDescription field={field} />
          </TableCell>
          <TableCell>
            <DatasetFieldStatusBadge status={field.status} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

interface DatasetFieldsPanelProps {
  datasetId: string;
}

export const DatasetFieldsPanel = ({ datasetId }: DatasetFieldsPanelProps) => {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter.trim().toLowerCase());

  // Выбор датасета синхронизирует его схему с источником (sync=true).
  const { data, error, isLoading, isFetching, refetch } = useGetDatasetQuery(
    { datasetId, sync: true, includeFields: true },
    { refetchOnMountOrArgChange: true }
  );

  const sortedFields = useMemo(
    () => [...(data?.fields ?? [])].sort(compareFields),
    [data?.fields]
  );
  const visibleFields = useMemo(
    () =>
      deferredFilter
        ? sortedFields.filter(field =>
            [field.name, field.dtype, field.effective_description].some(value =>
              value?.toLowerCase().includes(deferredFilter)
            )
          )
        : sortedFields,
    [deferredFilter, sortedFields]
  );

  const errorMessage = error
    ? 'message' in error
      ? error.message
      : 'Не удалось загрузить поля датасета.'
    : null;

  const syncStatus = isFetching
    ? 'Синхронизация схемы…'
    : data?.schema_synced_at
      ? `Синхронизировано ${formatDatasetDateTime(data.schema_synced_at)}`
      : null;

  const renderBody = () => {
    if (isLoading) {
      return (
        <>
          <Skeleton variant='rounded' height={34} />
          <Skeleton variant='rounded' height={240} />
        </>
      );
    }

    if (!data) {
      return null;
    }

    if (!sortedFields.length) {
      return (
        <Typography variant='body2' color='text.secondary'>
          Схема полей ещё не получена.
        </Typography>
      );
    }

    return (
      <>
        <SearchField style={{ margin: 0 }}>
          <SearchRoundedIcon sx={{ fontSize: 16 }} />
          <SearchInput
            value={filter}
            placeholder='Фильтр по имени, типу или описанию'
            aria-label='Фильтр полей'
            onChange={event => setFilter(event.target.value)}
          />
        </SearchField>
        {visibleFields.length ? (
          <FieldsTable fields={visibleFields} />
        ) : (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ py: 2, textAlign: 'center' }}
          >
            Поля не найдены
          </Typography>
        )}
      </>
    );
  };

  return (
    <>
      <DetailHeader>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {data ? (
            <>
              <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                <DetailTitle title={getDatasetName(data.locator)}>
                  {getDatasetName(data.locator)}
                </DetailTitle>
                <DatasetFreshnessBadge freshness={data.freshness} compact />
              </Box>
              <DetailSubtitle title={data.physical_key}>
                {[
                  getDatasetQualifiedName(data.locator),
                  getDatasetHostLabel(data.locator),
                  `${sortedFields.length} полей`,
                  syncStatus,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </DetailSubtitle>
            </>
          ) : (
            <>
              <Skeleton variant='text' width={200} height={22} />
              <Skeleton variant='text' width={320} />
            </>
          )}
        </Box>
        <Tooltip placement='bottom' title='Синхронизировать повторно'>
          <span>
            <GhostIconButton
              type='button'
              aria-label='Синхронизировать датасет'
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? (
                <Spinner size={15} />
              ) : (
                <RefreshRoundedIcon sx={{ fontSize: 17 }} />
              )}
            </GhostIconButton>
          </span>
        </Tooltip>
      </DetailHeader>
      <DetailScroll data-testid='widgets/data-catalog/dataset-fields'>
        {errorMessage ? (
          <Alert
            variant='destructive'
            action={
              <Button
                size='xs'
                variant='ghost'
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Повторить
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        ) : null}
        {data?.last_check_error ? (
          <Alert variant='warning'>{data.last_check_error}</Alert>
        ) : null}
        {renderBody()}
      </DetailScroll>
    </>
  );
};
