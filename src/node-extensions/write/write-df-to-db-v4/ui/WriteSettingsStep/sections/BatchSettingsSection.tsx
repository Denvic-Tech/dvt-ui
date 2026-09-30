import { Box, InputAdornment, TextField, Typography } from '@mui/material';
import type { ChangeEvent } from 'react';

type BatchSettingsSectionProps = {
  chunkSize: number | null | undefined;
  chunkSizeBounds: { min: number; max: number };
  minBatchRows: number | null | undefined;
  minBatchRowsBounds: { min: number; max: number };
  onChunkSizeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMinBatchRowsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  errors?: Record<string, string[]>;
};

export const BatchSettingsSection = ({
  chunkSize,
  chunkSizeBounds,
  minBatchRows,
  minBatchRowsBounds,
  onChunkSizeChange,
  onMinBatchRowsChange,
  errors = {},
}: BatchSettingsSectionProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 1.5,
    }}
  >
    {[
      {
        name: 'chunksize',
        label: 'Размер чанка',
        value: chunkSize,
        bounds: chunkSizeBounds,
        onChange: onChunkSizeChange,
        hint: 'Строк в одном INSERT',
      },
      {
        name: 'min_batch_rows',
        label: 'Мин. размер пакета',
        value: minBatchRows,
        bounds: minBatchRowsBounds,
        onChange: onMinBatchRowsChange,
        hint: 'Копить строки перед записью',
      },
    ].map(field => (
      <Box key={field.name} sx={{ minWidth: 0 }}>
        <Typography
          component='label'
          htmlFor={field.name}
          sx={{
            display: 'block',
            mb: 0.75,
            fontFamily: 'Inter, sans-serif',
            fontSize: 12.5,
            color: '#6b6b76',
          }}
        >
          {field.label}
        </Typography>
        <TextField
          id={field.name}
          fullWidth
          size='small'
          type='number'
          value={field.value ?? ''}
          onChange={field.onChange}
          error={Boolean(errors[field.name]?.length)}
          inputProps={{ min: field.bounds.min, max: field.bounds.max, step: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <Typography sx={{ fontSize: 12, color: '#c0c0c8' }}>
                  строк
                </Typography>
              </InputAdornment>
            ),
          }}
          helperText={errors[field.name]?.join(' ') || field.hint}
          sx={{
            '& .MuiOutlinedInput-root': { height: 34, borderRadius: '8px' },
            '& input': {
              fontFamily: 'Consolas, monospace',
              fontSize: 13,
              px: 1.25,
            },
            '& .MuiFormHelperText-root': {
              mx: 0,
              mt: 0.5,
              fontSize: 12,
              color: '#b2b2bd',
            },
            '& .MuiFormHelperText-root.Mui-error': { color: 'error.main' },
          }}
        />
      </Box>
    ))}
  </Box>
);
