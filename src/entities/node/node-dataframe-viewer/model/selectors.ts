import { RootState } from '@/app/providers/store';

export const selectNodeDataFrameViewerState = (state: RootState) =>
  state.nodeDataFrameViewer;

export const selectNodeDataFrameViewerOpen = (state: RootState) =>
  selectNodeDataFrameViewerState(state).open;

export const selectNodeDataFrameViewerNodeId = (state: RootState) =>
  selectNodeDataFrameViewerState(state).nodeID;
