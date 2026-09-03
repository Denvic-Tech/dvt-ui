import { describe, expect, it } from 'vitest';

import { calculateNodeFocusViewport } from './calculateNodeFocusViewport';

describe('calculateNodeFocusViewport', () => {
  it('places a distant node in the center without changing zoom', () => {
    expect(
      calculateNodeFocusViewport({
        nodePosition: { x: 2200, y: 900 },
        nodeSize: { width: 260, height: 120 },
        viewportSize: { width: 1200, height: 800 },
        zoom: 0.75,
      })
    ).toEqual({
      x: -1147.5,
      y: -320,
      zoom: 0.75,
    });
  });

  it('handles negative graph coordinates', () => {
    expect(
      calculateNodeFocusViewport({
        nodePosition: { x: -500, y: -300 },
        nodeSize: { width: 200, height: 100 },
        viewportSize: { width: 1000, height: 600 },
        zoom: 1,
      })
    ).toEqual({
      x: 900,
      y: 550,
      zoom: 1,
    });
  });
});
