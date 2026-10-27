import { useCallback } from 'react';

import {
  type RootState,
  useAppDispatch,
  useAppSelector,
} from '@/app/providers/store';

import { nodeFieldsViewerActions } from './slice';

export const selectNodeFieldsViewerOpen = (state: RootState) =>
  state.nodeFieldsViewer.open;

export const selectNodeFieldsViewerNodeId = (state: RootState) =>
  state.nodeFieldsViewer.nodeID;

export const useNodeFieldsViewer = () => {
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectNodeFieldsViewerOpen);
  const nodeID = useAppSelector(selectNodeFieldsViewerNodeId);

  const closeViewer = useCallback(() => {
    dispatch(nodeFieldsViewerActions.close());
  }, [dispatch]);

  return { open, nodeID, closeViewer };
};
