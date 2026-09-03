import { type ReactNode, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  fetchRuntimeConfig,
  selectRuntimeConfigStatus,
} from '@/entities/config/runtime-config';

import { useAuth } from '@/contexts/AuthContext';

interface RuntimeConfigProviderProps {
  children: ReactNode;
}

export const RuntimeConfigProvider = ({
  children,
}: RuntimeConfigProviderProps) => {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectRuntimeConfigStatus);
  const { isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || isAuthLoading || status !== 'idle') {
      return;
    }

    void dispatch(fetchRuntimeConfig());
  }, [dispatch, isAuthenticated, isAuthLoading, status]);

  return <>{children}</>;
};
