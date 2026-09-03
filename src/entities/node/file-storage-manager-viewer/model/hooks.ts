import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import type { FileStorageListContext } from '@/entities/data/storage';

import {
  createFileStorageManagerPickerRequest,
  resolveFileStorageManagerPickerRequest,
} from './pickerRequests';
import {
  selectFileStorageManagerViewerConnectionID,
  selectFileStorageManagerViewerMode,
  selectFileStorageManagerViewerOpen,
  selectFileStorageManagerViewerPicker,
} from './selectors';
import { fileStorageManagerViewerActions } from './slice';
import type { FileStorageManagerPickerSelection } from './types';

export const useFileStorageManagerViewer = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectFileStorageManagerViewerOpen);
  const connectionID = useAppSelector(
    selectFileStorageManagerViewerConnectionID
  );
  const mode = useAppSelector(selectFileStorageManagerViewerMode);
  const picker = useAppSelector(selectFileStorageManagerViewerPicker);

  const resolveActivePickerIfNeeded = useCallback(
    (selection: FileStorageManagerPickerSelection | null) => {
      if (mode === 'picker' && picker.requestId != null) {
        resolveFileStorageManagerPickerRequest(picker.requestId, selection);
      }
    },
    [mode, picker.requestId]
  );

  const openViewer = useCallback(
    (connectionID: string) => {
      resolveActivePickerIfNeeded(null);
      dispatch(fileStorageManagerViewerActions.openViewer(connectionID));
    },
    [dispatch, resolveActivePickerIfNeeded]
  );

  const openPicker = useCallback(
    ({
      allowedFileExts,
      confirmLabel,
      connectionID,
      connectionContext,
      description,
      extension,
      kind,
      selectedPath,
      selectionMode,
      title,
    }: {
      connectionID: string;
      selectionMode: typeof picker.selectionMode;
      selectedPath?: string | null;
      allowedFileExts?: string[] | null;
      kind?: typeof picker.kind;
      extension?: string | null;
      connectionContext?: FileStorageListContext | null;
      title?: string | null;
      description?: string | null;
      confirmLabel?: string | null;
    }) => {
      resolveActivePickerIfNeeded(null);

      const request = createFileStorageManagerPickerRequest();
      const actionPayload = {
        connectionID,
        kind,
        requestId: request.requestId,
        selectionMode,
      } as Parameters<typeof fileStorageManagerViewerActions.openPicker>[0];

      if (selectedPath !== undefined) {
        actionPayload.selectedPath = selectedPath;
      }
      if (allowedFileExts !== undefined) {
        actionPayload.allowedFileExts = allowedFileExts;
      }
      if (extension !== undefined) {
        actionPayload.extension = extension;
      }
      if (connectionContext !== undefined) {
        actionPayload.connectionContext = connectionContext;
      }
      if (title !== undefined) {
        actionPayload.title = title;
      }
      if (description !== undefined) {
        actionPayload.description = description;
      }
      if (confirmLabel !== undefined) {
        actionPayload.confirmLabel = confirmLabel;
      }

      dispatch(fileStorageManagerViewerActions.openPicker(actionPayload));

      return request.promise;
    },
    [dispatch, picker, resolveActivePickerIfNeeded]
  );

  const close = useCallback(() => {
    resolveActivePickerIfNeeded(null);
    dispatch(fileStorageManagerViewerActions.close());
  }, [dispatch, resolveActivePickerIfNeeded]);

  const setDBConnection = useCallback(
    (connectionID: string | null) => {
      dispatch(fileStorageManagerViewerActions.setDBConnection(connectionID));
    },
    [dispatch]
  );

  const resolvePicker = useCallback(
    (selection: FileStorageManagerPickerSelection | null) => {
      resolveActivePickerIfNeeded(selection);
      dispatch(fileStorageManagerViewerActions.close());
    },
    [dispatch, resolveActivePickerIfNeeded]
  );

  return {
    open: isOpen,
    connectionID,
    mode,
    picker,
    openViewer,
    openPicker,
    closeViewer: close,
    setDBConnection,
    resolvePicker,
  };
};
