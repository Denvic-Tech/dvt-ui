import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { nodeContextMenuActions } from './slice.ts';
import { selectNodeContextMenuState } from './selectors.ts';
import { NodeContextMenuOpenPayload } from './types.ts';

export const useNodeContextMenuState = () =>
  useAppSelector(selectNodeContextMenuState);

export const useNodeContextMenuActions = () => {
  const dispatch = useAppDispatch();

  const open = useCallback(
    (payload: NodeContextMenuOpenPayload) =>
      dispatch(nodeContextMenuActions.open(payload)),
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(nodeContextMenuActions.close());
  }, [dispatch]);

  return { open, close };
};
