import { createSlice } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';
import {
  ensureApiErrorPayload,
  type ApiErrorPayload,
} from '@/shared/lib/errors';
import type { OrganizationReadSchema } from '@/shared/gatewayClient';

import { organizationsApi } from '../api/organizationsApi.ts';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface OrganizationsSliceState {
  items: OrganizationReadSchema[];
  status: RequestStatus;
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;
}

const initialState: OrganizationsSliceState = {
  items: [],
  status: 'idle',
  error: null,
  lastUpdatedAt: null,
};

export const fetchOrganizations = createAppAsyncThunk<OrganizationReadSchema[]>(
  'organizations/fetchOrganizations',
  () => organizationsApi.getOrganizations()
);

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    clearOrganizationsState: state => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOrganizations.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Failed to load organizations.'
        );
      });
  },
});

export const organizationsReducer = organizationsSlice.reducer;

export const { clearOrganizationsState } = organizationsSlice.actions;
