import { type RootState } from '@/app/providers/store';

import type { ApiKeySliceState } from './slice.ts';

export const selectApiKeyState = (state: RootState): ApiKeySliceState =>
  state.apiKeys as ApiKeySliceState;

export const selectApiKeys = (state: RootState) =>
  selectApiKeyState(state).items;

export const selectApiKeysStatus = (state: RootState) =>
  selectApiKeyState(state).status;

export const selectApiKeysIsLoading = (state: RootState): boolean =>
  selectApiKeysStatus(state) === 'loading';

export const selectApiKeysError = (state: RootState) =>
  selectApiKeyState(state).error;

export const selectApiKeysLastUpdatedAt = (state: RootState) =>
  selectApiKeyState(state).lastUpdatedAt;

export const selectApiKeyCreationStatus = (state: RootState) =>
  selectApiKeyState(state).creationStatus;

export const selectApiKeyCreationError = (state: RootState) =>
  selectApiKeyState(state).creationError;

export const selectApiKeyCreatedSecret = (state: RootState) =>
  selectApiKeyState(state).createdSecret;

export const selectApiKeyDeletionStatus = (state: RootState) =>
  selectApiKeyState(state).deletionStatus;

export const selectApiKeyDeletionError = (state: RootState) =>
  selectApiKeyState(state).deletionError;

export const selectApiKeyDeletingIdentifier = (state: RootState) =>
  selectApiKeyState(state).deletingTokenIdentifier;
