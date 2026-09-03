import { RootState } from '@/app/providers/store';

export const selectMultiNodeContextMenuState = (state: RootState) =>
  state.multiNodeContextMenu;
