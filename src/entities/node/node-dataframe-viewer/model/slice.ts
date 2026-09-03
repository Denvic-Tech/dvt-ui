import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NodeDataFrameViewerState } from './types.ts';

const initialState: NodeDataFrameViewerState = {
  open: false,
  nodeID: null,
};

const nodeDataFrameViewerSlice = createSlice({
  name: 'nodeDataFrameViewer',
  initialState,
  reducers: {
    open(state, { payload }: PayloadAction<string>) {
      state.open = true;
      state.nodeID = payload;
    },
    close(state) {
      state.open = false;
      state.nodeID = null;
    },
    setNode(state, { payload }: PayloadAction<string | null>) {
      state.nodeID = payload;
    },
  },
});

export const nodeDataFrameViewerActions = nodeDataFrameViewerSlice.actions;
export const nodeDataFrameViewerReducer = nodeDataFrameViewerSlice.reducer;
