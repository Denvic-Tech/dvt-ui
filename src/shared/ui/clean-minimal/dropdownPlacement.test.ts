import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDropdownPlacement, useDropdownWidth } from './dropdownPlacement';

const createAnchor = (rect: Partial<DOMRect>) => {
  const anchor = document.createElement('button');
  anchor.getBoundingClientRect = () =>
    ({ top: 0, bottom: 0, width: 0, ...rect }) as DOMRect;
  return anchor;
};

describe('useDropdownWidth', () => {
  it('keeps the last anchor width after the anchor is reset on close', () => {
    const anchor = createAnchor({ width: 406 });
    const { result, rerender } = renderHook(
      ({ anchorEl }: { anchorEl: HTMLElement | null }) =>
        useDropdownWidth(anchorEl, 'anchor'),
      { initialProps: { anchorEl: anchor as HTMLElement | null } }
    );
    expect(result.current).toBe(406);

    rerender({ anchorEl: null });
    expect(result.current).toBe(406);
  });

  it('returns a fixed width as is', () => {
    const { result } = renderHook(() => useDropdownWidth(null, 260));
    expect(result.current).toBe(260);
  });
});

describe('useDropdownPlacement', () => {
  it('keeps the upward placement while the menu closes', () => {
    // Якорь у нижнего края окна: места снизу нет, меню открывается вверх.
    const anchor = createAnchor({
      top: window.innerHeight - 40,
      bottom: window.innerHeight - 8,
    });
    const { result, rerender } = renderHook(
      ({ anchorEl, open }: { anchorEl: HTMLElement | null; open: boolean }) =>
        useDropdownPlacement(anchorEl, open, 200),
      { initialProps: { anchorEl: anchor as HTMLElement | null, open: true } }
    );
    expect(result.current.side).toBe('top');

    rerender({ anchorEl: null, open: false });
    expect(result.current.side).toBe('top');
  });
});
