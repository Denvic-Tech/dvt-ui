import type { RootState } from '@/app/providers/store';

import type { NodeDocumentationState } from './slice';

export const selectNodeDocumentationState = (
  state: RootState
): NodeDocumentationState => state.nodeDocumentation;

export const selectNodeDocumentationEntryByKey = (
  state: RootState,
  key: string
) => selectNodeDocumentationState(state).entriesByKey[key];
