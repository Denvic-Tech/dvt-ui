import React, { memo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowAll?: boolean; // новый параметр
}

export const ProtectedRoute = memo(function ProtectedRoute({
  children,
  requireAuth = false,
  allowAll = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (allowAll) {
    return <>{children}</>;
  }

  if (!requireAuth && isAuthenticated) {
    const returnUrl = searchParams.get('returnUrl') || '/';
    return <Navigate to={returnUrl} replace />;
  }

  if (isAuthLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (requireAuth && !isAuthenticated) {
    const returnUrl = location.pathname + location.search;
    const signInUrl = `/sign_in?returnUrl=${encodeURIComponent(returnUrl)}`;
    return <Navigate to={signInUrl} replace />;
  }

  return <>{children}</>;
});
