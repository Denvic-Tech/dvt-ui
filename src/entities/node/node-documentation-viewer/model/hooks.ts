import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import {
  selectNodeDocumentationViewerNodeName,
  selectNodeDocumentationViewerNodeTitle,
  selectNodeDocumentationViewerOpen,
} from './selectors';
import { nodeDocumentationViewerActions } from './slice';
import type { NodeDocumentationViewerPayload } from './types';

export const useNodeDocumentationViewer = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectNodeDocumentationViewerOpen);
  const nodeName = useAppSelector(selectNodeDocumentationViewerNodeName);
  const nodeTitle = useAppSelector(selectNodeDocumentationViewerNodeTitle);

  const openViewer = useCallback(
    (payload: NodeDocumentationViewerPayload) => {
      dispatch(nodeDocumentationViewerActions.open(payload));
    },
    [dispatch]
  );

  const closeViewer = useCallback(() => {
    dispatch(nodeDocumentationViewerActions.close());
  }, [dispatch]);

  const resetViewer = useCallback(() => {
    dispatch(nodeDocumentationViewerActions.reset());
  }, [dispatch]);

  return {
    closeViewer,
    nodeName,
    nodeTitle,
    open: isOpen,
    openViewer,
    resetViewer,
  };
};
