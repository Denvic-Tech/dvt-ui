import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/app/providers/store';

export type LineageHighlightRole = 'highlighted' | 'dimmed' | null;

const EMPTY_IDS: ReadonlySet<string> = new Set();

export const selectLineageHighlight = (state: RootState) =>
  state.lineageHighlight.highlight;

export const selectLineageHighlightNodeIDs = createSelector(
  selectLineageHighlight,
  highlight => (highlight ? new Set(highlight.nodeIDs) : EMPTY_IDS)
);

export const selectLineageHighlightEdgeIDs = createSelector(
  selectLineageHighlight,
  highlight => (highlight ? new Set(highlight.edgeIDs) : EMPTY_IDS)
);

/** Роль ноды при активной подсветке: часть цепочки или приглушённая. */
export const selectLineageNodeRole = (
  state: RootState,
  nodeID: string
): LineageHighlightRole => {
  if (!selectLineageHighlight(state)) {
    return null;
  }
  return selectLineageHighlightNodeIDs(state).has(nodeID)
    ? 'highlighted'
    : 'dimmed';
};

/**
 * Роль ребра. У рёбер свёрнутого сабграфа свой proxy-id, поэтому
 * проверяем и id реального ребра.
 */
export const selectLineageEdgeRole = (
  state: RootState,
  edgeID: string,
  realEdgeID?: string | null
): LineageHighlightRole => {
  if (!selectLineageHighlight(state)) {
    return null;
  }
  const edgeIDs = selectLineageHighlightEdgeIDs(state);
  return edgeIDs.has(edgeID) || (realEdgeID ? edgeIDs.has(realEdgeID) : false)
    ? 'highlighted'
    : 'dimmed';
};
