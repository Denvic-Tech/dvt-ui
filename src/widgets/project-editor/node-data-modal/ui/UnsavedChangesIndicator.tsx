import { Box, Typography } from '@mui/material';

export const UnsavedChangesIndicator = () => (
  <Box
    role='status'
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      minWidth: 0,
    }}
  >
    <Box
      aria-hidden='true'
      sx={{
        width: 8,
        height: 8,
        flexShrink: 0,
        borderRadius: '50%',
        backgroundColor: '#ff9800',
      }}
    />
    <Typography
      color='text.secondary'
      sx={{
        fontSize: 15,
        lineHeight: 1.4,
        opacity: 0.76,
        whiteSpace: 'nowrap',
      }}
    >
      Есть несохранённые изменения
    </Typography>
  </Box>
);
