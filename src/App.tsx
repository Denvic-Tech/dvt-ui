import React from 'react';
import { Box } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Provider as ReduxProvider } from 'react-redux';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { GlobalErrorBoundary } from '@/app/errors/ui/GlobalErrorBoundary';
import { AlertStack } from '@/app/notifications';
import { ConfirmDialogProvider } from '@/app/providers/confirm-dialog';
import { LanguageProvider } from '@/app/providers/language';
import { RuntimeConfigProvider } from '@/app/providers/runtime-config';
import { persistor, store } from '@/app/providers/store';
import { AppThemeProvider } from '@/app/providers/theme/AppThemeProvider';
import { PageTitle } from '@/app/router/ui/PageTitle';
import { ProtectedRoute } from '@/app/router/ui/ProtectedRoute';
import { useSetup } from '@/app/setup';

import HomePage from '@/pages/HomePage';
import { ProjectEditorRoute } from '@/pages/ProjectEditorPage';
import ProjectsPage from '@/pages/ProjectsPage';
import SetupPage from '@/pages/SetupPage';
import SignInPage from '@/pages/SigninPage';
import UIKitPage from '@/pages/UIKitPage';
import UserProfilePage from '@/pages/UserProfilePage';

import { MenuAppBar } from '@/widgets/menu-app-bar';

import { SystemUpdateOverlayHost } from '@/features/profile/system-update';
import { SystemAvailabilityGate } from '@/features/system-availability';

import { NodeInputExpressionsConfigProvider } from '@/entities/config/expressions-config';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';

import '@/App.css';

const SetupStatusGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthLoading, isAuthenticated } = useAuth();
  const { status, loadSetupStatus } = useSetup();
  const [isChecking, setIsChecking] = React.useState(true);
  const [hasResolvedSetup, setHasResolvedSetup] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const verifySetupStatus = async () => {
      setIsChecking(true);
      setHasResolvedSetup(false);

      try {
        await loadSetupStatus();

        if (!mounted) {
          return;
        }
        setHasResolvedSetup(true);
      } catch {
        if (mounted) {
          setHasResolvedSetup(true);
        }
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    void verifySetupStatus();

    return () => {
      mounted = false;
    };
  }, [loadSetupStatus, location.pathname, location.search]);

  React.useEffect(() => {
    const isSetupRoute = location.pathname.startsWith('/setup');

    if (isChecking || !hasResolvedSetup || !status) {
      return;
    }

    if (!status.initialized) {
      if (isSetupRoute) {
        return;
      }

      navigate('/setup', {
        replace: true,
        state: {
          from: location.pathname + location.search,
        },
      });
      return;
    }

    if (!isSetupRoute || isAuthLoading) {
      return;
    }

    navigate(isAuthenticated ? '/' : '/sign_in', {
      replace: true,
    });
  }, [
    hasResolvedSetup,
    isAuthLoading,
    isAuthenticated,
    isChecking,
    location.pathname,
    location.search,
    navigate,
    status,
  ]);

  if (isChecking) {
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

  return <>{children}</>;
};

const RoutedAppContent = () => {
  const location = useLocation();
  const isProjectEditorRoute = location.pathname.startsWith('/project-editor/');
  const isHomeRoute =
    location.pathname === '/' || location.pathname === '/home';

  return (
    <LanguageProvider>
      <AuthProvider>
        <SystemAvailabilityGate>
          <RuntimeConfigProvider>
            <NodeInputExpressionsConfigProvider>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  gap: '12px',
                  backgroundColor: 'fafafa',
                }}
              >
                <MenuAppBar />
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: isProjectEditorRoute ? 'visible' : 'auto',
                    backgroundColor: 'background.default',
                    ...(isHomeRoute
                      ? {
                          scrollbarGutter: 'stable',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#c7cbd1 transparent',
                          '&::-webkit-scrollbar': {
                            width: 10,
                            height: 10,
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#c7cbd1',
                            borderRadius: 999,
                            border: '3px solid transparent',
                            backgroundClip: 'content-box',
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: '#aeb4be',
                          },
                          '&::-webkit-scrollbar-button': {
                            display: 'none',
                            width: 0,
                            height: 0,
                          },
                          '&::-webkit-scrollbar-button:single-button': {
                            display: 'none',
                            width: 0,
                            height: 0,
                          },
                          '&::-webkit-scrollbar-button:vertical:decrement': {
                            display: 'none',
                            width: 0,
                            height: 0,
                          },
                          '&::-webkit-scrollbar-button:vertical:increment': {
                            display: 'none',
                            width: 0,
                            height: 0,
                          },
                          '&::-webkit-scrollbar-button:horizontal:decrement': {
                            display: 'none',
                            width: 0,
                            height: 0,
                          },
                          '&::-webkit-scrollbar-button:horizontal:increment': {
                            display: 'none',
                            width: 0,
                            height: 0,
                          },
                          '&::-webkit-scrollbar-corner': {
                            background: 'transparent',
                          },
                        }
                      : null),
                  }}
                >
                  <SetupStatusGuard>
                    <Routes>
                      <Route
                        path='/'
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <PageTitle title='Home'>
                              <HomePage />
                            </PageTitle>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path='/profile/*'
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <PageTitle title='Profile'>
                              <UserProfilePage />
                            </PageTitle>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path='/ui-kit/*'
                        element={
                          <ProtectedRoute allowAll={true}>
                            <PageTitle title='UI Kit'>
                              <UIKitPage />
                            </PageTitle>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path='/sign_in'
                        element={
                          <ProtectedRoute requireAuth={false}>
                            <PageTitle title='Sign in'>
                              <SignInPage />
                            </PageTitle>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path='/setup'
                        element={
                          <ProtectedRoute allowAll={true}>
                            <PageTitle title='Setup'>
                              <SetupPage />
                            </PageTitle>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path='/home'
                        element={<Navigate to='/' replace />}
                      />

                      <Route
                        path='/projects'
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <PageTitle title='Projects'>
                              <ProjectsPage />
                            </PageTitle>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path='/project-editor/:projectID'
                        element={
                          <ProtectedRoute requireAuth={true}>
                            <ProjectEditorRoute />
                          </ProtectedRoute>
                        }
                      />

                      <Route path='*' element={<Navigate to='/' replace />} />
                    </Routes>
                  </SetupStatusGuard>
                </Box>
              </Box>
            </NodeInputExpressionsConfigProvider>
          </RuntimeConfigProvider>
        </SystemAvailabilityGate>
        <SystemUpdateOverlayHost />
        <AlertStack />
      </AuthProvider>
    </LanguageProvider>
  );
};

const MainContent = () => {
  return (
    <BrowserRouter>
      <RoutedAppContent />
    </BrowserRouter>
  );
};

const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  console.error('Global error caught:', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  });
};

function App() {
  return (
    <GlobalErrorBoundary onError={handleGlobalError}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ReduxProvider store={store}>
          <PersistGate loading={<CircularProgress />} persistor={persistor}>
            <AppThemeProvider>
              <ConfirmDialogProvider>
                <MainContent />
              </ConfirmDialogProvider>
            </AppThemeProvider>
          </PersistGate>
        </ReduxProvider>
      </LocalizationProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
