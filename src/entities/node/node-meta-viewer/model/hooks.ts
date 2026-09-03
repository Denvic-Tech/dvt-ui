import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';
import { nodeMetaViewerActions } from './slice.ts';
import {
  selectNodeMetaViewerNodeId,
  selectNodeMetaViewerOpen,
} from './selectors.ts';

export const useNodeMetaViewer = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectNodeMetaViewerOpen);
  const nodeID = useAppSelector(selectNodeMetaViewerNodeId);

  const openViewer = useCallback(
    (nodeID: string) => {
      dispatch(nodeMetaViewerActions.open(nodeID));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(nodeMetaViewerActions.close());
  }, [dispatch]);

  const setNode = useCallback(
    (nodeId: string | null) => {
      dispatch(nodeMetaViewerActions.setNode(nodeId));
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
