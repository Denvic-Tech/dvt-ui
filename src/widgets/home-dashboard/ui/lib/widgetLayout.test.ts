import { describe, expect, it } from 'vitest';

import { layoutWidgets, toGridArea } from './widgetLayout';

describe('widgets/home-dashboard/widgetLayout', () => {
  it('packs the default set into three columns without gaps', () => {
    const layout = layoutWidgets(
      [
        { id: 'scheduled', w: 1, h: 2 },
        { id: 'failing', w: 1, h: 2 },
        { id: 'runs', w: 1, h: 1 },
        { id: 'services', w: 1, h: 1 },
      ],
      3
    );

    expect(layout.positions).toEqual({
      scheduled: { row: 0, col: 0, w: 1, h: 2 },
      failing: { row: 0, col: 1, w: 1, h: 2 },
      runs: { row: 0, col: 2, w: 1, h: 1 },
      services: { row: 1, col: 2, w: 1, h: 1 },
    });
    expect(layout.rows).toBe(2);
    expect(layout.gaps).toEqual([]);
  });

  it('back-fills holes and reports remaining free cells as gaps', () => {
    const layout = layoutWidgets(
      [
        { id: 'tall', w: 1, h: 2 },
        { id: 'small', w: 1, h: 1 },
      ],
      3
    );

    expect(layout.positions['small']).toEqual({ row: 0, col: 1, w: 1, h: 1 });
    expect(layout.gaps).toEqual([
      { row: 0, col: 2, w: 1, h: 2 },
      { row: 1, col: 1, w: 1, h: 1 },
    ]);
  });

  it('wraps to two columns and clamps oversized widgets', () => {
    const layout = layoutWidgets(
      [
        { id: 'wide', w: 3, h: 9 },
        { id: 'small', w: 1, h: 1 },
      ],
      2
    );

    expect(layout.positions['wide']).toEqual({ row: 0, col: 0, w: 2, h: 4 });
    expect(layout.positions['small']).toEqual({ row: 4, col: 0, w: 1, h: 1 });
    expect(layout.gaps).toEqual([{ row: 4, col: 1, w: 1, h: 1 }]);
  });

  it('returns an empty layout for no widgets', () => {
    expect(layoutWidgets([], 3)).toEqual({ gaps: [], positions: {}, rows: 0 });
  });

  it('maps cells to CSS grid placement', () => {
    expect(toGridArea({ row: 1, col: 2, w: 1, h: 2 })).toEqual({
      gridColumn: '3 / span 1',
      gridRow: '2 / span 2',
    });
  });
});
