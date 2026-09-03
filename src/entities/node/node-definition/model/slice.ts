import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { type NodeDefinition } from '@/shared/gatewayClient';
import {
  type ApiErrorPayload,
  ensureApiErrorPayload,
} from '@/shared/lib/errors';

import { fetchNodeDefinitions } from './thunks.ts';

export interface NodeDefinitionSliceState {
  nodesDefinitionsMap: Record<string, NodeDefinition>; // Словарь определений нод
  error: ApiErrorPayload | null;
  lastUpdatedAt: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: NodeDefinitionSliceState = {
  nodesDefinitionsMap: {},
  error: null,
  lastUpdatedAt: null,
  status: 'idle',
};

export const nodeDefinitionSlice = createSlice({
  name: 'nodeDefinition',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchNodeDefinitions.pending, state => {
        state.error = null;
        state.status = 'loading';
      })
      .addCase(
        fetchNodeDefinitions.fulfilled,
        (state, action: PayloadAction<Record<string, NodeDefinition>>) => {
          state.status = 'succeeded';
          state.nodesDefinitionsMap = action.payload;
          state.lastUpdatedAt = new Date().toISOString();
          state.error = null;
        }
      )
      .addCase(fetchNodeDefinitions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось получить определения нод'
        );
      });
  },
});

export const nodeDefinitionReducer = nodeDefinitionSlice.reducer;
