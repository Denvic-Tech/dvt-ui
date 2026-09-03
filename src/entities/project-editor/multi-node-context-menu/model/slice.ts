import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  MultiNodeContextMenuOpenPayload,
  MultiNodeContextMenuState,
} from './types.ts';

const initialState: MultiNodeContextMenuState = {
  open: false,
  position: null,
  nodeIDs: [],
};

const multiNodeContextMenuSlice = createSlice({
  name: 'multiNodeContextMenu',
  initialState,
  reducers: {
    open(state, { payload }: PayloadAction<MultiNodeContextMenuOpenPayload>) {
      state.open = true;
      state.position = payload.position;
      state.nodeIDs = Array.from(new Set(payload.nodeIDs));
    },
    close(state) {
      if (
        !state.open &&
        state.position === null &&
        state.nodeIDs.length === 0
      ) {
        return;
      }
      state.open = false;
      state.position = null;
      state.nodeIDs = [];
    },
  },
});

export const multiNodeContextMenuActions = multiNodeContextMenuSlice.actions;
export const multiNodeContextMenuReducer = multiNodeContextMenuSlice.reducer;
