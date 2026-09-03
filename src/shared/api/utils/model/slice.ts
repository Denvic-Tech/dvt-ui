import { createSlice } from '@reduxjs/toolkit';

import {
  createAsyncRequestState,
  markFulfilled,
  markPending,
  markRejected,
} from '@/shared/api/utils/model/helpers';
import {
  createDatabaseThunk,
  createSchemaThunk,
  createTableThunk,
  generateSchemaDDLThunk,
  generateTableDDLThunk,
  getSQLCodeMetadataThunk,
} from '@/shared/api/utils/model/thunks';
import { type ApiErrorPayload } from '@/shared/lib/errors';

import {
  CreateDatabaseResult,
  CreateSchemaResult,
  CreateTableResult,
  GenerateSchemaDDLResult,
  GenerateTableDDLResult,
  GetSQLCodeMetadataResult,
} from './types';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncRequestState<TData> {
  data: TData | null;
  status: RequestStatus;
  error: ApiErrorPayload | null;
  currentRequestId: string | null;
  lastCompletedAt: string | null;
}

export interface ApiUtilsSliceState {
  createTable: AsyncRequestState<CreateTableResult>;
  generateTableDDL: AsyncRequestState<GenerateTableDDLResult>;
  createSchema: AsyncRequestState<CreateSchemaResult>;
  generateSchemaDDL: AsyncRequestState<GenerateSchemaDDLResult>;
  createDatabase: AsyncRequestState<CreateDatabaseResult>;
  getSQLCodeMetadata: AsyncRequestState<GetSQLCodeMetadataResult>;
}

const initialState: ApiUtilsSliceState = {
  createTable: createAsyncRequestState<CreateTableResult>(),
  generateTableDDL: createAsyncRequestState<GenerateTableDDLResult>(),
  createSchema: createAsyncRequestState<CreateSchemaResult>(),
  generateSchemaDDL: createAsyncRequestState<GenerateSchemaDDLResult>(),
  createDatabase: createAsyncRequestState<CreateDatabaseResult>(),
  getSQLCodeMetadata: createAsyncRequestState<GetSQLCodeMetadataResult>(),
};

const apiUtilsSlice = createSlice({
  name: 'apiUtils',
  initialState,
  reducers: {
    resetApiUtilsState: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(createTableThunk.pending, (state, action) => {
        markPending(state.createTable, action.meta.requestId);
      })
      .addCase(createTableThunk.fulfilled, (state, action) => {
        markFulfilled(state.createTable, action.meta.requestId, action.payload);
      })
      .addCase(createTableThunk.rejected, (state, action) => {
        markRejected(
          state.createTable,
          action.meta.requestId,
          action.payload,
          action.error.message,
          'Не удалось создать таблицу.'
        );
      })
      .addCase(generateTableDDLThunk.pending, (state, action) => {
        markPending(state.generateTableDDL, action.meta.requestId);
      })
      .addCase(generateTableDDLThunk.fulfilled, (state, action) => {
        markFulfilled(
          state.generateTableDDL,
          action.meta.requestId,
          action.payload
        );
      })
      .addCase(generateTableDDLThunk.rejected, (state, action) => {
        markRejected(
          state.generateTableDDL,
          action.meta.requestId,
          action.payload,
          action.error.message,
          'Не удалось сгенерировать DDL таблицы.'
        );
      })
      .addCase(createSchemaThunk.pending, (state, action) => {
        markPending(state.createSchema, action.meta.requestId);
      })
      .addCase(createSchemaThunk.fulfilled, (state, action) => {
        markFulfilled(
          state.createSchema,
          action.meta.requestId,
          action.payload
        );
      })
      .addCase(createSchemaThunk.rejected, (state, action) => {
        markRejected(
          state.createSchema,
          action.meta.requestId,
          action.payload,
          action.error.message,
          'Не удалось создать схему.'
        );
      })
      .addCase(generateSchemaDDLThunk.pending, (state, action) => {
        markPending(state.generateSchemaDDL, action.meta.requestId);
      })
      .addCase(generateSchemaDDLThunk.fulfilled, (state, action) => {
        markFulfilled(
          state.generateSchemaDDL,
          action.meta.requestId,
          action.payload
        );
      })
      .addCase(generateSchemaDDLThunk.rejected, (state, action) => {
        markRejected(
          state.generateSchemaDDL,
          action.meta.requestId,
          action.payload,
          action.error.message,
          'Не удалось сгенерировать DDL схемы.'
        );
      })
      .addCase(createDatabaseThunk.pending, (state, action) => {
        markPending(state.createDatabase, action.meta.requestId);
      })
      .addCase(createDatabaseThunk.fulfilled, (state, action) => {
        markFulfilled(
          state.createDatabase,
          action.meta.requestId,
          action.payload
        );
      })
      .addCase(createDatabaseThunk.rejected, (state, action) => {
        markRejected(
          state.createDatabase,
          action.meta.requestId,
          action.payload,
          action.error.message,
          'Не удалось создать базу данных.'
        );
      })
      .addCase(getSQLCodeMetadataThunk.pending, (state, action) => {
        markPending(state.getSQLCodeMetadata, action.meta.requestId);
      })
      .addCase(getSQLCodeMetadataThunk.fulfilled, (state, action) => {
        markFulfilled(
          state.getSQLCodeMetadata,
          action.meta.requestId,
          action.payload
        );
      })
      .addCase(getSQLCodeMetadataThunk.rejected, (state, action) => {
        markRejected(
          state.getSQLCodeMetadata,
          action.meta.requestId,
          action.payload,
          action.error.message,
          'Не удалось извлечь метаданные SQL кода.'
        );
      });
  },
});

export const apiUtilsReducer = apiUtilsSlice.reducer;

export const { resetApiUtilsState } = apiUtilsSlice.actions;
