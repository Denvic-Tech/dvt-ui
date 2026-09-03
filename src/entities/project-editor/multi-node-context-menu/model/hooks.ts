import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { multiNodeContextMenuActions } from './slice.ts';
import { selectMultiNodeContextMenuState } from './selectors.ts';
import { MultiNodeContextMenuOpenPayload } from './types.ts';

export const useMultiNodeContextMenuState = () =>
  useAppSelector(selectMultiNodeContextMenuState);

export const useMultiNodeContextMenuActions = () => {
  const dispatch = useAppDispatch();

  const open = useCallback(
    (payload: MultiNodeContextMenuOpenPayload) =>
      dispatch(multiNodeContextMenuActions.open(payload)),
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(multiNodeContextMenuActions.close());
  }, [dispatch]);

  return { open, close };
};
