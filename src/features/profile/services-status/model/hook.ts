import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';
import { selectServicesStatusState } from './selectors';
import { fetchServicesStatus } from './slice';

export const useServicesStatus = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectServicesStatusState);

  const loadServicesStatus = useCallback(() => {
    return dispatch(fetchServicesStatus()).unwrap();
  }, [dispatch]);

  return {
    ...state,
    loadServicesStatus,
  };
};
