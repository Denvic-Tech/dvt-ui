import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { DTypeMetadata } from '@/shared/gatewayClient';
import { formatBoolean } from '../lib/formatters.ts';
import { MetadataKeyValueGrid } from './MetadataPrimitives.tsx';

export const getDTypeMetadataItems = (dtypeMetadata?: DTypeMetadata | null) => {
  return [
    { label: 'dtype.name', value: dtypeMetadata?.name },
    { label: 'dtype.class', value: dtypeMetadata?.class },
    { label: 'dtype.origin', value: dtypeMetadata?.origin },
    { label: 'dtype.repr', value: dtypeMetadata?.repr, mono: true },
    { label: 'dtype.module', value: dtypeMetadata?.module, mono: true },
    { label: 'dtype.kind', value: dtypeMetadata?.kind },
    { label: 'dtype.itemsize', value: dtypeMetadata?.itemsize },
    {
      label: 'dtype.is_extension',
      value:
        dtypeMetadata?.is_extension == null
          ? null
          : formatBoolean(dtypeMetadata.is_extension),
    },
    { label: 'dtype.scalar_type', value: dtypeMetadata?.scalar_type },
    { label: 'dtype.storage', value: dtypeMetadata?.storage },
    { label: 'dtype.unit', value: dtypeMetadata?.unit },
    { label: 'dtype.timezone', value: dtypeMetadata?.timezone },
    {
      label: 'dtype.ordered',
      value:
        dtypeMetadata?.ordered == null
          ? null
          : formatBoolean(dtypeMetadata.ordered),
    },
    {
      label: 'dtype.categories_count',
      value: dtypeMetadata?.categories_count,
    },
    {
      label: 'dtype.categories_dtype',
      value: dtypeMetadata?.categories_dtype,
    },
  ];
};

export const hasDTypeMetadata = (dtypeMetadata?: DTypeMetadata | null) => {
  return getDTypeMetadataItems(dtypeMetadata).some(item => item.value != null);
};

interface DTypeMetadataDetailsProps {
  dtypeMetadata?: DTypeMetadata | null;
  title?: string;
  description?: string;
}

export const DTypeMetadataDetails = ({
  dtypeMetadata,
  title = 'dtype metadata',
  description = 'Расширенные свойства типа данных, пришедшие с backend.',
}: DTypeMetadataDetailsProps) => {
  return (
    <Box
      sx={theme => ({
        p: 1.5,
        borderRadius: '18px',
        border: `1px solid ${alpha(theme.palette.common.black, 0.07)}`,
        background:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.common.black, 0.16)
            : 'rgba(248, 250, 252, 0.92)',
      })}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{title}</Typography>
      <Typography color='text.secondary' sx={{ mt: 0.5, fontSize: 12 }}>
        {description}
      </Typography>
      <Box sx={{ mt: 1.25 }}>
        <MetadataKeyValueGrid items={getDTypeMetadataItems(dtypeMetadata)} />
      </Box>
    </Box>
  );
};
