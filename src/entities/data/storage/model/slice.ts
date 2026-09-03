import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { createAppAsyncThunk } from '@/app/providers/store/helpers.ts';

import {
  storageApi,
  UserFileTreeWithConnectionID,
} from '@/entities/data/storage';

import {
  CommonResponse,
  PresignedPostOut,
  UserFileTreeSchema,
} from '@/shared/gatewayClient';
import { ApiErrorPayload, ensureApiErrorPayload } from '@/shared/lib/errors';

export interface StorageSliceState {
  presignedUpload: PresignedPostOut | null;
  presignedDownloadUrl: string | null;
  nodesByConnectionID: { [connectionID: string]: UserFileTreeSchema };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: ApiErrorPayload | null;
}

const initialState: StorageSliceState = {
  presignedUpload: null,
  presignedDownloadUrl: null,
  nodesByConnectionID: {},
  status: 'idle',
  error: null,
};

// --- Thunks ---

export type FetchUploadPresignArgs = Parameters<
  typeof storageApi.uploadPresign
>;
export const fetchUploadPresign = createAppAsyncThunk<
  Awaited<ReturnType<typeof storageApi.uploadPresign>>,
  FetchUploadPresignArgs
>('storage/fetchUploadPresign', args => storageApi.uploadPresign(...args));

export type FetchDownloadPresignArgs = Parameters<
  typeof storageApi.downloadPresign
>;
export const fetchDownloadPresign = createAppAsyncThunk<
  Awaited<ReturnType<typeof storageApi.downloadPresign>>,
  FetchDownloadPresignArgs
>('storage/fetchDownloadPresign', args => storageApi.downloadPresign(...args));

export type FetchStorageListArgs = Parameters<typeof storageApi.list>;
export const fetchStorageList = createAppAsyncThunk<
  Awaited<ReturnType<typeof storageApi.list>>,
  FetchStorageListArgs
>('storage/fetchStorageList', args => storageApi.list(...args));

export type CreateFolderArgs = Parameters<typeof storageApi.createFolder>;
export const createFolder = createAppAsyncThunk<
  Awaited<ReturnType<typeof storageApi.createFolder>>,
  CreateFolderArgs
>('storage/createFolder', args => storageApi.createFolder(...args));

export type DeleteFolderArgs = Parameters<typeof storageApi.deleteFolder>;
export const deleteFolder = createAppAsyncThunk<
  Awaited<ReturnType<typeof storageApi.deleteFolder>>,
  DeleteFolderArgs
>('storage/deleteFolder', args => storageApi.deleteFolder(...args));

export type DeleteFilesArgs = Parameters<typeof storageApi.deleteFiles>;
export const deleteFiles = createAppAsyncThunk<
  Awaited<ReturnType<typeof storageApi.deleteFiles>>,
  DeleteFilesArgs
>('storage/deleteFiles', args => storageApi.deleteFiles(...args));

export type RenamePathArgs = Parameters<typeof storageApi.renamePath>;
export const renamePath = createAppAsyncThunk<
  Awaited<ReturnType<typeof storageApi.renamePath>>,
  RenamePathArgs
>('storage/renamePath', args => storageApi.renamePath(...args));

export type MovePathArgs = Parameters<typeof storageApi.movePath>;
export const movePath = createAppAsyncThunk<
  Awaited<ReturnType<typeof storageApi.movePath>>,
  MovePathArgs
>('storage/movePath', args => storageApi.movePath(...args));

// --- Slice ---

export const storageSlice = createSlice({
  name: 'storage',
  initialState,
  reducers: {
    clearStorageState: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Upload Presign
      .addCase(fetchUploadPresign.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(
        fetchUploadPresign.fulfilled,
        (state, action: PayloadAction<PresignedPostOut>) => {
          state.status = 'succeeded';
          state.presignedUpload = action.payload;
        }
      )
      .addCase(fetchUploadPresign.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось получить пресигн какой то'
        );
      })

      // Download Presign
      .addCase(
        fetchDownloadPresign.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.status = 'succeeded';
          state.presignedDownloadUrl = action.payload;
        }
      )

      // List
      .addCase(
        fetchStorageList.fulfilled,
        (state, action: PayloadAction<UserFileTreeWithConnectionID>) => {
          state.status = 'succeeded';
          state.nodesByConnectionID[action.payload.connectionID] =
            action.payload;
        }
      )

      // Create Folder
      .addCase(createFolder.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(
        createFolder.fulfilled,
        (state, _action: PayloadAction<CommonResponse>) => {
          state.status = 'succeeded';
          // nodes обновятся отдельным fetchStorageList
        }
      )
      .addCase(createFolder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось создать папку'
        );
      })

      // Delete Folder
      .addCase(deleteFolder.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteFolder.fulfilled, state => {
        state.status = 'succeeded';
      })
      .addCase(deleteFolder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось удалить папку'
        );
      })

      // Delete Files
      .addCase(deleteFiles.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteFiles.fulfilled, state => {
        state.status = 'succeeded';
      })
      .addCase(deleteFiles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось удалить файлы'
        );
      })

      // Rename Path
      .addCase(renamePath.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(renamePath.fulfilled, state => {
        state.status = 'succeeded';
      })
      .addCase(renamePath.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось переименовать путь'
        );
      })

      // Move Path
      .addCase(movePath.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(movePath.fulfilled, state => {
        state.status = 'succeeded';
      })
      .addCase(movePath.rejected, (state, action) => {
        state.status = 'failed';
        state.error = ensureApiErrorPayload(
          action.payload,
          action.error.message ?? 'Не удалось переместить путь'
        );
      });
  },
});

export const { clearStorageState } = storageSlice.actions;
export const storageReducer = storageSlice.reducer;
