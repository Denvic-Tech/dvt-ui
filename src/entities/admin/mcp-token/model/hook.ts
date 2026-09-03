import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import type { McpTokenCreateSchema } from '@/shared/gatewayClient';

import {
  selectMcpTokenCreatedSecret,
  selectMcpTokenCreationStatus,
  selectMcpTokenDeletionStatus,
  selectMcpTokens,
  selectMcpTokensError,
  selectMcpTokensStatus,
} from './selectors';
import {
  createMcpToken,
  fetchMcpTokens,
  resetMcpTokenCreationState,
  resetMcpTokenDeletionState,
  revokeMcpToken,
} from './slice';

export const useMcpTokens = () => {
  const dispatch = useAppDispatch();

  const loadMcpTokens = useCallback(
    () => dispatch(fetchMcpTokens()).unwrap(),
    [dispatch]
  );
  const createMcpTokenMutation = useCallback(
    (payload: McpTokenCreateSchema) =>
      dispatch(createMcpToken(payload)).unwrap(),
    [dispatch]
  );
  const revokeMcpTokenMutation = useCallback(
    (tokenId: string) => dispatch(revokeMcpToken(tokenId)).unwrap(),
    [dispatch]
  );
  const resetCreationState = useCallback(
    () => dispatch(resetMcpTokenCreationState()),
    [dispatch]
  );
  const resetDeletionState = useCallback(
    () => dispatch(resetMcpTokenDeletionState()),
    [dispatch]
  );

  return {
    items: useAppSelector(selectMcpTokens),
    status: useAppSelector(selectMcpTokensStatus),
    error: useAppSelector(selectMcpTokensError),
    creationStatus: useAppSelector(selectMcpTokenCreationStatus),
    createdSecret: useAppSelector(selectMcpTokenCreatedSecret),
    deletionStatus: useAppSelector(selectMcpTokenDeletionStatus),
    loadMcpTokens,
    createMcpToken: createMcpTokenMutation,
    revokeMcpToken: revokeMcpTokenMutation,
    resetCreationState,
    resetDeletionState,
  } as const;
};
