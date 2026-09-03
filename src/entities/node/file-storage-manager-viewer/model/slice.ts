import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { FileStorageListContext } from '@/entities/data/storage';

import {
  FileStorageManagerViewerPickerSession,
  FileStorageManagerViewerState,
} from './types';

const createInitialPickerState = (): FileStorageManagerViewerPickerSession => ({
  kind: 'generic',
  requestId: null,
  selectionMode: 'none',
  selectedPath: null,
  allowedFileExts: null,
  extension: null,
  connectionContext: null,
  title: null,
  description: null,
  confirmLabel: null,
});

type OpenFileStorageManagerPickerPayload = {
  connectionID: string;
  requestId: number;
  kind?: FileStorageManagerViewerPickerSession['kind'];
  selectionMode: FileStorageManagerViewerPickerSession['selectionMode'];
  selectedPath?: string | null;
  allowedFileExts?: string[] | null;
  extension?: string | null;
  connectionContext?: FileStorageListContext | null;
  title?: string | null;
  description?: string | null;
  confirmLabel?: string | null;
};

const initialState: FileStorageManagerViewerState = {
  open: false,
  connectionID: null,
  mode: 'viewer',
  picker: createInitialPickerState(),
};

const fileStorageManagerViewerSlice = createSlice({
  name: 'fileStorageManagerViewer',
  initialState,
  reducers: {
    openViewer(state, { payload }: PayloadAction<string>) {
      state.open = true;
      state.connectionID = payload;
      state.mode = 'viewer';
      state.picker = createInitialPickerState();
    },
    openPicker(
      state,
      { payload }: PayloadAction<OpenFileStorageManagerPickerPayload>
    ) {
      state.open = true;
      state.connectionID = payload.connectionID;
      state.mode = 'picker';
      state.picker = {
        kind: payload.kind ?? 'generic',
        requestId: payload.requestId,
        selectionMode: payload.selectionMode,
        selectedPath: payload.selectedPath ?? null,
        allowedFileExts: payload.allowedFileExts ?? null,
        extension: payload.extension ?? null,
        connectionContext: payload.connectionContext ?? null,
        title: payload.title ?? null,
        description: payload.description ?? null,
        confirmLabel: payload.confirmLabel ?? null,
      };
    },
    close(state) {
      state.open = false;
      state.connectionID = null;
      state.mode = 'viewer';
      state.picker = createInitialPickerState();
    },
    setDBConnection(state, { payload }: PayloadAction<string | null>) {
      state.connectionID = payload;
    },
  },
});

export const fileStorageManagerViewerActions =
  fileStorageManagerViewerSlice.actions;
export const fileStorageManagerViewerReducer =
  fileStorageManagerViewerSlice.reducer;
