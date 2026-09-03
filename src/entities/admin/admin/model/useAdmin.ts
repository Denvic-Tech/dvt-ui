import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';
import type {
  AdminUserCreateSchema,
  AdminUserReadSchema,
  AdminUserUpdateSchema,
} from '@/shared/gatewayClient';

import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUserById,
  fetchAdminUsers,
  resetAdminCreateState,
  resetAdminDeleteState,
  resetAdminSelectedUser,
  resetAdminUpdateState,
  setAdminSelectedUser,
  updateAdminUser,
} from './slice.ts';
import {
  selectAdminCreateError,
  selectAdminCreateStatus,
  selectAdminDeleteError,
  selectAdminDeleteStatus,
  selectAdminDeletingUserId,
  selectAdminIsCreating,
  selectAdminIsDeleting,
  selectAdminIsUpdating,
  selectAdminLastUpdatedAt,
  selectAdminSelectedUser,
  selectAdminSelectedUserError,
  selectAdminSelectedUserStatus,
  selectAdminUpdateError,
  selectAdminUpdateStatus,
  selectAdminUpdatingUserId,
  selectAdminUsers,
  selectAdminUsersError,
  selectAdminUsersIsLoading,
  selectAdminUsersStatus,
} from './selectors.ts';

export const useAdmin = () => {
  const dispatch = useAppDispatch();

  const users = useAppSelector(selectAdminUsers);
  const usersStatus = useAppSelector(selectAdminUsersStatus);
  const usersError = useAppSelector(selectAdminUsersError);
  const usersLoading = useAppSelector(selectAdminUsersIsLoading);
  const lastUpdatedAt = useAppSelector(selectAdminLastUpdatedAt);

  const selectedUser = useAppSelector(selectAdminSelectedUser);
  const selectedUserStatus = useAppSelector(selectAdminSelectedUserStatus);
  const selectedUserError = useAppSelector(selectAdminSelectedUserError);

  const createStatus = useAppSelector(selectAdminCreateStatus);
  const createError = useAppSelector(selectAdminCreateError);
  const isCreating = useAppSelector(selectAdminIsCreating);

  const updateStatus = useAppSelector(selectAdminUpdateStatus);
  const updateError = useAppSelector(selectAdminUpdateError);
  const updatingUserId = useAppSelector(selectAdminUpdatingUserId);
  const isUpdating = useAppSelector(selectAdminIsUpdating);

  const deleteStatus = useAppSelector(selectAdminDeleteStatus);
  const deleteError = useAppSelector(selectAdminDeleteError);
  const deletingUserId = useAppSelector(selectAdminDeletingUserId);
  const isDeleting = useAppSelector(selectAdminIsDeleting);

  const loadUsers = useCallback(
    (page: number = 1, limit: number = 30, emailContains?: string) =>
      dispatch(
        fetchAdminUsers({
          page,
          limit,
          emailContains: emailContains ?? undefined,
        })
      ).unwrap(),
    [dispatch]
  );

  const loadUserById = useCallback(
    (id: string) => dispatch(fetchAdminUserById(id)).unwrap(),
    [dispatch]
  );

  const createUser = useCallback(
    (payload: AdminUserCreateSchema) =>
      dispatch(createAdminUser(payload)).unwrap(),
    [dispatch]
  );

  const updateUser = useCallback(
    (payload: AdminUserUpdateSchema) =>
      dispatch(updateAdminUser(payload)).unwrap(),
    [dispatch]
  );

  const deleteUser = useCallback(
    (id: string) => dispatch(deleteAdminUser(id)).unwrap(),
    [dispatch]
  );

  const selectUser = useCallback(
    (user: AdminUserReadSchema | null) => dispatch(setAdminSelectedUser(user)),
    [dispatch]
  );

  const resetCreateState = useCallback(
    () => dispatch(resetAdminCreateState()),
    [dispatch]
  );

  const resetUpdateState = useCallback(
    () => dispatch(resetAdminUpdateState()),
    [dispatch]
  );

  const resetDeleteState = useCallback(
    () => dispatch(resetAdminDeleteState()),
    [dispatch]
  );

  const resetSelectedUser = useCallback(
    () => dispatch(resetAdminSelectedUser()),
    [dispatch]
  );

  return {
    users,
    usersStatus,
    usersError,
    usersLoading,
    lastUpdatedAt,
    selectedUser,
    selectedUserStatus,
    selectedUserError,
    createStatus,
    createError,
    isCreating,
    updateStatus,
    updateError,
    updatingUserId,
    isUpdating,
    deleteStatus,
    deleteError,
    deletingUserId,
    isDeleting,
    loadUsers,
    loadUserById,
    createUser,
    updateUser,
    deleteUser,
    selectUser,
    resetCreateState,
    resetUpdateState,
    resetDeleteState,
    resetSelectedUser,
  } as const;
};
