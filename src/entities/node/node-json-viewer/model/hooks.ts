import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';
import { nodeJsonViewerActions } from './slice.ts';
import {
  selectNodeJsonViewerNodeId,
  selectNodeJsonViewerOpen,
} from './selectors.ts';

export const useNodeJsonViewer = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectNodeJsonViewerOpen);
  const nodeID = useAppSelector(selectNodeJsonViewerNodeId);

  const openViewer = useCallback(
    (nodeID: string) => {
      dispatch(nodeJsonViewerActions.open(nodeID));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(nodeJsonViewerActions.close());
  }, [dispatch]);

  const setNode = useCallback(
    (nodeID: string | null) => {
      dispatch(nodeJsonViewerActions.setNode(nodeID));
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
