import { useEffect } from 'react';
import { useBeforeUnload } from 'react-router-dom';

import type { AppDispatch, RootState } from '@/app/providers/store';
import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { selectIsSystemAvailabilityBlocking } from '@/entities/system-availability';

import { selectHasPendingGraphChanges } from './selectors';
import { flushGraphOperations } from './slice';

export const useGraphUnsavedChangesGuard = () => {
  const hasPendingGraphChanges = useAppSelector(selectHasPendingGraphChanges);

  useBeforeUnload(event => {
    if (!hasPendingGraphChanges) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  });
};

/**
 * Leaving the editor inside the SPA (e.g. to the home page) must not wait for
 * the 2s debounce: pending operations are sent right away. They stay bound to
 * their own project, so opening another project meanwhile is safe.
 */
export const useFlushGraphOnLeave = (projectId: string | undefined) => {
  const dispatch = useAppDispatch();

  useEffect(
    () => () => {
      if (!projectId) {
        return;
      }

      dispatch((innerDispatch: AppDispatch, getState: () => RootState) => {
        const state = getState();
        if (
          state.syncGraph.outbox.length > 0 &&
          !state.syncGraph.inFlight &&
          !selectIsSystemAvailabilityBlocking(state)
        ) {
          void innerDispatch(flushGraphOperations());
        }
      });
    },
    [dispatch, projectId]
  );
};
