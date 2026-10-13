import { useDeferredValue, useMemo, useState } from 'react';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Typography } from '@mui/material';

import {
  type DatasetField,
  DatasetFieldStatusBadge,
} from '@/entities/data/data-catalog';

import {
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
} from '@/shared/ui/primitives';

interface DatasetFieldsTabProps {
  fields: DatasetField[];
}

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

export const DatasetFieldsTab = ({ fields }: DatasetFieldsTabProps) => {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter.trim().toLowerCase());

  const sortedFields = useMemo(() => [...fields].sort(compareFields), [fields]);

  const visibleFields = useMemo(
    () =>
      deferredFilter
        ? sortedFields.filter(field =>
            [field.name, field.dtype, field.effective_description]
              .filter(Boolean)
              .some(value => value!.toLowerCase().includes(deferredFilter))
          )
        : sortedFields,
    [deferredFilter, sortedFields]
  );

  if (fields.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
        Схема полей ещё не получена.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Input
        placeholder='Фильтр по имени, типу или описанию'
        value={filter}
        onChange={event => setFilter(event.target.value)}
        startAdornment={<SearchIcon fontSize='small' />}
      />

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
          {visibleFields.map((field, index) => (
            <TableRow
              key={field.id}
              sx={{
                opacity: field.status === 'missing' ? 0.6 : 1,
                verticalAlign: 'top',
              }}
            >
              <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                {field.ordinal ?? index + 1}
              </TableCell>
              <TableCell>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    minWidth: 0,
                  }}
                >
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
          {visibleFields.length === 0 ? (
            <TableRow hover={false}>
              <TableCell colSpan={6}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ py: 1, textAlign: 'center' }}
                >
                  Поля не найдены
                </Typography>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Box>
  );
};
