import type { RootState } from '@/app/providers/store';

import type { OrganizationsSliceState } from './slice.ts';

export const selectOrganizationsState = (
  state: RootState
): OrganizationsSliceState => state.organizations as OrganizationsSliceState;

export const selectOrganizations = (state: RootState) =>
  selectOrganizationsState(state).items;

export const selectOrganizationsStatus = (state: RootState) =>
  selectOrganizationsState(state).status;

export const selectOrganizationsError = (state: RootState) =>
  selectOrganizationsState(state).error;

export const selectOrganizationsLastUpdatedAt = (state: RootState) =>
  selectOrganizationsState(state).lastUpdatedAt;

export const selectOrganizationsIsLoading = (state: RootState) =>
  selectOrganizationsStatus(state) === 'loading';
