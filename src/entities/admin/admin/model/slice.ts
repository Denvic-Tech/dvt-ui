import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import type {
  AdminUserCreateSchema,
  AdminUserReadSchema,
  AdminUserUpdateSchema,
  CommonResponse,
} from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { adminApi } from '../api/adminApi.ts';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AdminSliceState {
  users: AdminUserReadSchema[];
  usersStatus: RequestStatus;
  usersError: ApiErrorPayload | null;
  selectedUser: AdminUserReadSchema | null;
  selectedUserStatus: RequestStatus;
  selectedUserError: ApiErrorPayload | null;
  createStatus: RequestStatus;
  createError: ApiErrorPayload | null;
  updateStatus: RequestStatus;
  updateError: ApiErrorPayload | null;
  updatingUserId: string | null;
  deleteStatus: RequestStatus;
  deleteError: ApiErrorPayload | null;
  deletingUserId: string | null;
  lastUpdatedAt: string | null;
}

const initialState: AdminSliceState = {
  users: [],
  usersStatus: 'idle',
  usersError: null,
  selectedUser: null,
  selectedUserStatus: 'idle',
  selectedUserError: null,
  createStatus: 'idle',
  createError: null,
  updateStatus: 'idle',
  updateError: null,
  updatingUserId: null,
  deleteStatus: 'idle',
  deleteError: null,
  deletingUserId: null,
  lastUpdatedAt: null,
};

export const fetchAdminUsers = createAppAsyncThunk<
  AdminUserReadSchema[],
  { page?: number; limit?: number; emailContains?: string | undefined }
>('admin/fetchUsers', async ({ page = 1, limit = 30, emailContains }) => {
  return await adminApi.getAllUsers(page, limit, emailContains);
});

export const fetchAdminUserById = createAppAsyncThunk<
  AdminUserReadSchema,
  string
>('admin/fetchUserById', id => adminApi.getUserById(id));

export const createAdminUser = createAppAsyncThunk<
  CommonResponse,
  AdminUserCreateSchema
>('admin/createUser', payload => adminApi.createUser(payload));

export const updateAdminUser = createAppAsyncThunk<
  { response: CommonResponse; user: AdminUserReadSchema },
  AdminUserUpdateSchema
>('admin/updateUser', async payload => {
  const response = await adminApi.updateUser(payload.user_id, payload);
  const user = await adminApi.getUserById(payload.user_id);

  return { response, user };
});

export const deleteAdminUser = createAppAsyncThunk<
  { id: string; response: CommonResponse },
  string
>('admin/deleteUser', async id => {
  const response = await adminApi.deleteUser(id);
  return { id, response };
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetAdminCreateState: state => {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetAdminUpdateState: state => {
      state.updateStatus = 'idle';
      state.updateError = null;
      state.updatingUserId = null;
    },
    resetAdminDeleteState: state => {
      state.deleteStatus = 'idle';
      state.deleteError = null;
      state.deletingUserId = null;
    },
    resetAdminSelectedUser: state => {
      state.selectedUser = null;
      state.selectedUserStatus = 'idle';
      state.selectedUserError = null;
    },
    setAdminSelectedUser: (
      state,
      action: PayloadAction<AdminUserReadSchema | null>
    ) => {
      state.selectedUser = action.payload;
    },
    clearAdminState: state => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAdminUsers.pending, state => {
        state.usersStatus = 'loading';
        state.usersError = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.usersStatus = 'succeeded';
        state.users = action.payload;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.usersStatus = 'failed';
        state.usersError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Failed to load admin users.'
        );
      })
      .addCase(fetchAdminUserById.pending, state => {
        state.selectedUserStatus = 'loading';
        state.selectedUserError = null;
      })
      .addCase(fetchAdminUserById.fulfilled, (state, action) => {
        state.selectedUserStatus = 'succeeded';
        state.selectedUser = action.payload;
      })
      .addCase(fetchAdminUserById.rejected, (state, action) => {
        state.selectedUserStatus = 'failed';
        state.selectedUserError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Failed to load admin user.'
        );
      })
      .addCase(createAdminUser.pending, state => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createAdminUser.fulfilled, state => {
        state.createStatus = 'succeeded';
      })
      .addCase(createAdminUser.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Failed to create admin user.'
        );
      })
      .addCase(updateAdminUser.pending, (state, action) => {
        state.updateStatus = 'loading';
        state.updateError = null;
        state.updatingUserId = action.meta.arg.user_id;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.updatingUserId = null;

        const { user } = action.payload;
        if (user.id) {
          const idx = state.users.findIndex(item => item.id === user.id);
          if (idx >= 0) {
            state.users[idx] = user;
          }
        }

        if (state.selectedUser?.id === user.id) {
          state.selectedUser = user;
        }

        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updatingUserId = null;
        state.updateError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Failed to update admin user.'
        );
      })
      .addCase(deleteAdminUser.pending, (state, action) => {
        state.deleteStatus = 'loading';
        state.deleteError = null;
        state.deletingUserId = action.meta.arg;
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        state.deletingUserId = null;

        state.users = state.users.filter(user => user.id !== action.payload.id);

        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = null;
        }

        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(deleteAdminUser.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.deleteError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Failed to delete admin user.'
        );
      });
  },
});

export const adminReducer = adminSlice.reducer;

export const {
  resetAdminCreateState,
  resetAdminUpdateState,
  resetAdminDeleteState,
  resetAdminSelectedUser,
  setAdminSelectedUser,
  clearAdminState,
} = adminSlice.actions;
