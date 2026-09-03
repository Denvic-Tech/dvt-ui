import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  EdgeContextMenuOpenPayload,
  EdgeContextMenuState,
} from './types.ts';

const initialState: EdgeContextMenuState = {
  open: false,
  position: null,
  flowPosition: null,
  edge: null,
  geometry: null,
};

const edgeContextMenuSlice = createSlice({
  name: 'edgeContextMenu',
  initialState,
  reducers: {
    open(state, { payload }: PayloadAction<EdgeContextMenuOpenPayload>) {
      state.open = true;
      state.position = payload.position;
      state.flowPosition = payload.flowPosition;
      state.edge = payload.edge;
      state.geometry = payload.geometry ?? null;
    },
    close(state) {
      state.open = false;
      state.position = null;
      state.flowPosition = null;
      state.edge = null;
      state.geometry = null;
    },
  },
});

export const edgeContextMenuActions = edgeContextMenuSlice.actions;
export const edgeContextMenuReducer = edgeContextMenuSlice.reducer;
