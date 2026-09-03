import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '@/app/providers/store';
import type { UserFileTreeSchema } from '@/shared/gatewayClient';

import { type StorageSliceState } from './slice.ts';

export const selectStorageState = (state: RootState): StorageSliceState =>
  state.storage as StorageSliceState;

export const selectStorageLoading = (state: RootState): boolean =>
  state.storage.status === 'loading';

export const selectStorageNodesMap = (
  state: RootState
): StorageSliceState['nodesByConnectionID'] =>
  selectStorageState(state).nodesByConnectionID;

export const selectStorageNodesByConnectionID = (
  state: RootState,
  connectionID: string
): UserFileTreeSchema | null =>
  selectStorageNodesMap(state)[connectionID] ?? null;

export const makeSelectStorageNodesByConnectionID = (connectionID: string) =>
  createSelector(
    [selectStorageNodesMap],
    nodesByConnectionID => nodesByConnectionID[connectionID] ?? null
  );

export const selectStoragePresignedUpload = (
  state: RootState
): StorageSliceState['presignedUpload'] =>
  selectStorageState(state).presignedUpload;

export const selectStoragePresignedDownloadUrl = (
  state: RootState
): StorageSliceState['presignedDownloadUrl'] =>
  selectStorageState(state).presignedDownloadUrl;

export const selectStorageStatus = (
  state: RootState
): StorageSliceState['status'] => selectStorageState(state).status;

export const selectStorageError = (
  state: RootState
): StorageSliceState['error'] => selectStorageState(state).error;

export const selectStorageIsLoading = (state: RootState): boolean =>
  selectStorageStatus(state) === 'loading';
