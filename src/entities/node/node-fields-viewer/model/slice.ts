import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface NodeFieldsViewerState {
  open: boolean;
  nodeID: string | null;
}

const initialState: NodeFieldsViewerState = {
  open: false,
  nodeID: null,
};

const nodeFieldsViewerSlice = createSlice({
  name: 'nodeFieldsViewer',
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
  },
});

export const nodeFieldsViewerActions = nodeFieldsViewerSlice.actions;
export const nodeFieldsViewerReducer = nodeFieldsViewerSlice.reducer;
