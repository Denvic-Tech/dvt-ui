import { createSlice } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers';

import type {
  McpTokenCreatedSchema,
  McpTokenCreateSchema,
  McpTokenReadSchema,
} from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { mcpTokenApi } from '../api';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface McpTokenSliceState {
  items: McpTokenReadSchema[];
  status: RequestStatus;
  error: ApiErrorPayload | null;
  creationStatus: RequestStatus;
  creationError: ApiErrorPayload | null;
  createdSecret: string | null;
  deletionStatus: RequestStatus;
  deletionError: ApiErrorPayload | null;
  deletingTokenId: string | null;
}

const initialState: McpTokenSliceState = {
  items: [],
  status: 'idle',
  error: null,
  creationStatus: 'idle',
  creationError: null,
  createdSecret: null,
  deletionStatus: 'idle',
  deletionError: null,
  deletingTokenId: null,
};

export const fetchMcpTokens = createAppAsyncThunk<McpTokenReadSchema[]>(
  'mcpToken/fetchList',
  () => mcpTokenApi.list()
);

export const createMcpToken = createAppAsyncThunk<
  McpTokenCreatedSchema,
  McpTokenCreateSchema
>('mcpToken/create', payload => mcpTokenApi.create(payload));

export const revokeMcpToken = createAppAsyncThunk<void, string>(
  'mcpToken/revoke',
  tokenId => mcpTokenApi.revoke(tokenId)
);

const mcpTokenSlice = createSlice({
  name: 'mcpToken',
  initialState,
  reducers: {
    resetMcpTokenCreationState: state => {
      state.creationStatus = 'idle';
      state.creationError = null;
      state.createdSecret = null;
    },
    resetMcpTokenDeletionState: state => {
      state.deletionStatus = 'idle';
      state.deletionError = null;
      state.deletingTokenId = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMcpTokens.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMcpTokens.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchMcpTokens.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось загрузить MCP-токены.'
        );
      })
      .addCase(createMcpToken.pending, state => {
        state.creationStatus = 'loading';
        state.creationError = null;
        state.createdSecret = null;
      })
      .addCase(createMcpToken.fulfilled, (state, action) => {
        state.creationStatus = 'succeeded';
        state.createdSecret = action.payload.token;
        state.items.unshift(action.payload);
      })
      .addCase(createMcpToken.rejected, (state, action) => {
        state.creationStatus = 'failed';
        state.creationError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось создать MCP-токен.'
        );
      })
      .addCase(revokeMcpToken.pending, (state, action) => {
        state.deletionStatus = 'loading';
        state.deletionError = null;
        state.deletingTokenId = action.meta.arg;
      })
      .addCase(revokeMcpToken.fulfilled, (state, action) => {
        state.deletionStatus = 'succeeded';
        state.items = state.items.filter(item => item.id !== action.meta.arg);
        state.deletingTokenId = null;
      })
      .addCase(revokeMcpToken.rejected, (state, action) => {
        state.deletionStatus = 'failed';
        state.deletionError = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось отозвать MCP-токен.'
        );
        state.deletingTokenId = null;
      });
  },
});

export const mcpTokenReducer = mcpTokenSlice.reducer;
export const { resetMcpTokenCreationState, resetMcpTokenDeletionState } =
  mcpTokenSlice.actions;
