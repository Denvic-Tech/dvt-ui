import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const StepLoadingOverlay: React.FC<{ message?: string }> = ({
  message = 'Загрузка данных...',
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
      gap: 2,
      py: 4,
    }}
  >
    <CircularProgress size={48} thickness={4} />
    <Typography variant='body2' color='text.secondary'>
      {message}
    </Typography>
  </Box>
);
