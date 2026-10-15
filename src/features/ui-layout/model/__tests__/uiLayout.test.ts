import { describe, expect, it } from 'vitest';

import { uiLayoutActions, uiLayoutReducer } from '../slice';

describe('uiLayout slice', () => {
  describe('setGraphViewport', () => {
    it('stores a viewport for the project', () => {
      const state = uiLayoutReducer(
        undefined,
        uiLayoutActions.setGraphViewport({
          projectId: 'p1',
          viewport: { x: 10, y: 20, zoom: 1.5 },
        })
      );

      expect(state.graphViewports['p1']).toEqual({ x: 10, y: 20, zoom: 1.5 });
    });

    it('keeps state identity when the viewport values are unchanged', () => {
      const initial = uiLayoutReducer(
        undefined,
        uiLayoutActions.setGraphViewport({
          projectId: 'p1',
          viewport: { x: 10, y: 20, zoom: 1.5 },
        })
      );

      const next = uiLayoutReducer(
        initial,
        uiLayoutActions.setGraphViewport({
          projectId: 'p1',
          viewport: { x: 10, y: 20, zoom: 1.5 },
        })
      );

      expect(next).toBe(initial);
      expect(next.graphViewports).toBe(initial.graphViewports);
      expect(next.graphViewports['p1']).toBe(initial.graphViewports['p1']);
    });

    it('replaces the viewport when any value differs', () => {
      const initial = uiLayoutReducer(
        undefined,
        uiLayoutActions.setGraphViewport({
          projectId: 'p1',
          viewport: { x: 10, y: 20, zoom: 1.5 },
        })
      );

      const next = uiLayoutReducer(
        initial,
        uiLayoutActions.setGraphViewport({
          projectId: 'p1',
          viewport: { x: 10, y: 20, zoom: 2 },
        })
      );

      expect(next).not.toBe(initial);
      expect(next.graphViewports['p1']).toEqual({ x: 10, y: 20, zoom: 2 });
    });

    it('does not touch other projects when updating one of them', () => {
      const initial = uiLayoutReducer(
        undefined,
        uiLayoutActions.setGraphViewport({
          projectId: 'p1',
          viewport: { x: 1, y: 2, zoom: 1 },
        })
      );

      const next = uiLayoutReducer(
        initial,
        uiLayoutActions.setGraphViewport({
          projectId: 'p2',
          viewport: { x: 3, y: 4, zoom: 1 },
        })
      );

      expect(next.graphViewports['p1']).toBe(initial.graphViewports['p1']);
      expect(next.graphViewports['p2']).toEqual({ x: 3, y: 4, zoom: 1 });
    });
  });
});
