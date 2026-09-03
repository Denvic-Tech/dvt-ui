import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Column, DbColumn } from '@/shared/gatewayClient';
import { formatBoolean } from '../lib/formatters.ts';
import { DTypeMetadataDetails } from './DTypeMetadataDetails.tsx';
import { MetadataPill } from './MetadataPrimitives.tsx';

type SupportedColumn = Column | DbColumn;

interface ColumnMetadataCardProps {
  column: SupportedColumn;
}

export const ColumnMetadataCard = ({ column }: ColumnMetadataCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 2,
        borderRadius: '22px',
        border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
        background:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.white, 0.04)
            : alpha(theme.palette.common.white, 0.78),
      })}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={1.25}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {column.name}
            </Typography>
            <Typography color='text.secondary' sx={{ mt: 0.5, fontSize: 12 }}>
              Колонка данных и её dtype-профиль.
            </Typography>
          </Box>
          <Stack direction='row' flexWrap='wrap' gap={0.75}>
            <MetadataPill label={column.dtype} tone='info' />
            {column.nullable ? (
              <MetadataPill label='nullable' tone='warning' />
            ) : null}
            {column.index ? (
              <MetadataPill label='index' tone='success' />
            ) : null}
            {'primary_key' in column && column.primary_key != null && (
              <MetadataPill
                label={`PK: ${formatBoolean(column.primary_key)}`}
                tone={column.primary_key ? 'success' : 'neutral'}
              />
            )}
          </Stack>
        </Stack>

        {'indexes' in column && column.indexes?.length ? (
          <Stack direction='row' flexWrap='wrap' gap={0.75}>
            {column.indexes.map(indexName => (
              <MetadataPill
                key={`${column.name}-${indexName}`}
                label={indexName}
                tone='neutral'
              />
            ))}
          </Stack>
        ) : null}

        <DTypeMetadataDetails dtypeMetadata={column.dtype_metadata ?? null} />
      </Stack>
    </Paper>
  );
};
