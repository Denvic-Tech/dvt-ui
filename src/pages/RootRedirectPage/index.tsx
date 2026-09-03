import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

export default function RootRedirectPage() {
  const navigate = useNavigate();
  const { isAuthLoading, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    navigate(isAuthenticated ? '/projects' : '/sign_in', {
      replace: true,
    });
  }, [isAuthLoading, isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
