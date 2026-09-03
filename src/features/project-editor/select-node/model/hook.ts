import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { selectSelectedNodeID } from './selectors';
import { selectNodeActions } from './slice';

export const useSelectNode = () => {
  const dispatch = useAppDispatch();

  const selectedNodeID = useAppSelector(selectSelectedNodeID);

  const selectNode = useCallback(
    (nodeID: string) => {
      dispatch(selectNodeActions.selectNode(nodeID));
    },
    [dispatch]
  );

  const clearSelectedNode = useCallback(() => {
    dispatch(selectNodeActions.clearSelectedNode());
  }, [dispatch]);

  return { selectedNodeID, selectNode, clearSelectedNode };
};
