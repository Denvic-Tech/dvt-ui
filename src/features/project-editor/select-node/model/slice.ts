import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SelectNodeState {
  selectedNodeID: string | null;
}

const initialState: SelectNodeState = {
  selectedNodeID: null,
};

const selectNodeSlice = createSlice({
  name: 'selectNode',
  initialState,
  reducers: {
    selectNode(state, action: PayloadAction<string>) {
      state.selectedNodeID = action.payload;
    },
    clearSelectedNode(state) {
      state.selectedNodeID = null;
    },
    // --- Reset ---
    resetState() {
      return { ...initialState };
    },
  },
});

export const selectNodeReducer = selectNodeSlice.reducer;

export const selectNodeActions = selectNodeSlice.actions;
