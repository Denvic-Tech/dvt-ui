import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';
import type { ApiTokenCreate } from '@/shared/gatewayClient';

import {
  createApiKey,
  deleteApiKey,
  fetchApiKeys,
  resetApiKeyCreationState,
  resetApiKeyDeletionState,
} from './slice.ts';
import {
  selectApiKeyCreatedSecret,
  selectApiKeyCreationError,
  selectApiKeyCreationStatus,
  selectApiKeyDeletionError,
  selectApiKeyDeletionStatus,
  selectApiKeyDeletingIdentifier,
  selectApiKeys,
  selectApiKeysError,
  selectApiKeysIsLoading,
  selectApiKeysStatus,
  selectApiKeysLastUpdatedAt,
} from './selectors.ts';

export const useApiKeys = () => {
  const dispatch = useAppDispatch();

  const items = useAppSelector(selectApiKeys);
  const status = useAppSelector(selectApiKeysStatus);
  const isLoading = useAppSelector(selectApiKeysIsLoading);
  const error = useAppSelector(selectApiKeysError);
  const lastUpdatedAt = useAppSelector(selectApiKeysLastUpdatedAt);

  const creationStatus = useAppSelector(selectApiKeyCreationStatus);
  const creationError = useAppSelector(selectApiKeyCreationError);
  const createdSecret = useAppSelector(selectApiKeyCreatedSecret);

  const deletionStatus = useAppSelector(selectApiKeyDeletionStatus);
  const deletionError = useAppSelector(selectApiKeyDeletionError);
  const deletingTokenIdentifier = useAppSelector(
    selectApiKeyDeletingIdentifier
  );

  const loadApiKeys = useCallback(
    () => dispatch(fetchApiKeys()).unwrap(),
    [dispatch]
  );

  const createApiKeyMutation = useCallback(
    (payload: ApiTokenCreate) => dispatch(createApiKey(payload)).unwrap(),
    [dispatch]
  );

  const deleteApiKeyMutation = useCallback(
    (tokenIdentifier: string) =>
      dispatch(deleteApiKey(tokenIdentifier)).unwrap(),
    [dispatch]
  );

  const resetCreationState = useCallback(() => {
    dispatch(resetApiKeyCreationState());
  }, [dispatch]);

  const resetDeletionState = useCallback(() => {
    dispatch(resetApiKeyDeletionState());
  }, [dispatch]);

  return {
    items,
    status,
    isLoading,
    error,
    lastUpdatedAt,
    creationStatus,
    creationError,
    createdSecret,
    deletionStatus,
    deletionError,
    deletingTokenIdentifier,
    loadApiKeys,
    createApiKey: createApiKeyMutation,
    deleteApiKey: deleteApiKeyMutation,
    resetCreationState,
    resetDeletionState,
  } as const;
};
