import { RootState } from '@/app/providers/store';

export const selectNodeMetaViewerState = (state: RootState) =>
  state.nodeMetaViewer;

export const selectNodeMetaViewerOpen = (state: RootState) =>
  selectNodeMetaViewerState(state).open;

export const selectNodeMetaViewerNodeId = (state: RootState) =>
  selectNodeMetaViewerState(state).nodeID;
