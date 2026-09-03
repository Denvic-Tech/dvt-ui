import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NodeContextMenuOpenPayload, NodeContextMenuState } from './types.ts';

const initialState: NodeContextMenuState = {
  open: false,
  position: null,
  nodeID: null,
  nodeDefinition: null,
  nodeData: null,
};

const nodeContextMenuSlice = createSlice({
  name: 'nodeContextMenu',
  initialState,
  reducers: {
    open(state, { payload }: PayloadAction<NodeContextMenuOpenPayload>) {
      state.open = true;
      state.position = payload.position;
      state.nodeID = payload.nodeID;
      state.nodeDefinition = payload.nodeDefinition;
      state.nodeData = payload.nodeData;
    },
    close(state) {
      state.open = false;
      state.position = null;
      state.nodeID = null;
      state.nodeDefinition = null;
      state.nodeData = null;
    },
  },
});

export const nodeContextMenuActions = nodeContextMenuSlice.actions;
export const nodeContextMenuReducer = nodeContextMenuSlice.reducer;
