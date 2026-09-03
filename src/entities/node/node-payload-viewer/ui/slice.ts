import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface NodePayloadViewerState {
  isOpen: boolean;
  nodeID: string | null;
}

const initialState: NodePayloadViewerState = {
  isOpen: false,
  nodeID: null,
};

export const nodePayloadViewerSlice = createSlice({
  name: 'nodePayloadViewer',
  initialState,
  reducers: {
    open(state, action: PayloadAction<string>) {
      state.isOpen = true;
      state.nodeID = action.payload;
    },
    close(state) {
      state.isOpen = false;
      state.nodeID = null;
    },
  },
});

export const nodePayloadViewerActions = nodePayloadViewerSlice.actions;
export const nodePayloadViewerReducer = nodePayloadViewerSlice.reducer;