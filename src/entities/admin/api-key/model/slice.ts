import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';
import {
  ensureApiErrorPayload,
  type ApiErrorPayload,
} from '@/shared/lib/errors';
import type { UserTokenRead, ApiTokenCreate } from '@/shared/gatewayClient';
import { apiKeyApi } from '../api.ts';

export interface ApiKeySliceState {
  items: UserTokenRead[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;

  creationStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  creationError: ApiErrorPayload | null;
  createdSecret: string | null;

  deletionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  deletionError: ApiErrorPayload | null;
  deletingTokenIdentifier: string | null;
}

const initialState: ApiKeySliceState = {
  items: [],
  status: 'idle',
  error: null,
  lastUpdatedAt: null,

  creationStatus: 'idle',
  creationError: null,
  createdSecret: null,

  deletionStatus: 'idle',
  deletionError: null,
  deletingTokenIdentifier: null,
};

export const fetchApiKeys = createAppAsyncThunk<UserTokenRead[]>(
  'apiKey/fetchList',
  () => apiKeyApi.list()
);

export const createApiKey = createAppAsyncThunk<string, ApiTokenCreate>(
  'apiKey/create',
  payload => apiKeyApi.create(payload)
);

export const deleteApiKey = createAppAsyncThunk<void, string>(
  'apiKey/delete',
  tokenIdentifier => apiKeyApi.delete(tokenIdentifier)
);

const apiKeySlice = createSlice({
  name: 'apiKey',
  initialState,
  reducers: {
    resetApiKeyCreationState: state => {
      state.creationStatus = 'idle';
      state.creationError = null;
      state.createdSecret = null;
    },
    resetApiKeyDeletionState: state => {
      state.deletionStatus = 'idle';
      state.deletionError = null;
      state.deletingTokenIdentifier = null;
    },
    upsertApiKeys: (state, action: PayloadAction<UserTokenRead[]>) => {
      state.items = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchApiKeys.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить список API-ключей.'
        );
      })

      .addCase(createApiKey.pending, state => {
        state.creationStatus = 'loading';
        state.creationError = null;
        state.createdSecret = null;
      })
      .addCase(createApiKey.fulfilled, (state, action) => {
        state.creationStatus = 'succeeded';
        state.createdSecret = action.payload;
      })
      .addCase(createApiKey.rejected, (state, action) => {
        state.creationStatus = 'failed';
        state.creationError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось создать API-ключ.'
        );
        state.createdSecret = null;
      })

      .addCase(deleteApiKey.pending, (state, action) => {
        state.deletionStatus = 'loading';
        state.deletionError = null;
        state.deletingTokenIdentifier = action.meta.arg;
      })
      .addCase(deleteApiKey.fulfilled, (state, action) => {
        state.deletionStatus = 'succeeded';
        const identifier = action.meta.arg;
        if (identifier) {
          state.items = state.items.filter(item => item.id !== identifier);
        }
        state.deletingTokenIdentifier = null;
      })
      .addCase(deleteApiKey.rejected, (state, action) => {
        state.deletionStatus = 'failed';
        state.deletionError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось удалить API-ключ.'
        );
      });
  },
});

export const apiKeyReducer = apiKeySlice.reducer;

export const {
  resetApiKeyCreationState,
  resetApiKeyDeletionState,
  upsertApiKeys,
} = apiKeySlice.actions;
