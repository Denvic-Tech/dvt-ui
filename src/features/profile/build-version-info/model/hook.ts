import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks.ts';
import { fetchBuildVersion } from './slice';
import { selectBuildVersionState } from './selectors';

export const useBuildVersion = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectBuildVersionState);

  const loadBuildVersion = useCallback(() => {
    return dispatch(fetchBuildVersion()).unwrap();
  }, [dispatch]);

  return {
    ...state,
    loadBuildVersion,
  };
};
