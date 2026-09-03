import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';

import { connect, disconnect } from '../slice.ts';
import { selectWebSocketError, selectWebSocketStatus } from '../selectors.ts';

export const useWebSocketConnection = () => {
  const dispatch = useAppDispatch();

  const status = useAppSelector(selectWebSocketStatus);
  const error = useAppSelector(selectWebSocketError);

  const connectWs = useCallback(
    (projectId: string) => dispatch(connect({ projectId })),
    [dispatch]
  );

  const disconnectWs = useCallback(
    (projectId?: string) => dispatch(disconnect({ projectId })),
    [dispatch]
  );

  return {
    status,
    error,
    connectWs,
    disconnectWs,
  };
};
