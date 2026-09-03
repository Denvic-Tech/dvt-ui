import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { DbTable } from '@/shared/gatewayClient';

type ReadTableMetadataPreviewProps = {
  databaseName: string | null;
  schemaName: string | null;
  table: DbTable;
};

const BooleanMark = ({ value }: { value: boolean | null | undefined }) =>
  value ? (
    <CheckRoundedIcon color='success' sx={{ fontSize: 16 }} />
  ) : (
    <Typography component='span' color='text.disabled' sx={{ fontSize: 12 }}>
      —
    </Typography>
  );

export const ReadTableMetadataPreview = ({
  databaseName,
  schemaName,
  table,
}: ReadTableMetadataPreviewProps) => (
  <Stack spacing={2}>
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 650 }}>
        {table.name}
      </Typography>
      <Typography color='text.secondary' sx={{ mt: 0.25, fontSize: 12 }}>
        {[databaseName, schemaName].filter(Boolean).join(' / ') ||
          'Текущее подключение'}
      </Typography>
      <Stack direction='row' gap={0.75} flexWrap='wrap' sx={{ mt: 1.25 }}>
        <Chip
          size='small'
          label={table.type || 'TABLE'}
          sx={{ height: 24, fontSize: 11 }}
        />
        <Chip
          size='small'
          label={`${table.columns.length} кол.`}
          sx={{ height: 24, fontSize: 11 }}
        />
      </Stack>
    </Box>

    <Box
      sx={theme => ({
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        backgroundColor: theme.palette.background.paper,
      })}
    >
      <Box
        sx={theme => ({
          display: 'grid',
          gridTemplateColumns:
            'minmax(130px, 1fr) minmax(90px, auto) 44px 44px',
          gap: 1,
          px: 1.5,
          py: 1,
          backgroundColor: alpha(theme.palette.grey[100], 0.72),
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        {['Колонка', 'Тип', 'NULL', 'Индекс'].map(label => (
          <Typography
            key={label}
            color='text.secondary'
            sx={{ fontSize: 10.5, fontWeight: 650 }}
          >
            {label}
          </Typography>
        ))}
      </Box>
      {table.columns.map(column => (
        <Box
          key={column.name}
          sx={theme => ({
            display: 'grid',
            gridTemplateColumns:
              'minmax(130px, 1fr) minmax(90px, auto) 44px 44px',
            alignItems: 'center',
            gap: 1,
            minHeight: 40,
            px: 1.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '&:last-of-type': { borderBottom: 0 },
          })}
        >
          <Stack direction='row' alignItems='center' gap={0.65} minWidth={0}>
            {column.primary_key ? (
              <KeyRoundedIcon
                color='warning'
                sx={{ flexShrink: 0, fontSize: 15 }}
              />
            ) : null}
            <Typography
              title={column.name}
              sx={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'monospace',
                fontSize: 11.5,
              }}
            >
              {column.name}
            </Typography>
          </Stack>
          <Typography
            title={String(column.dtype ?? '')}
            color='text.secondary'
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              fontSize: 10.5,
            }}
          >
            {String(column.dtype ?? 'unknown')}
          </Typography>
          <BooleanMark value={column.nullable} />
          <BooleanMark
            value={
              column.index ||
              column.primary_key ||
              Boolean(column.indexes?.length)
            }
          />
        </Box>
      ))}
    </Box>
  </Stack>
);
