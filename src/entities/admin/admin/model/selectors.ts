import { type RootState } from '@/app/providers/store';

import type { AdminSliceState } from './slice.ts';

export const selectAdminState = (state: RootState): AdminSliceState =>
  state.admin as AdminSliceState;

export const selectAdminUsers = (state: RootState) =>
  selectAdminState(state).users;

export const selectAdminUsersStatus = (state: RootState) =>
  selectAdminState(state).usersStatus;

export const selectAdminUsersIsLoading = (state: RootState): boolean =>
  selectAdminUsersStatus(state) === 'loading';

export const selectAdminUsersError = (state: RootState) =>
  selectAdminState(state).usersError;

export const selectAdminLastUpdatedAt = (state: RootState) =>
  selectAdminState(state).lastUpdatedAt;

export const selectAdminSelectedUser = (state: RootState) =>
  selectAdminState(state).selectedUser;

export const selectAdminSelectedUserStatus = (state: RootState) =>
  selectAdminState(state).selectedUserStatus;

export const selectAdminSelectedUserError = (state: RootState) =>
  selectAdminState(state).selectedUserError;

export const selectAdminCreateStatus = (state: RootState) =>
  selectAdminState(state).createStatus;

export const selectAdminCreateError = (state: RootState) =>
  selectAdminState(state).createError;

export const selectAdminUpdateStatus = (state: RootState) =>
  selectAdminState(state).updateStatus;

export const selectAdminUpdateError = (state: RootState) =>
  selectAdminState(state).updateError;

export const selectAdminUpdatingUserId = (state: RootState) =>
  selectAdminState(state).updatingUserId;

export const selectAdminDeleteStatus = (state: RootState) =>
  selectAdminState(state).deleteStatus;

export const selectAdminDeleteError = (state: RootState) =>
  selectAdminState(state).deleteError;

export const selectAdminDeletingUserId = (state: RootState) =>
  selectAdminState(state).deletingUserId;

export const selectAdminIsCreating = (state: RootState) =>
  selectAdminCreateStatus(state) === 'loading';

export const selectAdminIsUpdating = (state: RootState) =>
  selectAdminUpdateStatus(state) === 'loading';

export const selectAdminIsDeleting = (state: RootState) =>
  selectAdminDeleteStatus(state) === 'loading';
