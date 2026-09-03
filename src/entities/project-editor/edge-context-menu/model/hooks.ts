import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { edgeContextMenuActions } from './slice.ts';
import { selectEdgeContextMenuState } from './selectors.ts';
import { EdgeContextMenuOpenPayload } from './types.ts';

export const useEdgeContextMenuState = () =>
  useAppSelector(selectEdgeContextMenuState);

export const useEdgeContextMenuActions = () => {
  const dispatch = useAppDispatch();

  const open = useCallback(
    (payload: EdgeContextMenuOpenPayload) =>
      dispatch(edgeContextMenuActions.open(payload)),
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(edgeContextMenuActions.close());
  }, [dispatch]);

  return { open, close };
};
