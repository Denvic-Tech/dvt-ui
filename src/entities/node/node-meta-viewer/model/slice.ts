import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NodeMetaViewerState } from './types.ts';

const initialState: NodeMetaViewerState = {
  open: false,
  nodeID: null,
};

const nodeMetaViewerSlice = createSlice({
  name: 'nodeMetaViewer',
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

export const nodeMetaViewerActions = nodeMetaViewerSlice.actions;
export const nodeMetaViewerReducer = nodeMetaViewerSlice.reducer;
