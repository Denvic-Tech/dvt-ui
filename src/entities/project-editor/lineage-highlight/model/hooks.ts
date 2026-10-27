import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectLineageEdgeRole,
  selectLineageHighlight,
  selectLineageNodeRole,
} from './selectors';
import { lineageHighlightActions } from './slice';

export const useLineageNodeRole = (nodeID: string) =>
  useAppSelector(state => selectLineageNodeRole(state, nodeID));

export const useLineageEdgeRole = (
  edgeID: string,
  realEdgeID?: string | null
) => useAppSelector(state => selectLineageEdgeRole(state, edgeID, realEdgeID));

export const useLineageHighlight = () => {
  const dispatch = useAppDispatch();
  const highlight = useAppSelector(selectLineageHighlight);

  const clearHighlight = useCallback(() => {
    dispatch(lineageHighlightActions.clear());
  }, [dispatch]);

  return { highlight, clearHighlight };
};
