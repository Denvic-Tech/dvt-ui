import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectNodeDataFrameViewerNodeId,
  selectNodeDataFrameViewerOpen,
} from './selectors.ts';
import { nodeDataFrameViewerActions } from './slice.ts';

export const useNodeDataFrameViewer = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectNodeDataFrameViewerOpen);
  const nodeID = useAppSelector(selectNodeDataFrameViewerNodeId);

  const openViewer = useCallback(
    (nodeID: string) => {
      dispatch(nodeDataFrameViewerActions.open(nodeID));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(nodeDataFrameViewerActions.close());
  }, [dispatch]);

  const setNode = useCallback(
    (nodeID: string | null) => {
      dispatch(nodeDataFrameViewerActions.setNode(nodeID));
    },
    [dispatch]
  );

  return {
    open: isOpen,
    nodeID,
    openViewer,
    closeViewer: close,
    setNode,
  };
};
