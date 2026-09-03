import React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';

import { useAppSelector } from '@/app/providers/store';

import { selectThemeMode } from '@/entities/ui-preferences';

import { darkTheme, lightTheme } from '@/shared/ui';

interface AppThemeProviderProps {
  children: React.ReactNode;
}

export const AppThemeProvider: React.FC<AppThemeProviderProps> = ({
  children,
}) => {
  const themeMode = useAppSelector(selectThemeMode);
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          backgroundColor: theme => theme.palette.background.default,
          height: '100dvh',
          minHeight: '100dvh',
          boxSizing: 'border-box',
          padding: '12px 16px',
          overflow: 'visible',
          color: 'text.primary',
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
};

export default AppThemeProvider;
