import { useCallback, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';
import type { RootState } from '@/app/providers/store/types';

import {
  selectNodeDefinitionError,
  selectNodeDefinitionsMap,
  selectNodeDefinitionsStatus,
} from './selectors.ts';
import { fetchNodeDefinitions } from './thunks.ts';

export const useNodeDefinitions = () => {
  const dispatch = useAppDispatch();

  const nodeDefinitionsMap = useAppSelector(selectNodeDefinitionsMap);
  const status = useAppSelector(selectNodeDefinitionsStatus);
  const error = useAppSelector(selectNodeDefinitionError);

  const isLoading = useMemo(() => status === 'loading', [status]);

  const loadNodeDefinitions = useCallback(async () => {
    return dispatch(fetchNodeDefinitions()).unwrap();
  }, [dispatch]);

  return {
    loadNodeDefinitions,
    nodeDefinitionsMap,
    isLoading,
    status,
    error,
  };
};
