export { adminApi } from './api/adminApi.ts';

export {
  adminReducer,
  fetchAdminUsers,
  fetchAdminUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  resetAdminCreateState,
  resetAdminUpdateState,
  resetAdminDeleteState,
  resetAdminSelectedUser,
  setAdminSelectedUser,
  clearAdminState,
  type AdminSliceState,
} from './model/slice.ts';

export {
  selectAdminState,
  selectAdminUsers,
  selectAdminUsersStatus,
  selectAdminUsersIsLoading,
  selectAdminUsersError,
  selectAdminLastUpdatedAt,
  selectAdminSelectedUser,
  selectAdminSelectedUserStatus,
  selectAdminSelectedUserError,
  selectAdminCreateStatus,
  selectAdminCreateError,
  selectAdminUpdateStatus,
  selectAdminUpdateError,
  selectAdminUpdatingUserId,
  selectAdminDeleteStatus,
  selectAdminDeleteError,
  selectAdminDeletingUserId,
  selectAdminIsCreating,
  selectAdminIsUpdating,
  selectAdminIsDeleting,
} from './model/selectors.ts';

export { useAdmin } from './model/useAdmin.ts';
