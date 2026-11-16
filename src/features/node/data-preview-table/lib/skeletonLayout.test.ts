import { describe, expect, it } from 'vitest';

import {
  buildDataPreviewSkeletonLayout,
  getSkeletonCellBaseWidth,
  getSkeletonWidthFactor,
  SKELETON_CELL_WIDTH,
} from './skeletonLayout';

describe('data preview skeleton layout', () => {
  it('picks the base cell width from the column type', () => {
    const width = (dtype: string, name = 'value') =>
      getSkeletonCellBaseWidth({ name, dtype });

    expect(width('timestamptz')).toBe(SKELETON_CELL_WIDTH.temporal);
    expect(width('DATETIME')).toBe(SKELETON_CELL_WIDTH.temporal);
    expect(width('text', 'comment')).toBe(SKELETON_CELL_WIDTH.longText);
    expect(width('STRING', 'Комментарий')).toBe(SKELETON_CELL_WIDTH.longText);
    expect(width('text')).toBe(SKELETON_CELL_WIDTH.text);
    expect(width('char(3)')).toBe(SKELETON_CELL_WIDTH.shortChar);
    expect(width('char(12)')).toBe(SKELETON_CELL_WIDTH.text);
    expect(width('BOOLEAN')).toBe(SKELETON_CELL_WIDTH.boolean);
    expect(width('numeric(12,2)')).toBe(SKELETON_CELL_WIDTH.numeric);
    expect(width('FLOAT')).toBe(SKELETON_CELL_WIDTH.numeric);
    expect(width('bigint')).toBe(SKELETON_CELL_WIDTH.integer);
    expect(width('Nullable(UInt64)')).toBe(SKELETON_CELL_WIDTH.integer);
    expect(width('bigint', 'comment_id')).toBe(SKELETON_CELL_WIDTH.integer);
    expect(width('interval')).toBe(SKELETON_CELL_WIDTH.text);
  });

  it('varies widths deterministically within 65–100 %', () => {
    const factors = Array.from({ length: 18 }, (_, row) =>
      Array.from({ length: 9 }, (__, column) =>
        getSkeletonWidthFactor(row, column)
      )
    ).flat();

    expect(Math.min(...factors)).toBeCloseTo(0.65);
    expect(Math.max(...factors)).toBeCloseTo(1);
    expect(new Set(factors).size).toBeGreaterThan(1);
    expect(buildDataPreviewSkeletonLayout(null)).toEqual(
      buildDataPreviewSkeletonLayout(null)
    );
  });

  it('shows known column names in the head', () => {
    const layout = buildDataPreviewSkeletonLayout([
      { name: 'id', dtype: 'INT' },
      { name: 'created_at', dtype: 'DATETIME' },
    ]);

    expect(layout.head).toEqual([
      { kind: 'label', label: 'id', title: 'INT' },
      { kind: 'label', label: 'created_at', title: 'DATETIME' },
    ]);
    expect(layout.rows).toHaveLength(18);
    // Строка 0: множители 0.65 и 0.9 от базовых 36 и 104.
    expect(layout.rows[0]).toEqual([23, 94]);
  });

  it('falls back to nine skeleton head cells with alternating types', () => {
    const layout = buildDataPreviewSkeletonLayout([]);

    expect(layout.head).toEqual(
      [52, 84, 64, 72, 90, 60, 78, 56, 70].map(width => ({
        kind: 'bar',
        width,
      }))
    );
    // Базовые 36/52/44/52/104/36/52/34/52 с множителями строки 0.
    expect(layout.rows[0]).toEqual([23, 47, 33, 52, 88, 25, 49, 27, 34]);
  });
});
