import type { FileStorageListContext } from '@/entities/data/storage';

export type FileStorageManagerViewerMode = 'viewer' | 'picker';
export type FileStorageManagerPickerKind = 'generic' | 'save_target';

export type FileStorageManagerViewerSelectionMode =
  | 'none'
  | 'file'
  | 'folder'
  | 'file_or_folder';

export interface FileStorageManagerPickerSelection {
  path: string;
  nodeType: 'file' | 'folder';
}

export interface FileStorageManagerViewerPickerSession {
  kind: FileStorageManagerPickerKind;
  requestId: number | null;
  selectionMode: FileStorageManagerViewerSelectionMode;
  selectedPath: string | null;
  allowedFileExts: string[] | null;
  extension: string | null;
  connectionContext: FileStorageListContext | null;
  title: string | null;
  description: string | null;
  confirmLabel: string | null;
}

export interface FileStorageManagerViewerState {
  open: boolean;
  connectionID: string | null;
  mode: FileStorageManagerViewerMode;
  picker: FileStorageManagerViewerPickerSession;
}
