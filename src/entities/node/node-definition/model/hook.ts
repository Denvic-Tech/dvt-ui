import { useCallback, useMemo } from 'react';

import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from '@/app/providers/store';
import {
  fetchNodeDefinitions,
  selectNodeDefinitionsStatus,
  selectNodeDefinitionError,
  selectNodeDefinitionsMap,
} from '@/entities/node/node-definition';

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
