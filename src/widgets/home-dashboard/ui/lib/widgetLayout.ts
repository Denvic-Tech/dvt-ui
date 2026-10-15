/** Height of one grid cell; widget heights are multiples of it. */
export const WIDGET_CELL_HEIGHT = 184;
export const WIDGET_GRID_GAP = 12;
export const WIDGET_MAX_ROWS = 4;

export type WidgetSize = {
  /** Width in grid columns. */
  w: number;
  /** Height in grid rows of {@link WIDGET_CELL_HEIGHT}. */
  h: number;
};

export type WidgetLayoutItem = WidgetSize & { id: string };

/** Zero-based cell rectangle. */
export type WidgetCellRect = {
  col: number;
  h: number;
  row: number;
  w: number;
};

export type WidgetLayout = {
  /** Empty rectangles between/after widgets that can host «add» tiles. */
  gaps: WidgetCellRect[];
  positions: Record<string, WidgetCellRect>;
  /** Total occupied rows. */
  rows: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(Math.round(value), min), max);

/**
 * Packs widgets in order into the first free slot, scanning rows top-down
 * and columns left-to-right (like CSS `grid-auto-flow: row dense`), then
 * collects the remaining free cells into maximal rectangles.
 */
export const layoutWidgets = (
  items: readonly WidgetLayoutItem[],
  columns: number
): WidgetLayout => {
  const cols = Math.max(1, Math.floor(columns));
  const occupied: boolean[][] = [];
  const isFree = (row: number, col: number) => !occupied[row]?.[col];
  const fits = (row: number, col: number, w: number, h: number) => {
    for (let r = row; r < row + h; r += 1) {
      for (let c = col; c < col + w; c += 1) {
        if (!isFree(r, c)) {
          return false;
        }
      }
    }
    return true;
  };
  const fill = (grid: boolean[][], rect: WidgetCellRect) => {
    for (let r = rect.row; r < rect.row + rect.h; r += 1) {
      grid[r] = grid[r] ?? [];
      for (let c = rect.col; c < rect.col + rect.w; c += 1) {
        grid[r][c] = true;
      }
    }
  };

  const positions: Record<string, WidgetCellRect> = {};

  items.forEach(item => {
    const w = clamp(item.w, 1, cols);
    const h = clamp(item.h, 1, WIDGET_MAX_ROWS);

    for (let row = 0; ; row += 1) {
      const col = Array.from({ length: cols - w + 1 }, (_, c) => c).find(c =>
        fits(row, c, w, h)
      );

      if (col != null) {
        const rect = { row, col, w, h };
        positions[item.id] = rect;
        fill(occupied, rect);
        break;
      }
    }
  });

  const rows = occupied.length;
  const used: boolean[][] = [];
  const isOpen = (row: number, col: number) =>
    isFree(row, col) && !used[row]?.[col];
  const gaps: WidgetCellRect[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!isOpen(row, col)) {
        continue;
      }

      let w = 1;
      while (col + w < cols && isOpen(row, col + w)) {
        w += 1;
      }

      let h = 1;
      const rowOpen = (r: number) =>
        Array.from({ length: w }, (_, k) => col + k).every(c => isOpen(r, c));
      while (row + h < rows && rowOpen(row + h)) {
        h += 1;
      }

      const gap = { row, col, w, h };
      gaps.push(gap);
      fill(used, gap);
    }
  }

  return { gaps, positions, rows };
};

/** CSS grid placement for a zero-based cell rectangle. */
export const toGridArea = ({ col, h, row, w }: WidgetCellRect) => ({
  gridColumn: `${col + 1} / span ${w}`,
  gridRow: `${row + 1} / span ${h}`,
});
