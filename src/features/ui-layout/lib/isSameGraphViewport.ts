import { GraphViewport } from '../model/types.ts';

export const isSameGraphViewport = (
  a: GraphViewport | null | undefined,
  b: GraphViewport | null | undefined
): boolean => {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom;
};
