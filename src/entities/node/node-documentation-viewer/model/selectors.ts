import type { RootState } from '@/app/providers/store';

export const selectNodeDocumentationViewerState = (state: RootState) =>
  state.nodeDocumentationViewer;

export const selectNodeDocumentationViewerOpen = (state: RootState) =>
  selectNodeDocumentationViewerState(state).open;

export const selectNodeDocumentationViewerNodeName = (state: RootState) =>
  selectNodeDocumentationViewerState(state).nodeName;

export const selectNodeDocumentationViewerNodeTitle = (state: RootState) =>
  selectNodeDocumentationViewerState(state).nodeTitle;
