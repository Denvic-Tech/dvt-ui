import type { RootState } from '@/app/providers/store';

export const selectNodeJsonViewerState = (state: RootState) => state.nodeJsonViewer;

export const selectNodeJsonViewerOpen = (state: RootState) =>
  selectNodeJsonViewerState(state).open;

export const selectNodeJsonViewerNodeId = (state: RootState) =>
  selectNodeJsonViewerState(state).nodeID;

