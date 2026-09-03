import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NodeJsonViewerState } from './types.ts';

const initialState: NodeJsonViewerState = {
  open: false,
  nodeID: null,
};

const nodeJsonViewerSlice = createSlice({
  name: 'nodeJsonViewer',
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

export const nodeJsonViewerActions = nodeJsonViewerSlice.actions;
export const nodeJsonViewerReducer = nodeJsonViewerSlice.reducer;
