import type { RootState } from '@/app/providers/store/rootReducer';

export const selectSystemUpdateState = (state: RootState) => state.systemUpdate;

export const selectSystemUpdateMarker = (state: RootState) =>
  state.systemUpdate.marker;
