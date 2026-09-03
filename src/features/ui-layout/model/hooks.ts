import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectGraphViewportByProjectId,
  selectNodeDataModalUILayout,
  uiLayoutActions,
} from '@/features/ui-layout';

import { GraphViewport } from './types.ts';

export const useNodeDataModalUI = () => {
  const dispatch = useAppDispatch();

  const nodeDataModalUILayoutState = useAppSelector(
    selectNodeDataModalUILayout
  );

  const toggle = useCallback(() => {
    dispatch(uiLayoutActions.toggleNodeDataModal());
  }, [dispatch]);

  const setOpen = useCallback(
    (open: boolean) => {
      dispatch(uiLayoutActions.setNodeDataModalOpen(open));
    },
    [dispatch]
  );

  return {
    ...nodeDataModalUILayoutState,
    toggle,
    setOpen,
  };
};

export const useGraphViewport = (projectId: string | undefined) => {
  const dispatch = useAppDispatch();

  const viewport = useAppSelector(state =>
    selectGraphViewportByProjectId(state, projectId)
  );

  const setViewport = useCallback(
    (viewport: GraphViewport) => {
      if (!projectId) return;
      dispatch(uiLayoutActions.setGraphViewport({ projectId, viewport }));
    },
    [dispatch, projectId]
  );

  return {
    viewport,
    setViewport,
  };
};
