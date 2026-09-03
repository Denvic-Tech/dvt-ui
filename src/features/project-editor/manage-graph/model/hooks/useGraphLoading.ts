import { useCallback } from 'react';
import {
  fetchGraph,
  selectGraphLoaded,
  selectGraphLoading,
  selectGraphLoadingError,
} from '@/entities/project-editor/graph';
import { useAppSelector, useAppDispatch } from '@/app/providers/store';

export const useGraphLoading = () => {
  const dispatch = useAppDispatch();

  const graphLoading = useAppSelector(selectGraphLoading);
  const graphLoaded = useAppSelector(selectGraphLoaded);
  const graphLoadingError = useAppSelector(selectGraphLoadingError);

  const loadGraph = useCallback(
    async (projectID: string) => {
      if (!projectID) return null;
      return await dispatch(fetchGraph({ projectID })).unwrap();
    },
    [dispatch]
  );

  return {
    graphLoading,
    graphLoaded,
    graphLoadingError,
    loadGraph,
  };
};
