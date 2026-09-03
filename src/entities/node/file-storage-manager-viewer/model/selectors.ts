import { RootState } from '@/app/providers/store';

export const selectFileStorageManagerViewerState = (state: RootState) =>
  state.fileStorageManagerViewer;

export const selectFileStorageManagerViewerOpen = (state: RootState) =>
  selectFileStorageManagerViewerState(state).open;

export const selectFileStorageManagerViewerConnectionID = (state: RootState) =>
  selectFileStorageManagerViewerState(state).connectionID;

export const selectFileStorageManagerViewerMode = (state: RootState) =>
  selectFileStorageManagerViewerState(state).mode;

export const selectFileStorageManagerViewerPicker = (state: RootState) =>
  selectFileStorageManagerViewerState(state).picker;
