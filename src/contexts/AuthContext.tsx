import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { useAlert } from '@/app/notifications';

import { client } from '@/shared/gatewayClient';

interface AuthContextType {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => Promise<void>;
  login: (email: string, password: string, returnUrl?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthStateChangeDetail = {
  returnUrl?: string;
  showNotification?: boolean;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { showNotification } = useAlert();

  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  // const publicRoutes = ['/sign_in', '/sign_up', '/reset_password'];

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const resp = await client.auth.checkAuth.post();
        if (!resp.data.success) {
          setIsAuthenticated(false);
          console.debug('User is not authenticated');
          return;
        }
        setIsAuthenticated(true);
        console.debug('User is authenticated');
      } catch (error) {
        setIsAuthenticated(false);
        console.debug('User is not authenticated');
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, returnUrl?: string) => {
    try {
      const resp = await client.auth.signIn.post({
        body: {
          email,
          password,
          auth_provider: 'email',
        },
      });

      if (!resp.data.success) {
        console.error('Login failed:', resp.data);
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);
      navigate(returnUrl || '/');
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      await client.auth.logout.post();
      setIsAuthenticated(false);
      navigate('/sign_in');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, [navigate]);

  useEffect(() => {
    const handleAuthStateChange = (event: Event) => {
      const customEvent = event as CustomEvent<AuthStateChangeDetail>;
      const providedReturnUrl = customEvent.detail?.returnUrl;
      const shouldShowNotification =
        customEvent.detail?.showNotification === true;
      const fallbackReturnUrl = `${window.location.pathname}${window.location.search}`;
      const returnUrl =
        providedReturnUrl?.startsWith('/') === true
          ? providedReturnUrl
          : fallbackReturnUrl;

      if (shouldShowNotification) {
        showNotification({
          type: 'warning',
          title: 'Требуется повторный вход',
          description: 'Сессия истекла. Войдите в систему снова.',
          group: 'auth:unauthorized-redirect',
        });
      }

      setIsAuthenticated(false);

      if (window.location.pathname.startsWith('/sign_in')) {
        return;
      }

      navigate(`/sign_in?returnUrl=${encodeURIComponent(returnUrl)}`, {
        replace: true,
      });
    };

    window.addEventListener('authStateChange', handleAuthStateChange);

    return () => {
      window.removeEventListener('authStateChange', handleAuthStateChange);
    };
  }, [navigate, setIsAuthenticated, showNotification]);

  return (
    <AuthContext.Provider
      value={{
        isAuthLoading,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
