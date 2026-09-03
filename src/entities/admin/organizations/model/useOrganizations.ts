import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectOrganizations,
  selectOrganizationsError,
  selectOrganizationsIsLoading,
  selectOrganizationsLastUpdatedAt,
  selectOrganizationsStatus,
} from './selectors.ts';
import { clearOrganizationsState, fetchOrganizations } from './slice.ts';

export const useOrganizations = () => {
  const dispatch = useAppDispatch();

  const organizations = useAppSelector(selectOrganizations);
  const organizationsStatus = useAppSelector(selectOrganizationsStatus);
  const organizationsError = useAppSelector(selectOrganizationsError);
  const organizationsLoading = useAppSelector(selectOrganizationsIsLoading);
  const lastUpdatedAt = useAppSelector(selectOrganizationsLastUpdatedAt);

  const loadOrganizations = useCallback(
    () => dispatch(fetchOrganizations()).unwrap(),
    [dispatch]
  );

  const resetOrganizationsState = useCallback(
    () => dispatch(clearOrganizationsState()),
    [dispatch]
  );

  return {
    organizations,
    organizationsStatus,
    organizationsError,
    organizationsLoading,
    lastUpdatedAt,
    loadOrganizations,
    resetOrganizationsState,
  } as const;
};
